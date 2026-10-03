'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState('');

  useEffect(() => {
    async function cargarTickets() {
      const token =
        localStorage.getItem('access_token');

      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const respuesta = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tickets/asignados`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (
          respuesta.status === 401 ||
          respuesta.status === 403
        ) {
          router.replace('/dashboard');
          return;
        }

        if (!respuesta.ok) {
          setMensaje(
            'No fue posible cargar los tickets.',
          );
          return;
        }

        const data = await respuesta.json();

        setTickets(data);
      } catch {
        setMensaje(
          'No fue posible conectar con el servidor.',
        );
      } finally {
        setCargando(false);
      }
    }

    cargarTickets();
  }, [router]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Cargando tickets...
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
              Tickets asignados
            </p>
          </div>

          <button
            onClick={() =>
              router.push('/dashboard')
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Volver
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Mis tickets asignados
          </h2>

          <p className="mt-1 text-slate-500">
            Incidentes asignados a su usuario.
          </p>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">
            {mensaje}
          </div>
        )}

        {tickets.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-500">
              No tiene tickets asignados.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Código
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Título
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Prioridad
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Estado
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Fecha
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.idTicket}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {ticket.codigo}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {ticket.titulo}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {ticket.prioridad?.nombre ??
                          'Sin prioridad'}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                          {ticket.estado.nombre}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(
                          ticket.fechaCreacion,
                        ).toLocaleString(
                          'es-GT',
                        )}
                      </td>

                      <td className="px-6 py-4">
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}