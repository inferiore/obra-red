import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type TipoTrabajo =
  | 'albanileria'
  | 'plomeria'
  | 'electricidad'
  | 'carpinteria'
  | 'pintura'
  | 'soldadura'
  | 'techado'
  | 'demolicion'
  | 'yeso'
  | 'otro';

export type SolicitudEstado =
  | 'borrador'
  | 'publicado'
  | 'ejecucion'
  | 'revision'
  | 'corrigiendo'
  | 'disputa'
  | 'finalizado';

@Entity('solicitudes')
export class Solicitud {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clienteUsername: string;

  @Column()
  clienteNombre: string;

  @Column({ type: 'varchar' })
  tipo: TipoTrabajo;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'int' })
  presupuesto: number;

  @Column()
  ubicacion: string;

  @Column({ type: 'simple-json', default: '[]' })
  fotos: string[];

  @Column({ type: 'varchar', default: 'borrador' })
  estado: SolicitudEstado;

  @Column({ nullable: true })
  trabajadorAsignado?: string;

  @Column({ type: 'simple-json', default: '[]' })
  evidenciaAntes: string[];

  @Column({ type: 'simple-json', default: '[]' })
  evidenciaDurante: string[];

  @Column({ type: 'simple-json', default: '[]' })
  evidenciaDespues: string[];

  @Column({ type: 'text', nullable: true })
  evidenciaNota?: string;

  @Column({ type: 'simple-json', default: '[]' })
  correcciones: string[];

  @Column({ type: 'simple-json', default: '[]' })
  evidenciaDisputa: { url: string; autorUsername: string; createdAt: string }[];

  @Column({ type: 'int', default: 0 })
  correccionesCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
