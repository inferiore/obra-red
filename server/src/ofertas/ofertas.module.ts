import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Oferta } from './oferta.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { UsersModule } from '../users/users.module';
import { OfertasService } from './ofertas.service';
import { OfertasController } from './ofertas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Oferta, Solicitud]), UsersModule],
  controllers: [OfertasController],
  providers: [OfertasService],
  exports: [OfertasService],
})
export class OfertasModule {}
