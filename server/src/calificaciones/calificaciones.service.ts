import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calificacion } from './calificacion.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { User } from '../users/user.entity';
import { CreateCalificacionDto } from './dto/create-calificacion.dto';

@Injectable()
export class CalificacionesService {
  constructor(
    @InjectRepository(Calificacion)
    private readonly calificacionesRepo: Repository<Calificacion>,
    @InjectRepository(Solicitud)
    private readonly solicitudesRepo: Repository<Solicitud>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findByTrabajador(trabajadorUsername: string): Promise<Calificacion[]> {
    return this.calificacionesRepo.find({
      where: { trabajadorUsername },
      order: { createdAt: 'DESC' },
    });
  }

  async crear(dto: CreateCalificacionDto, clienteUsername: string): Promise<Calificacion> {
    const solicitud = await this.solicitudesRepo.findOne({ where: { id: dto.solicitudId } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.clienteUsername !== clienteUsername) {
      throw new ForbiddenException('No eres el dueño de esta solicitud');
    }
    if (solicitud.estado !== 'finalizado') {
      throw new ConflictException('Solo puedes calificar trabajos finalizados');
    }
    if (!solicitud.trabajadorAsignado) {
      throw new ConflictException('Esta solicitud no tiene un trabajador asignado');
    }

    const existente = await this.calificacionesRepo.findOne({
      where: { solicitudId: dto.solicitudId },
    });
    if (existente) throw new ConflictException('Ya calificaste este trabajo');

    const calificacion = this.calificacionesRepo.create({
      solicitudId: dto.solicitudId,
      clienteUsername,
      clienteNombre: solicitud.clienteNombre,
      tipo: solicitud.tipo,
      trabajadorUsername: solicitud.trabajadorAsignado,
      estrellas: dto.estrellas,
      comentario: dto.comentario,
      etiquetas: dto.etiquetas ?? [],
    });
    const guardada = await this.calificacionesRepo.save(calificacion);

    await this.actualizarPromedioTrabajador(solicitud.trabajadorAsignado);

    return guardada;
  }

  private async actualizarPromedioTrabajador(trabajadorUsername: string): Promise<void> {
    const raw = await this.calificacionesRepo
      .createQueryBuilder('c')
      .select('AVG(c.estrellas)', 'avg')
      .addSelect('COUNT(c.id)', 'count')
      .where('c.trabajadorUsername = :trabajadorUsername', { trabajadorUsername })
      .getRawOne<{ avg: string; count: string }>();

    const trabajador = await this.usersRepo.findOne({ where: { username: trabajadorUsername } });
    if (!trabajador || !raw) return;
    const { avg, count } = raw;

    trabajador.calificacion = Math.round(parseFloat(avg) * 10) / 10;
    trabajador.trabajosCompletados = parseInt(count, 10);
    await this.usersRepo.save(trabajador);
  }
}
