import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('files')
export class File {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  path: string;

  @Column()
  object: string;

  @Column()
  objectId: string;

  @Column()
  disk: string;
}
