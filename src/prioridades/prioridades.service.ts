import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {
  Prioridad,
} from './entities/prioridad.entity';

import {
  CreatePrioridadDto,
} from './dto/create-prioridad.dto';

import {
  UpdatePrioridadStatusDto,
} from './dto/update-prioridad-status.dto';

@Injectable()
export class PrioridadesService {
  constructor(
    @InjectRepository(Prioridad)
    private readonly prioridadRepository:
      Repository<Prioridad>,
  ) {}

  async create(
    createPrioridadDto: CreatePrioridadDto,
  ) {
    const nombre =
      createPrioridadDto.nombre.trim();

    const prioridadPorNombre =
      await this.prioridadRepository.findOne({
        where: {
          nombre,
        },
      });

    if (prioridadPorNombre) {
      throw new BadRequestException(
        'La prioridad ya existe',
      );
    }

    const prioridadPorNivel =
      await this.prioridadRepository.findOne({
        where: {
          nivel: createPrioridadDto.nivel,
        },
      });

    if (prioridadPorNivel) {
      throw new BadRequestException(
        'El nivel de prioridad ya existe',
      );
    }

    const nuevaPrioridad =
      this.prioridadRepository.create({
        nombre,
        nivel: createPrioridadDto.nivel,
        activo: true,
      });

    try {
      return await this.prioridadRepository.save(
        nuevaPrioridad,
      );
    } catch {
      throw new BadRequestException(
        'No fue posible registrar la prioridad.',
      );
    }
  }

  async findAll() {
    return this.prioridadRepository.find({
      order: {
        nivel: 'ASC',
      },
    });
  }

  async findActivas() {
    return this.prioridadRepository.find({
      where: {
        activo: true,
      },
      order: {
        nivel: 'ASC',
      },
    });
  }

  async updateStatus(
    idPrioridad: number,
    updatePrioridadStatusDto:
      UpdatePrioridadStatusDto,
  ) {
    const prioridad =
      await this.prioridadRepository.findOne({
        where: {
          idPrioridad,
        },
      });

    if (!prioridad) {
      throw new NotFoundException(
        'La prioridad no existe',
      );
    }

    prioridad.activo =
      updatePrioridadStatusDto.activo;

    try {
      return await this.prioridadRepository.save(
        prioridad,
      );
    } catch {
      throw new BadRequestException(
        'No fue posible cambiar el estado de la prioridad.',
      );
    }
  }
}