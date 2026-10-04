'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

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

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Cargando...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Gestión de Incidentes TI
            </h1>

            <p className="text-sm text-slate-500">
              Todos los tickets
            </p>
          </div>

          <div className="flex items-center gap-4">
            {perfil && (
              <div className="text-right">
                <p className="font-medium text-slate-900">
                  {perfil.usuario}
                </p>

                <p className="text-sm text-slate-500">
                  {perfil.rol}
                </p>
              </div>
            )}

            <button
              onClick={() =>
                router.push(
                  '/dashboard',
                )
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Volver
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Todos los tickets
          </h2>

          <p className="mt-1 text-slate-500">
            Consulte y filtre los
            incidentes registrados en el
            sistema.
          </p>
        </div>

        <div className="mb-6 grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Estado
            </label>

            <select
              value={filtroEstado}
              onChange={(event) =>
                setFiltroEstado(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Técnico
            </label>

            <select
              value={filtroTecnico}
              onChange={(event) =>
                setFiltroTecnico(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
            <label className="mb-2 block text-sm font-medium text-slate-700">
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
                    {
                      prioridad.nombre
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Mostrando{' '}
            <strong>
              {
                ticketsFiltrados.length
              }
            </strong>{' '}
            de{' '}
            <strong>
              {tickets.length}
            </strong>{' '}
            tickets
          </p>
        </div>

        {mensaje && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {mensaje}
          </div>
        )}

        {ticketsFiltrados.length ===
        0 ? (
          <div className="rounded-xl bg-white px-6 py-12 text-center shadow-sm">
            <p className="font-medium text-slate-700">
              No se encontraron tickets.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Cambie o elimine los filtros
              seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Código
                    </th>

                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Título
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Solicitante
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Categoría
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Técnico
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Prioridad
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Estado
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700">
                      Fecha
                    </th>

                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700">
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
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                          {
                            ticket.codigo
                          }
                        </td>

                        <td className="min-w-[220px] px-4 py-4 text-slate-700">
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
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {ticket.estado
                              ?.nombre ??
                              'Sin estado'}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                          {formatearFecha(
                            ticket.fechaCreacion,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <button
                            onClick={() =>
                              router.push(
                                `/tickets/${ticket.idTicket}`,
                              )
                            }
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
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
    </main>
  );
}