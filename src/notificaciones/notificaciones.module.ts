import {
  Module,
} from '@nestjs/common';

import {
  TypeOrmModule,
} from '@nestjs/typeorm';

import {
  Notificacion,
} from './entities/notificacion.entity';

import {
  NotificacionesController,
} from './notificaciones.controller';

import {
  NotificacionesService,
} from './notificaciones.service';

import {
  AuthModule,
} from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notificacion,
    ]),
    AuthModule,
  ],
  controllers: [
    NotificacionesController,
  ],
  providers: [
    NotificacionesService,
  ],
  exports: [
    NotificacionesService,
  ],
})
export class NotificacionesModule {}