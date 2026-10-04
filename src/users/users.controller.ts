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

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('usuarios')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  create(
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(
      createUserDto,
    );
  }

  @Get('tecnicos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'Administrador',
    'Supervisor',
  )
  findTecnicos() {
    return this.usersService.findTecnicos();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/estado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  actualizarEstado(
    @Param('id', ParseIntPipe)
    idUsuario: number,

    @Body()
    updateUserStatusDto: UpdateUserStatusDto,

    @Req()
    request: any,
  ) {
    return this.usersService.actualizarEstado(
      idUsuario,
      updateUserStatusDto,
      request.user.sub,
    );
  }
}