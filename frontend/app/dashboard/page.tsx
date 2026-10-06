'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import AppShell from '../../components/AppShell';

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
  idTecnico: number | null;

  estado?: {
    idEstado: number;
    nombre: string;
  };
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

        setPerfil(
          perfilNormalizado,
        );

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
              total:
                tickets.length,

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
    <AppShell perfil={perfil}>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[#EC2328]">
            Panel principal
          </p>

          <h1 className="text-3xl font-bold text-[#1F4697]">
            Bienvenido, {perfil.usuario}
          </h1>

          <p className="mt-2 text-[#61605E]">
            Consulte y gestione la información
            disponible según su rol.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-[#EC2328]" />

            <p className="text-sm font-medium text-[#61605E]">
              Usuario
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {perfil.usuario}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-[#1F4697]" />

            <p className="text-sm font-medium text-[#61605E]">
              Rol
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {perfil.rol}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-1 w-12 rounded-full bg-green-500" />

            <p className="text-sm font-medium text-[#61605E]">
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
              <h2 className="text-xl font-bold text-[#1F4697]">
                Resumen de tickets
              </h2>

              <p className="mt-1 text-sm text-[#61605E]">
                Estado general de los
                incidentes registrados en el
                sistema.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#61605E]">
                  Total de tickets
                </p>

                <p className="mt-2 text-3xl font-bold text-[#1F4697]">
                  {indicadores.total}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#61605E]">
                  Nuevos
                </p>

                <p className="mt-2 text-3xl font-bold text-[#1F4697]">
                  {indicadores.nuevos}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#61605E]">
                  En revisión
                </p>

                <p className="mt-2 text-3xl font-bold text-[#1F4697]">
                  {indicadores.enRevision}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#61605E]">
                  En atención
                </p>

                <p className="mt-2 text-3xl font-bold text-[#EC2328]">
                  {indicadores.enAtencion}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#61605E]">
                  Pendientes
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {indicadores.pendientes}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#61605E]">
                  Resueltos
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {indicadores.resueltos}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#61605E]">
                  Cerrados
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-700">
                  {indicadores.cerrados}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#61605E]">
                  Sin asignar
                </p>

                <p className="mt-2 text-3xl font-bold text-[#EC2328]">
                  {indicadores.sinAsignar}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#1F4697]">
              Accesos rápidos
            </h2>

            <p className="mt-1 text-sm text-[#61605E]">
              Opciones disponibles para su
              perfil.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {esSolicitante && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/tickets/nuevo',
                    )
                  }
                  className="rounded-lg bg-[#EC2328] px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  Crear nuevo ticket
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/tickets/mis-tickets',
                    )
                  }
                  className="rounded-lg border border-[#1F4697] bg-white px-6 py-3 font-semibold text-[#1F4697] transition hover:bg-blue-50"
                >
                  Mis tickets
                </button>
              </>
            )}

            {esTecnico && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/tickets/asignados',
                  )
                }
                className="rounded-lg bg-[#1F4697] px-6 py-3 font-semibold text-white transition hover:bg-blue-900"
              >
                Ver tickets asignados
              </button>
            )}

            {esAdministrativo && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/tickets/gestion',
                    )
                  }
                  className="rounded-lg bg-[#1F4697] px-6 py-3 font-semibold text-white transition hover:bg-blue-900"
                >
                  Gestionar tickets
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/tickets/todos',
                    )
                  }
                  className="rounded-lg border border-[#1F4697] bg-white px-6 py-3 font-semibold text-[#1F4697] transition hover:bg-blue-50"
                >
                  Todos los tickets
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/analitica',
                    )
                  }
                  className="rounded-lg border border-[#1F4697] bg-white px-6 py-3 font-semibold text-[#1F4697] transition hover:bg-blue-50"
                >
                  Ver analítica
                </button>
              </>
            )}

            {esAdministrador && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/usuarios',
                  )
                }
                className="rounded-lg border border-[#EC2328] bg-white px-6 py-3 font-semibold text-[#EC2328] transition hover:bg-red-50"
              >
                Administrar usuarios
              </button>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}