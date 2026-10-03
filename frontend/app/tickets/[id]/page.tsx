'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

interface Ticket {
  idTicket: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  impacto: string;
  urgencia: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaCierre: string | null;

  solicitante: {
    id: number;
    usuario: string;
  };

  tecnico: {
    id: number;
    usuario: string;
  } | null;

  categoria: {
    idCategoria: number;
    nombre: string;
  };

  prioridad: {
    idPrioridad: number;
    nombre: string;
    nivel: number;
  } | null;

  estado: {
    idEstado: number;
    nombre: string;
  };
}

interface Bitacora {
  idBitacora: number;
  idTicket: number;
  idUsuario: number;
  accion: string;
  detalle: string;
  fecha: string;

  usuario: {
    id: number;
    usuario: string;
  };
}

interface OpcionEstado {
  idEstado: number;
  nombre: string;
}

export default function DetalleTicketPage() {
  const router = useRouter();

  const params =
    useParams<{ id: string }>();

  const idTicket = params.id;

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [bitacora, setBitacora] =
    useState<Bitacora[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState('');

  const [mensajeExito, setMensajeExito] =
    useState('');

  const [estadoSeleccionado, setEstadoSeleccionado] =
    useState('');

  const cargarInformacion = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
      }

      const token =
        localStorage.getItem('access_token');

      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const [
          respuestaTicket,
          respuestaBitacora,
        ] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}/bitacora`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),
        ]);

        if (
          respuestaTicket.status === 401
        ) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');

          return;
        }

        if (
          respuestaTicket.status === 403
        ) {
          router.replace(
            '/tickets/asignados',
          );

          return;
        }

        if (!respuestaTicket.ok) {
          setMensaje(
            'No fue posible cargar el ticket.',
          );

          return;
        }

        const ticketData =
          await respuestaTicket.json();

        setTicket(ticketData);

        if (respuestaBitacora.ok) {
          const bitacoraData =
            await respuestaBitacora.json();

          setBitacora(bitacoraData);
        }
      } catch {
        setMensaje(
          'No fue posible conectar con el servidor.',
        );
      } finally {
        if (mostrarCarga) {
          setCargando(false);
        }
      }
    },
    [idTicket, router],
  );

  useEffect(() => {
    cargarInformacion();
  }, [cargarInformacion]);

  function obtenerEstadosPermitidos(
    idEstadoActual: number,
  ): OpcionEstado[] {
    switch (idEstadoActual) {
      case 3:
        return [
          {
            idEstado: 4,
            nombre: 'Pendiente',
          },
          {
            idEstado: 5,
            nombre: 'Resuelto',
          },
        ];

      case 4:
        return [
          {
            idEstado: 3,
            nombre: 'En atención',
          },
          {
            idEstado: 5,
            nombre: 'Resuelto',
          },
        ];

      case 5:
        return [
          {
            idEstado: 6,
            nombre: 'Cerrado',
          },
        ];

      default:
        return [];
    }
  }

  async function actualizarEstado() {
    if (!ticket) {
      return;
    }

    if (!estadoSeleccionado) {
      setMensaje(
        'Seleccione el nuevo estado del ticket.',
      );

      return;
    }

    const token =
      localStorage.getItem('access_token');

    if (!token) {
      router.replace('/');
      return;
    }

    setActualizando(true);
    setMensaje('');
    setMensajeExito('');

    try {
      const respuesta = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}/estado`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            idEstado: Number(
              estadoSeleccionado,
            ),
          }),
        },
      );

      if (respuesta.status === 401) {
        localStorage.removeItem(
          'access_token',
        );

        router.replace('/');

        return;
      }

      if (respuesta.status === 403) {
        setMensaje(
          'No tiene permisos para cambiar el estado de este ticket.',
        );

        return;
      }

      if (!respuesta.ok) {
        const errorData =
          await respuesta
            .json()
            .catch(() => null);

        if (
          errorData?.message
        ) {
          setMensaje(
            Array.isArray(
              errorData.message,
            )
              ? errorData.message.join(
                  ', ',
                )
              : errorData.message,
          );
        } else {
          setMensaje(
            'No fue posible actualizar el estado.',
          );
        }

        return;
      }

      setMensajeExito(
        'Estado actualizado correctamente.',
      );

      setEstadoSeleccionado('');

      await cargarInformacion(false);
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setActualizando(false);
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Cargando información...
        </p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="mb-4 text-red-600">
            {mensaje ||
              'No fue posible encontrar el ticket.'}
          </p>

          <button
            onClick={() =>
              router.push(
                '/tickets/asignados',
              )
            }
            className="rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            Volver
          </button>
        </div>
      </main>
    );
  }

  const estadosPermitidos =
    obtenerEstadosPermitidos(
      ticket.estado.idEstado,
    );

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Gestión de Incidentes TI
            </h1>

            <p className="text-sm text-slate-500">
              Detalle del ticket
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                '/tickets/asignados',
              )
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Volver
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">
              {ticket.codigo}
            </h2>

            <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
              {ticket.estado.nombre}
            </span>
          </div>

          <h3 className="mt-2 text-xl text-slate-700">
            {ticket.titulo}
          </h3>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                Información del incidente
              </h3>

              <p className="whitespace-pre-wrap text-slate-700">
                {ticket.descripcion}
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">
                    Impacto
                  </p>

                  <p className="font-semibold text-slate-900">
                    {ticket.impacto}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Urgencia
                  </p>

                  <p className="font-semibold text-slate-900">
                    {ticket.urgencia}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Categoría
                  </p>

                  <p className="font-semibold text-slate-900">
                    {ticket.categoria.nombre}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Prioridad
                  </p>

                  <p className="font-semibold text-slate-900">
                    {ticket.prioridad?.nombre ??
                      'Sin prioridad'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Solicitante
                  </p>

                  <p className="font-semibold text-slate-900">
                    {
                      ticket.solicitante
                        .usuario
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Técnico
                  </p>

                  <p className="font-semibold text-slate-900">
                    {ticket.tecnico
                      ?.usuario ??
                      'Sin asignar'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-lg font-bold text-slate-900">
                Bitácora
              </h3>

              {bitacora.length === 0 ? (
                <p className="text-slate-500">
                  No hay movimientos registrados.
                </p>
              ) : (
                <div className="space-y-5">
                  {bitacora.map(
                    (registro) => (
                      <div
                        key={
                          registro.idBitacora
                        }
                        className="border-l-4 border-slate-300 pl-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">
                            {
                              registro.accion
                            }
                          </p>

                          <p className="text-sm text-slate-400">
                            {new Date(
                              registro.fecha,
                            ).toLocaleString(
                              'es-GT',
                            )}
                          </p>
                        </div>

                        <p className="mt-1 text-slate-600">
                          {
                            registro.detalle
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Realizado por:{' '}
                          {registro.usuario
                            ?.usuario ??
                            `Usuario ${registro.idUsuario}`}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                Fechas
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">
                    Creación
                  </p>

                  <p className="font-medium text-slate-900">
                    {new Date(
                      ticket.fechaCreacion,
                    ).toLocaleString(
                      'es-GT',
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Última actualización
                  </p>

                  <p className="font-medium text-slate-900">
                    {new Date(
                      ticket.fechaActualizacion,
                    ).toLocaleString(
                      'es-GT',
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Cierre
                  </p>

                  <p className="font-medium text-slate-900">
                    {ticket.fechaCierre
                      ? new Date(
                          ticket.fechaCierre,
                        ).toLocaleString(
                          'es-GT',
                        )
                      : 'Pendiente'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-slate-900">
                Gestión del ticket
              </h3>

              {estadosPermitidos.length >
              0 ? (
                <>
                  <p className="mb-3 text-sm text-slate-500">
                    Estado actual
                  </p>

                  <p className="mb-5 font-semibold text-slate-900">
                    {ticket.estado.nombre}
                  </p>

                  <label
                    htmlFor="estado"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nuevo estado
                  </label>

                  <select
                    id="estado"
                    value={
                      estadoSeleccionado
                    }
                    onChange={(event) => {
                      setEstadoSeleccionado(
                        event.target.value,
                      );

                      setMensaje('');
                      setMensajeExito('');
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                  >
                    <option value="">
                      Seleccione un estado
                    </option>

                    {estadosPermitidos.map(
                      (estado) => (
                        <option
                          key={
                            estado.idEstado
                          }
                          value={
                            estado.idEstado
                          }
                        >
                          {estado.nombre}
                        </option>
                      ),
                    )}
                  </select>

                  <button
                    onClick={
                      actualizarEstado
                    }
                    disabled={
                      actualizando ||
                      !estadoSeleccionado
                    }
                    className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {actualizando
                      ? 'Actualizando...'
                      : 'Actualizar estado'}
                  </button>

                  {mensajeExito && (
                    <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                      {mensajeExito}
                    </div>
                  )}

                  {mensaje && (
                    <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {mensaje}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="font-semibold text-slate-900">
                    {
                      ticket.estado
                        .nombre
                    }
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {ticket.estado
                      .idEstado === 6
                      ? 'El ticket se encuentra cerrado y ya no puede cambiar de estado.'
                      : 'No hay cambios de estado disponibles.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}