import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mensaje } from './mensaje.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { UsersModule } from '../users/users.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { MensajesService } from './mensajes.service';
import { MensajesController } from './mensajes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mensaje, Solicitud]),
    UsersModule,
    NotificacionesModule,
  ],
  controllers: [MensajesController],
  providers: [MensajesService],
  exports: [MensajesService],
})
export class MensajesModule {}
