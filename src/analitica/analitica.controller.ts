import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import {
  AnaliticaService,
} from './analitica.service';

import {
  JwtAuthGuard,
} from '../auth/auth.guard';

import {
  RolesGuard,
} from '../auth/roles.guard';

import {
  Roles,
} from '../auth/roles.decorator';

@Controller('analitica')
export class AnaliticaController {
  constructor(
    private readonly analiticaService:
      AnaliticaService,
  ) {}

  @Get('resumen')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Supervisor',
    'Administrador',
  )
  obtenerResumenGeneral() {
    return this.analiticaService
      .obtenerResumenGeneral();
  }

  @Get('categorias')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Supervisor',
    'Administrador',
  )
  obtenerTicketsPorCategoria() {
    return this.analiticaService
      .obtenerTicketsPorCategoria();
  }

  @Get('prioridades')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Supervisor',
    'Administrador',
  )
  obtenerTicketsPorPrioridad() {
    return this.analiticaService
      .obtenerTicketsPorPrioridad();
  }

  @Get('tecnicos')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Supervisor',
    'Administrador',
  )
  obtenerTicketsPorTecnico() {
    return this.analiticaService
      .obtenerTicketsPorTecnico();
  }

  @Get('mensual')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Supervisor',
    'Administrador',
  )
  obtenerHistoricoMensual() {
    return this.analiticaService
      .obtenerHistoricoMensual();
  }
}