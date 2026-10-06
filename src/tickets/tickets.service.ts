import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  In,
  Repository,
} from 'typeorm';

import { Ticket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateAtencionTicketDto } from './dto/update-atencion-ticket.dto';
import { UpdateEstadoTicketDto } from './dto/update-estado-ticket.dto';

import { Prioridad } from '../prioridades/entities/prioridad.entity';

import { User } from '../users/entities/user.entity';

import { BitacoraService } from '../bitacora/bitacora.service';

import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository:
      Repository<Ticket>,

    @InjectRepository(Prioridad)
    private readonly prioridadRepository:
      Repository<Prioridad>,

    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,

    private readonly bitacoraService:
      BitacoraService,

    private readonly notificacionesService:
      NotificacionesService,
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

    const ultimoTicket =
      ultimosTickets[0];

    const siguienteNumero =
      (ultimoTicket?.idTicket ?? 0) + 1;

    const codigo = `TK-${String(
      siguienteNumero,
    ).padStart(4, '0')}`;

    const nuevoTicket =
      this.ticketRepository.create({
        codigo,

        titulo:
          createTicketDto.titulo,

        descripcion:
          createTicketDto.descripcion,

        impacto:
          createTicketDto.impacto,

        urgencia:
          createTicketDto.urgencia,

        idSolicitante,

        idTecnico: null,

        idCategoria:
          createTicketDto.idCategoria,

        idPrioridad: null,

        idEstado: 1,

        fechaCierre: null,
      });

    let ticketGuardado: Ticket;

    /*
     * Primero guardamos el ticket.
     */
    try {
      ticketGuardado =
        await this.ticketRepository.save(
          nuevoTicket,
        );
    } catch {
      throw new BadRequestException(
        'No fue posible registrar el ticket. Verifique los datos relacionados.',
      );
    }

    /*
     * Registramos la creación
     * en la bitácora.
     */
    await this.bitacoraService.registrar(
      ticketGuardado.idTicket,
      idSolicitante,
      'Ticket creado',
      `Se creó el ticket ${ticketGuardado.codigo} en estado Nuevo.`,
    );

    /*
     * Buscamos usuarios activos
     * con los roles:
     *
     * 6 = Supervisor
     * 7 = Administrador
     */
    const usuariosAdministrativos =
      await this.userRepository.find({
        where: {
          idRol: In([
            6,
            7,
          ]),

          activo: true,
        },
      });

    /*
     * Creamos una notificación
     * para cada Supervisor y
     * Administrador activo.
     */
    await Promise.all(
      usuariosAdministrativos.map(
        (usuario) =>
          this.notificacionesService.crear(
            usuario.id,

            'Nuevo ticket registrado',

            `Se creó el ticket ${ticketGuardado.codigo}: ${ticketGuardado.titulo}. Impacto: ${ticketGuardado.impacto}. Urgencia: ${ticketGuardado.urgencia}.`,

            ticketGuardado.idTicket,
          ),
      ),
    );

    return ticketGuardado;
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

  async findOne(
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
      ticket.idSolicitante !==
        idUsuario
    ) {
      throw new ForbiddenException(
        'No tiene permisos para consultar este ticket',
      );
    }

    if (
      rol === 'Técnico' &&
      ticket.idTecnico !==
        idUsuario
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
        'No tiene permisos para consultar este ticket',
      );
    }

    return ticket;
  }

  async gestionarAtencion(
    idTicket: number,

    updateAtencionTicketDto:
      UpdateAtencionTicketDto,

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

    /*
     * Validamos que la prioridad exista.
     */
    const prioridad =
      await this.prioridadRepository.findOne({
        where: {
          idPrioridad:
            updateAtencionTicketDto.idPrioridad,
        },
      });

    if (!prioridad) {
      throw new BadRequestException(
        'La prioridad seleccionada no existe',
      );
    }

    /*
     * La prioridad también
     * debe encontrarse activa.
     */
    if (!prioridad.activo) {
      throw new BadRequestException(
        'La prioridad seleccionada está inactiva',
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
          ticketActualizado.tecnico
            ?.usuario ??
          `ID ${updateAtencionTicketDto.idTecnico}`
        }. Prioridad: ${
          ticketActualizado.prioridad
            ?.nombre ??
          `ID ${updateAtencionTicketDto.idPrioridad}`
        }. Estado: ${
          ticketActualizado.estado
            ?.nombre ??
          `ID ${updateAtencionTicketDto.idEstado}`
        }.`,
      );

      /*
       * Notificación al técnico.
       */
      await this.notificacionesService.crear(
        updateAtencionTicketDto.idTecnico,

        'Nuevo ticket asignado',

        `Se le asignó el ticket ${ticketActualizado.codigo}: ${ticketActualizado.titulo}. Prioridad: ${
          ticketActualizado.prioridad
            ?.nombre ??
          prioridad.nombre
        }.`,

        idTicket,
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

    updateEstadoTicketDto:
      UpdateEstadoTicketDto,
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
      ticket.idTecnico !==
      idTecnico
    ) {
      throw new ForbiddenException(
        'El ticket no está asignado a este técnico',
      );
    }

    const estadoActual =
      ticket.idEstado;

    const estadoNuevo =
      updateEstadoTicketDto.idEstado;

    if (
      estadoNuevo < 1 ||
      estadoNuevo > 6
    ) {
      throw new BadRequestException(
        'El estado indicado no es válido',
      );
    }

    if (
      estadoActual ===
      estadoNuevo
    ) {
      throw new BadRequestException(
        'El ticket ya se encuentra en ese estado',
      );
    }

    if (
      estadoActual === 6
    ) {
      throw new BadRequestException(
        'Un ticket cerrado ya no puede cambiar de estado',
      );
    }

    const transicionesPermitidas: Record<
      number,
      number[]
    > = {
      3: [
        4,
        5,
      ],

      4: [
        3,
        5,
      ],

      5: [
        6,
      ],
    };

    const estadosPermitidos =
      transicionesPermitidas[
        estadoActual
      ] ?? [];

    if (
      !estadosPermitidos.includes(
        estadoNuevo,
      )
    ) {
      throw new BadRequestException(
        'La transición de estado solicitada no está permitida',
      );
    }

    const nombresEstados: Record<
      number,
      string
    > = {
      1: 'Nuevo',
      2: 'En revisión',
      3: 'En atención',
      4: 'Pendiente',
      5: 'Resuelto',
      6: 'Cerrado',
    };

    const nombreEstadoAnterior =
      ticket.estado?.nombre ??
      nombresEstados[
        estadoActual
      ] ??
      `ID ${estadoActual}`;

    if (
      estadoNuevo === 6
    ) {
      await this.ticketRepository.update(
        idTicket,
        {
          idEstado:
            estadoNuevo,

          fechaCierre:
            new Date(),
        },
      );
    } else {
      await this.ticketRepository.update(
        idTicket,
        {
          idEstado:
            estadoNuevo,
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

    const nombreEstadoNuevo =
      ticketActualizado.estado
        ?.nombre ??
      nombresEstados[
        estadoNuevo
      ] ??
      `ID ${estadoNuevo}`;

    /*
     * Bitácora.
     */
    await this.bitacoraService.registrar(
      idTicket,

      idTecnico,

      'Estado actualizado',

      `El estado cambió de ${nombreEstadoAnterior} a ${nombreEstadoNuevo}.`,
    );

    /*
     * Notificación al solicitante.
     */
    await this.notificacionesService.crear(
      ticket.idSolicitante,

      'Estado de ticket actualizado',

      `El ticket ${ticketActualizado.codigo}: ${ticketActualizado.titulo} cambió de ${nombreEstadoAnterior} a ${nombreEstadoNuevo}.`,

      idTicket,
    );

    return ticketActualizado;
  }

  async findBitacora(
    idTicket: number,
    idUsuario: number,
    rol: string,
  ) {
    await this.findOne(
      idTicket,
      idUsuario,
      rol,
    );

    return this.bitacoraService.findByTicket(
      idTicket,
    );
  }
}