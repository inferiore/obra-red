import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/user.entity';
import { Solicitud } from './solicitudes/solicitud.entity';
import { Oferta } from './ofertas/oferta.entity';
import { Calificacion } from './calificaciones/calificacion.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { OfertasModule } from './ofertas/ofertas.module';
import { CalificacionesModule } from './calificaciones/calificaciones.module';
import { UploadsModule } from './uploads/upload.module';
import { File } from './files/files.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH ?? 'obrared.sqlite',
      entities: [User, Solicitud, Oferta, Calificacion, File],
      migrations: ['dist/database/migrations/*.js'],
      // In-memory DB (e2e tests) has no migrations to run against, so build
      // its schema straight from the entities instead.
      synchronize: process.env.DB_PATH === ':memory:',
    }),
    AuthModule,
    UsersModule,
    SolicitudesModule,
    OfertasModule,
    CalificacionesModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
