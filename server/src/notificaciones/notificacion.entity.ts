import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userUsername: string;

  @Column()
  tipo: string;

  @Column()
  mensaje: string;

  @Column({ type: 'varchar', nullable: true })
  solicitudId: string | null;

  @Column({ type: 'varchar', nullable: true })
  object: string | null;

  @Column({ type: 'varchar', nullable: true })
  objectId: string | null;

  @Column({ default: false })
  leido: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
