'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import AppShell from '../../../components/AppShell';

interface Perfil {
  sub: number;
  usuario: string;
  idRol: number;
  rol: string;
}

interface Ticket {
  idTicket: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  impacto: string;
  urgencia: string;
  fechaCreacion: string;

  idSolicitante: number;
  idTecnico: number | null;
  idCategoria: number;
  idPrioridad: number | null;
  idEstado: number;

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

interface Tecnico {
  id: number;
  usuario: string;
  activo: boolean;
  idRol: number;

  rol?: {
    idRol: number;
    nombre: string;
  };
}

interface Prioridad {
  idPrioridad: number;
  nombre: string;
  nivel: number;
}

interface SeleccionTicket {
  idTecnico: string;
  idPrioridad: string;
}

export default function GestionTicketsPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [tecnicos, setTecnicos] =
    useState<Tecnico[]>([]);

  const [prioridades, setPrioridades] =
    useState<Prioridad[]>([]);

  const [selecciones, setSelecciones] =
    useState<
      Record<number, SeleccionTicket>
    >({});

  const [cargando, setCargando] =
    useState(true);

  const [procesando, setProcesando] =
    useState<number | null>(null);

  const [mensaje, setMensaje] =
    useState('');

  const [mensajeExito, setMensajeExito] =
    useState('');

  const cargarDatos = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
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

        const autorizado =
          perfilNormalizado.idRol === 6 ||
          perfilNormalizado.idRol === 7 ||
          perfilNormalizado.rol?.trim() ===
            'Supervisor' ||
          perfilNormalizado.rol?.trim() ===
            'Administrador';

        if (!autorizado) {
          router.replace('/dashboard');
          return;
        }

        setPerfil(perfilNormalizado);

        const [
          respuestaTickets,
          respuestaTecnicos,
          respuestaPrioridades,
        ] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/usuarios/tecnicos`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/prioridades`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),
        ]);

        if (
          respuestaTickets.status === 401 ||
          respuestaTecnicos.status === 401 ||
          respuestaPrioridades.status === 401
        ) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');
          return;
        }

        if (
          !respuestaTickets.ok ||
          !respuestaTecnicos.ok ||
          !respuestaPrioridades.ok
        ) {
          setMensaje(
            'No fue posible cargar la información necesaria.',
          );

          return;
        }

        const ticketsData: Ticket[] =
          await respuestaTickets.json();

        const tecnicosData: Tecnico[] =
          await respuestaTecnicos.json();

        const prioridadesData: Prioridad[] =
          await respuestaPrioridades.json();

        setTickets(ticketsData);

        setTecnicos(
          tecnicosData.filter(
            (tecnico) =>
              tecnico.activo,
          ),
        );

        setPrioridades(
          prioridadesData.sort(
            (a, b) =>
              a.nivel - b.nivel,
          ),
        );
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
    [router],
  );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  function cambiarSeleccion(
    idTicket: number,
    campo: keyof SeleccionTicket,
    valor: string,
  ) {
    setSelecciones((actual) => ({
      ...actual,

      [idTicket]: {
        idTecnico:
          actual[idTicket]
            ?.idTecnico ?? '',

        idPrioridad:
          actual[idTicket]
            ?.idPrioridad ?? '',

        [campo]: valor,
      },
    }));

    setMensaje('');
    setMensajeExito('');
  }

  async function asignarTicket(
    ticket: Ticket,
  ) {
    const seleccion =
      selecciones[ticket.idTicket];

    if (
      !seleccion?.idTecnico ||
      !seleccion?.idPrioridad
    ) {
      setMensaje(
        'Debe seleccionar un técnico y una prioridad.',
      );

      setMensajeExito('');

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

    setProcesando(
      ticket.idTicket,
    );

    setMensaje('');
    setMensajeExito('');

    try {
      const respuesta =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticket.idTicket}/atencion`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              idTecnico: Number(
                seleccion.idTecnico,
              ),

              idPrioridad: Number(
                seleccion.idPrioridad,
              ),

              idEstado: 3,
            }),
          },
        );

      if (
        respuesta.status === 401
      ) {
        localStorage.removeItem(
          'access_token',
        );

        router.replace('/');
        return;
      }

      if (
        respuesta.status === 403
      ) {
        setMensaje(
          'No tiene permisos para asignar tickets.',
        );

        return;
      }

      if (!respuesta.ok) {
        const errorData =
          await respuesta
            .json()
            .catch(() => null);

        if (errorData?.message) {
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
            'No fue posible asignar el ticket.',
          );
        }

        return;
      }

      setMensajeExito(
        `${ticket.codigo} fue asignado correctamente.`,
      );

      setSelecciones(
        (actual) => {
          const nuevasSelecciones = {
            ...actual,
          };

          delete nuevasSelecciones[
            ticket.idTicket
          ];

          return nuevasSelecciones;
        },
      );

      await cargarDatos(false);
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setProcesando(null);
    }
  }

  function claseEstado(
    idEstado: number,
  ) {
    switch (idEstado) {
      case 1:
        return 'bg-blue-50 text-[#1F4697]';

      case 2:
        return 'bg-violet-50 text-violet-700';

      case 3:
        return 'bg-orange-50 text-orange-700';

      case 4:
        return 'bg-amber-50 text-amber-700';

      case 5:
        return 'bg-green-50 text-green-700';

      case 6:
        return 'bg-slate-100 text-slate-700';

      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  function formatearFecha(
    fecha: string,
  ) {
    return new Date(
      fecha,
    ).toLocaleString('es-GT');
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <p className="text-[#61605E]">
          Cargando tickets...
        </p>
      </main>
    );
  }

  if (!perfil) {
    return null;
  }

  const ticketsPendientes =
    tickets.filter(
      (ticket) =>
        ticket.idEstado === 1 &&
        ticket.idTecnico === null,
    );

  const ticketsGestionados =
    tickets.filter(
      (ticket) =>
        !(
          ticket.idEstado === 1 &&
          ticket.idTecnico === null
        ),
    );

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[#EC2328]">
            Gestión de tickets
          </p>

          <h1 className="text-3xl font-bold text-[#1F4697]">
            Asignación de tickets
          </h1>

          <p className="mt-2 text-[#61605E]">
            Asigne técnico y prioridad a
            los incidentes nuevos para
            iniciar su atención.
          </p>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {mensaje}
          </div>
        )}

        {mensajeExito && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {mensajeExito}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1F4697]">
              Tickets pendientes de asignación
            </h2>

            <p className="mt-1 text-sm text-[#61605E]">
              Seleccione el técnico y la
              prioridad para iniciar la
              atención.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <p className="text-xs text-[#61605E]">
              Pendientes
            </p>

            <p className="text-xl font-bold text-[#EC2328]">
              {
                ticketsPendientes.length
              }
            </p>
          </div>
        </div>

        {ticketsPendientes.length ===
        0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-green-500" />

            <p className="font-semibold text-[#1F4697]">
              No hay tickets pendientes de
              asignación.
            </p>

            <p className="mt-2 text-sm text-[#61605E]">
              Todos los tickets nuevos ya
              cuentan con atención asignada.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {ticketsPendientes.map(
              (ticket) => (
                <div
                  key={ticket.idTicket}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="h-1 bg-[#EC2328]" />

                  <div className="p-6">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-[#1F4697]">
                            {ticket.codigo}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                              ticket.idEstado,
                            )}`}
                          >
                            {
                              ticket.estado
                                .nombre
                            }
                          </span>
                        </div>

                        <h4 className="mt-2 text-lg font-semibold text-slate-900">
                          {ticket.titulo}
                        </h4>

                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#61605E]">
                          {
                            ticket.descripcion
                          }
                        </p>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-lg bg-slate-50 px-4 py-3">
                            <p className="text-xs text-[#61605E]">
                              Solicitante
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {
                                ticket
                                  .solicitante
                                  .usuario
                              }
                            </p>
                          </div>

                          <div className="rounded-lg bg-slate-50 px-4 py-3">
                            <p className="text-xs text-[#61605E]">
                              Categoría
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {
                                ticket
                                  .categoria
                                  .nombre
                              }
                            </p>
                          </div>

                          <div className="rounded-lg bg-slate-50 px-4 py-3">
                            <p className="text-xs text-[#61605E]">
                              Impacto
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {
                                ticket.impacto
                              }
                            </p>
                          </div>

                          <div className="rounded-lg bg-slate-50 px-4 py-3">
                            <p className="text-xs text-[#61605E]">
                              Urgencia
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {
                                ticket.urgencia
                              }
                            </p>
                          </div>
                        </div>

                        <p className="mt-5 text-xs text-slate-400">
                          Creado:{' '}
                          {formatearFecha(
                            ticket.fechaCreacion,
                          )}
                        </p>
                      </div>

                      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 p-5 lg:w-80">
                        <div className="mb-5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#EC2328]">
                            Atención
                          </p>

                          <h4 className="mt-1 text-lg font-bold text-[#1F4697]">
                            Asignar ticket
                          </h4>
                        </div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Técnico
                        </label>

                        <select
                          value={
                            selecciones[
                              ticket.idTicket
                            ]?.idTecnico ??
                            ''
                          }
                          onChange={(
                            event,
                          ) =>
                            cambiarSeleccion(
                              ticket.idTicket,
                              'idTecnico',
                              event.target
                                .value,
                            )
                          }
                          className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            Seleccione un técnico
                          </option>

                          {tecnicos.map(
                            (tecnico) => (
                              <option
                                key={
                                  tecnico.id
                                }
                                value={
                                  tecnico.id
                                }
                              >
                                {
                                  tecnico.usuario
                                }
                              </option>
                            ),
                          )}
                        </select>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Prioridad
                        </label>

                        <select
                          value={
                            selecciones[
                              ticket.idTicket
                            ]?.idPrioridad ??
                            ''
                          }
                          onChange={(
                            event,
                          ) =>
                            cambiarSeleccion(
                              ticket.idTicket,
                              'idPrioridad',
                              event.target
                                .value,
                            )
                          }
                          className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            Seleccione una prioridad
                          </option>

                          {prioridades.map(
                            (
                              prioridad,
                            ) => (
                              <option
                                key={
                                  prioridad.idPrioridad
                                }
                                value={
                                  prioridad.idPrioridad
                                }
                              >
                                {
                                  prioridad.nombre
                                }
                              </option>
                            ),
                          )}
                        </select>

                        <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                          <p className="text-xs text-[#61605E]">
                            Estado al asignar
                          </p>

                          <p className="mt-1 font-semibold text-[#1F4697]">
                            En atención
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            asignarTicket(
                              ticket,
                            )
                          }
                          disabled={
                            procesando ===
                            ticket.idTicket
                          }
                          className="w-full rounded-lg bg-[#1F4697] px-4 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {procesando ===
                          ticket.idTicket
                            ? 'Asignando...'
                            : 'Asignar ticket'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        <div className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#1F4697]">
                Tickets gestionados
              </h2>

              <p className="mt-1 text-sm text-[#61605E]">
                Tickets que ya fueron
                asignados o atendidos.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <p className="text-xs text-[#61605E]">
                Gestionados
              </p>

              <p className="text-xl font-bold text-[#1F4697]">
                {
                  ticketsGestionados.length
                }
              </p>
            </div>
          </div>

          {ticketsGestionados.length ===
          0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-[#61605E]">
                No hay tickets gestionados.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-sm font-semibold text-[#1F4697]">
                        Código
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-[#1F4697]">
                        Título
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-[#1F4697]">
                        Técnico
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-[#1F4697]">
                        Prioridad
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-[#1F4697]">
                        Estado
                      </th>

                      <th className="px-5 py-4 text-sm font-semibold text-[#1F4697]">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ticketsGestionados.map(
                      (ticket) => (
                        <tr
                          key={
                            ticket.idTicket
                          }
                          className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                        >
                          <td className="whitespace-nowrap px-5 py-4 font-bold text-[#1F4697]">
                            {
                              ticket.codigo
                            }
                          </td>

                          <td className="min-w-[220px] px-5 py-4 font-medium text-slate-800">
                            {
                              ticket.titulo
                            }
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                            {ticket.tecnico
                              ?.usuario ??
                              'Sin asignar'}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                            {ticket.prioridad
                              ?.nombre ??
                              'Sin prioridad'}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                                ticket.idEstado,
                              )}`}
                            >
                              {
                                ticket.estado
                                  .nombre
                              }
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/tickets/${ticket.idTicket}`,
                                )
                              }
                              className="rounded-lg bg-[#1F4697] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}