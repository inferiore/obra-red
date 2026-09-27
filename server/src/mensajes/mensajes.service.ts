import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Mensaje } from './mensaje.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { UsersService } from '../users/users.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { UserRole } from '../users/user.entity';

export interface Conversacion {
  solicitudId: string;
  contraparteNombre: string;
  ultimoMensaje: string;
  ultimaFecha: Date;
  noLeidos: number;
}

@Injectable()
export class MensajesService {
  private readonly logger = new Logger(MensajesService.name);

  constructor(
    @InjectRepository(Mensaje) private readonly mensajesRepo: Repository<Mensaje>,
    @InjectRepository(Solicitud) private readonly solicitudesRepo: Repository<Solicitud>,
    private readonly usersService: UsersService,
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

  private esParticipante(solicitud: Solicitud, username: string): boolean {
    return username === solicitud.clienteUsername || username === solicitud.trabajadorAsignado;
  }

  private guardAcceso(solicitud: Solicitud, username: string, role: UserRole): void {
    if (!this.esParticipante(solicitud, username) && role !== 'admin') {
      throw new ForbiddenException('No tienes acceso al chat de esta solicitud');
    }
  }

  async findBySolicitud(
    solicitudId: string,
    username: string,
    role: UserRole,
  ): Promise<Mensaje[]> {
    const solicitud = await this.solicitudesRepo.findOne({ where: { id: solicitudId } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    this.guardAcceso(solicitud, username, role);

    const mensajes = await this.mensajesRepo.find({
      where: { solicitudId },
      order: { createdAt: 'ASC' },
    });

    // El marcado como leído solo aplica a un participante real (cliente o
    // trabajador asignado): un admin que revisa el chat no es destinatario
    // de ningún mensaje y no debe alterar el estado de lectura de ninguna
    // de las dos partes.
    if (this.esParticipante(solicitud, username)) {
      await this.mensajesRepo.update(
        { solicitudId, autorUsername: Not(username), leidoPorDestinatario: false },
        { leidoPorDestinatario: true },
      );
    }

    return mensajes.map((m) =>
      m.autorUsername !== username ? { ...m, leidoPorDestinatario: true } : m,
    );
  }

  async crear(
    solicitudId: string,
    contenido: string,
    username: string,
    role: UserRole,
  ): Promise<Mensaje> {
    const solicitud = await this.solicitudesRepo.findOne({ where: { id: solicitudId } });
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    this.guardAcceso(solicitud, username, role);
    if (solicitud.estado === 'finalizado') {
      throw new ConflictException('Esta solicitud ya finalizó y su chat es de solo lectura');
    }

    const mensaje = this.mensajesRepo.create({
      solicitudId,
      autorUsername: username,
      contenido,
    });
    const guardado = await this.mensajesRepo.save(mensaje);

    if (this.esParticipante(solicitud, username)) {
      const destinatario =
        username === solicitud.clienteUsername
          ? solicitud.trabajadorAsignado
          : solicitud.clienteUsername;
      if (destinatario) {
        await this.notificar(
          destinatario,
          'nuevo_mensaje',
          'Tienes un nuevo mensaje en el chat de tu solicitud',
          solicitudId,
          'mensaje',
          guardado.id,
        );
      }
    } else {
      // El autor es un admin mediando la disputa (no es cliente ni
      // trabajador): no hay una única "otra parte", así que notificamos a
      // ambas.
      if (solicitud.clienteUsername) {
        await this.notificar(
          solicitud.clienteUsername,
          'nuevo_mensaje',
          'Tienes un nuevo mensaje en el chat de tu solicitud',
          solicitudId,
          'mensaje',
          guardado.id,
        );
      }
      if (solicitud.trabajadorAsignado) {
        await this.notificar(
          solicitud.trabajadorAsignado,
          'nuevo_mensaje',
          'Tienes un nuevo mensaje en el chat de tu solicitud',
          solicitudId,
          'mensaje',
          guardado.id,
        );
      }
    }

    return guardado;
  }

  async findConversaciones(username: string): Promise<Conversacion[]> {
    const solicitudes = await this.solicitudesRepo.find({
      where: [{ clienteUsername: username }, { trabajadorAsignado: username }],
    });
    if (solicitudes.length === 0) return [];

    const solicitudIds = solicitudes.map((s) => s.id);
    const mensajes = await this.mensajesRepo.find({
      where: { solicitudId: In(solicitudIds) },
      order: { createdAt: 'ASC' },
    });
    if (mensajes.length === 0) return [];

    const contraparteUsernames = solicitudes
      .map((s) => (username === s.clienteUsername ? s.trabajadorAsignado : s.clienteUsername))
      .filter((u): u is string => !!u);
    const contrapartes = await this.usersService.findByUsernames(contraparteUsernames);

    const mensajesPorSolicitud = new Map<string, Mensaje[]>();
    for (const m of mensajes) {
      const lista = mensajesPorSolicitud.get(m.solicitudId) ?? [];
      lista.push(m);
      mensajesPorSolicitud.set(m.solicitudId, lista);
    }

    const conversaciones: Conversacion[] = [];
    for (const solicitud of solicitudes) {
      const mensajesSolicitud = mensajesPorSolicitud.get(solicitud.id);
      if (!mensajesSolicitud || mensajesSolicitud.length === 0) continue;

      const contraparteUsername =
        username === solicitud.clienteUsername ? solicitud.trabajadorAsignado : solicitud.clienteUsername;
      const contraparte = contraparteUsername ? contrapartes.get(contraparteUsername) : undefined;
      const ultimo = mensajesSolicitud[mensajesSolicitud.length - 1];
      const noLeidos = mensajesSolicitud.filter(
        (m) => m.autorUsername !== username && !m.leidoPorDestinatario,
      ).length;

      conversaciones.push({
        solicitudId: solicitud.id,
        contraparteNombre: contraparte?.name ?? contraparteUsername ?? 'Desconocido',
        ultimoMensaje: ultimo.contenido,
        ultimaFecha: ultimo.createdAt,
        noLeidos,
      });
    }

    conversaciones.sort(
      (a, b) => new Date(b.ultimaFecha).getTime() - new Date(a.ultimaFecha).getTime(),
    );
    return conversaciones;
  }
}
