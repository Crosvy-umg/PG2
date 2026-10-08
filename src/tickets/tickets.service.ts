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

import { ReabrirTicketDto } from './dto/reabrir-ticket.dto';

import { Prioridad } from '../prioridades/entities/prioridad.entity';

import { Categoria } from '../categorias/entities/categoria.entity';

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

    @InjectRepository(Categoria)
    private readonly categoriaRepository:
      Repository<Categoria>,

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
    /*
     * Validamos que la categoría
     * seleccionada exista.
     */
    const categoria =
      await this.categoriaRepository.findOne({
        where: {
          idCategoria:
            createTicketDto.idCategoria,
        },
      });

    if (!categoria) {
      throw new BadRequestException(
        'La categoría seleccionada no existe',
      );
    }

    /*
     * Una categoría inactiva no puede
     * utilizarse para crear nuevos tickets.
     */
    if (!categoria.activo) {
      throw new BadRequestException(
        'La categoría seleccionada está inactiva',
      );
    }

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

        resolucion: null,

        fechaResolucion: null,
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
     * Un ticket que ya se encuentra
     * Pendiente, Resuelto o Cerrado
     * no puede modificarse nuevamente
     * desde la gestión de atención.
     */
    if (
      ticket.idEstado === 4 ||
      ticket.idEstado === 5 ||
      ticket.idEstado === 6
    ) {
      throw new BadRequestException(
        'Un ticket Pendiente, Resuelto o Cerrado no puede modificarse desde la gestión de atención',
      );
    }

    /*
     * Desde la gestión de atención
     * únicamente se permite colocar
     * el ticket en:
     *
     * 2 = En revisión
     * 3 = En atención
     */
    const estadosPermitidosAtencion = [
      2,
      3,
    ];

    if (
      !estadosPermitidosAtencion.includes(
        updateAtencionTicketDto.idEstado,
      )
    ) {
      throw new BadRequestException(
        'Desde la gestión de atención solo se puede colocar el ticket En revisión o En atención',
      );
    }

    /*
     * Validamos que el usuario
     * seleccionado como técnico exista.
     */
    const tecnico =
      await this.userRepository.findOne({
        where: {
          id:
            updateAtencionTicketDto.idTecnico,
        },
      });

    if (!tecnico) {
      throw new BadRequestException(
        'El técnico seleccionado no existe',
      );
    }

    /*
     * El usuario seleccionado debe
     * encontrarse activo.
     */
    if (!tecnico.activo) {
      throw new BadRequestException(
        'El técnico seleccionado está inactivo',
      );
    }

    /*
     * Solo un usuario con rol Técnico
     * puede quedar asignado como
     * responsable de un ticket.
     *
     * idRol 2 = Técnico
     */
    if (tecnico.idRol !== 2) {
      throw new BadRequestException(
        'El usuario seleccionado no tiene rol de Técnico',
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

  /*
   * Cambio de estado realizado
   * por el técnico asignado.
   *
   * El técnico puede:
   *
   * En atención -> Pendiente
   * En atención -> Resuelto
   * Pendiente -> En atención
   * Pendiente -> Resuelto
   *
   * El técnico ya NO puede
   * cerrar directamente el ticket.
   */
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

    /*
     * El cierre ya no corresponde
     * directamente al técnico.
     */
    if (
      estadoNuevo === 6
    ) {
      throw new BadRequestException(
        'El cierre del ticket debe ser confirmado por el solicitante',
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

    let resolucionLimpia:
      string | null = null;

    if (
      estadoNuevo === 5
    ) {
      resolucionLimpia =
        updateEstadoTicketDto.resolucion
          ?.trim() ?? '';

      if (!resolucionLimpia) {
        throw new BadRequestException(
          'Debe registrar la solución antes de marcar el ticket como Resuelto',
        );
      }
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
      estadoNuevo === 5
    ) {
      await this.ticketRepository.update(
        idTicket,
        {
          idEstado: 5,

          resolucion:
            resolucionLimpia,

          fechaResolucion:
            new Date(),

          fechaCierre: null,
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

    if (
      estadoNuevo === 5
    ) {
      await this.bitacoraService.registrar(
        idTicket,

        idTecnico,

        'Ticket resuelto',

        `El estado cambió de ${nombreEstadoAnterior} a Resuelto. Solución registrada: ${resolucionLimpia}.`,
      );
    } else {
      await this.bitacoraService.registrar(
        idTicket,

        idTecnico,

        'Estado actualizado',

        `El estado cambió de ${nombreEstadoAnterior} a ${nombreEstadoNuevo}.`,
      );
    }

    if (
      estadoNuevo === 5
    ) {
      await this.notificacionesService.crear(
        ticket.idSolicitante,

        'Solución pendiente de confirmación',

        `El ticket ${ticketActualizado.codigo}: ${ticketActualizado.titulo} fue marcado como Resuelto. Solución: ${resolucionLimpia}. Revise el ticket para confirmar si el problema fue solucionado.`,

        idTicket,
      );
    } else {
      await this.notificacionesService.crear(
        ticket.idSolicitante,

        'Estado de ticket actualizado',

        `El ticket ${ticketActualizado.codigo}: ${ticketActualizado.titulo} cambió de ${nombreEstadoAnterior} a ${nombreEstadoNuevo}.`,

        idTicket,
      );
    }

    return ticketActualizado;
  }

  /*
   * El solicitante confirma que
   * la solución funcionó.
   *
   * Resuelto -> Cerrado
   */
  async confirmarResolucion(
    idTicket: number,
    idSolicitante: number,
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
      ticket.idSolicitante !==
      idSolicitante
    ) {
      throw new ForbiddenException(
        'No tiene permisos para confirmar la solución de este ticket',
      );
    }

    if (
      ticket.idEstado !== 5
    ) {
      throw new BadRequestException(
        'El ticket debe encontrarse en estado Resuelto para confirmar la solución',
      );
    }

    if (
      !ticket.resolucion?.trim()
    ) {
      throw new BadRequestException(
        'El ticket no tiene una solución registrada',
      );
    }

    await this.ticketRepository.update(
      idTicket,
      {
        idEstado: 6,

        fechaCierre:
          new Date(),
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

      idSolicitante,

      'Solución confirmada',

      'El solicitante confirmó que la solución fue satisfactoria. El ticket pasó de Resuelto a Cerrado.',
    );

    if (
      ticket.idTecnico
    ) {
      await this.notificacionesService.crear(
        ticket.idTecnico,

        'Ticket cerrado por el solicitante',

        `El solicitante confirmó la solución del ticket ${ticketActualizado.codigo}: ${ticketActualizado.titulo}. El ticket fue cerrado.`,

        idTicket,
      );
    }

    return ticketActualizado;
  }

  /*
   * El solicitante indica que
   * la solución NO resolvió
   * el incidente.
   *
   * Resuelto -> En atención
   */
  async reabrirTicket(
    idTicket: number,

    idSolicitante: number,

    reabrirTicketDto:
      ReabrirTicketDto,
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
      ticket.idSolicitante !==
      idSolicitante
    ) {
      throw new ForbiddenException(
        'No tiene permisos para reabrir este ticket',
      );
    }

    if (
      ticket.idEstado !== 5
    ) {
      throw new BadRequestException(
        'Solo un ticket en estado Resuelto puede regresar a atención',
      );
    }

    const motivo =
      reabrirTicketDto.motivo
        .trim();

    if (!motivo) {
      throw new BadRequestException(
        'Debe indicar el motivo por el cual el problema continúa',
      );
    }

    const resolucionAnterior =
      ticket.resolucion?.trim() ??
      'Sin solución registrada';

    await this.ticketRepository.update(
      idTicket,
      {
        idEstado: 3,

        resolucion: null,

        fechaResolucion: null,

        fechaCierre: null,
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

      idSolicitante,

      'Solución no confirmada',

      `El solicitante indicó que el problema continúa. Motivo: ${motivo}. Solución propuesta anteriormente: ${resolucionAnterior}. El ticket regresó de Resuelto a En atención.`,
    );

    if (
      ticket.idTecnico
    ) {
      await this.notificacionesService.crear(
        ticket.idTecnico,

        'El ticket requiere nueva atención',

        `El solicitante indicó que el problema del ticket ${ticketActualizado.codigo}: ${ticketActualizado.titulo} continúa. Motivo: ${motivo}. El ticket regresó a En atención.`,

        idTicket,
      );
    }

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