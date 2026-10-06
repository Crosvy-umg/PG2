import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  NotificacionesService,
} from './notificaciones.service';

import {
  JwtAuthGuard,
} from '../auth/auth.guard';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(
    private readonly notificacionesService:
      NotificacionesService,
  ) {}

  @Get('mis-notificaciones')
  findMisNotificaciones(
    @Req() request: any,
  ) {
    return this.notificacionesService.findByUsuario(
      request.user.sub,
    );
  }

  @Patch('leer-todas')
  marcarTodasComoLeidas(
    @Req() request: any,
  ) {
    return this.notificacionesService.marcarTodasComoLeidas(
      request.user.sub,
    );
  }

  @Patch(':id/leida')
  marcarComoLeida(
    @Param(
      'id',
      ParseIntPipe,
    )
    idNotificacion: number,

    @Req()
    request: any,
  ) {
    return this.notificacionesService.marcarComoLeida(
      idNotificacion,
      request.user.sub,
    );
  }
}