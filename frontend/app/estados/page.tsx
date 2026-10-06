'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import AppShell from '../../components/AppShell';

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

const descripcionEstados: Record<
  string,
  string
> = {
  Nuevo:
    'Ticket recién registrado y pendiente de asignación.',

  'En revisión':
    'El incidente está siendo revisado antes de iniciar su atención.',

  'En atención':
    'El ticket ya fue asignado y está siendo atendido por un técnico.',

  Pendiente:
    'La atención se encuentra temporalmente en espera.',

  Resuelto:
    'El incidente fue solucionado y está pendiente de cierre.',

  Cerrado:
    'El proceso de atención del ticket ha finalizado.',
};

function obtenerDescripcion(
  nombre: string,
) {
  return (
    descripcionEstados[nombre] ??
    'Estado utilizado dentro del flujo de atención de tickets.'
  );
}

function obtenerColorEstado(
  nombre: string,
) {
  switch (nombre) {
    case 'Nuevo':
      return 'bg-blue-50 text-blue-700';

    case 'En revisión':
      return 'bg-violet-50 text-violet-700';

    case 'En atención':
      return 'bg-orange-50 text-orange-700';

    case 'Pendiente':
      return 'bg-amber-50 text-amber-700';

    case 'Resuelto':
      return 'bg-emerald-50 text-emerald-700';

    case 'Cerrado':
      return 'bg-slate-100 text-slate-700';

    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function EstadosPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [estados, setEstados] =
    useState<Estado[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [mensaje, setMensaje] =
    useState('');

  useEffect(() => {
    async function cargarPagina() {
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
         * Perfil del usuario
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

        if (
          respuestaPerfil.status ===
            401 ||
          respuestaPerfil.status ===
            403
        ) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');
          return;
        }

        if (!respuestaPerfil.ok) {
          setMensaje(
            'No fue posible obtener la información del usuario.',
          );
          return;
        }

        const dataPerfil =
          await respuestaPerfil.json();

        /*
         * Compatibilidad por si el backend
         * devuelve directamente el payload
         * o lo incluye dentro de una propiedad.
         */
        const perfilObtenido: Perfil = {
          sub:
            dataPerfil.sub ??
            dataPerfil.usuario?.sub,

          usuario:
            typeof dataPerfil.usuario ===
            'string'
              ? dataPerfil.usuario
              : dataPerfil.usuario
                  ?.usuario ??
                dataPerfil.user
                  ?.usuario ??
                '',

          idRol:
            dataPerfil.idRol ??
            dataPerfil.usuario
              ?.idRol ??
            dataPerfil.user?.idRol,

          rol:
            typeof dataPerfil.rol ===
            'string'
              ? dataPerfil.rol
              : dataPerfil.rol?.nombre ??
                dataPerfil.usuario
                  ?.rol ??
                dataPerfil.user
                  ?.rol ??
                '',
        };

        /*
         * Solo Administrador
         */
        const esAdministrador =
          perfilObtenido.idRol === 7 ||
          perfilObtenido.rol?.trim() ===
            'Administrador';

        if (!esAdministrador) {
          router.replace(
            '/dashboard',
          );
          return;
        }

        setPerfil(perfilObtenido);

        /*
         * Catálogo de estados
         */
        const respuestaEstados =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/estados`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!respuestaEstados.ok) {
          setMensaje(
            'No fue posible cargar los estados.',
          );
          return;
        }

        const dataEstados =
          await respuestaEstados.json();

        setEstados(
          Array.isArray(dataEstados)
            ? dataEstados
            : [],
        );
      } catch {
        setMensaje(
          'No fue posible conectar con el servidor.',
        );
      } finally {
        setCargando(false);
      }
    }

    cargarPagina();
  }, [router]);

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <p className="text-sm text-[#61605E]">
          Cargando estados...
        </p>
      </main>
    );
  }

  if (!perfil) {
    return null;
  }

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto w-full max-w-6xl px-6 py-8">
        {/* Encabezado */}
        <div className="mb-7">
          <p className="text-sm font-semibold text-red-600">
            Administración
          </p>

          <h1 className="mt-1 text-3xl font-bold text-[#1F4697]">
            Estados
          </h1>

          <p className="mt-2 text-sm text-[#61605E]">
            Consulte los estados que
            forman parte del flujo de
            atención de los tickets.
          </p>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {mensaje}
          </div>
        )}

        {/* Indicadores */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-[#1F4697]" />

            <p className="text-sm text-[#61605E]">
              Total de estados
            </p>

            <p className="mt-1 text-3xl font-bold text-[#1F4697]">
              {estados.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-green-500" />

            <p className="text-sm text-[#61605E]">
              Flujo configurado
            </p>

            <p className="mt-1 text-3xl font-bold text-green-600">
              {estados.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Información */}
          <div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 h-1 w-10 rounded-full bg-red-500" />

              <h2 className="text-lg font-bold text-[#1F4697]">
                Flujo de atención
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#61605E]">
                Los estados representan
                las diferentes etapas por
                las que puede pasar un
                incidente desde su
                creación hasta su cierre.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-[#1F4697]">
                Importante
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#61605E]">
                Este catálogo forma parte
                de la lógica interna del
                sistema. Los estados
                actuales no deben
                eliminarse ni cambiarse
                libremente porque están
                asociados al flujo de los
                tickets.
              </p>
            </div>
          </div>

          {/* Tabla */}
          <div>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1F4697]">
                  Estados registrados
                </h2>

                <p className="mt-1 text-sm text-[#61605E]">
                  Estados utilizados
                  actualmente en el
                  proceso de atención.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <p className="text-xs text-slate-500">
                  Registros
                </p>

                <p className="text-lg font-bold text-[#1F4697]">
                  {estados.length}
                </p>
              </div>
            </div>

            {estados.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-red-500" />

                <p className="font-semibold text-[#1F4697]">
                  No hay estados
                  registrados.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full table-fixed">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="w-[12%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                        ID
                      </th>

                      <th className="w-[24%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                        Estado
                      </th>

                      <th className="w-[46%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                        Descripción
                      </th>

                      <th className="w-[18%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                        Flujo
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {estados.map(
                      (estado) => (
                        <tr
                          key={
                            estado.idEstado
                          }
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-[#1F4697]">
                            {
                              estado.idEstado
                            }
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${obtenerColorEstado(
                                estado.nombre,
                              )}`}
                            >
                              {
                                estado.nombre
                              }
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm leading-5 text-[#61605E]">
                            {obtenerDescripcion(
                              estado.nombre,
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              Configurado
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
    </AppShell>
  );
}