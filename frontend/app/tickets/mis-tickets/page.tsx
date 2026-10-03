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

        if (
          perfilNormalizado.idRol !== 1 &&
          perfilNormalizado.rol?.trim() !==
            'Solicitante'
        ) {
          router.replace(
            '/dashboard',
          );

          return;
        }

        setPerfil(
          perfilNormalizado,
        );

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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Gestión de Incidentes TI
            </h1>

            <p className="text-sm text-slate-500">
              Mis tickets
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

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Mis tickets
            </h2>

            <p className="mt-1 text-slate-500">
              Consulte el estado y seguimiento de sus incidentes.
            </p>
          </div>

          <button
            onClick={() =>
              router.push(
                '/tickets/nuevo',
              )
            }
            className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Crear nuevo ticket
          </button>
        </div>

        {mensaje && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {mensaje}
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="rounded-xl bg-white px-6 py-12 text-center shadow-sm">
            <p className="font-medium text-slate-700">
              No tiene tickets registrados.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Puede crear un nuevo ticket para reportar un incidente.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                      Código
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                      Título
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                      Categoría
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                      Prioridad
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                      Estado
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                      Técnico
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                      Fecha
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
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
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {
                            ticket.codigo
                          }
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {
                            ticket.titulo
                          }
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {ticket
                            .categoria
                            ?.nombre ??
                            'Sin categoría'}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {ticket
                            .prioridad
                            ?.nombre ??
                            'Sin prioridad'}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {ticket.estado
                              ?.nombre ??
                              'Sin estado'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {ticket
                            .tecnico
                            ?.usuario ??
                            'Sin asignar'}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatearFecha(
                            ticket.fechaCreacion,
                          )}
                        </td>

                        <td className="px-5 py-4">
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