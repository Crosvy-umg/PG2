import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BitacoraTicket } from './entities/bitacora-ticket.entity';

@Injectable()
export class BitacoraService {
  constructor(
    @InjectRepository(BitacoraTicket)
    private readonly bitacoraRepository: Repository<BitacoraTicket>,
  ) {}

  async registrar(
    idTicket: number,
    idUsuario: number,
    accion: string,
    detalle: string | null = null,
  ) {
    const registro =
      this.bitacoraRepository.create({
        idTicket,
        idUsuario,
        accion,
        detalle,
      });

    return this.bitacoraRepository.save(
      registro,
    );
  }

  async findByTicket(
    idTicket: number,
  ) {
    return this.bitacoraRepository.find({
      where: {
        idTicket,
      },
      relations: {
        usuario: true,
      },
      order: {
        fecha: 'ASC',
      },
    });
  }
}