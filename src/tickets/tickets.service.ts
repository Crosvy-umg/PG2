import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateAtencionTicketDto } from './dto/update-atencion-ticket.dto';
import { UpdateEstadoTicketDto } from './dto/update-estado-ticket.dto';

import { BitacoraService } from '../bitacora/bitacora.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,

    private readonly bitacoraService: BitacoraService,
  ) {}

  async create(
    createTicketDto: CreateTicketDto,
    idSolicitante: number,
  ) {
    const ultimosTickets =
      await this.ticketRepository.find({
        order: {
          idTicket: 'DESC',
        },
        take: 1,
      });

    const ultimoTicket = ultimosTickets[0];

    const siguienteNumero =
      (ultimoTicket?.idTicket ?? 0) + 1;

    const codigo = `TK-${String(
      siguienteNumero,
    ).padStart(4, '0')}`;

    const nuevoTicket =
      this.ticketRepository.create({
        codigo,
        titulo: createTicketDto.titulo,
        descripcion: createTicketDto.descripcion,
        impacto: createTicketDto.impacto,
        urgencia: createTicketDto.urgencia,
        idSolicitante,
        idTecnico: null,
        idCategoria: createTicketDto.idCategoria,
        idPrioridad: null,
        idEstado: 1,
        fechaCierre: null,
      });

    try {
      const ticketGuardado =
        await this.ticketRepository.save(
          nuevoTicket,
        );

      await this.bitacoraService.registrar(
        ticketGuardado.idTicket,
        idSolicitante,
        'Ticket creado',
        `Se creó el ticket ${ticketGuardado.codigo} en estado Nuevo.`,
      );

      return ticketGuardado;
    } catch {
      throw new BadRequestException(
        'No fue posible registrar el ticket. Verifique los datos relacionados.',
      );
    }
  }

  async findAll() {
    return this.ticketRepository.find({
      order: {
        idTicket: 'DESC',
      },
    });
  }

  async findBySolicitante(
    idSolicitante: number,
  ) {
    return this.ticketRepository.find({
      where: {
        idSolicitante,
      },
      order: {
        idTicket: 'DESC',
      },
    });
  }

  async gestionarAtencion(
    idTicket: number,
    updateAtencionTicketDto: UpdateAtencionTicketDto,
    idUsuario: number,
  ) {
    const ticket =
      await this.ticketRepository.findOne({
        where: {
          idTicket,
        },
      });

    if (!ticket) {
      throw new NotFoundException(
        'El ticket no existe',
      );
    }

    try {
      await this.ticketRepository.update(
        idTicket,
        {
          idTecnico:
            updateAtencionTicketDto.idTecnico,
          idPrioridad:
            updateAtencionTicketDto.idPrioridad,
          idEstado:
            updateAtencionTicketDto.idEstado,
        },
      );

      const ticketActualizado =
        await this.ticketRepository.findOne({
          where: {
            idTicket,
          },
        });

      if (!ticketActualizado) {
        throw new NotFoundException(
          'No fue posible recuperar el ticket actualizado',
        );
      }

      await this.bitacoraService.registrar(
        idTicket,
        idUsuario,
        'Atención actualizada',
        `Técnico: ${
          ticketActualizado.tecnico?.usuario ??
          `ID ${updateAtencionTicketDto.idTecnico}`
        }. Prioridad: ${
          ticketActualizado.prioridad?.nombre ??
          `ID ${updateAtencionTicketDto.idPrioridad}`
        }. Estado: ${
          ticketActualizado.estado?.nombre ??
          `ID ${updateAtencionTicketDto.idEstado}`
        }.`,
      );

      return ticketActualizado;
    } catch {
      throw new BadRequestException(
        'No fue posible actualizar la atención del ticket. Verifique técnico, prioridad y estado.',
      );
    }
  }

  async findByTecnico(
    idTecnico: number,
  ) {
    return this.ticketRepository.find({
      where: {
        idTecnico,
      },
      order: {
        idTicket: 'DESC',
      },
    });
  }

  async actualizarEstado(
    idTicket: number,
    idTecnico: number,
    updateEstadoTicketDto: UpdateEstadoTicketDto,
  ) {
    const ticket =
      await this.ticketRepository.findOne({
        where: {
          idTicket,
        },
      });

    if (!ticket) {
      throw new NotFoundException(
        'El ticket no existe',
      );
    }

    if (ticket.idTecnico !== idTecnico) {
      throw new BadRequestException(
        'El ticket no está asignado a este técnico',
      );
    }

    const estadoAnterior =
      ticket.estado?.nombre ??
      `ID ${ticket.idEstado}`;

    try {
      if (updateEstadoTicketDto.idEstado === 6) {
        await this.ticketRepository.update(
          idTicket,
          {
            idEstado:
              updateEstadoTicketDto.idEstado,
            fechaCierre: new Date(),
          },
        );
      } else {
        await this.ticketRepository.update(
          idTicket,
          {
            idEstado:
              updateEstadoTicketDto.idEstado,
          },
        );
      }

      const ticketActualizado =
        await this.ticketRepository.findOne({
          where: {
            idTicket,
          },
        });

      if (!ticketActualizado) {
        throw new NotFoundException(
          'No fue posible recuperar el ticket actualizado',
        );
      }

      const estadoNuevo =
        ticketActualizado.estado?.nombre ??
        `ID ${updateEstadoTicketDto.idEstado}`;

      await this.bitacoraService.registrar(
        idTicket,
        idTecnico,
        'Estado actualizado',
        `El estado cambió de ${estadoAnterior} a ${estadoNuevo}.`,
      );

      return ticketActualizado;
    } catch {
      throw new BadRequestException(
        'No fue posible actualizar el estado del ticket.',
      );
    }
  }

  async findBitacora(
    idTicket: number,
  ) {
    const ticket =
      await this.ticketRepository.findOne({
        where: {
          idTicket,
        },
      });

    if (!ticket) {
      throw new NotFoundException(
        'El ticket no existe',
      );
    }

    return this.bitacoraService.findByTicket(
      idTicket,
    );
  }
}