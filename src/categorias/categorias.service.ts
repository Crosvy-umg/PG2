import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async create(createCategoriaDto: CreateCategoriaDto) {
    const categoriaExistente =
      await this.categoriaRepository.findOne({
        where: {
          nombre: createCategoriaDto.nombre,
        },
      });

    if (categoriaExistente) {
      throw new BadRequestException(
        'La categoría ya existe',
      );
    }

    const nuevaCategoria =
      this.categoriaRepository.create({
        nombre: createCategoriaDto.nombre,
        descripcion:
          createCategoriaDto.descripcion ?? null,
      });

    return this.categoriaRepository.save(
      nuevaCategoria,
    );
  }

  async findAll() {
    return this.categoriaRepository.find({
      order: {
        nombre: 'ASC',
      },
    });
  }
}