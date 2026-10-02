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

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'Solicitante',
    'Administrador',
  )
  create(
    @Body() createTicketDto: CreateTicketDto,
    @Req() request: any,
  ) {
    return this.ticketsService.create(
      createTicketDto,
      request.user.sub,
    );
  }

  @Get('mis-tickets')
  @UseGuards(JwtAuthGuard)
  findMyTickets(
    @Req() request: any,
  ) {
    return this.ticketsService.findBySolicitante(
      request.user.sub,
    );
  }

  @Get('asignados')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Técnico')
  findAssignedTickets(
    @Req() request: any,
  ) {
    return this.ticketsService.findByTecnico(
      request.user.sub,
    );
  }

  @Get(':id/bitacora')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  findBitacora(
    @Param('id', ParseIntPipe) idTicket: number,
  ) {
    return this.ticketsService.findBitacora(
      idTicket,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  findAll() {
    return this.ticketsService.findAll();
  }

  @Patch(':id/atencion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'Técnico',
    'Supervisor',
    'Administrador',
  )
  gestionarAtencion(
    @Param('id', ParseIntPipe) idTicket: number,
    @Body() updateAtencionTicketDto: UpdateAtencionTicketDto,
    @Req() request: any,
  ) {
    return this.ticketsService.gestionarAtencion(
      idTicket,
      updateAtencionTicketDto,
      request.user.sub,
    );
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Técnico')
  actualizarEstado(
    @Param('id', ParseIntPipe) idTicket: number,
    @Body() updateEstadoTicketDto: UpdateEstadoTicketDto,
    @Req() request: any,
  ) {
    return this.ticketsService.actualizarEstado(
      idTicket,
      request.user.sub,
      updateEstadoTicketDto,
    );
  }
}