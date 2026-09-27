import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud } from './solicitud.entity';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';
import { SubirEvidenciasDto } from './dto/subir-evidencias.dto';
import { SubirEvidenciaDisputaDto } from './dto/subir-evidencia-disputa.dto';
import { SolicitarCorreccionDto } from './dto/solicitar-correccion.dto';
import { AbrirDisputaDto } from './dto/abrir-disputa.dto';
import { OfertaEnriquecida, OfertasService } from '../ofertas/ofertas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

export type SolicitudConOfertas = Solicitud & { ofertas: OfertaEnriquecida[] };

@Injectable()
export class SolicitudesService {
  private readonly logger = new Logger(SolicitudesService.name);

  constructor(
    @InjectRepository(Solicitud) private readonly repo: Repository<Solicitud>,
    private readonly ofertasService: OfertasService,
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

  async findAll(): Promise<SolicitudConOfertas[]> {
    // El listado no trae evidencias ni fotos (pueden pesar varios MB en base64
    // por solicitud) — esas solo se piden al abrir el detalle de una en concreto.
    const solicitudes = await this.repo.find({
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'clienteUsername',
        'clienteNombre',
        'tipo',
        'descripcion',
        'presupuesto',
        'ubicacion',
        'estado',
        'trabajadorAsignado',
        'correcciones',
        'correccionesCount',
        'createdAt',
      ],
    });
    const ofertasPorSolicitud = await this.ofertasService.findBySolicitudIds(
      solicitudes.map((s) => s.id),
    );
    return solicitudes.map((s) => ({
      ...s,
      ofertas: ofertasPorSolicitud.get(s.id) ?? [],
    }));
  }

  async findOne(id: string): Promise<Solicitud> {
    const solicitud = await this.repo.findOne({ where: { id } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    return solicitud;
  }

  crear(
    dto: CreateSolicitudDto,
    cliente: { username: string; name: string },
  ): Promise<Solicitud> {
    const solicitud = this.repo.create({
      ...dto,
      fotos: dto.fotos ?? [],
      estado: dto.estado ?? 'borrador',
      clienteUsername: cliente.username,
      clienteNombre: cliente.name,
    });
    return this.repo.save(solicitud);
  }

  async actualizarEstado(id: string, dto: UpdateEstadoDto): Promise<Solicitud> {
    const solicitud = await this.findOne(id);
    solicitud.estado = dto.estado;
    if (dto.trabajadorUsername)
      solicitud.trabajadorAsignado = dto.trabajadorUsername;
    const guardada = await this.repo.save(solicitud);

    if (dto.estado === 'ejecucion') {
      await this.notificar(
        guardada.clienteUsername,
        'solicitud_en_ejecucion',
        'Tu solicitud pasó a ejecución',
        guardada.id,
        'solicitud',
        guardada.id,
      );
    } else if (dto.estado === 'finalizado' && guardada.trabajadorAsignado) {
      await this.notificar(
        guardada.trabajadorAsignado,
        'solicitud_finalizada',
        'Tu trabajo fue marcado como finalizado',
        guardada.id,
        'solicitud',
        guardada.id,
      );
    }

    return guardada;
  }

  async actualizar(id: string, dto: UpdateSolicitudDto): Promise<Solicitud> {
    const solicitud = await this.findOne(id);
    const merge = this.repo.merge(solicitud, dto);
    return this.repo.save(merge);
  }

  async eliminar(id: string): Promise<void> {
    const solicitud = await this.findOne(id);
    await this.repo.remove(solicitud);
  }

  async subirEvidencias(
    id: string,
    dto: SubirEvidenciasDto,
    trabajadorUsername: string,
  ): Promise<Solicitud> {
    const solicitud = await this.findOne(id);
    if (solicitud.trabajadorAsignado !== trabajadorUsername) {
      throw new ForbiddenException('No estás asignado a este trabajo');
    }
    if (solicitud.estado !== 'ejecucion' && solicitud.estado !== 'corrigiendo') {
      throw new ConflictException('Este trabajo no está en ejecución');
    }
    solicitud.evidenciaAntes = dto.antes ?? [];
    solicitud.evidenciaDurante = dto.durante ?? [];
    solicitud.evidenciaDespues = dto.despues;
    solicitud.evidenciaNota = dto.nota;
    solicitud.estado = 'revision';
    return this.repo.save(solicitud);
  }

  async subirEvidenciaDisputa(
    id: string,
    fotos: string[],
    username: string,
  ): Promise<Solicitud> {
    const solicitud = await this.findOne(id);
    if (
      username !== solicitud.clienteUsername &&
      username !== solicitud.trabajadorAsignado
    ) {
      throw new ForbiddenException('No eres parte de esta solicitud');
    }
    if (solicitud.estado !== 'disputa') {
      throw new ConflictException('Esta solicitud no está en disputa');
    }
    solicitud.evidenciaDisputa = [
      ...(solicitud.evidenciaDisputa ?? []),
      ...fotos.map((url) => ({
        url,
        autorUsername: username,
        createdAt: new Date().toISOString(),
      })),
    ];
    return this.repo.save(solicitud);
  }

  async solicitarCorreccion(
    id: string,
    dto: SolicitarCorreccionDto,
    clienteUsername: string,
  ): Promise<Solicitud> {
    const solicitud = await this.findOne(id);
    if (solicitud.clienteUsername !== clienteUsername) {
      throw new ForbiddenException('No eres el dueño de esta solicitud');
    }
    if (solicitud.estado !== 'revision') {
      throw new ConflictException('Este trabajo no está en revisión');
    }
    solicitud.correcciones = [...(solicitud.correcciones ?? []), dto.comentario];
    if (solicitud.correccionesCount === 0) {
      solicitud.correccionesCount = 1;
      solicitud.estado = 'corrigiendo';
    } else {
      solicitud.estado = 'disputa';
    }
    const guardada = await this.repo.save(solicitud);

    if (guardada.estado === 'disputa') {
      await this.notificarDisputa(guardada);
    }

    return guardada;
  }

  async abrirDisputa(
    id: string,
    dto: AbrirDisputaDto,
    trabajadorUsername: string,
  ): Promise<Solicitud> {
    const solicitud = await this.findOne(id);
    if (trabajadorUsername !== solicitud.trabajadorAsignado) {
      throw new ForbiddenException('No estás asignado a este trabajo');
    }
    if (
      solicitud.estado !== 'ejecucion' &&
      solicitud.estado !== 'revision' &&
      solicitud.estado !== 'corrigiendo'
    ) {
      throw new ConflictException('No se puede abrir una disputa desde este estado');
    }
    solicitud.correcciones = [...(solicitud.correcciones ?? []), dto.comentario];
    solicitud.estado = 'disputa';
    const guardada = await this.repo.save(solicitud);

    await this.notificarDisputa(guardada);

    return guardada;
  }

  async resolverDisputa(
    id: string,
    estado: 'ejecucion' | 'finalizado',
  ): Promise<Solicitud> {
    const solicitud = await this.findOne(id);
    if (solicitud.estado !== 'disputa') {
      throw new ConflictException('Esta solicitud no está en disputa');
    }
    solicitud.estado = estado;
    const guardada = await this.repo.save(solicitud);

    await this.notificar(
      guardada.clienteUsername,
      'disputa_resuelta',
      'La disputa de tu solicitud fue resuelta',
      guardada.id,
      'solicitud',
      guardada.id,
    );
    if (guardada.trabajadorAsignado) {
      await this.notificar(
        guardada.trabajadorAsignado,
        'disputa_resuelta',
        'La disputa de la solicitud en la que trabajas fue resuelta',
        guardada.id,
        'solicitud',
        guardada.id,
      );
    }

    return guardada;
  }

  private async notificarDisputa(solicitud: Solicitud): Promise<void> {
    await this.notificar(
      solicitud.clienteUsername,
      'solicitud_en_disputa',
      'Tu solicitud entró en disputa',
      solicitud.id,
      'solicitud',
      solicitud.id,
    );
    if (solicitud.trabajadorAsignado) {
      await this.notificar(
        solicitud.trabajadorAsignado,
        'solicitud_en_disputa',
        'La solicitud en la que trabajas entró en disputa',
        solicitud.id,
        'solicitud',
        solicitud.id,
      );
    }
  }
}
