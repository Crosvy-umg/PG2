import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import {
  Ticket,
} from '../tickets/entities/ticket.entity';

@Injectable()
export class AnaliticaService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository:
      Repository<Ticket>,
  ) {}

  private esFechaValida(
    fecha: string,
  ) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        fecha,
      )
    ) {
      return false;
    }

    const [
      anio,
      mes,
      dia,
    ] = fecha
      .split('-')
      .map(Number);

    const fechaValidacion =
      new Date(
        Date.UTC(
          anio,
          mes - 1,
          dia,
        ),
      );

    return (
      fechaValidacion.getUTCFullYear() ===
        anio &&
      fechaValidacion.getUTCMonth() ===
        mes - 1 &&
      fechaValidacion.getUTCDate() ===
        dia
    );
  }

  private sumarUnDia(
    fecha: string,
  ) {
    const [
      anio,
      mes,
      dia,
    ] = fecha
      .split('-')
      .map(Number);

    const fechaSiguiente =
      new Date(
        Date.UTC(
          anio,
          mes - 1,
          dia,
        ),
      );

    fechaSiguiente.setUTCDate(
      fechaSiguiente.getUTCDate() + 1,
    );

    return fechaSiguiente
      .toISOString()
      .slice(0, 10);
  }

  private validarRangoFechas(
    desde?: string,
    hasta?: string,
  ) {
    if (
      desde &&
      !this.esFechaValida(desde)
    ) {
      throw new BadRequestException(
        'La fecha desde debe tener el formato YYYY-MM-DD.',
      );
    }

    if (
      hasta &&
      !this.esFechaValida(hasta)
    ) {
      throw new BadRequestException(
        'La fecha hasta debe tener el formato YYYY-MM-DD.',
      );
    }

    if (
      desde &&
      hasta &&
      desde > hasta
    ) {
      throw new BadRequestException(
        'La fecha desde no puede ser mayor que la fecha hasta.',
      );
    }
  }

  private aplicarFiltroFechas(
    queryBuilder:
      SelectQueryBuilder<Ticket>,
    desde?: string,
    hasta?: string,
  ) {
    this.validarRangoFechas(
      desde,
      hasta,
    );

    if (desde) {
      queryBuilder.andWhere(
        'ticket.fechaCreacion >= :desde',
        {
          desde:
            `${desde} 00:00:00`,
        },
      );
    }

    if (hasta) {
      const diaSiguiente =
        this.sumarUnDia(
          hasta,
        );

      queryBuilder.andWhere(
        'ticket.fechaCreacion < :hasta',
        {
          hasta:
            `${diaSiguiente} 00:00:00`,
        },
      );
    }

    return queryBuilder;
  }

  async obtenerResumenGeneral(
    desde?: string,
    hasta?: string,
  ) {
    const query =
      this.ticketRepository
        .createQueryBuilder('ticket');

    this.aplicarFiltroFechas(
      query,
      desde,
      hasta,
    );

    const resultado =
      await query
        .select(
          'COUNT(ticket.idTicket)',
          'total',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 1
              THEN 1
              ELSE 0
            END
          )`,
          'nuevos',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 2
              THEN 1
              ELSE 0
            END
          )`,
          'enRevision',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 3
              THEN 1
              ELSE 0
            END
          )`,
          'enAtencion',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 4
              THEN 1
              ELSE 0
            END
          )`,
          'pendientes',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 5
              THEN 1
              ELSE 0
            END
          )`,
          'resueltos',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 6
              THEN 1
              ELSE 0
            END
          )`,
          'cerrados',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idTecnico IS NULL
              THEN 1
              ELSE 0
            END
          )`,
          'sinAsignar',
        )
        .getRawOne();

    return {
      total:
        Number(resultado?.total) || 0,

      nuevos:
        Number(resultado?.nuevos) || 0,

      enRevision:
        Number(resultado?.enRevision) || 0,

      enAtencion:
        Number(resultado?.enAtencion) || 0,

      pendientes:
        Number(resultado?.pendientes) || 0,

      resueltos:
        Number(resultado?.resueltos) || 0,

      cerrados:
        Number(resultado?.cerrados) || 0,

      sinAsignar:
        Number(resultado?.sinAsignar) || 0,
    };
  }

  async obtenerTicketsPorCategoria(
    desde?: string,
    hasta?: string,
  ) {
    const query =
      this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoin(
          'ticket.categoria',
          'categoria',
        );

    this.aplicarFiltroFechas(
      query,
      desde,
      hasta,
    );

    const resultados =
      await query
        .select(
          'ticket.idCategoria',
          'idCategoria',
        )
        .addSelect(
          'categoria.nombre',
          'categoria',
        )
        .addSelect(
          'COUNT(ticket.idTicket)',
          'total',
        )
        .groupBy(
          'ticket.idCategoria',
        )
        .addGroupBy(
          'categoria.nombre',
        )
        .orderBy(
          'total',
          'DESC',
        )
        .getRawMany();

    const totalTickets =
      resultados.reduce(
        (
          acumulado,
          registro,
        ) =>
          acumulado +
          Number(registro.total),
        0,
      );

    return resultados.map(
      (registro) => {
        const total =
          Number(registro.total) || 0;

        const porcentaje =
          totalTickets > 0
            ? Number(
                (
                  (total /
                    totalTickets) *
                  100
                ).toFixed(2),
              )
            : 0;

        return {
          idCategoria:
            Number(
              registro.idCategoria,
            ),

          categoria:
            registro.categoria,

          total,

          porcentaje,
        };
      },
    );
  }

  async obtenerTicketsPorPrioridad(
    desde?: string,
    hasta?: string,
  ) {
    const query =
      this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoin(
          'ticket.prioridad',
          'prioridad',
        );

    this.aplicarFiltroFechas(
      query,
      desde,
      hasta,
    );

    const resultados =
      await query
        .select(
          'ticket.idPrioridad',
          'idPrioridad',
        )
        .addSelect(
          'prioridad.nombre',
          'prioridad',
        )
        .addSelect(
          'prioridad.nivel',
          'nivel',
        )
        .addSelect(
          'COUNT(ticket.idTicket)',
          'total',
        )
        .andWhere(
          'ticket.idPrioridad IS NOT NULL',
        )
        .groupBy(
          'ticket.idPrioridad',
        )
        .addGroupBy(
          'prioridad.nombre',
        )
        .addGroupBy(
          'prioridad.nivel',
        )
        .orderBy(
          'prioridad.nivel',
          'ASC',
        )
        .getRawMany();

    const totalTicketsConPrioridad =
      resultados.reduce(
        (
          acumulado,
          registro,
        ) =>
          acumulado +
          Number(registro.total),
        0,
      );

    return resultados.map(
      (registro) => {
        const total =
          Number(registro.total) || 0;

        const porcentaje =
          totalTicketsConPrioridad > 0
            ? Number(
                (
                  (total /
                    totalTicketsConPrioridad) *
                  100
                ).toFixed(2),
              )
            : 0;

        return {
          idPrioridad:
            Number(
              registro.idPrioridad,
            ),

          prioridad:
            registro.prioridad,

          nivel:
            Number(
              registro.nivel,
            ),

          total,

          porcentaje,
        };
      },
    );
  }

  async obtenerTicketsPorTecnico(
    desde?: string,
    hasta?: string,
  ) {
    const query =
      this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoin(
          'ticket.tecnico',
          'tecnico',
        );

    this.aplicarFiltroFechas(
      query,
      desde,
      hasta,
    );

    const resultados =
      await query
        .select(
          'ticket.idTecnico',
          'idTecnico',
        )
        .addSelect(
          'tecnico.usuario',
          'tecnico',
        )
        .addSelect(
          'COUNT(ticket.idTicket)',
          'totalAsignados',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 1
              THEN 1
              ELSE 0
            END
          )`,
          'nuevos',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 2
              THEN 1
              ELSE 0
            END
          )`,
          'enRevision',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 3
              THEN 1
              ELSE 0
            END
          )`,
          'enAtencion',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 4
              THEN 1
              ELSE 0
            END
          )`,
          'pendientes',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 5
              THEN 1
              ELSE 0
            END
          )`,
          'resueltos',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 6
              THEN 1
              ELSE 0
            END
          )`,
          'cerrados',
        )
        .andWhere(
          'ticket.idTecnico IS NOT NULL',
        )
        .groupBy(
          'ticket.idTecnico',
        )
        .addGroupBy(
          'tecnico.usuario',
        )
        .orderBy(
          'totalAsignados',
          'DESC',
        )
        .getRawMany();

    return resultados.map(
      (registro) => ({
        idTecnico:
          Number(
            registro.idTecnico,
          ),

        tecnico:
          registro.tecnico,

        totalAsignados:
          Number(
            registro.totalAsignados,
          ) || 0,

        nuevos:
          Number(
            registro.nuevos,
          ) || 0,

        enRevision:
          Number(
            registro.enRevision,
          ) || 0,

        enAtencion:
          Number(
            registro.enAtencion,
          ) || 0,

        pendientes:
          Number(
            registro.pendientes,
          ) || 0,

        resueltos:
          Number(
            registro.resueltos,
          ) || 0,

        cerrados:
          Number(
            registro.cerrados,
          ) || 0,
      }),
    );
  }

  async obtenerHistoricoMensual(
    desde?: string,
    hasta?: string,
  ) {
    const query =
      this.ticketRepository
        .createQueryBuilder('ticket');

    this.aplicarFiltroFechas(
      query,
      desde,
      hasta,
    );

    const resultados =
      await query
        .select(
          'YEAR(ticket.fechaCreacion)',
          'anio',
        )
        .addSelect(
          'MONTH(ticket.fechaCreacion)',
          'mes',
        )
        .addSelect(
          'COUNT(ticket.idTicket)',
          'total',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 1
              THEN 1
              ELSE 0
            END
          )`,
          'nuevos',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 2
              THEN 1
              ELSE 0
            END
          )`,
          'enRevision',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 3
              THEN 1
              ELSE 0
            END
          )`,
          'enAtencion',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 4
              THEN 1
              ELSE 0
            END
          )`,
          'pendientes',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 5
              THEN 1
              ELSE 0
            END
          )`,
          'resueltos',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.idEstado = 6
              THEN 1
              ELSE 0
            END
          )`,
          'cerrados',
        )
        .groupBy(
          'YEAR(ticket.fechaCreacion)',
        )
        .addGroupBy(
          'MONTH(ticket.fechaCreacion)',
        )
        .orderBy(
          'YEAR(ticket.fechaCreacion)',
          'ASC',
        )
        .addOrderBy(
          'MONTH(ticket.fechaCreacion)',
          'ASC',
        )
        .getRawMany();

    const nombresMeses = [
      '',
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    return resultados.map(
      (registro) => {
        const anio =
          Number(registro.anio);

        const mes =
          Number(registro.mes);

        return {
          anio,

          mes,

          nombreMes:
            nombresMeses[mes],

          periodo:
            `${nombresMeses[mes]} ${anio}`,

          total:
            Number(
              registro.total,
            ) || 0,

          nuevos:
            Number(
              registro.nuevos,
            ) || 0,

          enRevision:
            Number(
              registro.enRevision,
            ) || 0,

          enAtencion:
            Number(
              registro.enAtencion,
            ) || 0,

          pendientes:
            Number(
              registro.pendientes,
            ) || 0,

          resueltos:
            Number(
              registro.resueltos,
            ) || 0,

          cerrados:
            Number(
              registro.cerrados,
            ) || 0,
        };
      },
    );
  }

  async obtenerMetricasTiempo(
    desde?: string,
    hasta?: string,
  ) {
    const query =
      this.ticketRepository
        .createQueryBuilder('ticket');

    this.aplicarFiltroFechas(
      query,
      desde,
      hasta,
    );

    const resultado =
      await query
        .select(
          'COUNT(ticket.idTicket)',
          'totalTickets',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.fechaResolucion IS NOT NULL
              THEN 1
              ELSE 0
            END
          )`,
          'ticketsConResolucion',
        )
        .addSelect(
          `SUM(
            CASE
              WHEN ticket.fechaCierre IS NOT NULL
              THEN 1
              ELSE 0
            END
          )`,
          'ticketsCerrados',
        )
        .addSelect(
          `AVG(
            CASE
              WHEN ticket.fechaResolucion IS NOT NULL
              THEN TIMESTAMPDIFF(
                MINUTE,
                ticket.fechaCreacion,
                ticket.fechaResolucion
              )
              ELSE NULL
            END
          )`,
          'promedioResolucionMinutos',
        )
        .addSelect(
          `AVG(
            CASE
              WHEN ticket.fechaCierre IS NOT NULL
              THEN TIMESTAMPDIFF(
                MINUTE,
                ticket.fechaCreacion,
                ticket.fechaCierre
              )
              ELSE NULL
            END
          )`,
          'promedioCierreMinutos',
        )
        .addSelect(
          `MIN(
            CASE
              WHEN ticket.fechaResolucion IS NOT NULL
              THEN TIMESTAMPDIFF(
                MINUTE,
                ticket.fechaCreacion,
                ticket.fechaResolucion
              )
              ELSE NULL
            END
          )`,
          'menorTiempoResolucion',
        )
        .addSelect(
          `MAX(
            CASE
              WHEN ticket.fechaResolucion IS NOT NULL
              THEN TIMESTAMPDIFF(
                MINUTE,
                ticket.fechaCreacion,
                ticket.fechaResolucion
              )
              ELSE NULL
            END
          )`,
          'mayorTiempoResolucion',
        )
        .getRawOne();

    const queryMasRapido =
      this.ticketRepository
        .createQueryBuilder('ticket')
        .select(
          'ticket.idTicket',
          'idTicket',
        )
        .addSelect(
          'ticket.codigo',
          'codigo',
        )
        .addSelect(
          'ticket.titulo',
          'titulo',
        )
        .addSelect(
          `TIMESTAMPDIFF(
            MINUTE,
            ticket.fechaCreacion,
            ticket.fechaResolucion
          )`,
          'tiempoResolucionMinutos',
        )
        .andWhere(
          'ticket.fechaResolucion IS NOT NULL',
        );

    this.aplicarFiltroFechas(
      queryMasRapido,
      desde,
      hasta,
    );

    const ticketMasRapido =
      await queryMasRapido
        .orderBy(
          'tiempoResolucionMinutos',
          'ASC',
        )
        .addOrderBy(
          'ticket.idTicket',
          'ASC',
        )
        .getRawOne();

    const queryMasLento =
      this.ticketRepository
        .createQueryBuilder('ticket')
        .select(
          'ticket.idTicket',
          'idTicket',
        )
        .addSelect(
          'ticket.codigo',
          'codigo',
        )
        .addSelect(
          'ticket.titulo',
          'titulo',
        )
        .addSelect(
          `TIMESTAMPDIFF(
            MINUTE,
            ticket.fechaCreacion,
            ticket.fechaResolucion
          )`,
          'tiempoResolucionMinutos',
        )
        .andWhere(
          'ticket.fechaResolucion IS NOT NULL',
        );

    this.aplicarFiltroFechas(
      queryMasLento,
      desde,
      hasta,
    );

    const ticketMasLento =
      await queryMasLento
        .orderBy(
          'tiempoResolucionMinutos',
          'DESC',
        )
        .addOrderBy(
          'ticket.idTicket',
          'ASC',
        )
        .getRawOne();

    const promedioResolucionMinutos =
      Number(
        Number(
          resultado
            ?.promedioResolucionMinutos ??
            0,
        ).toFixed(2),
      );

    const promedioCierreMinutos =
      Number(
        Number(
          resultado
            ?.promedioCierreMinutos ??
            0,
        ).toFixed(2),
      );

    const convertirTicket =
      (
        ticket:
          | Record<string, any>
          | undefined,
      ) => {
        if (!ticket) {
          return null;
        }

        const minutos =
          Number(
            ticket
              .tiempoResolucionMinutos,
          ) || 0;

        return {
          idTicket:
            Number(
              ticket.idTicket,
            ),

          codigo:
            ticket.codigo,

          titulo:
            ticket.titulo,

          tiempoResolucionMinutos:
            minutos,

          tiempoResolucionHoras:
            Number(
              (
                minutos / 60
              ).toFixed(2),
            ),
        };
      };

    return {
      periodo: {
        desde:
          desde ?? null,

        hasta:
          hasta ?? null,
      },

      totalTickets:
        Number(
          resultado?.totalTickets,
        ) || 0,

      ticketsConResolucion:
        Number(
          resultado
            ?.ticketsConResolucion,
        ) || 0,

      ticketsCerrados:
        Number(
          resultado?.ticketsCerrados,
        ) || 0,

      promedioResolucionMinutos,

      promedioResolucionHoras:
        Number(
          (
            promedioResolucionMinutos /
            60
          ).toFixed(2),
        ),

      promedioCierreMinutos,

      promedioCierreHoras:
        Number(
          (
            promedioCierreMinutos /
            60
          ).toFixed(2),
        ),

      menorTiempoResolucionMinutos:
        Number(
          resultado
            ?.menorTiempoResolucion,
        ) || 0,

      mayorTiempoResolucionMinutos:
        Number(
          resultado
            ?.mayorTiempoResolucion,
        ) || 0,

      ticketMasRapido:
        convertirTicket(
          ticketMasRapido,
        ),

      ticketMasLento:
        convertirTicket(
          ticketMasLento,
        ),
    };
  }
}