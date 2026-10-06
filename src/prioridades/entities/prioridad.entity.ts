import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('prioridades')
export class Prioridad {
  @PrimaryGeneratedColumn()
  idPrioridad: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  nombre: string;

  @Column({
    type: 'int',
    unique: true,
  })
  nivel: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  activo: boolean;
}