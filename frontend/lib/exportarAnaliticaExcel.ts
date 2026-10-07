import * as XLSX from 'xlsx';

interface ResumenAnalitica {
  total: number;
  nuevos: number;
  enRevision: number;
  enAtencion: number;
  pendientes: number;
  resueltos: number;
  cerrados: number;
  sinAsignar: number;
}

interface CategoriaAnalitica {
  idCategoria: number;
  categoria: string;
  total: number;
  porcentaje: number;
}

interface PrioridadAnalitica {
  idPrioridad: number;
  prioridad: string;
  nivel: number;
  total: number;
  porcentaje: number;
}

interface TecnicoAnalitica {
  idTecnico: number;
  tecnico: string;
  totalAsignados: number;
  nuevos: number;
  enRevision: number;
  enAtencion: number;
  pendientes: number;
  resueltos: number;
  cerrados: number;
}

interface HistoricoMensual {
  anio: number;
  mes: number;
  nombreMes: string;
  periodo: string;
  total: number;
  nuevos: number;
  enRevision: number;
  enAtencion: number;
  pendientes: number;
  resueltos: number;
  cerrados: number;
}

interface TicketTiempo {
  idTicket: number;
  codigo: string;
  titulo: string;
  tiempoResolucionMinutos: number;
  tiempoResolucionHoras: number;
}

interface MetricasTiempoAnalitica {
  periodo: {
    desde: string | null;
    hasta: string | null;
  };

  totalTickets: number;

  ticketsConResolucion: number;

  ticketsCerrados: number;

  promedioResolucionMinutos: number;

  promedioResolucionHoras: number;

  promedioCierreMinutos: number;

  promedioCierreHoras: number;

  menorTiempoResolucionMinutos: number;

  mayorTiempoResolucionMinutos: number;

  ticketMasRapido:
    | TicketTiempo
    | null;

  ticketMasLento:
    | TicketTiempo
    | null;
}

interface ExportarAnaliticaExcelParams {
  resumen: ResumenAnalitica;

  categorias: CategoriaAnalitica[];

  prioridades: PrioridadAnalitica[];

  tecnicos: TecnicoAnalitica[];

  historicoMensual: HistoricoMensual[];

  metricasTiempo?:
    MetricasTiempoAnalitica;

  desde?: string;

  hasta?: string;
}

function ajustarAnchoColumnas(
  hoja: XLSX.WorkSheet,
  datos: Record<
    string,
    unknown
  >[],
) {
  if (datos.length === 0) {
    return;
  }

  const columnas =
    Object.keys(
      datos[0],
    );

  hoja['!cols'] =
    columnas.map(
      (columna) => {
        const longitudMaxima =
          Math.max(
            columna.length,

            ...datos.map(
              (registro) =>
                String(
                  registro[
                    columna
                  ] ?? '',
                ).length,
            ),
          );

        return {
          wch: Math.min(
            longitudMaxima + 3,
            45,
          ),
        };
      },
    );
}

function formatearTiempo(
  minutos: number,
) {
  if (
    !Number.isFinite(
      minutos,
    ) ||
    minutos < 0
  ) {
    return 'No disponible';
  }

  const horas =
    Math.floor(
      minutos / 60,
    );

  const minutosRestantes =
    Math.round(
      minutos % 60,
    );

  if (horas === 0) {
    return `${minutosRestantes} min`;
  }

  if (
    minutosRestantes === 0
  ) {
    return `${horas} h`;
  }

  return `${horas} h ${minutosRestantes} min`;
}

function formatearFecha(
  fecha?: string,
) {
  if (!fecha) {
    return '';
  }

  const partes =
    fecha.split('-');

  if (
    partes.length !== 3
  ) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function exportarAnaliticaExcel({
  resumen,
  categorias,
  prioridades,
  tecnicos,
  historicoMensual,
  metricasTiempo,
  desde,
  hasta,
}: ExportarAnaliticaExcelParams) {
  const libro =
    XLSX.utils.book_new();

  /*
   * HOJA 1
   * RESUMEN GENERAL
   */

  const datosResumen = [
    {
      Indicador:
        'Total de tickets',
      Cantidad:
        resumen.total,
    },

    {
      Indicador:
        'Nuevos',
      Cantidad:
        resumen.nuevos,
    },

    {
      Indicador:
        'En revisión',
      Cantidad:
        resumen.enRevision,
    },

    {
      Indicador:
        'En atención',
      Cantidad:
        resumen.enAtencion,
    },

    {
      Indicador:
        'Pendientes',
      Cantidad:
        resumen.pendientes,
    },

    {
      Indicador:
        'Resueltos',
      Cantidad:
        resumen.resueltos,
    },

    {
      Indicador:
        'Cerrados',
      Cantidad:
        resumen.cerrados,
    },

    {
      Indicador:
        'Sin asignar',
      Cantidad:
        resumen.sinAsignar,
    },
  ];

  const hojaResumen =
    XLSX.utils.json_to_sheet(
      datosResumen,
    );

  ajustarAnchoColumnas(
    hojaResumen,
    datosResumen,
  );

  XLSX.utils.book_append_sheet(
    libro,
    hojaResumen,
    'Resumen',
  );

  /*
   * HOJA 2
   * INDICADORES DE TIEMPOS
   */

  if (metricasTiempo) {
    const periodo =
      desde &&
      hasta
        ? `${formatearFecha(
            desde,
          )} al ${formatearFecha(
            hasta,
          )}`
        : 'Todos los registros';

    const datosTiempos = [
      {
        Indicador:
          'Período consultado',

        Valor:
          periodo,
      },

      {
        Indicador:
          'Tickets analizados',

        Valor:
          metricasTiempo
            .totalTickets,
      },

      {
        Indicador:
          'Tickets con resolución',

        Valor:
          metricasTiempo
            .ticketsConResolucion,
      },

      {
        Indicador:
          'Tickets con cierre',

        Valor:
          metricasTiempo
            .ticketsCerrados,
      },

      {
        Indicador:
          'Promedio de resolución',

        Valor:
          formatearTiempo(
            metricasTiempo
              .promedioResolucionMinutos,
          ),
      },

      {
        Indicador:
          'Promedio de resolución en horas',

        Valor:
          metricasTiempo
            .promedioResolucionHoras,
      },

      {
        Indicador:
          'Promedio de cierre',

        Valor:
          formatearTiempo(
            metricasTiempo
              .promedioCierreMinutos,
          ),
      },

      {
        Indicador:
          'Promedio de cierre en horas',

        Valor:
          metricasTiempo
            .promedioCierreHoras,
      },

      {
        Indicador:
          'Menor tiempo de resolución',

        Valor:
          formatearTiempo(
            metricasTiempo
              .menorTiempoResolucionMinutos,
          ),
      },

      {
        Indicador:
          'Mayor tiempo de resolución',

        Valor:
          formatearTiempo(
            metricasTiempo
              .mayorTiempoResolucionMinutos,
          ),
      },

      {
        Indicador:
          'Nota',

        Valor:
          'Los tiempos de resolución se calculan únicamente con tickets que cuentan con fecha de resolución registrada.',
      },
    ];

    const hojaTiempos =
      XLSX.utils.json_to_sheet(
        datosTiempos,
      );

    ajustarAnchoColumnas(
      hojaTiempos,
      datosTiempos,
    );

    /*
     * Agregar detalle del ticket
     * más rápido y más tardado.
     */

    const detalleTickets = [
      {
        Tipo:
          'Resolución más rápida',

        Código:
          metricasTiempo
            .ticketMasRapido
            ?.codigo ??
          'No disponible',

        Título:
          metricasTiempo
            .ticketMasRapido
            ?.titulo ??
          'No disponible',

        'Tiempo de resolución':
          metricasTiempo
            .ticketMasRapido
            ? formatearTiempo(
                metricasTiempo
                  .ticketMasRapido
                  .tiempoResolucionMinutos,
              )
            : 'No disponible',
      },

      {
        Tipo:
          'Resolución más tardada',

        Código:
          metricasTiempo
            .ticketMasLento
            ?.codigo ??
          'No disponible',

        Título:
          metricasTiempo
            .ticketMasLento
            ?.titulo ??
          'No disponible',

        'Tiempo de resolución':
          metricasTiempo
            .ticketMasLento
            ? formatearTiempo(
                metricasTiempo
                  .ticketMasLento
                  .tiempoResolucionMinutos,
              )
            : 'No disponible',
      },
    ];

    XLSX.utils.sheet_add_json(
      hojaTiempos,
      detalleTickets,
      {
        origin: 'A14',
      },
    );

    hojaTiempos['!cols'] = [
      {
        wch: 35,
      },

      {
        wch: 20,
      },

      {
        wch: 45,
      },

      {
        wch: 25,
      },
    ];

    XLSX.utils.book_append_sheet(
      libro,
      hojaTiempos,
      'Indicadores tiempos',
    );
  }

  /*
   * HOJA 3
   * CATEGORÍAS
   */

  const datosCategorias =
    categorias.map(
      (registro) => ({
        Categoría:
          registro.categoria,

        Total:
          registro.total,

        Porcentaje:
          `${registro.porcentaje}%`,
      }),
    );

  const hojaCategorias =
    XLSX.utils.json_to_sheet(
      datosCategorias,
    );

  ajustarAnchoColumnas(
    hojaCategorias,
    datosCategorias,
  );

  XLSX.utils.book_append_sheet(
    libro,
    hojaCategorias,
    'Categorías',
  );

  /*
   * HOJA 4
   * PRIORIDADES
   */

  const datosPrioridades =
    prioridades.map(
      (registro) => ({
        Prioridad:
          registro.prioridad,

        Nivel:
          registro.nivel,

        Total:
          registro.total,

        Porcentaje:
          `${registro.porcentaje}%`,
      }),
    );

  const hojaPrioridades =
    XLSX.utils.json_to_sheet(
      datosPrioridades,
    );

  ajustarAnchoColumnas(
    hojaPrioridades,
    datosPrioridades,
  );

  XLSX.utils.book_append_sheet(
    libro,
    hojaPrioridades,
    'Prioridades',
  );

  /*
   * HOJA 5
   * TÉCNICOS
   */

  const datosTecnicos =
    tecnicos.map(
      (registro) => ({
        Técnico:
          registro.tecnico,

        Asignados:
          registro.totalAsignados,

        Nuevos:
          registro.nuevos,

        'En revisión':
          registro.enRevision,

        'En atención':
          registro.enAtencion,

        Pendientes:
          registro.pendientes,

        Resueltos:
          registro.resueltos,

        Cerrados:
          registro.cerrados,
      }),
    );

  const hojaTecnicos =
    XLSX.utils.json_to_sheet(
      datosTecnicos,
    );

  ajustarAnchoColumnas(
    hojaTecnicos,
    datosTecnicos,
  );

  XLSX.utils.book_append_sheet(
    libro,
    hojaTecnicos,
    'Técnicos',
  );

  /*
   * HOJA 6
   * HISTÓRICO MENSUAL
   */

  const datosMensuales =
    historicoMensual.map(
      (registro) => ({
        Período:
          registro.periodo,

        Total:
          registro.total,

        Nuevos:
          registro.nuevos,

        'En revisión':
          registro.enRevision,

        'En atención':
          registro.enAtencion,

        Pendientes:
          registro.pendientes,

        Resueltos:
          registro.resueltos,

        Cerrados:
          registro.cerrados,
      }),
    );

  const hojaMensual =
    XLSX.utils.json_to_sheet(
      datosMensuales,
    );

  ajustarAnchoColumnas(
    hojaMensual,
    datosMensuales,
  );

  XLSX.utils.book_append_sheet(
    libro,
    hojaMensual,
    'Histórico mensual',
  );

  /*
   * NOMBRE DEL ARCHIVO
   */

  let nombreArchivo =
    'analitica_incidentes';

  if (
    desde &&
    hasta
  ) {
    nombreArchivo +=
      `_${desde}_${hasta}`;
  }

  nombreArchivo +=
    '.xlsx';

  XLSX.writeFile(
    libro,
    nombreArchivo,
  );
}