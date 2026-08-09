import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { Oferta } from '../ofertas/oferta.entity';
import { Calificacion } from '../calificaciones/calificacion.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH ?? 'obrared.sqlite',
  entities: [User, Solicitud, Oferta, Calificacion],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
