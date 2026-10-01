import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('estados')
export class Estado {
  @PrimaryGeneratedColumn()
  idEstado: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  nombre: string;
}