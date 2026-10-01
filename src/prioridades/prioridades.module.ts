import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Prioridad } from './entities/prioridad.entity';
import { PrioridadesController } from './prioridades.controller';
import { PrioridadesService } from './prioridades.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prioridad]),
    AuthModule,
  ],
  controllers: [PrioridadesController],
  providers: [PrioridadesService],
  exports: [
    PrioridadesService,
    TypeOrmModule,
  ],
})
export class PrioridadesModule {}