'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import AppShell from '../../../components/AppShell';

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

        const esSolicitante =
          perfilNormalizado.idRol === 1 ||
          perfilNormalizado.rol?.trim() ===
            'Solicitante';

        if (!esSolicitante) {
          router.replace('/dashboard');
          return;
        }

        setPerfil(
          perfilNormalizado,
        );

        /*
         * 2. Obtener únicamente
         * categorías activas
         */

        const respuestaCategorias =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/categorias/activas`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (
          respuestaCategorias.status ===
          401
        ) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');
          return;
        }

        if (!respuestaCategorias.ok) {
          setMensaje(
            'No fue posible cargar las categorías activas.',
          );

          return;
        }

        const categoriasData: Categoria[] =
          await respuestaCategorias.json();

        setCategorias(
          categoriasData,
        );
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
      localStorage.getItem(
        'access_token',
      );

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

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto max-w-5xl px-6 py-8 lg:px-8">

        {/* ENCABEZADO */}

        <div className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[#EC2328]">
            Registro de incidentes
          </p>

          <h1 className="text-3xl font-bold text-[#1F4697]">
            Crear nuevo ticket
          </h1>

          <p className="mt-2 text-[#61605E]">
            Reporte un problema tecnológico para que
            pueda ser atendido por el Departamento de IT.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

          {/* FORMULARIO */}

          <form
            onSubmit={crearTicket}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="h-1 bg-[#EC2328]" />

            <div className="p-7">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#1F4697]">
                  Información del incidente
                </h2>

                <p className="mt-1 text-sm text-[#61605E]">
                  Complete la información necesaria para
                  registrar el ticket.
                </p>
              </div>

              {/* TÍTULO */}

              <div className="mb-5">
                <label
                  htmlFor="titulo"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Título
                </label>

                <input
                  id="titulo"
                  type="text"
                  value={titulo}
                  onChange={(event) =>
                    setTitulo(
                      event.target.value,
                    )
                  }
                  maxLength={150}
                  placeholder="Ejemplo: Problema con impresora"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* DESCRIPCIÓN */}

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
                  onChange={(event) =>
                    setDescripcion(
                      event.target.value,
                    )
                  }
                  rows={5}
                  placeholder="Explique detalladamente el problema que está presentando."
                  className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                {/* CATEGORÍA */}

                <div>
                  <label
                    htmlFor="categoria"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Categoría
                  </label>

                  <select
                    id="categoria"
                    value={idCategoria}
                    onChange={(event) =>
                      setIdCategoria(
                        event.target.value,
                      )
                    }
                    disabled={
                      categorias.length === 0
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">
                      {categorias.length === 0
                        ? 'No hay categorías activas'
                        : 'Seleccione una categoría'}
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

                {/* IMPACTO */}

                <div>
                  <label
                    htmlFor="impacto"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Impacto
                  </label>

                  <select
                    id="impacto"
                    value={impacto}
                    onChange={(event) =>
                      setImpacto(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
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

                {/* URGENCIA */}

                <div>
                  <label
                    htmlFor="urgencia"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Urgencia
                  </label>

                  <select
                    id="urgencia"
                    value={urgencia}
                    onChange={(event) =>
                      setUrgencia(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
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

                {/* ESTADO INICIAL */}

                <div>
                  <p className="mb-2 block text-sm font-semibold text-slate-700">
                    Estado inicial
                  </p>

                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 font-semibold text-[#1F4697]">
                    Nuevo
                  </div>
                </div>
              </div>

              {/* ERROR */}

              {mensaje && (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {mensaje}
                </div>
              )}

              {/* ÉXITO */}

              {mensajeExito && (
                <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {mensajeExito}
                </div>
              )}

              {/* BOTONES */}

              <div className="mt-7 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/tickets/mis-tickets',
                    )
                  }
                  className="rounded-lg border border-[#1F4697] bg-white px-5 py-3 font-semibold text-[#1F4697] transition hover:bg-blue-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando ||
                    categorias.length === 0
                  }
                  className="rounded-lg bg-[#EC2328] px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {guardando
                    ? 'Creando...'
                    : 'Crear ticket'}
                </button>
              </div>
            </div>
          </form>

          {/* INFORMACIÓN LATERAL */}

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 h-1 w-10 rounded-full bg-[#1F4697]" />

              <h3 className="font-bold text-[#1F4697]">
                Antes de enviar
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#61605E]">
                Describa claramente el problema y seleccione
                la categoría, impacto y urgencia que mejor
                correspondan.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 h-1 w-10 rounded-full bg-[#EC2328]" />

              <h3 className="font-bold text-[#1F4697]">
                Flujo inicial
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#61605E]">
                El ticket será registrado en estado
                <strong> Nuevo</strong>. Posteriormente un
                Administrador o Supervisor podrá asignar
                técnico y prioridad.
              </p>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}