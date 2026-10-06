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

import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaStatusDto } from './dto/update-categoria-status.dto';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('categorias')
export class CategoriasController {
  constructor(
    private readonly categoriasService: CategoriasService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  create(
    @Body()
    createCategoriaDto: CreateCategoriaDto,
  ) {
    return this.categoriasService.create(
      createCategoriaDto,
    );
  }

  @Get('activas')
  @UseGuards(JwtAuthGuard)
  findActivas() {
    return this.categoriasService.findActivas();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.categoriasService.findAll();
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  actualizarEstado(
    @Param('id', ParseIntPipe)
    idCategoria: number,

    @Body()
    updateCategoriaStatusDto: UpdateCategoriaStatusDto,
  ) {
    return this.categoriasService.actualizarEstado(
      idCategoria,
      updateCategoriaStatusDto,
    );
  }
}