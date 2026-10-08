import {
  forwardRef,
  Module,
} from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    forwardRef(
      () => UsersModule,
    ),

    /*
     * Registramos el repositorio User
     * para que JwtAuthGuard pueda consultar
     * el estado actual del usuario.
     */
    TypeOrmModule.forFeature([
      User,
    ]),

    ConfigModule,

    JwtModule.registerAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.get<string>(
            'JWT_SECRET',
          ),

        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
  ],

  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    JwtModule,

    /*
     * IMPORTANTE:
     * Esto permite que los módulos que
     * importan AuthModule también puedan
     * resolver UserRepository cuando
     * utilizan JwtAuthGuard.
     */
    TypeOrmModule,
  ],
})
export class AuthModule {}