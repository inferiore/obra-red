import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type UserRole = 'cliente' | 'trabajador' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  role: UserRole;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  documento?: string;

  // Cliente
  @Column({ type: 'varchar', nullable: true })
  tipoCliente?: 'natural' | 'empresa';

  @Column({ nullable: true })
  razonSocial?: string;

  @Column({ nullable: true })
  nit?: string;

  @Column({ nullable: true })
  direccion?: string;

  @Column({ nullable: true })
  barrio?: string;

  // Trabajador
  @Column({ nullable: true })
  especialidad?: string;

  @Column({ type: 'simple-json', nullable: true })
  especialidadesExtra?: string[];

  @Column({ type: 'int', nullable: true })
  experiencia?: number;

  @Column({ type: 'text', nullable: true })
  descripcionProfesional?: string;

  @Column({ type: 'simple-json', nullable: true })
  zonasCobertura?: string[];

  // Perfil público de trabajador (usado al enriquecer ofertas)
  @Column({ type: 'float', default: 5 })
  calificacion: number;

  @Column({ type: 'int', default: 0 })
  trabajosCompletados: number;

  @Column({ type: 'boolean', default: false })
  verificado: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
