import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Categoria } from './entities/categoria.entity';
import { CategoriasController } from './categorias.controller';
import { CategoriasService } from './categorias.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Categoria]),
    AuthModule,
  ],
  controllers: [CategoriasController],
  providers: [CategoriasService],
  exports: [
    CategoriasService,
    TypeOrmModule,
  ],
})
export class CategoriasModule {}