'use client';

import {
  useCallback,
  useEffect,
  useMemo,
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

interface Usuario {
  id: number;
  usuario: string;
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

interface Estado {
  idEstado: number;
  nombre: string;
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

  idSolicitante: number;
  solicitante?: Usuario;

  idTecnico: number | null;
  tecnico?: Usuario | null;

  idCategoria: number;
  categoria?: Categoria;

  idPrioridad: number | null;
  prioridad?: Prioridad | null;

  idEstado: number;
  estado?: Estado;
}

export default function TodosTicketsPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState('');

  const [busqueda, setBusqueda] =
    useState('');

  const [filtroEstado, setFiltroEstado] =
    useState('');

  const [
    filtroTecnico,
    setFiltroTecnico,
  ] = useState('');

  const [
    filtroPrioridad,
    setFiltroPrioridad,
  ] = useState('');

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

        const respuestaTickets =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets`,
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
          setMensaje(
            'No tiene permisos para consultar todos los tickets.',
          );

          return;
        }

        if (!respuestaTickets.ok) {
          setMensaje(
            'No fue posible cargar los tickets.',
          );

          return;
        }

        const ticketsData: Ticket[] =
          await respuestaTickets.json();

        setTickets(ticketsData);
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

  const estados = useMemo(() => {
    const mapa = new Map<
      number,
      Estado
    >();

    tickets.forEach((ticket) => {
      if (ticket.estado) {
        mapa.set(
          ticket.estado.idEstado,
          ticket.estado,
        );
      }
    });

    return Array.from(
      mapa.values(),
    ).sort(
      (a, b) =>
        a.idEstado - b.idEstado,
    );
  }, [tickets]);

  const tecnicos = useMemo(() => {
    const mapa = new Map<
      number,
      Usuario
    >();

    tickets.forEach((ticket) => {
      if (ticket.tecnico) {
        mapa.set(
          ticket.tecnico.id,
          ticket.tecnico,
        );
      }
    });

    return Array.from(
      mapa.values(),
    ).sort((a, b) =>
      a.usuario.localeCompare(
        b.usuario,
      ),
    );
  }, [tickets]);

  const prioridades = useMemo(() => {
    const mapa = new Map<
      number,
      Prioridad
    >();

    tickets.forEach((ticket) => {
      if (ticket.prioridad) {
        mapa.set(
          ticket.prioridad.idPrioridad,
          ticket.prioridad,
        );
      }
    });

    return Array.from(
      mapa.values(),
    ).sort(
      (a, b) =>
        a.nivel - b.nivel,
    );
  }, [tickets]);

  const ticketsFiltrados = useMemo(
    () => {
      return tickets.filter(
        (ticket) => {
          const textoBusqueda =
            busqueda
              .trim()
              .toLowerCase();

          const coincideBusqueda =
            !textoBusqueda ||
            ticket.codigo
              .toLowerCase()
              .includes(
                textoBusqueda,
              ) ||
            ticket.titulo
              .toLowerCase()
              .includes(
                textoBusqueda,
              ) ||
            ticket.solicitante
              ?.usuario
              ?.toLowerCase()
              .includes(
                textoBusqueda,
              ) ||
            ticket.tecnico
              ?.usuario
              ?.toLowerCase()
              .includes(
                textoBusqueda,
              );

          const coincideEstado =
            !filtroEstado ||
            String(
              ticket.idEstado,
            ) === filtroEstado;

          const coincideTecnico =
            !filtroTecnico ||
            String(
              ticket.idTecnico,
            ) === filtroTecnico;

          const coincidePrioridad =
            !filtroPrioridad ||
            String(
              ticket.idPrioridad,
            ) ===
              filtroPrioridad;

          return (
            coincideBusqueda &&
            coincideEstado &&
            coincideTecnico &&
            coincidePrioridad
          );
        },
      );
    },
    [
      tickets,
      busqueda,
      filtroEstado,
      filtroTecnico,
      filtroPrioridad,
    ],
  );

  function limpiarFiltros() {
    setBusqueda('');
    setFiltroEstado('');
    setFiltroTecnico('');
    setFiltroPrioridad('');
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

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <p className="text-[#61605E]">
          Cargando...
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
        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[#EC2328]">
            Gestión de tickets
          </p>

          <h1 className="text-3xl font-bold text-[#1F4697]">
            Todos los tickets
          </h1>

          <p className="mt-2 text-[#61605E]">
            Consulte y filtre los incidentes
            registrados en el sistema.
          </p>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {mensaje}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1F4697]">
                Filtros de búsqueda
              </h2>

              <p className="mt-1 text-sm text-[#61605E]">
                Utilice uno o varios filtros
                para localizar incidentes.
              </p>
            </div>

            <div className="hidden h-1 w-12 rounded-full bg-[#EC2328] sm:block" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar
              </label>

              <input
                type="text"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value,
                  )
                }
                placeholder="Código, título o usuario"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Estado
              </label>

              <select
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1F4697]"
              >
                <option value="">
                  Todos
                </option>

                {estados.map(
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Técnico
              </label>

              <select
                value={filtroTecnico}
                onChange={(event) =>
                  setFiltroTecnico(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1F4697]"
              >
                <option value="">
                  Todos
                </option>

                {tecnicos.map(
                  (tecnico) => (
                    <option
                      key={tecnico.id}
                      value={tecnico.id}
                    >
                      {tecnico.usuario}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Prioridad
              </label>

              <select
                value={
                  filtroPrioridad
                }
                onChange={(event) =>
                  setFiltroPrioridad(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#1F4697]"
              >
                <option value="">
                  Todas
                </option>

                {prioridades.map(
                  (prioridad) => (
                    <option
                      key={
                        prioridad.idPrioridad
                      }
                      value={
                        prioridad.idPrioridad
                      }
                    >
                      {prioridad.nombre}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={limpiarFiltros}
                className="w-full rounded-lg border border-[#1F4697] bg-white px-4 py-2.5 text-sm font-semibold text-[#1F4697] transition hover:bg-blue-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#1F4697]">
              Incidentes registrados
            </h2>

            <p className="mt-1 text-sm text-[#61605E]">
              Mostrando{' '}
              <strong>
                {ticketsFiltrados.length}
              </strong>{' '}
              de{' '}
              <strong>
                {tickets.length}
              </strong>{' '}
              tickets
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <p className="text-xs text-[#61605E]">
              Resultados
            </p>

            <p className="text-xl font-bold text-[#1F4697]">
              {ticketsFiltrados.length}
            </p>
          </div>
        </div>

        {ticketsFiltrados.length ===
        0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="font-semibold text-[#1F4697]">
              No se encontraron tickets.
            </p>

            <p className="mt-2 text-sm text-[#61605E]">
              Cambie o elimine los filtros
              seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Código
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Título
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Solicitante
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Categoría
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Técnico
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Prioridad
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Estado
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Fecha
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ticketsFiltrados.map(
                    (ticket) => (
                      <tr
                        key={
                          ticket.idTicket
                        }
                        className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-4 font-bold text-[#1F4697]">
                          {
                            ticket.codigo
                          }
                        </td>

                        <td className="min-w-[220px] px-4 py-4 font-medium text-slate-800">
                          {
                            ticket.titulo
                          }
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {ticket
                            .solicitante
                            ?.usuario ??
                            'Sin solicitante'}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {ticket
                            .categoria
                            ?.nombre ??
                            'Sin categoría'}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {ticket
                            .tecnico
                            ?.usuario ??
                            'Sin asignar'}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                          {ticket
                            .prioridad
                            ?.nombre ??
                            'Sin prioridad'}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                              ticket.idEstado,
                            )}`}
                          >
                            {ticket.estado
                              ?.nombre ??
                              'Sin estado'}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-[#61605E]">
                          {formatearFecha(
                            ticket.fechaCreacion,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
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
      </section>
    </AppShell>
  );
}