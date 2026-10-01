import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

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
}