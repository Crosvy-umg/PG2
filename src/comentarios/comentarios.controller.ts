import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ComentariosService,
} from './comentarios.service';

import {
  CreateComentarioDto,
} from './dto/create-comentario.dto';

import {
  JwtAuthGuard,
} from '../auth/auth.guard';

@Controller(
  'tickets/:idTicket/comentarios',
)
export class ComentariosController {
  constructor(
    private readonly comentariosService:
      ComentariosService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findByTicket(
    @Param(
      'idTicket',
      ParseIntPipe,
    )
    idTicket: number,

    @Req()
    request: any,
  ) {
    return this.comentariosService.findByTicket(
      idTicket,
      request.user.sub,
      request.user.rol,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  crear(
    @Param(
      'idTicket',
      ParseIntPipe,
    )
    idTicket: number,

    @Body()
    createComentarioDto:
      CreateComentarioDto,

    @Req()
    request: any,
  ) {
    return this.comentariosService.crear(
      idTicket,
      request.user.sub,
      request.user.rol,
      createComentarioDto,
    );
  }
}