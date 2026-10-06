import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  PrioridadesService,
} from './prioridades.service';

import {
  CreatePrioridadDto,
} from './dto/create-prioridad.dto';

import {
  UpdatePrioridadStatusDto,
} from './dto/update-prioridad-status.dto';

import {
  JwtAuthGuard,
} from '../auth/auth.guard';

import {
  RolesGuard,
} from '../auth/roles.guard';

import {
  Roles,
} from '../auth/roles.decorator';

@Controller('prioridades')
export class PrioridadesController {
  constructor(
    private readonly prioridadesService:
      PrioridadesService,
  ) {}

  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Administrador')
  create(
    @Body()
    createPrioridadDto:
      CreatePrioridadDto,
  ) {
    return this.prioridadesService.create(
      createPrioridadDto,
    );
  }

  @Get('activas')
  @UseGuards(JwtAuthGuard)
  findActivas() {
    return this.prioridadesService.findActivas();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.prioridadesService.findAll();
  }

  @Patch(':id/estado')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('Administrador')
  updateStatus(
    @Param(
      'id',
      ParseIntPipe,
    )
    idPrioridad: number,

    @Body()
    updatePrioridadStatusDto:
      UpdatePrioridadStatusDto,
  ) {
    return this.prioridadesService.updateStatus(
      idPrioridad,
      updatePrioridadStatusDto,
    );
  }
}