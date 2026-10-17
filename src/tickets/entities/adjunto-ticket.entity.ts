import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Ticket } from './ticket.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ticket_adjuntos')
export class AdjuntoTicket {
  @PrimaryGeneratedColumn()
  idAdjunto: number;

  @Column({
    type: 'int',
  })
  idTicket: number;

  @ManyToOne(() => Ticket, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'idTicket' })
  ticket: Ticket;

  @Column({
    type: 'varchar',
    length: 255,
  })
  nombreOriginal: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  nombreArchivo: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  tipoMime: string;

  @Column({
    type: 'int',
  })
  tamano: number;

  @Column({
    type: 'varchar',
    length: 500,
  })
  ruta: string;

  @Column({
    type: 'int',
  })
  idUsuario: number;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'idUsuario' })
  usuario: User;

  @CreateDateColumn()
  fechaCreacion: Date;
}