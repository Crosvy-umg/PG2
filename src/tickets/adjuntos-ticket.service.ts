import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Ticket } from './entities/ticket.entity';

import { AdjuntoTicket } from './entities/adjunto-ticket.entity';

import { BitacoraService } from '../bitacora/bitacora.service';

@Injectable()
export class AdjuntosTicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository:
      Repository<Ticket>,

    @InjectRepository(AdjuntoTicket)
    private readonly adjuntoRepository:
      Repository<AdjuntoTicket>,

    private readonly bitacoraService:
      BitacoraService,
  ) {}

  private validarAccesoTicket(
    ticket: Ticket,
    idUsuario: number,
    rolUsuario: string,
  ) {
    const puedeAcceder =
      rolUsuario === 'Administrador' ||
      rolUsuario === 'Supervisor' ||
      (
        rolUsuario === 'Solicitante' &&
        ticket.idSolicitante === idUsuario
      ) ||
      (
        rolUsuario === 'Técnico' &&
        ticket.idTecnico === idUsuario
      );

    if (!puedeAcceder) {
      throw new ForbiddenException(
        'No tiene permiso para acceder a los archivos de este ticket.',
      );
    }
  }

  async guardarAdjuntos(
    idTicket: number,
    archivos: Express.Multer.File[],
    idUsuario: number,
    rolUsuario: string,
  ) {
    const ticket =
      await this.ticketRepository.findOne({
        where: {
          idTicket,
        },
      });

    if (!ticket) {
      throw new NotFoundException(
        'El ticket no existe.',
      );
    }

    this.validarAccesoTicket(
      ticket,
      idUsuario,
      rolUsuario,
    );

    if (
      !archivos ||
      archivos.length === 0
    ) {
      throw new BadRequestException(
        'Debe seleccionar al menos un archivo.',
      );
    }

    const adjuntos: AdjuntoTicket[] = [];

    for (const archivo of archivos) {
      const adjunto =
        this.adjuntoRepository.create({
          idTicket,
          nombreOriginal:
            archivo.originalname,
          nombreArchivo:
            archivo.filename,
          tipoMime:
            archivo.mimetype,
          tamano:
            archivo.size,
          ruta:
            archivo.path.replace(
              /\\/g,
              '/',
            ),
          idUsuario,
        });

      const adjuntoGuardado =
        await this.adjuntoRepository.save(
          adjunto,
        );

      adjuntos.push(
        adjuntoGuardado,
      );

      /*
       * Registramos el archivo
       * agregado en la bitácora
       * del ticket.
       */
      await this.bitacoraService.registrar(
        idTicket,
        idUsuario,
        'Archivo adjunto agregado',
        `Se agregó el archivo "${archivo.originalname}" al ticket.`,
      );
    }

    return {
      message:
        'Archivo(s) adjuntado(s) correctamente.',
      cantidad:
        adjuntos.length,
      adjuntos,
    };
  }

  async listarAdjuntos(
    idTicket: number,
    idUsuario: number,
    rolUsuario: string,
  ) {
    const ticket =
      await this.ticketRepository.findOne({
        where: {
          idTicket,
        },
      });

    if (!ticket) {
      throw new NotFoundException(
        'El ticket no existe.',
      );
    }

    this.validarAccesoTicket(
      ticket,
      idUsuario,
      rolUsuario,
    );

    return this.adjuntoRepository.find({
      where: {
        idTicket,
      },
      order: {
        fechaCreacion: 'DESC',
      },
    });
  }

  async obtenerArchivo(
    idTicket: number,
    idAdjunto: number,
    idUsuario: number,
    rolUsuario: string,
  ) {
    const ticket =
      await this.ticketRepository.findOne({
        where: {
          idTicket,
        },
      });

    if (!ticket) {
      throw new NotFoundException(
        'El ticket no existe.',
      );
    }

    this.validarAccesoTicket(
      ticket,
      idUsuario,
      rolUsuario,
    );

    const adjunto =
      await this.adjuntoRepository.findOne({
        where: {
          idAdjunto,
          idTicket,
        },
      });

    if (!adjunto) {
      throw new NotFoundException(
        'El archivo adjunto no existe para este ticket.',
      );
    }

    return adjunto;
  }
}