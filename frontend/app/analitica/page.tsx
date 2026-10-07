'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import AppShell from '../../components/AppShell';

interface Perfil {
  sub: number;
  usuario: string;
  idRol: number;
  rol: string;
  iat?: number;
  exp?: number;
}

interface Resumen {
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

interface MensualAnalitica {
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

interface FiltroAplicado {
  desde: string;
  hasta: string;
}

const resumenInicial: Resumen = {
  total: 0,
  nuevos: 0,
  enRevision: 0,
  enAtencion: 0,
  pendientes: 0,
  resueltos: 0,
  cerrados: 0,
  sinAsignar: 0,
};

export default function AnaliticaPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [resumen, setResumen] =
    useState<Resumen>(resumenInicial);

  const [categorias, setCategorias] =
    useState<CategoriaAnalitica[]>([]);

  const [prioridades, setPrioridades] =
    useState<PrioridadAnalitica[]>([]);

  const [tecnicos, setTecnicos] =
    useState<TecnicoAnalitica[]>([]);

  const [mensual, setMensual] =
    useState<MensualAnalitica[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [cargandoFiltro, setCargandoFiltro] =
    useState(false);

  const [error, setError] =
    useState('');

  const [mensajeFiltro, setMensajeFiltro] =
    useState('');

  const [desde, setDesde] =
    useState('');

  const [hasta, setHasta] =
    useState('');

  const [
    filtroAplicado,
    setFiltroAplicado,
  ] =
    useState<FiltroAplicado | null>(
      null,
    );

  function construirQuery(
    fechaDesde?: string,
    fechaHasta?: string,
  ) {
    const parametros =
      new URLSearchParams();

    if (fechaDesde) {
      parametros.set(
        'desde',
        fechaDesde,
      );
    }

    if (fechaHasta) {
      parametros.set(
        'hasta',
        fechaHasta,
      );
    }

    const query =
      parametros.toString();

    return query
      ? `?${query}`
      : '';
  }

  async function cargarDatosAnaliticos(
    token: string,
    fechaDesde?: string,
    fechaHasta?: string,
  ) {
    const headers = {
      Authorization:
        `Bearer ${token}`,
    };

    const query =
      construirQuery(
        fechaDesde,
        fechaHasta,
      );

    const [
      respuestaResumen,
      respuestaCategorias,
      respuestaPrioridades,
      respuestaTecnicos,
      respuestaMensual,
    ] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analitica/resumen${query}`,
        {
          headers,
        },
      ),

      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analitica/categorias${query}`,
        {
          headers,
        },
      ),

      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analitica/prioridades${query}`,
        {
          headers,
        },
      ),

      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analitica/tecnicos${query}`,
        {
          headers,
        },
      ),

      fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/analitica/mensual${query}`,
  {
    headers,
  },
),
    ]);

    const respuestas = [
      respuestaResumen,
      respuestaCategorias,
      respuestaPrioridades,
      respuestaTecnicos,
      respuestaMensual,
    ];

    const sesionExpirada =
      respuestas.some(
        (respuesta) =>
          respuesta.status === 401,
      );

    if (sesionExpirada) {
      localStorage.removeItem(
        'access_token',
      );

      router.replace('/');

      return false;
    }

    const algunaConError =
      respuestas.some(
        (respuesta) =>
          !respuesta.ok,
      );

    if (algunaConError) {
      throw new Error(
        'No fue posible cargar la información analítica.',
      );
    }

    const [
      dataResumen,
      dataCategorias,
      dataPrioridades,
      dataTecnicos,
      dataMensual,
    ] = await Promise.all([
      respuestaResumen.json(),
      respuestaCategorias.json(),
      respuestaPrioridades.json(),
      respuestaTecnicos.json(),
      respuestaMensual.json(),
    ]);

    setResumen(dataResumen);
    setCategorias(dataCategorias);
    setPrioridades(dataPrioridades);
    setTecnicos(dataTecnicos);
    setMensual(dataMensual);

    return true;
  }

  useEffect(() => {
    async function cargarAnalitica() {
      const token =
        localStorage.getItem(
          'access_token',
        );

      if (!token) {
        router.replace('/');
        return;
      }

      try {
        setError('');

        const respuestaPerfil =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/perfil`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!respuestaPerfil.ok) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');
          return;
        }

        const dataPerfil =
          await respuestaPerfil.json();

        const perfilNormalizado: Perfil =
          dataPerfil.usuario &&
          typeof dataPerfil.usuario ===
            'object'
            ? dataPerfil.usuario
            : dataPerfil;

        const esSupervisor =
          perfilNormalizado.idRol === 6 ||
          perfilNormalizado.rol?.trim() ===
            'Supervisor';

        const esAdministrador =
          perfilNormalizado.idRol === 7 ||
          perfilNormalizado.rol?.trim() ===
            'Administrador';

        if (
          !esSupervisor &&
          !esAdministrador
        ) {
          router.replace(
            '/dashboard',
          );
          return;
        }

        setPerfil(
          perfilNormalizado,
        );

        await cargarDatosAnaliticos(
          token,
        );
      } catch (errorCargar) {
        console.error(
          errorCargar,
        );

        setError(
          'No fue posible cargar la analítica. Verifique que el backend se encuentre disponible.',
        );
      } finally {
        setCargando(false);
      }
    }

    cargarAnalitica();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function aplicarFiltros() {
    setError('');
    setMensajeFiltro('');

    if (!desde || !hasta) {
      setError(
        'Seleccione una fecha inicial y una fecha final para aplicar el filtro.',
      );
      return;
    }

    if (desde > hasta) {
      setError(
        'La fecha inicial no puede ser posterior a la fecha final.',
      );
      return;
    }

    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      router.replace('/');
      return;
    }

    try {
      setCargandoFiltro(true);

      const cargado =
        await cargarDatosAnaliticos(
          token,
          desde,
          hasta,
        );

      if (!cargado) {
        return;
      }

      setFiltroAplicado({
        desde,
        hasta,
      });

      setMensajeFiltro(
        'Filtro aplicado correctamente.',
      );
    } catch (errorFiltro) {
      console.error(
        errorFiltro,
      );

      setError(
        'No fue posible aplicar el filtro de fechas.',
      );
    } finally {
      setCargandoFiltro(false);
    }
  }

  async function limpiarFiltros() {
    setError('');
    setMensajeFiltro('');

    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      router.replace('/');
      return;
    }

    try {
      setCargandoFiltro(true);

      const cargado =
        await cargarDatosAnaliticos(
          token,
        );

      if (!cargado) {
        return;
      }

      setDesde('');
      setHasta('');
      setFiltroAplicado(null);

      setMensajeFiltro(
        'Filtro eliminado. Se muestran todos los registros.',
      );
    } catch (errorLimpiar) {
      console.error(
        errorLimpiar,
      );

      setError(
        'No fue posible limpiar el filtro de fechas.',
      );
    } finally {
      setCargandoFiltro(false);
    }
  }

  function formatearFechaFiltro(
    fecha: string,
  ) {
    if (!fecha) {
      return '';
    }

    const [
      anio,
      mes,
      dia,
    ] = fecha.split('-');

    return `${dia}/${mes}/${anio}`;
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <p className="text-[#61605E]">
          Cargando analítica...
        </p>
      </main>
    );
  }

  if (!perfil) {
    return null;
  }

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1 text-sm font-semibold text-[#EC2328]">
              Analítica de incidentes
            </p>

            <h1 className="text-3xl font-bold text-[#1F4697]">
              Reportes y estadísticas
            </h1>

            <p className="mt-2 text-[#61605E]">
              Consulte el comportamiento general
              de los incidentes registrados en el
              sistema.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push('/dashboard')
            }
            className="rounded-lg border border-[#1F4697] bg-white px-5 py-2.5 font-semibold text-[#1F4697] transition hover:bg-blue-50"
          >
            Volver al inicio
          </button>
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 h-1 w-12 rounded-full bg-[#EC2328]" />

              <h2 className="text-lg font-bold text-[#1F4697]">
                Filtrar por fechas
              </h2>

              <p className="mt-1 text-sm text-[#61605E]">
                Consulte la analítica de un período específico.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[180px_180px_auto_auto] lg:items-end">
              <div>
                <label
                  htmlFor="fecha-desde"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Desde
                </label>

                <input
                  id="fecha-desde"
                  type="date"
                  value={desde}
                  onChange={(event) =>
                    setDesde(
                      event.target.value,
                    )
                  }
                  disabled={
                    cargandoFiltro
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="fecha-hasta"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Hasta
                </label>

                <input
                  id="fecha-hasta"
                  type="date"
                  value={hasta}
                  onChange={(event) =>
                    setHasta(
                      event.target.value,
                    )
                  }
                  disabled={
                    cargandoFiltro
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={
                  aplicarFiltros
                }
                disabled={
                  cargandoFiltro
                }
                className="rounded-lg bg-[#1F4697] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17397c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargandoFiltro
                  ? 'Procesando...'
                  : 'Aplicar filtros'}
              </button>

              <button
                type="button"
                onClick={
                  limpiarFiltros
                }
                disabled={
                  cargandoFiltro
                }
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpiar
              </button>
            </div>
          </div>

          {filtroAplicado && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-[#1F4697]">
              Período aplicado:{' '}
              <span className="font-semibold">
                {formatearFechaFiltro(
                  filtroAplicado.desde,
                )}
              </span>{' '}
              al{' '}
              <span className="font-semibold">
                {formatearFechaFiltro(
                  filtroAplicado.hasta,
                )}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {mensajeFiltro && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {mensajeFiltro}
          </div>
        )}

        <div className="mb-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#1F4697]">
              Resumen general
            </h2>

            <p className="mt-1 text-sm text-[#61605E]">
              {filtroAplicado
                ? `Resultados correspondientes al período del ${formatearFechaFiltro(
                    filtroAplicado.desde,
                  )} al ${formatearFechaFiltro(
                    filtroAplicado.hasta,
                  )}.`
                : 'Estado actual de los tickets registrados.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <IndicadorCard
              titulo="Total de tickets"
              valor={resumen.total}
              claseValor="text-[#1F4697]"
            />

            <IndicadorCard
              titulo="Nuevos"
              valor={resumen.nuevos}
              claseValor="text-[#1F4697]"
            />

            <IndicadorCard
              titulo="En revisión"
              valor={resumen.enRevision}
              claseValor="text-sky-600"
            />

            <IndicadorCard
              titulo="En atención"
              valor={resumen.enAtencion}
              claseValor="text-[#EC2328]"
            />

            <IndicadorCard
              titulo="Pendientes"
              valor={resumen.pendientes}
              claseValor="text-amber-600"
            />

            <IndicadorCard
              titulo="Resueltos"
              valor={resumen.resueltos}
              claseValor="text-green-600"
            />

            <IndicadorCard
              titulo="Cerrados"
              valor={resumen.cerrados}
              claseValor="text-slate-700"
            />

            <IndicadorCard
              titulo="Sin asignar"
              valor={resumen.sinAsignar}
              claseValor="text-[#EC2328]"
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-3 h-1 w-12 rounded-full bg-[#EC2328]" />

              <h2 className="text-xl font-bold text-[#1F4697]">
                Tickets por categoría
              </h2>

              <p className="mt-1 text-sm text-[#61605E]">
                Distribución de los incidentes
                según su categoría.
              </p>
            </div>

            {categorias.length === 0 ? (
              <MensajeVacio
                mensaje="No hay información de categorías."
              />
            ) : (
              <div className="space-y-5">
                {categorias.map(
                  (categoria) => (
                    <BarraPorcentaje
                      key={
                        categoria.idCategoria
                      }
                      nombre={
                        categoria.categoria
                      }
                      total={
                        categoria.total
                      }
                      porcentaje={
                        categoria.porcentaje
                      }
                    />
                  ),
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-3 h-1 w-12 rounded-full bg-[#1F4697]" />

              <h2 className="text-xl font-bold text-[#1F4697]">
                Tickets por prioridad
              </h2>

              <p className="mt-1 text-sm text-[#61605E]">
                Distribución según el nivel de
                prioridad asignado.
              </p>
            </div>

            {prioridades.length === 0 ? (
              <MensajeVacio
                mensaje="No hay tickets con prioridad asignada."
              />
            ) : (
              <div className="space-y-5">
                {prioridades.map(
                  (prioridad) => (
                    <BarraPorcentaje
                      key={
                        prioridad.idPrioridad
                      }
                      nombre={
                        prioridad.prioridad
                      }
                      total={
                        prioridad.total
                      }
                      porcentaje={
                        prioridad.porcentaje
                      }
                      detalle={`Nivel ${prioridad.nivel}`}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#1F4697]">
              Carga de trabajo por técnico
            </h2>

            <p className="mt-1 text-sm text-[#61605E]">
              Cantidad de incidentes asignados y
              estado actual por técnico.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {tecnicos.length === 0 ? (
              <div className="p-6">
                <MensajeVacio
                  mensaje="No hay tickets asignados a técnicos."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <EncabezadoTabla>
                        Técnico
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        Asignados
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        En atención
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        Pendientes
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        Resueltos
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        Cerrados
                      </EncabezadoTabla>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {tecnicos.map(
                      (tecnico) => (
                        <tr
                          key={
                            tecnico.idTecnico
                          }
                          className="hover:bg-slate-50"
                        >
                          <CeldaTabla>
                            <span className="font-semibold text-slate-900">
                              {
                                tecnico.tecnico
                              }
                            </span>
                          </CeldaTabla>

                          <CeldaTabla>
                            {
                              tecnico.totalAsignados
                            }
                          </CeldaTabla>

                          <CeldaTabla>
                            {
                              tecnico.enAtencion
                            }
                          </CeldaTabla>

                          <CeldaTabla>
                            {
                              tecnico.pendientes
                            }
                          </CeldaTabla>

                          <CeldaTabla>
                            {
                              tecnico.resueltos
                            }
                          </CeldaTabla>

                          <CeldaTabla>
                            {
                              tecnico.cerrados
                            }
                          </CeldaTabla>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#1F4697]">
              Histórico mensual
            </h2>

            <p className="mt-1 text-sm text-[#61605E]">
              Evolución mensual de los incidentes
              registrados.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {mensual.length === 0 ? (
              <div className="p-6">
                <MensajeVacio
                  mensaje="No existen datos históricos disponibles."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <EncabezadoTabla>
                        Período
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        Total
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        Nuevos
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        En atención
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        Pendientes
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        Resueltos
                      </EncabezadoTabla>

                      <EncabezadoTabla>
                        Cerrados
                      </EncabezadoTabla>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {mensual.map(
                      (registro) => (
                        <tr
                          key={`${registro.anio}-${registro.mes}`}
                          className="hover:bg-slate-50"
                        >
                          <CeldaTabla>
                            <span className="font-semibold text-slate-900">
                              {
                                registro.periodo
                              }
                            </span>
                          </CeldaTabla>

                          <CeldaTabla>
                            {registro.total}
                          </CeldaTabla>

                          <CeldaTabla>
                            {registro.nuevos}
                          </CeldaTabla>

                          <CeldaTabla>
                            {
                              registro.enAtencion
                            }
                          </CeldaTabla>

                          <CeldaTabla>
                            {
                              registro.pendientes
                            }
                          </CeldaTabla>

                          <CeldaTabla>
                            {
                              registro.resueltos
                            }
                          </CeldaTabla>

                          <CeldaTabla>
                            {
                              registro.cerrados
                            }
                          </CeldaTabla>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function IndicadorCard({
  titulo,
  valor,
  claseValor,
}: {
  titulo: string;
  valor: number;
  claseValor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#61605E]">
        {titulo}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${claseValor}`}
      >
        {valor}
      </p>
    </div>
  );
}

function BarraPorcentaje({
  nombre,
  total,
  porcentaje,
  detalle,
}: {
  nombre: string;
  total: number;
  porcentaje: number;
  detalle?: string;
}) {
  const porcentajeVisual =
    Math.min(
      Math.max(porcentaje, 0),
      100,
    );

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900">
            {nombre}
          </p>

          {detalle && (
            <p className="text-xs text-[#61605E]">
              {detalle}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="font-semibold text-[#1F4697]">
            {total}
          </p>

          <p className="text-xs text-[#61605E]">
            {porcentaje}%
          </p>
        </div>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#1F4697] transition-all"
          style={{
            width:
              `${porcentajeVisual}%`,
          }}
        />
      </div>
    </div>
  );
}

function EncabezadoTabla({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className="whitespace-nowrap px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#1F4697]"
    >
      {children}
    </th>
  );
}

function CeldaTabla({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-5 py-4 text-sm text-[#61605E]">
      {children}
    </td>
  );
}

function MensajeVacio({
  mensaje,
}: {
  mensaje: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-[#61605E]">
      {mensaje}
    </div>
  );
}
