import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { PrioridadesService } from './prioridades.service';
import { CreatePrioridadDto } from './dto/create-prioridad.dto';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('prioridades')
export class PrioridadesController {
  constructor(
    private readonly prioridadesService: PrioridadesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  create(
    @Body() createPrioridadDto: CreatePrioridadDto,
  ) {
    return this.prioridadesService.create(
      createPrioridadDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.prioridadesService.findAll();
  }
}