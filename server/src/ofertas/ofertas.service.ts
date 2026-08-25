import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { Oferta } from './oferta.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
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
  constructor(
    @InjectRepository(Oferta) private readonly ofertasRepo: Repository<Oferta>,
    @InjectRepository(Solicitud) private readonly solicitudesRepo: Repository<Solicitud>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

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
    const oferta = this.ofertasRepo.create({ ...dto, trabajadorUsername });
    return this.ofertasRepo.save(oferta);
  }

  async aceptar(ofertaId: string): Promise<Solicitud> {
    return this.dataSource.transaction(async (manager) => {
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
  }
}
