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

interface ExportarAnaliticaPdfParams {
  resumen: ResumenAnalitica;
  categorias: CategoriaAnalitica[];
  prioridades: PrioridadAnalitica[];
  tecnicos: TecnicoAnalitica[];
  historicoMensual: HistoricoMensual[];
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

  if (partes.length !== 3) {
    return fecha;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerSiguienteY(
  documento: JsPdfConTabla,
  margen = 12,
  espacioMinimo = 35,
) {
  const finalY =
    documento.lastAutoTable?.finalY ??
    40;

  const siguienteY =
    finalY + margen;

  const altoPagina =
    documento.internal.pageSize.getHeight();

  if (
    siguienteY + espacioMinimo >
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
  desde,
  hasta,
}: ExportarAnaliticaPdfParams) {
  const documento =
    new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    }) as JsPdfConTabla;

  const anchoPagina =
    documento.internal.pageSize.getWidth();

  const fechaGeneracion =
    new Date().toLocaleString(
      'es-GT',
      {
        dateStyle: 'short',
        timeStyle: 'short',
      },
    );

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(18);

  documento.text(
    'Reporte de Incidentes TI',
    anchoPagina / 2,
    16,
    {
      align: 'center',
    },
  );

  documento.setFont(
    'helvetica',
    'normal',
  );

  documento.setFontSize(10);

  documento.text(
    'Grupo Master - Departamento de IT',
    anchoPagina / 2,
    23,
    {
      align: 'center',
    },
  );

  let periodo =
    'Todos los registros';

  if (
    desde &&
    hasta
  ) {
    periodo =
      `${formatearFecha(desde)} al ${formatearFecha(hasta)}`;
  }

  documento.setFontSize(9);

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
      align: 'right',
    },
  );

  documento.setDrawColor(
    31,
    70,
    151,
  );

  documento.setLineWidth(0.8);

  documento.line(
    14,
    36,
    anchoPagina - 14,
    36,
  );

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(13);

  documento.text(
    'Resumen general',
    14,
    45,
  );

  autoTable(
    documento,
    {
      startY: 50,

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

      theme: 'grid',

      styles: {
        fontSize: 9,
        cellPadding: 2.5,
      },

      headStyles: {
        fillColor: [
          31,
          70,
          151,
        ],
      },

      margin: {
        left: 14,
        right: 14,
      },

      tableWidth: 100,
    },
  );

  let siguienteY =
    obtenerSiguienteY(
      documento,
      14,
    );

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(13);

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

      theme: 'grid',

      styles: {
        fontSize: 9,
        cellPadding: 2.5,
      },

      headStyles: {
        fillColor: [
          31,
          70,
          151,
        ],
      },

      margin: {
        left: 14,
        right: 14,
      },
    },
  );

  siguienteY =
    obtenerSiguienteY(
      documento,
      14,
    );

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(13);

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

      theme: 'grid',

      styles: {
        fontSize: 9,
        cellPadding: 2.5,
      },

      headStyles: {
        fillColor: [
          31,
          70,
          151,
        ],
      },

      margin: {
        left: 14,
        right: 14,
      },
    },
  );

  siguienteY =
    obtenerSiguienteY(
      documento,
      14,
    );

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(13);

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

      theme: 'grid',

      styles: {
        fontSize: 8,
        cellPadding: 2.3,
        halign: 'center',
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
          halign: 'left',
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    },
  );

  siguienteY =
    obtenerSiguienteY(
      documento,
      14,
    );

  documento.setFont(
    'helvetica',
    'bold',
  );

  documento.setFontSize(13);

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
        historicoMensual.length > 0
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

      theme: 'grid',

      styles: {
        fontSize: 8,
        cellPadding: 2.3,
        halign: 'center',
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
          halign: 'left',
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    },
  );

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

    documento.setFontSize(8);

    documento.setTextColor(
      100,
      116,
      139,
    );

    documento.text(
      `Página ${pagina} de ${totalPaginas}`,
      anchoPagina - 14,
      documento.internal.pageSize.getHeight() - 8,
      {
        align: 'right',
      },
    );

    documento.text(
      'Sistema de Gestión de Incidentes TI - Grupo Master',
      14,
      documento.internal.pageSize.getHeight() - 8,
    );
  }

  let nombreArchivo =
    'reporte_incidentes';

  if (
    desde &&
    hasta
  ) {
    nombreArchivo +=
      `_${desde}_${hasta}`;
  }

  nombreArchivo += '.pdf';

  documento.save(
    nombreArchivo,
  );
}