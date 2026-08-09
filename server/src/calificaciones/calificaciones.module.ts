import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calificacion } from './calificacion.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { User } from '../users/user.entity';
import { CalificacionesService } from './calificaciones.service';
import { CalificacionesController } from './calificaciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Calificacion, Solicitud, User])],
  controllers: [CalificacionesController],
  providers: [CalificacionesService],
})
export class CalificacionesModule {}
