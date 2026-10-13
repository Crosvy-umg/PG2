'use client';

import {
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

  solicitante: {
    id: number;
    usuario: string;
  };

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

export default function TicketsDisponiblesPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState('');

  const [mensajeExito, setMensajeExito] =
    useState('');

  const [ticketProcesando, setTicketProcesando] =
    useState<number | null>(null);

  async function cargarTickets(
    token: string,
  ) {
    const respuestaTickets =
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets/disponibles`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

    if (
      respuestaTickets.status === 401
    ) {
      localStorage.removeItem(
        'access_token',
      );

      router.replace('/');
      return;
    }

    if (
      respuestaTickets.status === 403
    ) {
      router.replace(
        '/dashboard',
      );

      return;
    }

    if (!respuestaTickets.ok) {
      throw new Error(
        'No fue posible cargar los tickets disponibles.',
      );
    }

    const data: Ticket[] =
      await respuestaTickets.json();

    setTickets(data);
  }

  useEffect(() => {
    async function cargarDatos() {
      const token =
        localStorage.getItem(
          'access_token',
        );

      if (!token) {
        router.replace('/');
        return;
      }

      try {
        /*
         * Consultar perfil.
         */
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

        const esTecnico =
          perfilNormalizado.idRol === 2 ||
          perfilNormalizado.rol?.trim() ===
            'Técnico';

        if (!esTecnico) {
          router.replace(
            '/dashboard',
          );

          return;
        }

        setPerfil(
          perfilNormalizado,
        );

        /*
         * Consultar tickets disponibles.
         */
        await cargarTickets(
          token,
        );
      } catch {
        setMensaje(
          'No fue posible conectar con el servidor.',
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [router]);

  async function tomarTicket(
    ticket: Ticket,
  ) {
    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      router.replace('/');
      return;
    }

    const confirmar =
      window.confirm(
        `¿Desea tomar el ticket ${ticket.codigo}: ${ticket.titulo}?`,
      );

    if (!confirmar) {
      return;
    }

    setTicketProcesando(
      ticket.idTicket,
    );

    setMensaje('');
    setMensajeExito('');

    try {
      const respuesta =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticket.idTicket}/asignarme`,
          {
            method: 'PATCH',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
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
          'No tiene permisos para tomar este ticket.',
        );

        return;
      }

      if (!respuesta.ok) {
        const error =
          await respuesta.json().catch(
            () => null,
          );

        setMensaje(
          error?.message ??
            'No fue posible asignar el ticket.',
        );

        /*
         * Volvemos a consultar la lista
         * porque otro técnico pudo haber
         * tomado el ticket.
         */
        await cargarTickets(
          token,
        );

        return;
      }

      setMensajeExito(
        `El ticket ${ticket.codigo} fue asignado correctamente a su usuario.`,
      );

      /*
       * Removemos inmediatamente el
       * ticket de la lista disponible.
       */
      setTickets(
        (ticketsActuales) =>
          ticketsActuales.filter(
            (ticketActual) =>
              ticketActual.idTicket !==
              ticket.idTicket,
          ),
      );
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setTicketProcesando(
        null,
      );
    }
  }

  function formatearFecha(
    fecha: string,
  ) {
    return new Date(
      fecha,
    ).toLocaleString(
      'es-GT',
    );
  }

  function claseEstado(
    idEstado: number,
  ) {
    switch (idEstado) {
      case 1:
        return 'bg-blue-50 text-[#1F4697]';

      case 2:
        return 'bg-violet-50 text-violet-700';

      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <p className="text-[#61605E]">
          Cargando tickets disponibles...
        </p>
      </main>
    );
  }

  if (!perfil) {
    return null;
  }

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto w-full max-w-7xl min-w-0 px-6 py-8 lg:px-8">

        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[#EC2328]">
            Atención técnica
          </p>

          <h1 className="text-3xl font-bold text-[#1F4697]">
            Tickets disponibles
          </h1>

          <p className="mt-2 text-[#61605E]">
            Consulte los incidentes que aún
            no tienen técnico asignado y tome
            los que pueda atender.
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

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 h-1 w-10 rounded-full bg-[#1F4697]" />

          <p className="text-sm text-[#61605E]">
            Tickets disponibles
          </p>

          <p className="mt-1 text-3xl font-bold text-[#1F4697]">
            {tickets.length}
          </p>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">
              No hay tickets disponibles
            </h2>

            <p className="mt-2 text-sm text-[#61605E]">
              Actualmente todos los tickets
              tienen un técnico asignado.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(
              (ticket) => (
                <article
                  key={
                    ticket.idTicket
                  }
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#1F4697]">
                          {
                            ticket.codigo
                          }
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                            ticket.estado
                              .idEstado,
                          )}`}
                        >
                          {
                            ticket
                              .estado
                              .nombre
                          }
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900">
                        {
                          ticket.titulo
                        }
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-[#61605E]">
                        {
                          ticket.descripcion
                        }
                      </p>

                      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Categoría
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {
                              ticket
                                .categoria
                                ?.nombre ??
                              'Sin categoría'
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Impacto
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {
                              ticket.impacto
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Urgencia
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {
                              ticket.urgencia
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Creado
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {formatearFecha(
                              ticket.fechaCreacion,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        disabled={
                          ticketProcesando ===
                          ticket.idTicket
                        }
                        onClick={() =>
                          tomarTicket(
                            ticket,
                          )
                        }
                        className="rounded-lg bg-[#1F4697] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17366F] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {ticketProcesando ===
                        ticket.idTicket
                          ? 'Asignando...'
                          : 'Tomar ticket'}
                      </button>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}