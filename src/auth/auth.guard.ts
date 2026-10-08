import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest();

    const token =
      this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token no proporcionado',
      );
    }

    let payload: {
      sub: number;
      usuario?: string;
      idRol?: number;
      rol?: string;
    };

    /*
     * Primero validamos que el JWT:
     * - tenga una firma válida
     * - no haya expirado
     */
    try {
      payload =
        await this.jwtService.verifyAsync(
          token,
          {
            secret:
              this.configService.get<string>(
                'JWT_SECRET',
              ),
          },
        );
    } catch {
      throw new UnauthorizedException(
        'Token inválido o expirado',
      );
    }

    /*
     * El token debe contener el ID
     * del usuario.
     */
    if (!payload.sub) {
      throw new UnauthorizedException(
        'Token inválido',
      );
    }

    /*
     * Consultamos nuevamente al usuario
     * en la base de datos.
     *
     * Esto permite invalidar en la práctica
     * los tokens de cuentas que hayan sido
     * desactivadas después de iniciar sesión.
     */
    const usuario =
      await this.userRepository.findOne({
        where: {
          id: payload.sub,
        },
      });

    /*
     * Si el usuario fue eliminado o ya no
     * existe, su token tampoco debe permitir
     * acceso.
     */
    if (!usuario) {
      throw new UnauthorizedException(
        'El usuario asociado al token no existe',
      );
    }

    /*
     * Un usuario inactivo no puede utilizar
     * un token emitido anteriormente.
     */
    if (!usuario.activo) {
      throw new UnauthorizedException(
        'El usuario se encuentra inactivo',
      );
    }

    /*
     * Después de comprobar el token y el
     * estado actual de la cuenta, dejamos
     * disponible el payload para los
     * controladores y guards de roles.
     */
    request.user = payload;

    return true;
  }

  private extractTokenFromHeader(
    request: any,
  ): string | undefined {
    const [type, token] =
      request.headers.authorization?.split(
        ' ',
      ) ?? [];

    return type === 'Bearer'
      ? token
      : undefined;
  }
}