import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
  } from '@nestjs/common';
  
  import { AuthService } from './auth.service';
  import { LoginDto } from './dto/login.dto';
  import { JwtAuthGuard } from './auth.guard';
  
  @Controller('auth')
  export class AuthController {
  
    constructor(
      private readonly authService: AuthService,
    ) {}
  
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() loginDto: LoginDto) {
      return this.authService.login(loginDto);
    }
  
    @Get('perfil')
    @UseGuards(JwtAuthGuard)
    perfil(@Req() request: any) {
  
      return {
        mensaje: 'Token válido',
        usuario: request.user,
      };
    }
  }