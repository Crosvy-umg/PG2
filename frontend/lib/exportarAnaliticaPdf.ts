import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

interface ExportarAnaliticaPdfParams {
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

interface JsPdfConTabla extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
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

function obtenerSiguienteY(
  documento: JsPdfConTabla,
  margen = 12,
  espacioMinimo = 35,
) {
  const finalY =
    documento.lastAutoTable
      ?.finalY ??
    40;

  const siguienteY =
    finalY + margen;

  const altoPagina =
    documento.internal
      .pageSize
      .getHeight();

  if (
    siguienteY +
      espacioMinimo >
    altoPagina - 15
  ) {
    documento.addPage();

    return 25;
  }

  return siguienteY;
}

export function exportarAnaliticaPdf({
  resumen,
  categorias,
  prioridades,
  tecnicos,
  historicoMensual,
  metricasTiempo,
  desde,
  hasta,
}: ExportarAnaliticaPdfParams) {
  const documento =
    new jsPDF({
      orientation:
        'landscape',

      unit:
        'mm',

      format:
        'a4',
    }) as JsPdfConTabla;

  const anchoPagina =
    documento.internal
      .pageSize
      .getWidth();

  const altoPagina =
    documento.internal
      .pageSize
      .getHeight();

  const fechaGeneracion =
    new Date()
      .toLocaleString(
        'es-GT',
        {
          dateStyle:
            'short',

          timeStyle:
            'short',
        },
      );

  /*
   * ENCABEZADO
   */

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(
    18,
  );

  documento.text(
    'Reporte de Incidentes TI',
    anchoPagina / 2,
    16,
    {
      align:
        'center',
    },
  );

  documento.setFont(
    'helvetica',
    'normal',
  );

  documento.setFontSize(
    10,
  );

  documento.text(
    'Grupo Master - Departamento de IT',
    anchoPagina / 2,
    23,
    {
      align:
        'center',
    },
  );

  let periodo =
    'Todos los registros';

  if (
    desde &&
    hasta
  ) {
    periodo =
      `${formatearFecha(
        desde,
      )} al ${formatearFecha(
        hasta,
      )}`;
  }

  documento.setFontSize(
    9,
  );

  documento.text(
    `Período: ${periodo}`,
    14,
    32,
  );

  documento.text(
    `Generado: ${fechaGeneracion}`,
    anchoPagina - 14,
    32,
    {
      align:
        'right',
    },
  );

  documento.setDrawColor(
    31,
    70,
    151,
  );

  documento.setLineWidth(
    0.8,
  );

  documento.line(
    14,
    36,
    anchoPagina - 14,
    36,
  );

  /*
   * RESUMEN GENERAL
   */

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setTextColor(
    0,
    0,
    0,
  );

  documento.setFontSize(
    13,
  );

  documento.text(
    'Resumen general',
    14,
    45,
  );

  autoTable(
    documento,
    {
      startY:
        50,

      head: [
        [
          'Indicador',
          'Cantidad',
        ],
      ],

      body: [
        [
          'Total de tickets',
          resumen.total,
        ],

        [
          'Nuevos',
          resumen.nuevos,
        ],

        [
          'En revisión',
          resumen.enRevision,
        ],

        [
          'En atención',
          resumen.enAtencion,
        ],

        [
          'Pendientes',
          resumen.pendientes,
        ],

        [
          'Resueltos',
          resumen.resueltos,
        ],

        [
          'Cerrados',
          resumen.cerrados,
        ],

        [
          'Sin asignar',
          resumen.sinAsignar,
        ],
      ],

      theme:
        'grid',

      styles: {
        fontSize:
          9,

        cellPadding:
          2.5,
      },

      headStyles: {
        fillColor: [
          31,
          70,
          151,
        ],
      },

      margin: {
        left:
          14,

        right:
          14,
      },

      tableWidth:
        100,
    },
  );

  /*
   * INDICADORES DE TIEMPOS
   */

  let siguienteY =
    obtenerSiguienteY(
      documento,
      14,
      75,
    );

  if (
    metricasTiempo
  ) {
    documento.setFont(
      'helvetica',
      'bold',
    );

    documento.setTextColor(
      0,
      0,
      0,
    );

    documento.setFontSize(
      13,
    );

    documento.text(
      'Indicadores de tiempos',
      14,
      siguienteY,
    );

    autoTable(
      documento,
      {
        startY:
          siguienteY + 5,

        head: [
          [
            'Indicador',
            'Valor',
          ],
        ],

        body: [
          [
            'Tickets analizados',
            metricasTiempo
              .totalTickets,
          ],

          [
            'Tickets con resolución',
            metricasTiempo
              .ticketsConResolucion,
          ],

          [
            'Tickets con cierre',
            metricasTiempo
              .ticketsCerrados,
          ],

          [
            'Promedio de resolución',
            formatearTiempo(
              metricasTiempo
                .promedioResolucionMinutos,
            ),
          ],

          [
            'Promedio de cierre',
            formatearTiempo(
              metricasTiempo
                .promedioCierreMinutos,
            ),
          ],

          [
            'Menor tiempo de resolución',
            formatearTiempo(
              metricasTiempo
                .menorTiempoResolucionMinutos,
            ),
          ],

          [
            'Mayor tiempo de resolución',
            formatearTiempo(
              metricasTiempo
                .mayorTiempoResolucionMinutos,
            ),
          ],
        ],

        theme:
          'grid',

        styles: {
          fontSize:
            9,

          cellPadding:
            2.5,
        },

        headStyles: {
          fillColor: [
            31,
            70,
            151,
          ],
        },

        margin: {
          left:
            14,

          right:
            14,
        },

        tableWidth:
          110,
      },
    );

    siguienteY =
      obtenerSiguienteY(
        documento,
        10,
        45,
      );

    documento.setFont(
      'helvetica',
      'bold',
    );

    documento.setFontSize(
      11,
    );

    documento.text(
      'Tickets destacados por tiempo de resolución',
      14,
      siguienteY,
    );

    autoTable(
      documento,
      {
        startY:
          siguienteY + 5,

        head: [
          [
            'Tipo',
            'Código',
            'Título',
            'Tiempo',
          ],
        ],

        body: [
          [
            'Resolución más rápida',

            metricasTiempo
              .ticketMasRapido
              ?.codigo ??
              'No disponible',

            metricasTiempo
              .ticketMasRapido
              ?.titulo ??
              'No disponible',

            metricasTiempo
              .ticketMasRapido
              ? formatearTiempo(
                  metricasTiempo
                    .ticketMasRapido
                    .tiempoResolucionMinutos,
                )
              : 'No disponible',
          ],

          [
            'Resolución más tardada',

            metricasTiempo
              .ticketMasLento
              ?.codigo ??
              'No disponible',

            metricasTiempo
              .ticketMasLento
              ?.titulo ??
              'No disponible',

            metricasTiempo
              .ticketMasLento
              ? formatearTiempo(
                  metricasTiempo
                    .ticketMasLento
                    .tiempoResolucionMinutos,
                )
              : 'No disponible',
          ],
        ],

        theme:
          'grid',

        styles: {
          fontSize:
            8.5,

          cellPadding:
            2.5,
        },

        headStyles: {
          fillColor: [
            31,
            70,
            151,
          ],
        },

        columnStyles: {
          0: {
            cellWidth:
              50,
          },

          1: {
            cellWidth:
              30,
          },

          2: {
            cellWidth:
              100,
          },

          3: {
            cellWidth:
              35,
          },
        },

        margin: {
          left:
            14,

          right:
            14,
        },
      },
    );

    let notaY =
      (
        documento
          .lastAutoTable
          ?.finalY ??
        siguienteY
      ) + 7;

    if (
      notaY >
      altoPagina - 22
    ) {
      documento.addPage();

      notaY =
        25;
    }

    documento.setFont(
      'helvetica',
      'normal',
    );

    documento.setFontSize(
      8,
    );

    documento.setTextColor(
      31,
      70,
      151,
    );

    const nota =
      documento.splitTextToSize(
        'Nota: Los tiempos de resolución se calculan únicamente con tickets que cuentan con fecha de resolución registrada.',
        anchoPagina - 28,
      );

    documento.text(
      nota,
      14,
      notaY,
    );

    documento.setTextColor(
      0,
      0,
      0,
    );

    siguienteY =
      notaY +
      nota.length * 4 +
      10;

    if (
      siguienteY >
      altoPagina - 35
    ) {
      documento.addPage();

      siguienteY =
        25;
    }
  } else {
    siguienteY =
      obtenerSiguienteY(
        documento,
        14,
      );
  }

  /*
   * TICKETS POR CATEGORÍA
   */

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(
    13,
  );

  documento.text(
    'Tickets por categoría',
    14,
    siguienteY,
  );

  autoTable(
    documento,
    {
      startY:
        siguienteY + 5,

      head: [
        [
          'Categoría',
          'Total',
          'Porcentaje',
        ],
      ],

      body:
        categorias.length > 0
          ? categorias.map(
              (registro) => [
                registro.categoria,

                registro.total,

                `${registro.porcentaje}%`,
              ],
            )
          : [
              [
                'Sin datos',
                0,
                '0%',
              ],
            ],

      theme:
        'grid',

      styles: {
        fontSize:
          9,

        cellPadding:
          2.5,
      },

      headStyles: {
        fillColor: [
          31,
          70,
          151,
        ],
      },

      margin: {
        left:
          14,

        right:
          14,
      },
    },
  );

  /*
   * TICKETS POR PRIORIDAD
   */

  siguienteY =
    obtenerSiguienteY(
      documento,
      14,
    );

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(
    13,
  );

  documento.text(
    'Tickets por prioridad',
    14,
    siguienteY,
  );

  autoTable(
    documento,
    {
      startY:
        siguienteY + 5,

      head: [
        [
          'Prioridad',
          'Nivel',
          'Total',
          'Porcentaje',
        ],
      ],

      body:
        prioridades.length > 0
          ? prioridades.map(
              (registro) => [
                registro.prioridad,

                registro.nivel,

                registro.total,

                `${registro.porcentaje}%`,
              ],
            )
          : [
              [
                'Sin datos',
                '-',
                0,
                '0%',
              ],
            ],

      theme:
        'grid',

      styles: {
        fontSize:
          9,

        cellPadding:
          2.5,
      },

      headStyles: {
        fillColor: [
          31,
          70,
          151,
        ],
      },

      margin: {
        left:
          14,

        right:
          14,
      },
    },
  );

  /*
   * CARGA POR TÉCNICO
   */

  siguienteY =
    obtenerSiguienteY(
      documento,
      14,
    );

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(
    13,
  );

  documento.text(
    'Carga de trabajo por técnico',
    14,
    siguienteY,
  );

  autoTable(
    documento,
    {
      startY:
        siguienteY + 5,

      head: [
        [
          'Técnico',
          'Asignados',
          'Nuevos',
          'En revisión',
          'En atención',
          'Pendientes',
          'Resueltos',
          'Cerrados',
        ],
      ],

      body:
        tecnicos.length > 0
          ? tecnicos.map(
              (registro) => [
                registro.tecnico,

                registro.totalAsignados,

                registro.nuevos,

                registro.enRevision,

                registro.enAtencion,

                registro.pendientes,

                registro.resueltos,

                registro.cerrados,
              ],
            )
          : [
              [
                'Sin datos',
                0,
                0,
                0,
                0,
                0,
                0,
                0,
              ],
            ],

      theme:
        'grid',

      styles: {
        fontSize:
          8,

        cellPadding:
          2.3,

        halign:
          'center',
      },

      headStyles: {
        fillColor: [
          31,
          70,
          151,
        ],
      },

      columnStyles: {
        0: {
          halign:
            'left',
        },
      },

      margin: {
        left:
          14,

        right:
          14,
      },
    },
  );

  /*
   * HISTÓRICO MENSUAL
   */

  siguienteY =
    obtenerSiguienteY(
      documento,
      14,
    );

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(
    13,
  );

  documento.text(
    'Histórico mensual',
    14,
    siguienteY,
  );

  autoTable(
    documento,
    {
      startY:
        siguienteY + 5,

      head: [
        [
          'Período',
          'Total',
          'Nuevos',
          'En revisión',
          'En atención',
          'Pendientes',
          'Resueltos',
          'Cerrados',
        ],
      ],

      body:
        historicoMensual.length >
        0
          ? historicoMensual.map(
              (registro) => [
                registro.periodo,

                registro.total,

                registro.nuevos,

                registro.enRevision,

                registro.enAtencion,

                registro.pendientes,

                registro.resueltos,

                registro.cerrados,
              ],
            )
          : [
              [
                'Sin datos',
                0,
                0,
                0,
                0,
                0,
                0,
                0,
              ],
            ],

      theme:
        'grid',

      styles: {
        fontSize:
          8,

        cellPadding:
          2.3,

        halign:
          'center',
      },

      headStyles: {
        fillColor: [
          31,
          70,
          151,
        ],
      },

      columnStyles: {
        0: {
          halign:
            'left',
        },
      },

      margin: {
        left:
          14,

        right:
          14,
      },
    },
  );

  /*
   * PIE DE PÁGINA
   */

  const totalPaginas =
    documento.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <= totalPaginas;
    pagina += 1
  ) {
    documento.setPage(
      pagina,
    );

    documento.setFont(
      'helvetica',
      'normal',
    );

    documento.setFontSize(
      8,
    );

    documento.setTextColor(
      100,
      116,
      139,
    );

    documento.text(
      `Página ${pagina} de ${totalPaginas}`,
      anchoPagina - 14,
      documento.internal
        .pageSize
        .getHeight() - 8,
      {
        align:
          'right',
      },
    );

    documento.text(
      'Sistema de Gestión de Incidentes TI - Grupo Master',
      14,
      documento.internal
        .pageSize
        .getHeight() - 8,
    );
  }

  /*
   * NOMBRE DEL ARCHIVO
   */

  let nombreArchivo =
    'reporte_incidentes';

  if (
    desde &&
    hasta
  ) {
    nombreArchivo +=
      `_${desde}_${hasta}`;
  }

  nombreArchivo +=
    '.pdf';

  documento.save(
    nombreArchivo,
  );
}