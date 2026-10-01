import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Role } from '../../roles/entities/role.entity';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
    length: 100,
  })
  usuario: string;

  @Column({
  select: false,
})
contrasenia: string;

  @Column({
    default: true,
  })
  activo: boolean;

  @Column({
    type: 'int',
    nullable: true,
  })
  idRol: number | null;

  @ManyToOne(() => Role, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'idRol' })
  rol: Role | null;

  @CreateDateColumn()
  fechaCreacion: Date;
}