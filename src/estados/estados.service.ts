import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Estado } from './entities/estado.entity';
import { CreateEstadoDto } from './dto/create-estado.dto';

@Injectable()
export class EstadosService {
  constructor(
    @InjectRepository(Estado)
    private readonly estadoRepository: Repository<Estado>,
  ) {}

  async create(createEstadoDto: CreateEstadoDto) {
    const estadoExistente =
      await this.estadoRepository.findOne({
        where: {
          nombre: createEstadoDto.nombre,
        },
      });

    if (estadoExistente) {
      throw new BadRequestException(
        'El estado ya existe',
      );
    }

    const nuevoEstado =
      this.estadoRepository.create({
        nombre: createEstadoDto.nombre,
      });

    return this.estadoRepository.save(
      nuevoEstado,
    );
  }

  async findAll() {
    return this.estadoRepository.find({
      order: {
        idEstado: 'ASC',
      },
    });
  }
}