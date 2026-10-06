'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import AppShell from '@/components/AppShell';

interface Perfil {
  sub: number;
  usuario: string;
  idRol: number;
  rol: string;
}

interface Prioridad {
  idPrioridad: number;
  nombre: string;
  nivel: number;
  activo: boolean;
}

export default function PrioridadesPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [prioridades, setPrioridades] =
    useState<Prioridad[]>([]);

  const [nombre, setNombre] =
    useState('');

  const [nivel, setNivel] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const [error, setError] =
    useState('');

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [
    prioridadProcesando,
    setPrioridadProcesando,
  ] = useState<number | null>(null);

  function obtenerMensajeError(
    data: unknown,
    mensajePredeterminado: string,
  ) {
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data
    ) {
      const message = (
        data as {
          message?: string | string[];
        }
      ).message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (
        typeof message === 'string'
      ) {
        return message;
      }
    }

    return mensajePredeterminado;
  }

  const cargarPrioridades =
    useCallback(
      async (
        token: string,
      ) => {
        const respuesta = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/prioridades`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

        if (
          respuesta.status === 401
        ) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');

          return false;
        }

        if (!respuesta.ok) {
          throw new Error(
            'No fue posible cargar las prioridades.',
          );
        }

        const data =
          await respuesta.json();

        setPrioridades(data);

        return true;
      },
      [router],
    );

  useEffect(() => {
    async function iniciarPagina() {
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
          throw new Error(
            'No fue posible obtener el perfil.',
          );
        }

        const dataPerfil =
          await respuestaPerfil.json();

        /*
         * Soporta tanto:
         *
         * {
         *   sub,
         *   usuario,
         *   idRol,
         *   rol
         * }
         *
         * como:
         *
         * {
         *   usuario: {
         *     sub,
         *     usuario,
         *     idRol,
         *     rol
         *   }
         * }
         */
        const perfilObtenido =
          typeof dataPerfil?.usuario ===
            'object' &&
          dataPerfil.usuario !== null
            ? dataPerfil.usuario
            : dataPerfil;

        const perfilNormalizado:
          Perfil = {
          sub: Number(
            perfilObtenido.sub,
          ),

          usuario: String(
            perfilObtenido.usuario ??
              '',
          ),

          idRol: Number(
            perfilObtenido.idRol,
          ),

          rol: String(
            perfilObtenido.rol ??
              '',
          ),
        };

        const esAdministrador =
          perfilNormalizado.idRol ===
            7 ||
          perfilNormalizado.rol.trim() ===
            'Administrador';

        if (!esAdministrador) {
          router.replace(
            '/dashboard',
          );

          return;
        }

        setPerfil(
          perfilNormalizado,
        );

        await cargarPrioridades(
          token,
        );
      } catch {
        setError(
          'No fue posible conectar con el servidor.',
        );
      } finally {
        setCargando(false);
      }
    }

    iniciarPagina();
  }, [
    router,
    cargarPrioridades,
  ]);

  async function crearPrioridad(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMensaje('');
    setError('');

    const nombreLimpio =
      nombre.trim();

    const nivelNumero =
      Number(nivel);

    if (!nombreLimpio) {
      setError(
        'Ingrese el nombre de la prioridad.',
      );

      return;
    }

    if (
      !Number.isInteger(
        nivelNumero,
      ) ||
      nivelNumero < 1
    ) {
      setError(
        'El nivel debe ser un número entero mayor o igual a 1.',
      );

      return;
    }

    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      router.replace('/');
      return;
    }

    setGuardando(true);

    try {
      const respuesta =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/prioridades`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              nombre: nombreLimpio,
              nivel: nivelNumero,
            }),
          },
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          obtenerMensajeError(
            data,
            'No fue posible crear la prioridad.',
          ),
        );

        return;
      }

      setNombre('');
      setNivel('');

      setMensaje(
        `La prioridad ${data.nombre} fue creada correctamente.`,
      );

      await cargarPrioridades(
        token,
      );
    } catch {
      setError(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(
    prioridad: Prioridad,
  ) {
    setMensaje('');
    setError('');

    const nuevoEstado =
      !prioridad.activo;

    const accion =
      nuevoEstado
        ? 'activar'
        : 'desactivar';

    const confirmado =
      window.confirm(
        `¿Está seguro de ${accion} la prioridad ${prioridad.nombre}?`,
      );

    if (!confirmado) {
      return;
    }

    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      router.replace('/');
      return;
    }

    setPrioridadProcesando(
      prioridad.idPrioridad,
    );

    try {
      const respuesta =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/prioridades/${prioridad.idPrioridad}/estado`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              activo: nuevoEstado,
            }),
          },
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          obtenerMensajeError(
            data,
            'No fue posible cambiar el estado de la prioridad.',
          ),
        );

        return;
      }

      setMensaje(
        `La prioridad ${prioridad.nombre} fue ${
          nuevoEstado
            ? 'activada'
            : 'desactivada'
        } correctamente.`,
      );

      await cargarPrioridades(
        token,
      );
    } catch {
      setError(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setPrioridadProcesando(
        null,
      );
    }
  }

  if (
    cargando ||
    !perfil
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <p className="text-sm text-[#61605E]">
          Cargando prioridades...
        </p>
      </main>
    );
  }

  const totalPrioridades =
    prioridades.length;

  const prioridadesActivas =
    prioridades.filter(
      (prioridad) =>
        prioridad.activo,
    ).length;

  const nivelMasAlto =
    prioridades.length > 0
      ? Math.max(
          ...prioridades.map(
            (prioridad) =>
              prioridad.nivel,
          ),
        )
      : 0;

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold text-red-600">
            Administración
          </p>

          <h1 className="mt-1 text-3xl font-bold text-[#1F4697]">
            Prioridades
          </h1>

          <p className="mt-2 text-sm text-[#61605E]">
            Cree y administre los
            niveles de prioridad
            utilizados para clasificar
            los incidentes.
          </p>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-[#1F4697]" />

            <p className="text-sm text-[#61605E]">
              Total de prioridades
            </p>

            <p className="mt-1 text-3xl font-bold text-[#1F4697]">
              {totalPrioridades}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-green-500" />

            <p className="text-sm text-[#61605E]">
              Prioridades activas
            </p>

            <p className="mt-1 text-3xl font-bold text-green-600">
              {prioridadesActivas}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-red-500" />

            <p className="text-sm text-[#61605E]">
              Nivel más alto
            </p>

            <p className="mt-1 text-3xl font-bold text-red-600">
              {nivelMasAlto}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 h-1 w-10 rounded-full bg-red-500" />

              <h2 className="text-xl font-bold text-[#1F4697]">
                Crear prioridad
              </h2>

              <p className="mt-1 text-sm text-[#61605E]">
                Registre un nuevo
                nivel de atención para
                los tickets.
              </p>

              <form
                onSubmit={
                  crearPrioridad
                }
                className="mt-6 space-y-5"
              >
                <div>
                  <label
                    htmlFor="nombre"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nombre
                  </label>

                  <input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={(
                      event,
                    ) =>
                      setNombre(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Ejemplo: Crítica"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="nivel"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nivel
                  </label>

                  <input
                    id="nivel"
                    type="number"
                    min="1"
                    step="1"
                    value={nivel}
                    onChange={(
                      event,
                    ) =>
                      setNivel(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Ejemplo: 5"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full rounded-lg bg-[#1F4697] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando
                    ? 'Creando...'
                    : 'Crear prioridad'}
                </button>
              </form>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#1F4697]">
                Clasificación
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#61605E]">
                El nivel permite
                establecer el grado de
                prioridad de los
                incidentes.
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F4697]">
                  Prioridades
                  registradas
                </h2>

                <p className="mt-1 text-sm text-[#61605E]">
                  Catálogo disponible
                  actualmente en el
                  sistema.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <p className="text-xs text-slate-500">
                  Registros
                </p>

                <p className="text-lg font-bold text-[#1F4697]">
                  {
                    prioridades.length
                  }
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full table-fixed">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-[10%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      ID
                    </th>

                    <th className="w-[30%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Prioridad
                    </th>

                    <th className="w-[20%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Nivel
                    </th>

                    <th className="w-[20%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                      Estado
                    </th>

                    <th className="w-[20%] px-4 py-4 text-center text-sm font-semibold text-[#1F4697]">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {prioridades.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No hay
                        prioridades
                        registradas.
                      </td>
                    </tr>
                  ) : (
                    prioridades.map(
                      (
                        prioridad,
                      ) => (
                        <tr
                          key={
                            prioridad.idPrioridad
                          }
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-[#1F4697]">
                            {
                              prioridad.idPrioridad
                            }
                          </td>

                          <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                            {
                              prioridad.nombre
                            }
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1F4697]">
                              Nivel{' '}
                              {
                                prioridad.nivel
                              }
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                prioridad.activo
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {prioridad.activo
                                ? 'Activa'
                                : 'Inactiva'}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              disabled={
                                prioridadProcesando ===
                                prioridad.idPrioridad
                              }
                              onClick={() =>
                                cambiarEstado(
                                  prioridad,
                                )
                              }
                              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                prioridad.activo
                                  ? 'border-red-300 text-red-600 hover:bg-red-50'
                                  : 'border-green-300 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {prioridadProcesando ===
                              prioridad.idPrioridad
                                ? 'Procesando...'
                                : prioridad.activo
                                  ? 'Desactivar'
                                  : 'Activar'}
                            </button>
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}