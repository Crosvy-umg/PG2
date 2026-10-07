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

interface ExportarAnaliticaExcelParams {
  resumen: ResumenAnalitica;
  categorias: CategoriaAnalitica[];
  prioridades: PrioridadAnalitica[];
  tecnicos: TecnicoAnalitica[];
  historicoMensual: HistoricoMensual[];
  desde?: string;
  hasta?: string;
}

function ajustarAnchoColumnas(
  hoja: XLSX.WorkSheet,
  datos: Record<string, unknown>[],
) {
  if (datos.length === 0) {
    return;
  }

  const columnas = Object.keys(datos[0]);

  hoja['!cols'] = columnas.map(
    (columna) => {
      const longitudMaxima = Math.max(
        columna.length,
        ...datos.map((registro) =>
          String(
            registro[columna] ?? '',
          ).length,
        ),
      );

      return {
        wch: Math.min(
          longitudMaxima + 3,
          40,
        ),
      };
    },
  );
}

export function exportarAnaliticaExcel({
  resumen,
  categorias,
  prioridades,
  tecnicos,
  historicoMensual,
  desde,
  hasta,
}: ExportarAnaliticaExcelParams) {
  const libro =
    XLSX.utils.book_new();

  const datosResumen = [
    {
      Indicador: 'Total de tickets',
      Cantidad: resumen.total,
    },
    {
      Indicador: 'Nuevos',
      Cantidad: resumen.nuevos,
    },
    {
      Indicador: 'En revisión',
      Cantidad: resumen.enRevision,
    },
    {
      Indicador: 'En atención',
      Cantidad: resumen.enAtencion,
    },
    {
      Indicador: 'Pendientes',
      Cantidad: resumen.pendientes,
    },
    {
      Indicador: 'Resueltos',
      Cantidad: resumen.resueltos,
    },
    {
      Indicador: 'Cerrados',
      Cantidad: resumen.cerrados,
    },
    {
      Indicador: 'Sin asignar',
      Cantidad: resumen.sinAsignar,
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

  let nombreArchivo =
    'analitica_incidentes';

  if (desde && hasta) {
    nombreArchivo +=
      `_${desde}_${hasta}`;
  }

  nombreArchivo += '.xlsx';

  XLSX.writeFile(
    libro,
    nombreArchivo,
  );
}