import {
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt';
  
  import { UsersService } from '../users/users.service';
  import { LoginDto } from './dto/login.dto';
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly usersService: UsersService,
      private readonly jwtService: JwtService,
    ) {}
  
    async login(loginDto: LoginDto) {
      const usuario = await this.usersService.findByUsername(
        loginDto.usuario,
      );
  
      if (!usuario) {
        throw new UnauthorizedException(
          'Usuario o contraseña incorrectos',
        );
      }
  
      if (!usuario.activo) {
        throw new UnauthorizedException(
          'Usuario inactivo',
        );
      }
  
      const contraseniaValida = await bcrypt.compare(
        loginDto.contrasenia,
        usuario.contrasenia,
      );
  
      if (!contraseniaValida) {
        throw new UnauthorizedException(
          'Usuario o contraseña incorrectos',
        );
      }
  
      const payload = {
        sub: usuario.id,
        usuario: usuario.usuario,
      };
  
      const token = await this.jwtService.signAsync(payload);
  
      return {
        mensaje: 'Inicio de sesión correcto',
        token,
        usuario: {
          id: usuario.id,
          usuario: usuario.usuario,
        },
      };
    }
  }