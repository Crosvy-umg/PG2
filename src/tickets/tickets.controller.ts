import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TicketsService } from './tickets.service';

import { CreateTicketDto } from './dto/create-ticket.dto';

import { UpdateAtencionTicketDto } from './dto/update-atencion-ticket.dto';

import { UpdateEstadoTicketDto } from './dto/update-estado-ticket.dto';

import { ReabrirTicketDto } from './dto/reabrir-ticket.dto';

import { JwtAuthGuard } from '../auth/auth.guard';

import { RolesGuard } from '../auth/roles.guard';

import { Roles } from '../auth/roles.decorator';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService:
      TicketsService,
  ) {}

  /*
   * Crear ticket.
   */
  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Solicitante',
    'Administrador',
  )
  create(
    @Body()
    createTicketDto:
      CreateTicketDto,

    @Req()
    request: any,
  ) {
    return this.ticketsService.create(
      createTicketDto,
      request.user.sub,
    );
  }

  /*
   * Tickets creados por
   * el solicitante autenticado.
   */
  @Get('mis-tickets')
  @UseGuards(JwtAuthGuard)
  findMyTickets(
    @Req()
    request: any,
  ) {
    return this.ticketsService.findBySolicitante(
      request.user.sub,
    );
  }

  /*
   * Tickets asignados al
   * técnico autenticado.
   */
  @Get('asignados')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Técnico')
  findAssignedTickets(
    @Req()
    request: any,
  ) {
    return this.ticketsService.findByTecnico(
      request.user.sub,
    );
  }

  /*
   * Consultar bitácora
   * de un ticket.
   */
  @Get(':id/bitacora')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Solicitante',
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  findBitacora(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Req()
    request: any,
  ) {
    return this.ticketsService.findBitacora(
      idTicket,
      request.user.sub,
      request.user.rol,
    );
  }

  /*
   * Consultar detalle
   * de un ticket.
   */
  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Solicitante',
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  findOne(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Req()
    request: any,
  ) {
    return this.ticketsService.findOne(
      idTicket,
      request.user.sub,
      request.user.rol,
    );
  }

  /*
   * Listar todos los tickets.
   */
  @Get()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  findAll() {
    return this.ticketsService.findAll();
  }

  /*
   * Asignar técnico,
   * prioridad y estado.
   */
  @Patch(':id/atencion')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  gestionarAtencion(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Body()
    updateAtencionTicketDto:
      UpdateAtencionTicketDto,

    @Req()
    request: any,
  ) {
    return this.ticketsService.gestionarAtencion(
      idTicket,
      updateAtencionTicketDto,
      request.user.sub,
    );
  }

  /*
   * Cambio de estado realizado
   * por el técnico asignado.
   *
   * En atención -> Pendiente
   * En atención -> Resuelto
   * Pendiente -> En atención
   * Pendiente -> Resuelto
   */
  @Patch(':id/estado')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Técnico')
  actualizarEstado(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Body()
    updateEstadoTicketDto:
      UpdateEstadoTicketDto,

    @Req()
    request: any,
  ) {
    return this.ticketsService.actualizarEstado(
      idTicket,
      request.user.sub,
      updateEstadoTicketDto,
    );
  }

  /*
   * El solicitante confirma
   * que la solución funcionó.
   *
   * Resuelto -> Cerrado
   */
  @Patch(
    ':id/confirmar-resolucion',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Solicitante')
  confirmarResolucion(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Req()
    request: any,
  ) {
    return this.ticketsService.confirmarResolucion(
      idTicket,
      request.user.sub,
    );
  }

  /*
   * El solicitante indica que
   * la solución no resolvió
   * el problema.
   *
   * Resuelto -> En atención
   */
  @Patch(':id/reabrir')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Solicitante')
  reabrirTicket(
    @Param(
      'id',
      ParseIntPipe,
    )
    idTicket: number,

    @Body()
    reabrirTicketDto:
      ReabrirTicketDto,

    @Req()
    request: any,
  ) {
    return this.ticketsService.reabrirTicket(
      idTicket,
      request.user.sub,
      reabrirTicketDto,
    );
  }
}