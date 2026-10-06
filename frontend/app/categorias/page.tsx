'use client';

import {
  FormEvent,
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
}

interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export default function CategoriasPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [categorias, setCategorias] =
    useState<Categoria[]>([]);

  const [nombre, setNombre] =
    useState('');

  const [descripcion, setDescripcion] =
    useState('');

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [
    cambiandoEstado,
    setCambiandoEstado,
  ] = useState<number | null>(null);

  const [mensaje, setMensaje] =
    useState('');

  const [error, setError] =
    useState('');

  async function cargarCategorias(
    token: string,
  ) {
    const respuesta = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categorias`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    );

    if (respuesta.status === 401) {
      localStorage.removeItem(
        'access_token',
      );

      router.replace('/');
      return;
    }

    if (!respuesta.ok) {
      throw new Error(
        'No fue posible cargar las categorías.',
      );
    }

    const data: Categoria[] =
      await respuesta.json();

    setCategorias(data);
  }

  useEffect(() => {
    async function cargarDatos() {
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
         * 1. Obtener perfil
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

        const esAdministrador =
          perfilNormalizado.idRol === 7 ||
          perfilNormalizado.rol?.trim() ===
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

        /*
         * 2. Obtener categorías
         */

        await cargarCategorias(
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

    cargarDatos();
  }, [router]);

  async function crearCategoria(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMensaje('');
    setError('');

    const nombreLimpio =
      nombre.trim();

    const descripcionLimpia =
      descripcion.trim();

    if (!nombreLimpio) {
      setError(
        'Ingrese el nombre de la categoría.',
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
          `${process.env.NEXT_PUBLIC_API_URL}/categorias`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              nombre:
                nombreLimpio,

              descripcion:
                descripcionLimpia ||
                undefined,
            }),
          },
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          Array.isArray(
            data.message,
          )
            ? data.message.join(
                ', ',
              )
            : data.message ??
                'No fue posible crear la categoría.',
        );

        return;
      }

      setNombre('');
      setDescripcion('');

      setMensaje(
        `La categoría ${
          data.nombre ??
          nombreLimpio
        } fue creada correctamente.`,
      );

      await cargarCategorias(
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

  async function cambiarEstadoCategoria(
    categoria: Categoria,
  ) {
    setMensaje('');
    setError('');

    const nuevoEstado =
      !categoria.activo;

    const accion =
      nuevoEstado
        ? 'activar'
        : 'desactivar';

    const confirmado =
      window.confirm(
        `¿Está seguro de ${accion} la categoría ${categoria.nombre}?`,
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

    setCambiandoEstado(
      categoria.idCategoria,
    );

    try {
      const respuesta =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/categorias/${categoria.idCategoria}/estado`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              activo:
                nuevoEstado,
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
        setError(
          'No tiene permisos para cambiar el estado de las categorías.',
        );

        return;
      }

      const data =
        await respuesta
          .json()
          .catch(() => null);

      if (!respuesta.ok) {
        setError(
          Array.isArray(
            data?.message,
          )
            ? data.message.join(
                ', ',
              )
            : data?.message ??
                'No fue posible cambiar el estado de la categoría.',
        );

        return;
      }

      setMensaje(
        `La categoría ${categoria.nombre} fue ${
          nuevoEstado
            ? 'activada'
            : 'desactivada'
        } correctamente.`,
      );

      await cargarCategorias(
        token,
      );
    } catch {
      setError(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setCambiandoEstado(
        null,
      );
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <p className="text-[#61605E]">
          Cargando categorías...
        </p>
      </main>
    );
  }

  if (!perfil) {
    return null;
  }

  const categoriasActivas =
    categorias.filter(
      (categoria) =>
        categoria.activo,
    ).length;

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">

        {/* ENCABEZADO */}

        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[#EC2328]">
            Administración
          </p>

          <h1 className="text-3xl font-bold text-[#1F4697]">
            Categorías
          </h1>

          <p className="mt-2 text-[#61605E]">
            Cree y administre las categorías
            utilizadas para clasificar los
            incidentes.
          </p>
        </div>

        {/* MENSAJES */}

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

        {/* RESUMEN */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-[#1F4697]" />

            <p className="text-sm text-[#61605E]">
              Total de categorías
            </p>

            <p className="mt-1 text-3xl font-bold text-[#1F4697]">
              {categorias.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-green-500" />

            <p className="text-sm text-[#61605E]">
              Categorías activas
            </p>

            <p className="mt-1 text-3xl font-bold text-green-600">
              {categoriasActivas}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">

          {/* FORMULARIO */}

          <div>
            <form
              onSubmit={
                crearCategoria
              }
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5">
                <div className="mb-4 h-1 w-10 rounded-full bg-[#EC2328]" />

                <h2 className="text-xl font-bold text-[#1F4697]">
                  Crear categoría
                </h2>

                <p className="mt-1 text-sm text-[#61605E]">
                  Registre una nueva
                  clasificación para los
                  tickets.
                </p>
              </div>

              <div className="mb-4">
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
                  required
                  maxLength={100}
                  placeholder="Ejemplo: Hardware"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mb-5">
                <label
                  htmlFor="descripcion"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Descripción
                </label>

                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(
                    event,
                  ) =>
                    setDescripcion(
                      event.target
                        .value,
                    )
                  }
                  maxLength={255}
                  rows={4}
                  placeholder="Descripción de la categoría"
                  className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={
                  guardando
                }
                className="w-full rounded-lg bg-[#1F4697] px-4 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando
                  ? 'Guardando...'
                  : 'Crear categoría'}
              </button>
            </form>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-[#1F4697]">
                Clasificación
              </p>

              <p className="mt-2 text-sm leading-6 text-[#61605E]">
                Las categorías permiten
                organizar los incidentes
                según el tipo de soporte
                requerido.
              </p>
            </div>
          </div>

          {/* LISTADO */}

          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F4697]">
                  Categorías registradas
                </h2>

                <p className="mt-1 text-sm text-[#61605E]">
                  Catálogo disponible
                  actualmente en el
                  sistema.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <p className="text-xs text-[#61605E]">
                  Registros
                </p>

                <p className="text-xl font-bold text-[#1F4697]">
                  {
                    categorias.length
                  }
                </p>
              </div>
            </div>

            {categorias.length ===
            0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-green-500" />

                <p className="font-semibold text-[#1F4697]">
                  No hay categorías
                  registradas.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full table-fixed">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="w-[10%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                        ID
                      </th>

                      <th className="w-[22%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                        Categoría
                      </th>

                      <th className="w-[38%] px-4 py-4 text-left text-sm font-semibold text-[#1F4697]">
                        Descripción
                      </th>

                      <th className="w-[15%] px-4 py-4 text-center text-sm font-semibold text-[#1F4697]">
                        Estado
                      </th>

                      <th className="w-[15%] px-4 py-4 text-center text-sm font-semibold text-[#1F4697]">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {categorias.map(
                      (
                        categoria,
                      ) => (
                        <tr
                          key={
                            categoria.idCategoria
                          }
                          className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0"
                        >
                          <td className="px-4 py-4 font-semibold text-[#1F4697]">
                            {
                              categoria.idCategoria
                            }
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {
                              categoria.nombre
                            }
                          </td>

                          <td className="px-4 py-4 text-sm text-[#61605E]">
                            {categoria.descripcion ??
                              'Sin descripción'}
                          </td>

                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                categoria.activo
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {categoria.activo
                                ? 'Activa'
                                : 'Inactiva'}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              disabled={
                                cambiandoEstado ===
                                categoria.idCategoria
                              }
                              onClick={() =>
                                cambiarEstadoCategoria(
                                  categoria,
                                )
                              }
                              className={`rounded-lg border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                categoria.activo
                                  ? 'border-red-300 bg-white text-red-600 hover:bg-red-50'
                                  : 'border-green-300 bg-white text-green-700 hover:bg-green-50'
                              }`}
                            >
                              {cambiandoEstado ===
                              categoria.idCategoria
                                ? 'Procesando...'
                                : categoria.activo
                                  ? 'Desactivar'
                                  : 'Activar'}
                            </button>
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