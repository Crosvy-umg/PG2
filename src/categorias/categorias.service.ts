import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Categoria } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaStatusDto } from './dto/update-categoria-status.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async create(
    createCategoriaDto: CreateCategoriaDto,
  ) {
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
          createCategoriaDto.descripcion ??
          null,
        activo: true,
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

  async findActivas() {
    return this.categoriaRepository.find({
      where: {
        activo: true,
      },
      order: {
        nombre: 'ASC',
      },
    });
  }

  async actualizarEstado(
    idCategoria: number,
    updateCategoriaStatusDto: UpdateCategoriaStatusDto,
  ) {
    const categoria =
      await this.categoriaRepository.findOne({
        where: {
          idCategoria,
        },
      });

    if (!categoria) {
      throw new NotFoundException(
        'La categoría no existe',
      );
    }

    /*
     * Evitamos realizar una actualización
     * cuando la categoría ya tiene el estado
     * solicitado.
     */
    if (
      categoria.activo ===
      updateCategoriaStatusDto.activo
    ) {
      throw new BadRequestException(
        updateCategoriaStatusDto.activo
          ? 'La categoría ya se encuentra activa'
          : 'La categoría ya se encuentra inactiva',
      );
    }

    categoria.activo =
      updateCategoriaStatusDto.activo;

    return this.categoriaRepository.save(
      categoria,
    );
  }
}