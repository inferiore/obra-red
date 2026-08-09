import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud } from './solicitud.entity';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';
import { SubirEvidenciasDto } from './dto/subir-evidencias.dto';
import { SolicitarCorreccionDto } from './dto/solicitar-correccion.dto';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud) private readonly repo: Repository<Solicitud>,
  ) {}

  findAll(): Promise<Solicitud[]> {
    // El listado no trae las evidencias (pueden pesar varios MB en base64 por
    // solicitud) — esas solo se piden al abrir el detalle de una en concreto.
    return this.repo.find({
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'clienteUsername',
        'clienteNombre',
        'tipo',
        'descripcion',
        'presupuesto',
        'ubicacion',
        'fotos',
        'estado',
        'trabajadorAsignado',
        'correccionComentario',
        'createdAt',
      ],
    });
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
    return this.repo.save(solicitud);
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
    solicitud.correccionComentario = dto.comentario;
    solicitud.estado = 'corrigiendo';
    return this.repo.save(solicitud);
  }
}
