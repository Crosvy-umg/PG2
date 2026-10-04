'use client';

import {
  FormEvent,
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

interface Rol {
  idRol: number;
  nombre: string;
}

interface Usuario {
  id: number;
  usuario: string;
  activo: boolean;
  idRol: number;
  fechaCreacion?: string;
  rol?: Rol;
}

interface NuevoUsuario {
  usuario: string;
  contrasenia: string;
  idRol: number;
}

const nombresRoles: Record<number, string> = {
  1: 'Solicitante',
  2: 'Técnico',
  6: 'Supervisor',
  7: 'Administrador',
};

export default function UsuariosPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [cambiandoEstado, setCambiandoEstado] =
    useState<number | null>(null);

  const [mensaje, setMensaje] =
    useState('');

  const [error, setError] =
    useState('');

  const [formulario, setFormulario] =
    useState<NuevoUsuario>({
      usuario: '',
      contrasenia: '',
      idRol: 1,
    });

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

        const esAdministrador =
          perfilNormalizado.idRol === 7 ||
          perfilNormalizado.rol?.trim() ===
            'Administrador';

        if (!esAdministrador) {
          router.replace('/dashboard');
          return;
        }

        setPerfil(perfilNormalizado);

        const respuestaUsuarios =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/usuarios`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (
          respuestaUsuarios.status ===
          401
        ) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');
          return;
        }

        if (
          respuestaUsuarios.status ===
          403
        ) {
          router.replace('/dashboard');
          return;
        }

        if (!respuestaUsuarios.ok) {
          setError(
            'No fue posible cargar los usuarios.',
          );
          return;
        }

        const usuariosData: Usuario[] =
          await respuestaUsuarios.json();

        setUsuarios(usuariosData);
      } catch {
        setError(
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

  async function crearUsuario(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMensaje('');
    setError('');

    const usuarioLimpio =
      formulario.usuario.trim();

    if (!usuarioLimpio) {
      setError(
        'Debe ingresar un nombre de usuario.',
      );
      return;
    }

    if (
      formulario.contrasenia.length < 6
    ) {
      setError(
        'La contraseña debe tener al menos 6 caracteres.',
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

    try {
      setGuardando(true);

      const respuesta =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/usuarios`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              usuario:
                usuarioLimpio,

              contrasenia:
                formulario.contrasenia,

              idRol:
                formulario.idRol,
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
          'No tiene permisos para crear usuarios.',
        );
        return;
      }

      if (!respuesta.ok) {
        const dataError =
          await respuesta.json();

        const mensajeError =
          Array.isArray(
            dataError.message,
          )
            ? dataError.message.join(
                ', ',
              )
            : dataError.message;

        setError(
          mensajeError ||
            'No fue posible crear el usuario.',
        );

        return;
      }

      setMensaje(
        `El usuario ${usuarioLimpio} fue creado correctamente.`,
      );

      setFormulario({
        usuario: '',
        contrasenia: '',
        idRol: 1,
      });

      await cargarDatos();
    } catch {
      setError(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoUsuario(
    usuario: Usuario,
  ) {
    setMensaje('');
    setError('');

    if (
      perfil &&
      usuario.id === perfil.sub &&
      usuario.activo
    ) {
      setError(
        'No puede desactivar su propia cuenta.',
      );
      return;
    }

    const nuevoEstado =
      !usuario.activo;

    const accion =
      nuevoEstado
        ? 'activar'
        : 'desactivar';

    const confirmado =
      window.confirm(
        `¿Está seguro de ${accion} al usuario ${usuario.usuario}?`,
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

    try {
      setCambiandoEstado(
        usuario.id,
      );

      const respuesta =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/usuarios/${usuario.id}/estado`,
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

      if (respuesta.status === 401) {
        localStorage.removeItem(
          'access_token',
        );

        router.replace('/');
        return;
      }

      if (respuesta.status === 403) {
        setError(
          'No tiene permisos para cambiar el estado de usuarios.',
        );
        return;
      }

      if (!respuesta.ok) {
        const dataError =
          await respuesta.json();

        const mensajeError =
          Array.isArray(
            dataError.message,
          )
            ? dataError.message.join(
                ', ',
              )
            : dataError.message;

        setError(
          mensajeError ||
            'No fue posible cambiar el estado del usuario.',
        );

        return;
      }

      setMensaje(
        nuevoEstado
          ? `El usuario ${usuario.usuario} fue activado correctamente.`
          : `El usuario ${usuario.usuario} fue desactivado correctamente.`,
      );

      await cargarDatos();
    } catch {
      setError(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setCambiandoEstado(null);
    }
  }

  function nombreRol(
    usuario: Usuario,
  ) {
    return (
      usuario.rol?.nombre ??
      nombresRoles[usuario.idRol] ??
      `Rol ${usuario.idRol}`
    );
  }

  function formatearFecha(
    fecha?: string,
  ) {
    if (!fecha) {
      return '-';
    }

    return new Date(
      fecha,
    ).toLocaleString('es-GT');
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
              Administración de usuarios
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
            Usuarios
          </h2>

          <p className="mt-1 text-slate-500">
            Cree usuarios y administre las
            cuentas registradas en el
            sistema.
          </p>
        </div>

        {mensaje && (
          <div className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div>
            <form
              onSubmit={crearUsuario}
              autoComplete="off"
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-slate-900">
                Crear usuario
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Ingrese los datos de la
                nueva cuenta.
              </p>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Usuario
                </label>

                <input
                  type="text"
                  name="nuevo-usuario"
                  autoComplete="off"
                  value={
                    formulario.usuario
                  }
                  onChange={(event) =>
                    setFormulario({
                      ...formulario,

                      usuario:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Ejemplo: tecnico2"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Contraseña
                </label>

                <input
                  type="password"
                  name="nueva-contrasenia"
                  autoComplete="new-password"
                  value={
                    formulario.contrasenia
                  }
                  onChange={(event) =>
                    setFormulario({
                      ...formulario,

                      contrasenia:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-slate-500"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Rol
                </label>

                <select
                  value={
                    formulario.idRol
                  }
                  onChange={(event) =>
                    setFormulario({
                      ...formulario,

                      idRol: Number(
                        event.target
                          .value,
                      ),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"
                >
                  <option value={1}>
                    Solicitante
                  </option>

                  <option value={2}>
                    Técnico
                  </option>

                  <option value={6}>
                    Supervisor
                  </option>

                  <option value={7}>
                    Administrador
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {guardando
                  ? 'Creando...'
                  : 'Crear usuario'}
              </button>
            </form>
          </div>

          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Usuarios registrados
              </h3>

              <p className="text-sm text-slate-500">
                Total:{' '}
                {usuarios.length}
              </p>
            </div>

            {usuarios.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="text-slate-600">
                  No hay usuarios
                  registrados.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold text-slate-700">
                          ID
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                          Usuario
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                          Rol
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                          Estado
                        </th>

                        <th className="whitespace-nowrap px-5 py-4 text-left text-sm font-semibold text-slate-700">
                          Fecha de creación
                        </th>

                        <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {usuarios.map(
                        (usuario) => {
                          const esCuentaActual =
                            perfil?.sub ===
                            usuario.id;

                          return (
                            <tr
                              key={
                                usuario.id
                              }
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="px-5 py-4 font-medium text-slate-700">
                                {
                                  usuario.id
                                }
                              </td>

                              <td className="px-5 py-4 font-semibold text-slate-900">
                                {
                                  usuario.usuario
                                }

                                {esCuentaActual && (
                                  <span className="ml-2 text-xs font-normal text-slate-400">
                                    (usted)
                                  </span>
                                )}
                              </td>

                              <td className="px-5 py-4 text-slate-700">
                                {nombreRol(
                                  usuario,
                                )}
                              </td>

                              <td className="px-5 py-4">
                                {usuario.activo ? (
                                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                    Activo
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                    Inactivo
                                  </span>
                                )}
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                {formatearFecha(
                                  usuario.fechaCreacion,
                                )}
                              </td>

                              <td className="px-5 py-4">
                                {esCuentaActual &&
                                usuario.activo ? (
                                  <span className="text-xs text-slate-400">
                                    Cuenta actual
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={
                                      cambiandoEstado ===
                                      usuario.id
                                    }
                                    onClick={() =>
                                      cambiarEstadoUsuario(
                                        usuario,
                                      )
                                    }
                                    className={
                                      usuario.activo
                                        ? 'rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
                                        : 'rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50'
                                    }
                                  >
                                    {cambiandoEstado ===
                                    usuario.id
                                      ? 'Procesando...'
                                      : usuario.activo
                                        ? 'Desactivar'
                                        : 'Activar'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}