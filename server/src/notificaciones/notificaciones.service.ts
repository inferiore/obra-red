import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './notificacion.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionesRepo: Repository<Notificacion>,
  ) {}

  crear(
    userUsername: string,
    tipo: string,
    mensaje: string,
    solicitudId?: string,
    object?: string,
    objectId?: string,
  ): Promise<Notificacion> {
    const notificacion = this.notificacionesRepo.create({
      userUsername,
      tipo,
      mensaje,
      solicitudId: solicitudId ?? null,
      object: object ?? null,
      objectId: objectId ?? null,
    });
    return this.notificacionesRepo.save(notificacion);
  }

  findMine(userUsername: string): Promise<Notificacion[]> {
    return this.notificacionesRepo.find({
      where: { userUsername },
      order: { createdAt: 'DESC' },
    });
  }

  async marcarLeida(id: string, userUsername: string): Promise<Notificacion> {
    const notificacion = await this.notificacionesRepo.findOne({
      where: { id, userUsername },
    });
    if (!notificacion) throw new NotFoundException('Notificación no encontrada');
    notificacion.leido = true;
    return this.notificacionesRepo.save(notificacion);
  }
}
