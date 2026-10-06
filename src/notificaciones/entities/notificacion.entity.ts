import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn()
  idNotificacion: number;

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
    type: 'int',
    nullable: true,
  })
  idTicket: number | null;

  @ManyToOne(
    () => Ticket,
    {
      nullable: true,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'idTicket',
  })
  ticket: Ticket | null;

  @Column({
    type: 'varchar',
    length: 150,
  })
  titulo: string;

  @Column({
    type: 'text',
  })
  mensaje: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  leida: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;
}