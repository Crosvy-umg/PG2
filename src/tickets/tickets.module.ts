import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Ticket } from './entities/ticket.entity';
import { AdjuntoTicket } from './entities/adjunto-ticket.entity';

import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { AdjuntosTicketService } from './adjuntos-ticket.service';

import { Prioridad } from '../prioridades/entities/prioridad.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { User } from '../users/entities/user.entity';

import { AuthModule } from '../auth/auth.module';
import { BitacoraModule } from '../bitacora/bitacora.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      AdjuntoTicket,
      Prioridad,
      Categoria,
      User,
    ]),

    AuthModule,

    BitacoraModule,

    NotificacionesModule,
  ],

  controllers: [
    TicketsController,
  ],

  providers: [
    TicketsService,
    AdjuntosTicketService,
  ],

  exports: [
    TicketsService,
    AdjuntosTicketService,
  ],
})
export class TicketsModule {}