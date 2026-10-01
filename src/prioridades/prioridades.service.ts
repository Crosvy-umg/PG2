import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Prioridad } from './entities/prioridad.entity';
import { CreatePrioridadDto } from './dto/create-prioridad.dto';

@Injectable()
export class PrioridadesService {
  constructor(
    @InjectRepository(Prioridad)
    private readonly prioridadRepository: Repository<Prioridad>,
  ) {}

  async create(createPrioridadDto: CreatePrioridadDto) {
    const prioridadExistente =
      await this.prioridadRepository.findOne({
        where: {
          nombre: createPrioridadDto.nombre,
        },
      });

    if (prioridadExistente) {
      throw new BadRequestException(
        'La prioridad ya existe',
      );
    }

    const nuevaPrioridad =
      this.prioridadRepository.create({
        nombre: createPrioridadDto.nombre,
        nivel: createPrioridadDto.nivel,
      });

    return this.prioridadRepository.save(
      nuevaPrioridad,
    );
  }

  async findAll() {
    return this.prioridadRepository.find({
      order: {
        nivel: 'ASC',
      },
    });
  }
}