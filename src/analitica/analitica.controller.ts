import {
  Controller,
  Get,
  Query,
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
  obtenerResumenGeneral(
    @Query('desde')
    desde?: string,

    @Query('hasta')
    hasta?: string,
  ) {
    return this.analiticaService
      .obtenerResumenGeneral(
        desde,
        hasta,
      );
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
  obtenerTicketsPorCategoria(
    @Query('desde')
    desde?: string,

    @Query('hasta')
    hasta?: string,
  ) {
    return this.analiticaService
      .obtenerTicketsPorCategoria(
        desde,
        hasta,
      );
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
  obtenerTicketsPorPrioridad(
    @Query('desde')
    desde?: string,

    @Query('hasta')
    hasta?: string,
  ) {
    return this.analiticaService
      .obtenerTicketsPorPrioridad(
        desde,
        hasta,
      );
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
  obtenerTicketsPorTecnico(
    @Query('desde')
    desde?: string,

    @Query('hasta')
    hasta?: string,
  ) {
    return this.analiticaService
      .obtenerTicketsPorTecnico(
        desde,
        hasta,
      );
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
  obtenerHistoricoMensual(
    @Query('desde')
    desde?: string,

    @Query('hasta')
    hasta?: string,
  ) {
    return this.analiticaService
      .obtenerHistoricoMensual(
        desde,
        hasta,
      );
  }

  @Get('tiempos')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    'Supervisor',
    'Administrador',
  )
  obtenerMetricasTiempo(
    @Query('desde')
    desde?: string,

    @Query('hasta')
    hasta?: string,
  ) {
    return this.analiticaService
      .obtenerMetricasTiempo(
        desde,
        hasta,
      );
  }
}