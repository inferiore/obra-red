import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mensajes')
export class Mensaje {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  solicitudId: string;

  @Column()
  autorUsername: string;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ default: false })
  leidoPorDestinatario: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
