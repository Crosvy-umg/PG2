import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Prioridad } from '../../prioridades/entities/prioridad.entity';
import { Estado } from '../../estados/entities/estado.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  idTicket: number;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  codigo: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  titulo: string;

  @Column({
    type: 'text',
  })
  descripcion: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  impacto: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  urgencia: string;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  fechaCierre: Date | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  resolucion: string | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  fechaResolucion: Date | null;

  @Column({
    type: 'int',
  })
  idSolicitante: number;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'idSolicitante' })
  solicitante: User;

  @Column({
    type: 'int',
    nullable: true,
  })
  idTecnico: number | null;

  @ManyToOne(() => User, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'idTecnico' })
  tecnico: User | null;

  @Column({
    type: 'int',
  })
  idCategoria: number;

  @ManyToOne(() => Categoria, {
    eager: true,
  })
  @JoinColumn({ name: 'idCategoria' })
  categoria: Categoria;

  @Column({
    type: 'int',
    nullable: true,
  })
  idPrioridad: number | null;

  @ManyToOne(() => Prioridad, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'idPrioridad' })
  prioridad: Prioridad | null;

  @Column({
    type: 'int',
  })
  idEstado: number;

  @ManyToOne(() => Estado, {
    eager: true,
  })
  @JoinColumn({ name: 'idEstado' })
  estado: Estado;
}