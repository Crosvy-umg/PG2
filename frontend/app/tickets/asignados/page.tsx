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
  fechaActualizacion: string;
  fechaCierre: string | null;

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

export default function TicketsAsignadosPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState('');

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
         * 1. Consultar perfil
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
         * 2. Consultar tickets asignados
         */
        const respuestaTickets =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets/asignados`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (
          respuestaTickets.status ===
          401
        ) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');
          return;
        }

        if (
          respuestaTickets.status ===
          403
        ) {
          router.replace(
            '/dashboard',
          );

          return;
        }

        if (!respuestaTickets.ok) {
          setMensaje(
            'No fue posible cargar los tickets.',
          );

          return;
        }

        const data: Ticket[] =
          await respuestaTickets.json();

        setTickets(data);
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

  function clasePrioridad(
    nivel?: number,
  ) {
    switch (nivel) {
      case 1:
        return 'bg-green-50 text-green-700';

      case 2:
        return 'bg-amber-50 text-amber-700';

      case 3:
        return 'bg-red-50 text-[#EC2328]';

      default:
        return 'bg-slate-100 text-slate-700';
    }
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

  const ticketsActivos =
    tickets.filter(
      (ticket) =>
        ticket.estado.idEstado !== 6,
    ).length;

  const ticketsCerrados =
    tickets.filter(
      (ticket) =>
        ticket.estado.idEstado === 6,
    ).length;

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto w-full max-w-7xl min-w-0 px-6 py-8 lg:px-8">

        {/* ENCABEZADO */}
        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[#EC2328]">
            Atención técnica
          </p>

          <h1 className="text-3xl font-bold text-[#1F4697]">
            Mis tickets asignados
          </h1>

          <p className="mt-2 text-[#61605E]">
            Consulte los incidentes que han
            sido asignados a su usuario y
            gestione su atención.
          </p>
        </div>

        {/* MENSAJE DE ERROR */}
        {mensaje && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {mensaje}
          </div>
        )}

        {/* RESUMEN */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-[#1F4697]" />

            <p className="text-sm text-[#61605E]">
              Total asignados
            </p>

            <p className="mt-1 text-3xl font-bold text-[#1F4697]">
              {tickets.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-[#EC2328]" />

            <p className="text-sm text-[#61605E]">
              En seguimiento
            </p>

            <p className="mt-1 text-3xl font-bold text-[#EC2328]">
              {ticketsActivos}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-green-500" />

            <p className="text-sm text-[#61605E]">
              Cerrados
            </p>

            <p className="mt-1 text-3xl font-bold text-green-600">
              {ticketsCerrados}
            </p>
          </div>
        </div>

        {/* LISTADO */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1F4697]">
              Incidentes asignados
            </h2>

            <p className="mt-1 text-sm text-[#61605E]">
              Tickets asignados al técnico{' '}
              <strong>
                {perfil.usuario}
              </strong>.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <p className="text-xs text-[#61605E]">
              Registros
            </p>

            <p className="text-xl font-bold text-[#1F4697]">
              {tickets.length}
            </p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-[#1F4697]" />

            <p className="font-semibold text-[#1F4697]">
              No tiene tickets asignados.
            </p>

            <p className="mt-2 text-sm text-[#61605E]">
              Cuando un Administrador o
              Supervisor le asigne un incidente,
              aparecerá en este listado.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full table-fixed">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="w-[9%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                    Código
                  </th>

                  <th className="w-[36%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                    Título
                  </th>

                  <th className="w-[12%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                    Prioridad
                  </th>

                  <th className="w-[13%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                    Estado
                  </th>

                  <th className="w-[18%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                    Fecha
                  </th>

                  <th className="w-[12%] px-3 py-4 text-center text-sm font-semibold text-[#1F4697]">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {tickets.map(
                  (ticket) => (
                    <tr
                      key={
                        ticket.idTicket
                      }
                      className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                    >
                      {/* CÓDIGO */}
                      <td className="px-3 py-4 align-top font-bold text-[#1F4697]">
                        {ticket.codigo}
                      </td>

                      {/* TÍTULO */}
                      <td className="min-w-0 px-3 py-4 align-top">
                        <p
                          className="truncate font-semibold text-slate-900"
                          title={
                            ticket.titulo
                          }
                        >
                          {ticket.titulo}
                        </p>

                        <p
                          className="mt-1 truncate text-xs text-[#61605E]"
                          title={
                            ticket.descripcion
                          }
                        >
                          {
                            ticket.descripcion
                          }
                        </p>
                      </td>

                      {/* PRIORIDAD */}
                      <td className="px-3 py-4 align-top">
                        <span
                          className={`inline-block max-w-full truncate rounded-full px-2 py-1 text-xs font-semibold ${clasePrioridad(
                            ticket.prioridad
                              ?.nivel,
                          )}`}
                        >
                          {ticket.prioridad
                            ?.nombre ??
                            'Sin prioridad'}
                        </span>
                      </td>

                      {/* ESTADO */}
                      <td className="px-3 py-4 align-top">
                        <span
                          className={`inline-block max-w-full rounded-full px-2 py-1 text-xs font-semibold ${claseEstado(
                            ticket.estado
                              .idEstado,
                          )}`}
                        >
                          {
                            ticket.estado
                              .nombre
                          }
                        </span>
                      </td>

                      {/* FECHA */}
                      <td className="px-3 py-4 align-top text-xs leading-5 text-[#61605E]">
                        {formatearFecha(
                          ticket.fechaCreacion,
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td className="px-3 py-4 text-center align-top">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/tickets/${ticket.idTicket}`,
                            )
                          }
                          className="rounded-lg bg-[#1F4697] px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-900"
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
        )}
      </section>
    </AppShell>
  );
}