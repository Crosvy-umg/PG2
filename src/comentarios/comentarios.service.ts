import {
  BadRequestException,
  ForbiddenException,
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
  Comentario,
} from './entities/comentario.entity';

import {
  Ticket,
} from '../tickets/entities/ticket.entity';

import {
  CreateComentarioDto,
} from './dto/create-comentario.dto';

import {
  NotificacionesService,
} from '../notificaciones/notificaciones.service';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario)
    private readonly comentarioRepository:
      Repository<Comentario>,

    @InjectRepository(Ticket)
    private readonly ticketRepository:
      Repository<Ticket>,

    private readonly notificacionesService:
      NotificacionesService,
  ) {}

  private async validarAccesoTicket(
    idTicket: number,
    idUsuario: number,
    rol: string,
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

    if (
      rol === 'Solicitante' &&
      ticket.idSolicitante !== idUsuario
    ) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a este ticket',
      );
    }

    if (
      rol === 'Técnico' &&
      ticket.idTecnico !== idUsuario
    ) {
      throw new ForbiddenException(
        'El ticket no está asignado a este técnico',
      );
    }

    if (
      ![
        'Solicitante',
        'Técnico',
        'Supervisor',
        'Administrador',
      ].includes(rol)
    ) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a este ticket',
      );
    }

    return ticket;
  }

  private async notificarComentario(
    ticket: Ticket,
    idUsuario: number,
    rol: string,
  ) {
    const destinatarios =
      new Set<number>();

    /*
     * Solicitante comenta:
     * notificamos al técnico asignado.
     */
    if (rol === 'Solicitante') {
      if (
        ticket.idTecnico &&
        ticket.idTecnico !== idUsuario
      ) {
        destinatarios.add(
          ticket.idTecnico,
        );
      }
    }

    /*
     * Técnico comenta:
     * notificamos al solicitante.
     */
    if (rol === 'Técnico') {
      if (
        ticket.idSolicitante !==
        idUsuario
      ) {
        destinatarios.add(
          ticket.idSolicitante,
        );
      }
    }

    /*
     * Supervisor o Administrador:
     * notificamos al solicitante
     * y al técnico asignado.
     */
    if (
      rol === 'Supervisor' ||
      rol === 'Administrador'
    ) {
      if (
        ticket.idSolicitante !==
        idUsuario
      ) {
        destinatarios.add(
          ticket.idSolicitante,
        );
      }

      if (
        ticket.idTecnico &&
        ticket.idTecnico !== idUsuario
      ) {
        destinatarios.add(
          ticket.idTecnico,
        );
      }
    }

    if (destinatarios.size === 0) {
      return;
    }

    let autor = rol;

    if (rol === 'Técnico') {
      autor = 'El técnico';
    }

    if (rol === 'Solicitante') {
      autor = 'El solicitante';
    }

    if (rol === 'Administrador') {
      autor = 'El administrador';
    }

    if (rol === 'Supervisor') {
      autor = 'El supervisor';
    }

    await Promise.all(
      Array.from(destinatarios).map(
        (idDestinatario) =>
          this.notificacionesService.crear(
            idDestinatario,
            'Nuevo comentario en el ticket',
            `${autor} agregó un comentario en ${ticket.codigo}: ${ticket.titulo}.`,
            ticket.idTicket,
          ),
      ),
    );
  }

  async crear(
    idTicket: number,
    idUsuario: number,
    rol: string,
    createComentarioDto:
      CreateComentarioDto,
  ) {
    const ticket =
      await this.validarAccesoTicket(
        idTicket,
        idUsuario,
        rol,
      );

    /*
     * Un ticket cerrado puede ser
     * consultado, pero ya no puede
     * recibir nuevos comentarios.
     */
    if (ticket.idEstado === 6) {
      throw new BadRequestException(
        'No se pueden agregar comentarios a un ticket cerrado',
      );
    }

    const nuevoComentario =
      this.comentarioRepository.create({
        idTicket,
        idUsuario,
        mensaje:
          createComentarioDto.mensaje,
      });

    const comentarioGuardado =
      await this.comentarioRepository.save(
        nuevoComentario,
      );

    await this.notificarComentario(
      ticket,
      idUsuario,
      rol,
    );

    return this.comentarioRepository.findOne({
      where: {
        idComentario:
          comentarioGuardado.idComentario,
      },
    });
  }

  async findByTicket(
    idTicket: number,
    idUsuario: number,
    rol: string,
  ) {
    await this.validarAccesoTicket(
      idTicket,
      idUsuario,
      rol,
    );

    return this.comentarioRepository.find({
      where: {
        idTicket,
      },
      order: {
        fechaCreacion: 'ASC',
      },
    });
  }
}