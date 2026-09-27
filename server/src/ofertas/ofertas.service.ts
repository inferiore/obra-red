import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { Oferta } from './oferta.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';

export interface OfertaEnriquecida {
  id: string;
  solicitudId: string;
  trabajadorUsername: string;
  nombre: string;
  fotoUrl: string;
  calificacion: number;
  trabajosCompletados: number;
  verificado: boolean;
  precio: number;
  tiempoEstimadoDias: number | null;
  fechaInicio: string | null;
  mensaje: string;
  estado: Oferta['estado'];
  createdAt: Date;
  expirada: boolean;
}

const DIAS_VIGENCIA_OFERTA = 3;

const fotoUrlFor = (nombre: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nombre)}`;

const estaExpirada = (createdAt: Date): boolean => {
  const vencimiento = new Date(createdAt);
  vencimiento.setDate(vencimiento.getDate() + DIAS_VIGENCIA_OFERTA);
  return vencimiento.getTime() < Date.now();
};

@Injectable()
export class OfertasService {
  private readonly logger = new Logger(OfertasService.name);

  constructor(
    @InjectRepository(Oferta) private readonly ofertasRepo: Repository<Oferta>,
    @InjectRepository(Solicitud) private readonly solicitudesRepo: Repository<Solicitud>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  private async notificar(
    userUsername: string,
    tipo: string,
    mensaje: string,
    solicitudId?: string,
    object?: string,
    objectId?: string,
  ): Promise<void> {
    try {
      await this.notificacionesService.crear(
        userUsername,
        tipo,
        mensaje,
        solicitudId,
        object,
        objectId,
      );
    } catch (err) {
      this.logger.error(
        `No se pudo crear la notificación '${tipo}' para ${userUsername}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  async findBySolicitud(solicitudId: string): Promise<OfertaEnriquecida[]> {
    const ofertas = await this.ofertasRepo.find({
      where: { solicitudId },
      order: { createdAt: 'ASC' },
    });
    const trabajadores = await this.usersService.findByUsernames(
      ofertas.map((o) => o.trabajadorUsername),
    );
    return ofertas.map((o) => this.enriquecer(o, trabajadores));
  }

  async findBySolicitudIds(
    solicitudIds: string[],
  ): Promise<Map<string, OfertaEnriquecida[]>> {
    if (solicitudIds.length === 0) return new Map();
    const ofertas = await this.ofertasRepo.find({
      where: { solicitudId: In(solicitudIds) },
      order: { createdAt: 'ASC' },
    });
    const trabajadores = await this.usersService.findByUsernames(
      ofertas.map((o) => o.trabajadorUsername),
    );
    const bySolicitud = new Map<string, OfertaEnriquecida[]>();
    for (const o of ofertas) {
      const lista = bySolicitud.get(o.solicitudId) ?? [];
      lista.push(this.enriquecer(o, trabajadores));
      bySolicitud.set(o.solicitudId, lista);
    }
    return bySolicitud;
  }

  private enriquecer(o: Oferta, trabajadores: Map<string, User>): OfertaEnriquecida {
    const trabajador = trabajadores.get(o.trabajadorUsername);
    return {
      id: o.id,
      solicitudId: o.solicitudId,
      trabajadorUsername: o.trabajadorUsername,
      nombre: trabajador?.name ?? o.trabajadorUsername,
      fotoUrl: fotoUrlFor(trabajador?.name ?? o.trabajadorUsername),
      calificacion: trabajador?.calificacion ?? 5,
      trabajosCompletados: trabajador?.trabajosCompletados ?? 0,
      verificado: trabajador?.verificado ?? false,
      precio: o.precio,
      tiempoEstimadoDias: o.tiempoEstimadoDias ?? null,
      fechaInicio: o.fechaInicio ?? null,
      mensaje: o.mensaje,
      estado: o.estado,
      createdAt: o.createdAt,
      expirada: estaExpirada(o.createdAt),
    };
  }

  async crear(dto: CreateOfertaDto, trabajadorUsername: string): Promise<Oferta> {
    const solicitud = await this.solicitudesRepo.findOne({ where: { id: dto.solicitudId } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.estado !== 'publicado') {
      throw new ConflictException('Esta solicitud ya no está disponible para recibir ofertas');
    }
    const yaOfertoPendiente = await this.ofertasRepo.findOne({
      where: { solicitudId: dto.solicitudId, trabajadorUsername, estado: 'pendiente' },
    });
    if (yaOfertoPendiente) {
      throw new ConflictException('Ya tienes una oferta pendiente en esta solicitud');
    }
    const oferta = this.ofertasRepo.create({ ...dto, trabajadorUsername });
    const guardada = await this.ofertasRepo.save(oferta);

    await this.notificar(
      solicitud.clienteUsername,
      'nueva_oferta',
      'Recibiste una nueva oferta en tu solicitud',
      dto.solicitudId,
      'oferta',
      guardada.id,
    );

    return guardada;
  }

  async aceptar(ofertaId: string): Promise<Solicitud> {
    const solicitud = await this.dataSource.transaction(async (manager) => {
      const oferta = await manager.findOne(Oferta, { where: { id: ofertaId } });
      if (!oferta) throw new NotFoundException('Oferta no encontrada');
      if (estaExpirada(oferta.createdAt)) {
        throw new ConflictException('Esta oferta ya expiró y no puede aceptarse');
      }

      const solicitud = await manager.findOne(Solicitud, {
        where: { id: oferta.solicitudId },
      });
      if (!solicitud) throw new NotFoundException('Solicitud no encontrada');

      await manager.update(
        Oferta,
        { solicitudId: oferta.solicitudId, id: Not(ofertaId) },
        { estado: 'rechazada' },
      );
      await manager.update(Oferta, { id: ofertaId }, { estado: 'aceptada' });

      solicitud.estado = 'ejecucion';
      solicitud.trabajadorAsignado = oferta.trabajadorUsername;
      return manager.save(solicitud);
    });

    await this.notificar(
      solicitud.trabajadorAsignado as string,
      'oferta_aceptada',
      'Tu oferta fue aceptada',
      solicitud.id,
      'oferta',
      ofertaId,
    );
    await this.notificar(
      solicitud.clienteUsername,
      'solicitud_en_ejecucion',
      'Tu solicitud pasó a ejecución',
      solicitud.id,
      'solicitud',
      solicitud.id,
    );

    return solicitud;
  }
}
