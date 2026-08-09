import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Solicitud } from '../solicitudes/solicitud.entity';

export type OfertaEstado = 'pendiente' | 'aceptada' | 'rechazada';

@Entity('ofertas')
export class Oferta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Solicitud, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitudId' })
  solicitud: Solicitud;

  @Column()
  solicitudId: string;

  @Column()
  trabajadorUsername: string;

  @Column({ type: 'int' })
  precio: number;

  @Column({ type: 'int', nullable: true })
  tiempoEstimadoDias?: number;

  @Column({ type: 'date', nullable: true })
  fechaInicio?: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'varchar', default: 'pendiente' })
  estado: OfertaEstado;

  @CreateDateColumn()
  createdAt: Date;
}
