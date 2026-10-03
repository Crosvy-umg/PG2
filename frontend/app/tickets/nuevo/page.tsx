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

interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

interface TicketCreado {
  idTicket: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  impacto: string;
  urgencia: string;
  idCategoria: number;
  idEstado: number;
}

export default function NuevoTicketPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [categorias, setCategorias] =
    useState<Categoria[]>([]);

  const [titulo, setTitulo] =
    useState('');

  const [descripcion, setDescripcion] =
    useState('');

  const [impacto, setImpacto] =
    useState('');

  const [urgencia, setUrgencia] =
    useState('');

  const [idCategoria, setIdCategoria] =
    useState('');

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState('');

  const [mensajeExito, setMensajeExito] =
    useState('');

  const cargarDatos = useCallback(async () => {
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
        'Solicitante'
      ) {
        router.replace('/dashboard');
        return;
      }

      setPerfil(perfilNormalizado);

      const respuestaCategorias =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/categorias`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

      if (
        respuestaCategorias.status === 401
      ) {
        localStorage.removeItem(
          'access_token',
        );

        router.replace('/');
        return;
      }

      if (!respuestaCategorias.ok) {
        setMensaje(
          'No fue posible cargar las categorías.',
        );

        return;
      }

      const categoriasData: Categoria[] =
        await respuestaCategorias.json();

      setCategorias(
        categoriasData.filter(
          (categoria) =>
            categoria.activo,
        ),
      );
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setCargando(false);
    }
  }, [router]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  async function crearTicket(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMensaje('');
    setMensajeExito('');

    if (
      !titulo.trim() ||
      !descripcion.trim() ||
      !impacto ||
      !urgencia ||
      !idCategoria
    ) {
      setMensaje(
        'Complete todos los campos del ticket.',
      );

      return;
    }

    const token =
      localStorage.getItem('access_token');

    if (!token) {
      router.replace('/');
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            titulo: titulo.trim(),
            descripcion:
              descripcion.trim(),
            impacto,
            urgencia,
            idCategoria:
              Number(idCategoria),
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
          'No tiene permisos para crear tickets.',
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
            Array.isArray(
              errorData.message,
            )
              ? errorData.message.join(
                  ', ',
                )
              : errorData.message,
          );
        } else {
          setMensaje(
            'No fue posible crear el ticket.',
          );
        }

        return;
      }

      const ticketCreado: TicketCreado =
        await respuesta.json();

      setMensajeExito(
        `${ticketCreado.codigo} fue creado correctamente.`,
      );

      setTitulo('');
      setDescripcion('');
      setImpacto('');
      setUrgencia('');
      setIdCategoria('');

      setTimeout(() => {
        router.push(
          `/tickets/${ticketCreado.idTicket}`,
        );
      }, 1200);
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setGuardando(false);
    }
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Gestión de Incidentes TI
            </h1>

            <p className="text-sm text-slate-500">
              Crear nuevo ticket
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

      <section className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Reportar incidente
          </h2>

          <p className="mt-1 text-slate-500">
            Describa el problema para que
            pueda ser atendido por el
            Departamento de IT.
          </p>
        </div>

        <form
          onSubmit={crearTicket}
          className="rounded-xl bg-white p-7 shadow-sm"
        >
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Título
            </label>

            <input
              type="text"
              value={titulo}
              onChange={(event) =>
                setTitulo(
                  event.target.value,
                )
              }
              maxLength={150}
              placeholder="Ejemplo: Problema con impresora"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descripción
            </label>

            <textarea
              value={descripcion}
              onChange={(event) =>
                setDescripcion(
                  event.target.value,
                )
              }
              rows={5}
              placeholder="Explique detalladamente el problema que está presentando."
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Categoría
              </label>

              <select
                value={idCategoria}
                onChange={(event) =>
                  setIdCategoria(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">
                  Seleccione una categoría
                </option>

                {categorias.map(
                  (categoria) => (
                    <option
                      key={
                        categoria.idCategoria
                      }
                      value={
                        categoria.idCategoria
                      }
                    >
                      {categoria.nombre}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Impacto
              </label>

              <select
                value={impacto}
                onChange={(event) =>
                  setImpacto(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">
                  Seleccione el impacto
                </option>

                <option value="Bajo">
                  Bajo
                </option>

                <option value="Medio">
                  Medio
                </option>

                <option value="Alto">
                  Alto
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Urgencia
              </label>

              <select
                value={urgencia}
                onChange={(event) =>
                  setUrgencia(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">
                  Seleccione la urgencia
                </option>

                <option value="Baja">
                  Baja
                </option>

                <option value="Media">
                  Media
                </option>

                <option value="Alta">
                  Alta
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Estado inicial
              </label>

              <div className="rounded-lg bg-slate-100 px-4 py-3 font-medium text-slate-700">
                Nuevo
              </div>
            </div>
          </div>

          {mensaje && (
            <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {mensaje}
            </div>
          )}

          {mensajeExito && (
            <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {mensajeExito}
            </div>
          )}

          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                router.push('/dashboard')
              }
              className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {guardando
                ? 'Creando...'
                : 'Crear ticket'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}