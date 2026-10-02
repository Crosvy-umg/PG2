import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';

@Entity('bitacora_tickets')
export class BitacoraTicket {
  @PrimaryGeneratedColumn()
  idBitacora: number;

  @Column({ type: 'int' })
  idTicket: number;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'idTicket' })
  ticket: Ticket;

  @Column({ type: 'int' })
  idUsuario: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'idUsuario' })
  usuario: User;

  @Column({
    type: 'varchar',
    length: 100,
  })
  accion: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  detalle: string | null;

  @CreateDateColumn()
  fecha: Date;
}