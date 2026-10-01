import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { EstadosService } from './estados.service';
import { CreateEstadoDto } from './dto/create-estado.dto';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('estados')
export class EstadosController {
  constructor(
    private readonly estadosService: EstadosService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  create(
    @Body() createEstadoDto: CreateEstadoDto,
  ) {
    return this.estadosService.create(
      createEstadoDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.estadosService.findAll();
  }
}