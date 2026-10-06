import {
  Module,
} from '@nestjs/common';

import {
  TypeOrmModule,
} from '@nestjs/typeorm';

import {
  Comentario,
} from './entities/comentario.entity';

import {
  Ticket,
} from '../tickets/entities/ticket.entity';

import {
  ComentariosController,
} from './comentarios.controller';

import {
  ComentariosService,
} from './comentarios.service';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  NotificacionesModule,
} from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comentario,
      Ticket,
    ]),

    AuthModule,

    NotificacionesModule,
  ],

  controllers: [
    ComentariosController,
  ],

  providers: [
    ComentariosService,
  ],

  exports: [
    ComentariosService,
  ],
})
export class ComentariosModule {}