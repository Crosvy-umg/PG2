'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Perfil {
  sub: number;
  usuario: string;
  idRol: number;
  rol: string;
  iat?: number;
  exp?: number;
}

interface Ticket {
  idTicket: number;
  codigo: string;
  titulo: string;
  idEstado: number;

  estado?: {
    idEstado: number;
    nombre: string;
  };

  idTecnico: number | null;
}

interface Indicadores {
  total: number;
  nuevos: number;
  enRevision: number;
  enAtencion: number;
  pendientes: number;
  resueltos: number;
  cerrados: number;
  sinAsignar: number;
}

export default function DashboardPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [indicadores, setIndicadores] =
    useState<Indicadores>({
      total: 0,
      nuevos: 0,
      enRevision: 0,
      enAtencion: 0,
      pendientes: 0,
      resueltos: 0,
      cerrados: 0,
      sinAsignar: 0,
    });

  useEffect(() => {
    async function cargarDashboard() {
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

        const data =
          await respuestaPerfil.json();

        const perfilNormalizado: Perfil =
          data.usuario &&
          typeof data.usuario ===
            'object'
            ? data.usuario
            : data;

        setPerfil(perfilNormalizado);

        const esSupervisor =
          perfilNormalizado.idRol === 6 ||
          perfilNormalizado.rol?.trim() ===
            'Supervisor';

        const esAdministrador =
          perfilNormalizado.idRol === 7 ||
          perfilNormalizado.rol?.trim() ===
            'Administrador';

        if (
          esSupervisor ||
          esAdministrador
        ) {
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
            respuestaTickets.status ===
            401
          ) {
            localStorage.removeItem(
              'access_token',
            );

            router.replace('/');
            return;
          }

          if (respuestaTickets.ok) {
            const tickets: Ticket[] =
              await respuestaTickets.json();

            setIndicadores({
              total: tickets.length,

              nuevos:
                tickets.filter(
                  (ticket) =>
                    ticket.idEstado === 1,
                ).length,

              enRevision:
                tickets.filter(
                  (ticket) =>
                    ticket.idEstado === 2,
                ).length,

              enAtencion:
                tickets.filter(
                  (ticket) =>
                    ticket.idEstado === 3,
                ).length,

              pendientes:
                tickets.filter(
                  (ticket) =>
                    ticket.idEstado === 4,
                ).length,

              resueltos:
                tickets.filter(
                  (ticket) =>
                    ticket.idEstado === 5,
                ).length,

              cerrados:
                tickets.filter(
                  (ticket) =>
                    ticket.idEstado === 6,
                ).length,

              sinAsignar:
                tickets.filter(
                  (ticket) =>
                    ticket.idTecnico ===
                    null,
                ).length,
            });
          }
        }
      } catch {
        localStorage.removeItem(
          'access_token',
        );

        router.replace('/');
      } finally {
        setCargando(false);
      }
    }

    cargarDashboard();
  }, [router]);

  function cerrarSesion() {
    localStorage.removeItem(
      'access_token',
    );

    router.replace('/');
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

  if (!perfil) {
    return null;
  }

  const esSolicitante =
    perfil.idRol === 1 ||
    perfil.rol?.trim() ===
      'Solicitante';

  const esTecnico =
    perfil.idRol === 2 ||
    perfil.rol?.trim() ===
      'Técnico';

  const esSupervisor =
    perfil.idRol === 6 ||
    perfil.rol?.trim() ===
      'Supervisor';

  const esAdministrador =
    perfil.idRol === 7 ||
    perfil.rol?.trim() ===
      'Administrador';

  const esAdministrativo =
    esAdministrador ||
    esSupervisor;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Gestión de Incidentes TI
            </h1>

            <p className="text-sm text-slate-500">
              Grupo Master
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-slate-900">
                {perfil.usuario}
              </p>

              <p className="text-sm text-slate-500">
                {perfil.rol}
              </p>
            </div>

            <button
              onClick={cerrarSesion}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Bienvenido, {perfil.usuario}
          </h2>

          <p className="mt-1 text-slate-500">
            Rol actual: {perfil.rol}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Usuario
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {perfil.usuario}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Rol
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {perfil.rol}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Estado
            </p>

            <p className="mt-2 text-xl font-bold text-green-600">
              Sesión activa
            </p>
          </div>
        </div>

        {esAdministrativo && (
          <div className="mt-10">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900">
                Resumen de tickets
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Estado general de los
                incidentes registrados.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Total de tickets
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {indicadores.total}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Nuevos
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {indicadores.nuevos}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  En revisión
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {indicadores.enRevision}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  En atención
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {indicadores.enAtencion}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Pendientes
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {indicadores.pendientes}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Resueltos
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {indicadores.resueltos}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Cerrados
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {indicadores.cerrados}
                </p>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Sin asignar
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {indicadores.sinAsignar}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Opciones
          </h3>

          <div className="flex flex-wrap gap-4">
            {esSolicitante && (
              <>
                <button
                  onClick={() =>
                    router.push(
                      '/tickets/nuevo',
                    )
                  }
                  className="rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800"
                >
                  Crear nuevo ticket
                </button>

                <button
                  onClick={() =>
                    router.push(
                      '/tickets/mis-tickets',
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Mis tickets
                </button>
              </>
            )}

            {esTecnico && (
              <button
                onClick={() =>
                  router.push(
                    '/tickets/asignados',
                  )
                }
                className="rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800"
              >
                Ver tickets asignados
              </button>
            )}

            {esAdministrativo && (
              <>
                <button
                  onClick={() =>
                    router.push(
                      '/tickets/gestion',
                    )
                  }
                  className="rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800"
                >
                  Gestionar tickets
                </button>

                <button
                  onClick={() =>
                    router.push(
                      '/tickets/todos',
                    )
                  }
                  className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Todos los tickets
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}