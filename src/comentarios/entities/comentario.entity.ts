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

@Entity('comentarios')
export class Comentario {
  @PrimaryGeneratedColumn()
  idComentario: number;

  @Column({
    type: 'int',
  })
  idTicket: number;

  @ManyToOne(
    () => Ticket,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'idTicket',
  })
  ticket: Ticket;

  @Column({
    type: 'int',
  })
  idUsuario: number;

  @ManyToOne(
    () => User,
    {
      eager: true,
    },
  )
  @JoinColumn({
    name: 'idUsuario',
  })
  usuario: User;

  @Column({
    type: 'text',
  })
  mensaje: string;

  @CreateDateColumn()
  fechaCreacion: Date;
}