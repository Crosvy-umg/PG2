import {
  Injectable,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
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

  async obtenerResumenGeneral() {
    const resultado =
      await this.ticketRepository
        .createQueryBuilder('ticket')
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

  async obtenerTicketsPorCategoria() {
    const resultados =
      await this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoin(
          'ticket.categoria',
          'categoria',
        )
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

  async obtenerTicketsPorPrioridad() {
    const resultados =
      await this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoin(
          'ticket.prioridad',
          'prioridad',
        )
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
        .where(
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

  async obtenerTicketsPorTecnico() {
    const resultados =
      await this.ticketRepository
        .createQueryBuilder('ticket')
        .leftJoin(
          'ticket.tecnico',
          'tecnico',
        )
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
        .where(
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

  async obtenerHistoricoMensual() {
    const resultados =
      await this.ticketRepository
        .createQueryBuilder('ticket')
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
}