'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

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
    useState<Record<number, SeleccionTicket>>({});

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
        localStorage.getItem('access_token');

      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const respuestaPerfil = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/perfil`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
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
          typeof dataPerfil.usuario === 'object'
            ? dataPerfil.usuario
            : dataPerfil;

        if (
          perfilNormalizado.rol !==
            'Administrador' &&
          perfilNormalizado.rol !==
            'Supervisor'
        ) {
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
                Authorization: `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/usuarios/tecnicos`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/prioridades`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
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
            (tecnico) => tecnico.activo,
          ),
        );

        setPrioridades(
          prioridadesData.sort(
            (a, b) => a.nivel - b.nivel,
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
          actual[idTicket]?.idTecnico ?? '',

        idPrioridad:
          actual[idTicket]?.idPrioridad ?? '',

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
      localStorage.getItem('access_token');

    if (!token) {
      router.replace('/');
      return;
    }

    setProcesando(ticket.idTicket);

    setMensaje('');

    setMensajeExito('');

    try {
      const respuesta = await fetch(
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

      if (respuesta.status === 401) {
        localStorage.removeItem(
          'access_token',
        );

        router.replace('/');

        return;
      }

      if (respuesta.status === 403) {
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
            Array.isArray(errorData.message)
              ? errorData.message.join(', ')
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

      setSelecciones((actual) => {
        const nuevasSelecciones = {
          ...actual,
        };

        delete nuevasSelecciones[
          ticket.idTicket
        ];

        return nuevasSelecciones;
      });

      await cargarDatos(false);
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setProcesando(null);
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Cargando tickets...
        </p>
      </main>
    );
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
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Gestión de Incidentes TI
            </h1>

            <p className="text-sm text-slate-500">
              Administración de tickets
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
                router.push('/dashboard')
              }
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Volver
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Tickets pendientes de asignación
          </h2>

          <p className="mt-1 text-slate-500">
            Seleccione el técnico y la prioridad
            para iniciar la atención.
          </p>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {mensaje}
          </div>
        )}

        {mensajeExito && (
          <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {mensajeExito}
          </div>
        )}

        {ticketsPendientes.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-slate-700">
              No hay tickets pendientes de
              asignación.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {ticketsPendientes.map(
              (ticket) => (
                <div
                  key={ticket.idTicket}
                  className="rounded-xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">
                          {ticket.codigo}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {ticket.estado.nombre}
                        </span>
                      </div>

                      <h4 className="mt-2 text-lg text-slate-800">
                        {ticket.titulo}
                      </h4>

                      <p className="mt-2 text-sm text-slate-500">
                        {ticket.descripcion}
                      </p>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs text-slate-500">
                            Solicitante
                          </p>

                          <p className="font-medium text-slate-900">
                            {
                              ticket
                                .solicitante
                                .usuario
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Categoría
                          </p>

                          <p className="font-medium text-slate-900">
                            {
                              ticket
                                .categoria
                                .nombre
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Impacto
                          </p>

                          <p className="font-medium text-slate-900">
                            {ticket.impacto}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Urgencia
                          </p>

                          <p className="font-medium text-slate-900">
                            {ticket.urgencia}
                          </p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-slate-400">
                        Creado:{' '}
                        {new Date(
                          ticket.fechaCreacion,
                        ).toLocaleString(
                          'es-GT',
                        )}
                      </p>
                    </div>

                    <div className="w-full rounded-xl bg-slate-50 p-5 lg:w-80">
                      <h4 className="mb-4 font-semibold text-slate-900">
                        Asignar atención
                      </h4>

                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Técnico
                      </label>

                      <select
                        value={
                          selecciones[
                            ticket.idTicket
                          ]?.idTecnico ?? ''
                        }
                        onChange={(event) =>
                          cambiarSeleccion(
                            ticket.idTicket,
                            'idTecnico',
                            event.target.value,
                          )
                        }
                        className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                      >
                        <option value="">
                          Seleccione un técnico
                        </option>

                        {tecnicos.map(
                          (tecnico) => (
                            <option
                              key={tecnico.id}
                              value={tecnico.id}
                            >
                              {
                                tecnico.usuario
                              }
                            </option>
                          ),
                        )}
                      </select>

                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Prioridad
                      </label>

                      <select
                        value={
                          selecciones[
                            ticket.idTicket
                          ]?.idPrioridad ??
                          ''
                        }
                        onChange={(event) =>
                          cambiarSeleccion(
                            ticket.idTicket,
                            'idPrioridad',
                            event.target.value,
                          )
                        }
                        className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
                      >
                        <option value="">
                          Seleccione una prioridad
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

                      <div className="mb-4">
                        <p className="text-sm text-slate-500">
                          Estado al asignar
                        </p>

                        <p className="font-semibold text-slate-900">
                          En atención
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          asignarTicket(ticket)
                        }
                        disabled={
                          procesando ===
                          ticket.idTicket
                        }
                        className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {procesando ===
                        ticket.idTicket
                          ? 'Asignando...'
                          : 'Asignar ticket'}
                      </button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        <div className="mt-12">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Tickets gestionados
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tickets que ya fueron asignados o
              atendidos.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            {ticketsGestionados.length ===
            0 ? (
              <p className="p-6 text-slate-500">
                No hay tickets gestionados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-sm text-slate-600">
                    <tr>
                      <th className="px-5 py-4">
                        Código
                      </th>

                      <th className="px-5 py-4">
                        Título
                      </th>

                      <th className="px-5 py-4">
                        Técnico
                      </th>

                      <th className="px-5 py-4">
                        Prioridad
                      </th>

                      <th className="px-5 py-4">
                        Estado
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
                          className="border-t border-slate-200"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {ticket.codigo}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {ticket.titulo}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {ticket.tecnico
                              ?.usuario ??
                              'Sin asignar'}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {ticket.prioridad
                              ?.nombre ??
                              'Sin prioridad'}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                              {
                                ticket.estado
                                  .nombre
                              }
                            </span>
                          </td>
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
    </main>
  );
}