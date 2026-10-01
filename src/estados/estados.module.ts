import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Estado } from './entities/estado.entity';
import { EstadosController } from './estados.controller';
import { EstadosService } from './estados.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Estado]),
    AuthModule,
  ],
  controllers: [EstadosController],
  providers: [EstadosService],
  exports: [
    EstadosService,
    TypeOrmModule,
  ],
})
export class EstadosModule {}