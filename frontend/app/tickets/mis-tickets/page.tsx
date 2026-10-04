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

interface Estado {
  idEstado: number;
  nombre: string;
}

interface Categoria {
  idCategoria: number;
  nombre: string;
}

interface Prioridad {
  idPrioridad: number;
  nombre: string;
  nivel: number;
}

interface Tecnico {
  id: number;
  usuario: string;
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

  idCategoria: number;
  categoria?: Categoria;

  idPrioridad: number | null;
  prioridad?: Prioridad | null;

  idEstado: number;
  estado?: Estado;

  idTecnico: number | null;
  tecnico?: Tecnico | null;
}

export default function MisTicketsPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState('');

  const cargarDatos = useCallback(
    async () => {
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

        const esSolicitante =
          perfilNormalizado.idRol === 1 ||
          perfilNormalizado.rol?.trim() ===
            'Solicitante';

        if (!esSolicitante) {
          router.replace(
            '/dashboard',
          );

          return;
        }

        setPerfil(
          perfilNormalizado,
        );

        /*
         * 2. Consultar tickets del solicitante
         */
        const respuestaTickets =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets/mis-tickets`,
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

        if (!respuestaTickets.ok) {
          setMensaje(
            'No fue posible cargar sus tickets.',
          );

          return;
        }

        const ticketsData: Ticket[] =
          await respuestaTickets.json();

        setTickets(
          ticketsData,
        );
      } catch {
        setMensaje(
          'No fue posible conectar con el servidor.',
        );
      } finally {
        setCargando(false);
      }
    },
    [router],
  );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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

  const ticketsAbiertos =
    tickets.filter(
      (ticket) =>
        ticket.idEstado !== 6,
    ).length;

  const ticketsCerrados =
    tickets.filter(
      (ticket) =>
        ticket.idEstado === 6,
    ).length;

  const ticketsSinAsignar =
    tickets.filter(
      (ticket) =>
        ticket.idTecnico === null,
    ).length;

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* ENCABEZADO */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold text-[#EC2328]">
              Seguimiento de incidentes
            </p>

            <h1 className="text-3xl font-bold text-[#1F4697]">
              Mis tickets
            </h1>

            <p className="mt-2 text-[#61605E]">
              Consulte el estado y seguimiento
              de los incidentes que ha
              reportado.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/tickets/nuevo',
              )
            }
            className="rounded-lg bg-[#EC2328] px-5 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Crear nuevo ticket
          </button>
        </div>

        {/* MENSAJE */}
        {mensaje && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {mensaje}
          </div>
        )}

        {/* INDICADORES */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-[#1F4697]" />

            <p className="text-sm text-[#61605E]">
              Total de tickets
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
              {ticketsAbiertos}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-amber-500" />

            <p className="text-sm text-[#61605E]">
              Sin asignar
            </p>

            <p className="mt-1 text-3xl font-bold text-amber-600">
              {ticketsSinAsignar}
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
              Incidentes reportados
            </h2>

            <p className="mt-1 text-sm text-[#61605E]">
              Historial de tickets registrados
              por{' '}
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
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-[#EC2328]" />

            <p className="font-semibold text-[#1F4697]">
              No tiene tickets registrados.
            </p>

            <p className="mt-2 text-sm text-[#61605E]">
              Puede crear un nuevo ticket
              para reportar un incidente al
              Departamento de IT.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/tickets/nuevo',
                )
              }
              className="mt-5 rounded-lg bg-[#EC2328] px-5 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              Crear primer ticket
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-[8%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Código
                    </th>

                    <th className="w-[26%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Título
                    </th>

                    <th className="w-[11%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Categoría
                    </th>

                    <th className="w-[10%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Prioridad
                    </th>

                    <th className="w-[11%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Estado
                    </th>

                    <th className="w-[10%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Técnico
                    </th>

                    <th className="w-[14%] px-3 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Fecha
                    </th>

                    <th className="w-[10%] px-3 py-4 text-center text-sm font-semibold text-[#1F4697]">
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
                        <td className="px-3 py-4 align-top font-bold text-[#1F4697]">
                          {ticket.codigo}
                        </td>

                        <td className="px-3 py-4 align-top">
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

                        <td className="px-3 py-4 align-top text-sm text-slate-700">
                          <p className="truncate">
                            {ticket
                              .categoria
                              ?.nombre ??
                              'Sin categoría'}
                          </p>
                        </td>

                        <td className="px-3 py-4 align-top">
                          <span
                            className={`inline-block max-w-full truncate rounded-full px-2 py-1 text-xs font-semibold ${clasePrioridad(
                              ticket.prioridad
                                ?.nivel,
                            )}`}
                          >
                            {ticket
                              .prioridad
                              ?.nombre ??
                              'Sin prioridad'}
                          </span>
                        </td>

                        <td className="px-3 py-4 align-top">
                          <span
                            className={`inline-block max-w-full rounded-full px-2 py-1 text-xs font-semibold ${claseEstado(
                              ticket.idEstado,
                            )}`}
                          >
                            {ticket
                              .estado
                              ?.nombre ??
                              'Sin estado'}
                          </span>
                        </td>

                        <td className="px-3 py-4 align-top text-sm text-slate-700">
                          <p className="truncate">
                            {ticket
                              .tecnico
                              ?.usuario ??
                              'Sin asignar'}
                          </p>
                        </td>

                        <td className="px-3 py-4 align-top text-xs leading-5 text-[#61605E]">
                          {formatearFecha(
                            ticket.fechaCreacion,
                          )}
                        </td>

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
          </div>
        )}
      </section>
    </AppShell>
  );
}