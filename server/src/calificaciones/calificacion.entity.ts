import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Solicitud } from '../solicitudes/solicitud.entity';
import type { TipoTrabajo } from '../solicitudes/solicitud.entity';

@Entity('calificaciones')
@Unique(['solicitudId'])
export class Calificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Solicitud, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitudId' })
  solicitud: Solicitud;

  @Column()
  solicitudId: string;

  @Column()
  clienteUsername: string;

  @Column()
  clienteNombre: string;

  @Column({ type: 'varchar' })
  tipo: TipoTrabajo;

  @Column()
  trabajadorUsername: string;

  @Column({ type: 'int' })
  estrellas: number;

  @Column({ type: 'text', nullable: true })
  comentario?: string;

  @Column({ type: 'simple-json', default: '[]' })
  etiquetas: string[];

  @CreateDateColumn()
  createdAt: Date;
}
