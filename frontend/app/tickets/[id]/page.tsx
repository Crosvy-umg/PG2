'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import AppShell from '../../../components/AppShell';

interface Perfil {
  sub: number;
  usuario: string;
  idRol: number;
  rol: string;
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

  resolucion: string | null;
  fechaResolucion: string | null;

  solicitante: {
    id: number;
    usuario: string;
  };

  tecnico: {
    id: number;
    usuario: string;
  } | null;

  categoria: {
    idCategoria: number;
    nombre: string;
  };

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

interface Bitacora {
  idBitacora: number;
  idTicket: number;
  idUsuario: number;
  accion: string;
  detalle: string;
  fecha: string;

  usuario: {
    id: number;
    usuario: string;
  };
}

interface Comentario {
  idComentario: number;
  idTicket: number;
  idUsuario: number;
  mensaje: string;
  fechaCreacion: string;

  usuario: {
    id: number;
    usuario: string;

    rol?: {
      idRol: number;
      nombre: string;
    };
  };
}

interface OpcionEstado {
  idEstado: number;
  nombre: string;
}

export default function DetalleTicketPage() {
  const router = useRouter();

  const params =
    useParams<{ id: string }>();

  const idTicket = params.id;

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [bitacora, setBitacora] =
    useState<Bitacora[]>([]);

  const [comentarios, setComentarios] =
    useState<Comentario[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [
    enviandoComentario,
    setEnviandoComentario,
  ] = useState(false);

  const [
    procesandoConfirmacion,
    setProcesandoConfirmacion,
  ] = useState(false);

  const [mensaje, setMensaje] =
    useState('');

  const [mensajeExito, setMensajeExito] =
    useState('');

  const [
    nuevoComentario,
    setNuevoComentario,
  ] = useState('');

  const [
    mensajeComentario,
    setMensajeComentario,
  ] = useState('');

  const [
    mensajeComentarioExito,
    setMensajeComentarioExito,
  ] = useState('');

  const [
    estadoSeleccionado,
    setEstadoSeleccionado,
  ] = useState('');

  const [
    resolucionTecnica,
    setResolucionTecnica,
  ] = useState('');

  const [
    mostrarReapertura,
    setMostrarReapertura,
  ] = useState(false);

  const [
    motivoReapertura,
    setMotivoReapertura,
  ] = useState('');

  function rutaListadoPorRol(
    perfilActual: Perfil,
  ) {
    if (
      perfilActual.idRol === 1 ||
      perfilActual.rol?.trim() ===
        'Solicitante'
    ) {
      return '/tickets/mis-tickets';
    }

    if (
      perfilActual.idRol === 2 ||
      perfilActual.rol?.trim() ===
        'Técnico'
    ) {
      return '/tickets/asignados';
    }

    if (
      perfilActual.idRol === 6 ||
      perfilActual.rol?.trim() ===
        'Supervisor'
    ) {
      return '/tickets/todos';
    }

    if (
      perfilActual.idRol === 7 ||
      perfilActual.rol?.trim() ===
        'Administrador'
    ) {
      return '/tickets/todos';
    }

    return '/dashboard';
  }

  const cargarInformacion = useCallback(
    async (mostrarCarga = true) => {
      if (mostrarCarga) {
        setCargando(true);
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
        /*
         * 1. Consultar perfil
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

        setPerfil(
          perfilNormalizado,
        );

        /*
         * 2. Consultar:
         *
         * - Ticket
         * - Bitácora
         * - Comentarios
         */
        const [
          respuestaTicket,
          respuestaBitacora,
          respuestaComentarios,
        ] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}/bitacora`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}/comentarios`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          ),
        ]);

        if (
          respuestaTicket.status === 401
        ) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');
          return;
        }

        if (
          respuestaTicket.status === 403
        ) {
          router.replace(
            rutaListadoPorRol(
              perfilNormalizado,
            ),
          );

          return;
        }

        if (!respuestaTicket.ok) {
          setMensaje(
            'No fue posible cargar el ticket.',
          );

          return;
        }

        const ticketData: Ticket =
          await respuestaTicket.json();

        setTicket(ticketData);

        if (respuestaBitacora.ok) {
          const bitacoraData: Bitacora[] =
            await respuestaBitacora.json();

          setBitacora(
            bitacoraData,
          );
        } else {
          setBitacora([]);
        }

        if (respuestaComentarios.ok) {
          const comentariosData:
            Comentario[] =
            await respuestaComentarios.json();

          setComentarios(
            comentariosData,
          );
        } else {
          setComentarios([]);
        }
      } catch {
        setMensaje(
          'No fue posible conectar con el servidor.',
        );
      } finally {
        if (mostrarCarga) {
          setCargando(false);
        }
      }
    },
    [idTicket, router],
  );

  useEffect(() => {
    cargarInformacion();
  }, [cargarInformacion]);

  function obtenerEstadosPermitidos(
    idEstadoActual: number,
  ): OpcionEstado[] {
    switch (idEstadoActual) {
      case 3:
        return [
          {
            idEstado: 4,
            nombre: 'Pendiente',
          },
          {
            idEstado: 5,
            nombre: 'Resuelto',
          },
        ];

      case 4:
        return [
          {
            idEstado: 3,
            nombre: 'En atención',
          },
          {
            idEstado: 5,
            nombre: 'Resuelto',
          },
        ];

      /*
       * Un ticket Resuelto ya no puede
       * ser cerrado directamente por
       * el técnico.
       *
       * El solicitante debe confirmar
       * la solución.
       */
      case 5:
        return [];

      default:
        return [];
    }
  }

  async function actualizarEstado() {
    if (!ticket) {
      return;
    }

    if (!estadoSeleccionado) {
      setMensaje(
        'Seleccione el nuevo estado del ticket.',
      );

      return;
    }

    const idEstadoNuevo =
      Number(estadoSeleccionado);

    /*
     * Para marcar como Resuelto,
     * el técnico debe explicar
     * qué solución aplicó.
     */
    if (
      idEstadoNuevo === 5 &&
      !resolucionTecnica.trim()
    ) {
      setMensaje(
        'Escriba la solución aplicada antes de marcar el ticket como Resuelto.',
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

    setActualizando(true);
    setMensaje('');
    setMensajeExito('');

    try {
      const body: {
        idEstado: number;
        resolucion?: string;
      } = {
        idEstado: idEstadoNuevo,
      };

      if (idEstadoNuevo === 5) {
        body.resolucion =
          resolucionTecnica.trim();
      }

      const respuesta = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}/estado`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(body),
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
          'No tiene permisos para cambiar el estado de este ticket.',
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
            'No fue posible actualizar el estado.',
          );
        }

        return;
      }

      if (idEstadoNuevo === 5) {
        setMensajeExito(
          'El ticket fue marcado como Resuelto. Ahora debe esperar la confirmación del solicitante.',
        );
      } else {
        setMensajeExito(
          'Estado actualizado correctamente.',
        );
      }

      setEstadoSeleccionado('');
      setResolucionTecnica('');

      await cargarInformacion(false);
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setActualizando(false);
    }
  }

  async function confirmarResolucion() {
    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      router.replace('/');
      return;
    }

    setProcesandoConfirmacion(true);
    setMensaje('');
    setMensajeExito('');

    try {
      const respuesta = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}/confirmar-resolucion`,
        {
          method: 'PATCH',

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

      if (respuesta.status === 403) {
        setMensaje(
          'No tiene permisos para confirmar la resolución de este ticket.',
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
            'No fue posible confirmar la resolución.',
          );
        }

        return;
      }

      setMensajeExito(
        'Solución confirmada. El ticket fue cerrado correctamente.',
      );

      setMostrarReapertura(false);
      setMotivoReapertura('');

      await cargarInformacion(false);
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setProcesandoConfirmacion(false);
    }
  }

  async function reabrirTicket() {
    const motivoLimpio =
      motivoReapertura.trim();

    if (!motivoLimpio) {
      setMensaje(
        'Indique por qué el problema continúa antes de reabrir el ticket.',
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

    setProcesandoConfirmacion(true);
    setMensaje('');
    setMensajeExito('');

    try {
      const respuesta = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}/reabrir`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            motivo: motivoLimpio,
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
          'No tiene permisos para reabrir este ticket.',
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
            'No fue posible reabrir el ticket.',
          );
        }

        return;
      }

      setMensajeExito(
        'El ticket fue reabierto y regresó a En atención.',
      );

      setMostrarReapertura(false);
      setMotivoReapertura('');

      await cargarInformacion(false);
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setProcesandoConfirmacion(false);
    }
  }

  async function crearComentario() {
    const comentarioLimpio =
      nuevoComentario.trim();

    if (!comentarioLimpio) {
      setMensajeComentario(
        'Escriba un comentario antes de enviarlo.',
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

    setEnviandoComentario(true);
    setMensajeComentario('');
    setMensajeComentarioExito('');

    try {
      const respuesta = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tickets/${idTicket}/comentarios`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            mensaje: comentarioLimpio,
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
        setMensajeComentario(
          'No tiene permisos para comentar en este ticket.',
        );

        return;
      }

      if (!respuesta.ok) {
        const errorData =
          await respuesta
            .json()
            .catch(() => null);

        if (errorData?.message) {
          setMensajeComentario(
            Array.isArray(
              errorData.message,
            )
              ? errorData.message.join(
                  ', ',
                )
              : errorData.message,
          );
        } else {
          setMensajeComentario(
            'No fue posible registrar el comentario.',
          );
        }

        return;
      }

      setNuevoComentario('');

      setMensajeComentarioExito(
        'Comentario agregado correctamente.',
      );

      await cargarInformacion(false);
    } catch {
      setMensajeComentario(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setEnviandoComentario(false);
    }
  }

  function formatearFecha(
    fecha: string,
  ) {
    return new Date(
      fecha,
    ).toLocaleString(
      'es-GT',
    );
  }

  function claseEstado(
    idEstado: number,
  ) {
    switch (idEstado) {
      case 1:
        return 'bg-blue-50 text-[#1F4697]';

      case 2:
        return 'bg-violet-50 text-violet-700';

      case 3:
        return 'bg-orange-50 text-orange-700';

      case 4:
        return 'bg-amber-50 text-amber-700';

      case 5:
        return 'bg-green-50 text-green-700';

      case 6:
        return 'bg-slate-100 text-slate-700';

      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  function clasePrioridad(
    nivel?: number,
  ) {
    switch (nivel) {
      case 1:
        return 'bg-green-50 text-green-700';

      case 2:
        return 'bg-amber-50 text-amber-700';

      case 3:
        return 'bg-red-50 text-[#EC2328]';

      case 4:
        return 'bg-red-100 text-red-800';

      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <p className="text-[#61605E]">
          Cargando información...
        </p>
      </main>
    );
  }

  if (!ticket || !perfil) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <div className="text-center">
          <p className="mb-4 text-red-600">
            {mensaje ||
              'No fue posible encontrar el ticket.'}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push('/dashboard')
            }
            className="rounded-lg bg-[#1F4697] px-4 py-2 font-semibold text-white"
          >
            Volver
          </button>
        </div>
      </main>
    );
  }

  const esTecnico =
    perfil.idRol === 2 ||
    perfil.rol?.trim() ===
      'Técnico';

  const esSolicitante =
    perfil.idRol === 1 ||
    perfil.rol?.trim() ===
      'Solicitante';

  const estadosPermitidos =
    esTecnico
      ? obtenerEstadosPermitidos(
          ticket.estado.idEstado,
        )
      : [];

  const seleccionaResuelto =
    Number(estadoSeleccionado) === 5;

  return (
    <AppShell perfil={perfil}>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* ENCABEZADO */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold text-[#EC2328]">
              Detalle del incidente
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-[#1F4697]">
                {ticket.codigo}
              </h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                  ticket.estado.idEstado,
                )}`}
              >
                {ticket.estado.nombre}
              </span>
            </div>

            <p className="mt-2 text-xl font-semibold text-slate-800">
              {ticket.titulo}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                rutaListadoPorRol(perfil),
              )
            }
            className="rounded-lg border border-[#1F4697] bg-white px-5 py-2.5 text-sm font-semibold text-[#1F4697] transition hover:bg-blue-50"
          >
            Volver al listado
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* COLUMNA PRINCIPAL */}
          <div className="space-y-6 lg:col-span-2">
            {/* INFORMACIÓN */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="h-1 bg-[#EC2328]" />

              <div className="p-6">
                <h2 className="text-xl font-bold text-[#1F4697]">
                  Información del incidente
                </h2>

                <p className="mt-4 whitespace-pre-wrap leading-6 text-slate-700">
                  {ticket.descripcion}
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs text-[#61605E]">
                      Impacto
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {ticket.impacto}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs text-[#61605E]">
                      Urgencia
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {ticket.urgencia}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs text-[#61605E]">
                      Categoría
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {ticket.categoria.nombre}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs text-[#61605E]">
                      Prioridad
                    </p>

                    <span
                      className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${clasePrioridad(
                        ticket.prioridad
                          ?.nivel,
                      )}`}
                    >
                      {ticket.prioridad
                        ?.nombre ??
                        'Sin prioridad'}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs text-[#61605E]">
                      Solicitante
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {
                        ticket.solicitante
                          .usuario
                      }
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs text-[#61605E]">
                      Técnico asignado
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {ticket.tecnico
                        ?.usuario ??
                        'Sin asignar'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SOLUCIÓN */}
            {ticket.resolucion && (
              <div className="overflow-hidden rounded-xl border border-green-200 bg-white shadow-sm">
                <div className="h-1 bg-green-500" />

                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        Solución técnica
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-[#1F4697]">
                        Solución propuesta
                      </h2>
                    </div>

                    {ticket.fechaResolucion && (
                      <p className="text-xs text-slate-400">
                        {formatearFecha(
                          ticket.fechaResolucion,
                        )}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 rounded-lg bg-green-50 px-4 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {ticket.resolucion}
                    </p>
                  </div>

                  {ticket.estado.idEstado ===
                    5 && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      El ticket se encuentra
                      pendiente de confirmación por
                      parte del solicitante.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* BITÁCORA */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-[#1F4697]">
                  Bitácora
                </h2>

                <p className="mt-1 text-sm text-[#61605E]">
                  Historial de movimientos y cambios
                  realizados sobre el ticket.
                </p>
              </div>

              {bitacora.length === 0 ? (
                <div className="rounded-lg bg-slate-50 px-5 py-8 text-center">
                  <p className="text-[#61605E]">
                    No hay movimientos registrados.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {bitacora.map(
                    (registro) => (
                      <div
                        key={
                          registro.idBitacora
                        }
                        className="border-l-4 border-[#1F4697] pl-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-bold text-slate-900">
                            {
                              registro.accion
                            }
                          </p>

                          <p className="text-xs text-slate-400">
                            {formatearFecha(
                              registro.fecha,
                            )}
                          </p>
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {
                            registro.detalle
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Realizado por:{' '}
                          {registro.usuario
                            ?.usuario ??
                            `Usuario ${registro.idUsuario}`}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* COMENTARIOS */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#1F4697]">
                    Seguimiento / Comentarios
                  </h2>

                  <p className="mt-1 text-sm text-[#61605E]">
                    Registre observaciones,
                    avances o información
                    relacionada con la atención
                    del incidente.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 px-4 py-2 text-center">
                  <p className="text-xs text-slate-500">
                    Comentarios
                  </p>

                  <p className="text-lg font-bold text-[#1F4697]">
                    {comentarios.length}
                  </p>
                </div>
              </div>

              {/* NUEVO COMENTARIO */}
              {ticket.estado.idEstado === 6 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg text-slate-600">
                      🔒
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        Ticket cerrado
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        El ticket se encuentra cerrado y
                        ya no admite nuevos comentarios.
                        Los comentarios registrados
                        anteriormente permanecen
                        disponibles para consulta.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label
                    htmlFor="comentario"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Agregar comentario
                  </label>

                  <textarea
                    id="comentario"
                    rows={4}
                    value={nuevoComentario}
                    onChange={(event) => {
                      setNuevoComentario(
                        event.target.value,
                      );

                      setMensajeComentario('');

                      setMensajeComentarioExito(
                        '',
                      );
                    }}
                    placeholder="Escriba una actualización o seguimiento del ticket..."
                    className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                  />

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={
                        crearComentario
                      }
                      disabled={
                        enviandoComentario ||
                        !nuevoComentario.trim()
                      }
                      className="rounded-lg bg-[#1F4697] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {enviandoComentario
                        ? 'Enviando...'
                        : 'Agregar comentario'}
                    </button>
                  </div>

                  {mensajeComentarioExito && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                      {
                        mensajeComentarioExito
                      }
                    </div>
                  )}

                  {mensajeComentario && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {mensajeComentario}
                    </div>
                  )}
                </div>
              )}

              {/* LISTADO */}
              <div className="mt-6">
                {comentarios.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 px-5 py-8 text-center">
                    <p className="font-semibold text-slate-700">
                      No hay comentarios todavía.
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      El seguimiento del ticket
                      aparecerá en esta sección.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comentarios.map(
                      (comentario) => (
                        <div
                          key={
                            comentario.idComentario
                          }
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#1F4697]">
                                {comentario.usuario
                                  ?.usuario
                                  ?.charAt(0)
                                  .toUpperCase() ??
                                  'U'}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {comentario
                                    .usuario
                                    ?.usuario ??
                                    `Usuario ${comentario.idUsuario}`}
                                </p>

                                {comentario
                                  .usuario
                                  ?.rol
                                  ?.nombre && (
                                  <p className="text-xs text-slate-500">
                                    {
                                      comentario
                                        .usuario
                                        .rol
                                        .nombre
                                    }
                                  </p>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-400">
                              {formatearFecha(
                                comentario.fechaCreacion,
                              )}
                            </p>
                          </div>

                          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {
                              comentario.mensaje
                            }
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-6">
            {/* FECHAS */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 h-1 w-10 rounded-full bg-[#1F4697]" />

              <h2 className="text-lg font-bold text-[#1F4697]">
                Fechas
              </h2>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-[#61605E]">
                    Creación
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatearFecha(
                      ticket.fechaCreacion,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#61605E]">
                    Última actualización
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatearFecha(
                      ticket.fechaActualizacion,
                    )}
                  </p>
                </div>

                {ticket.fechaResolucion && (
                  <div>
                    <p className="text-xs text-[#61605E]">
                      Resolución
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {formatearFecha(
                        ticket.fechaResolucion,
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-[#61605E]">
                    Cierre
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {ticket.fechaCierre
                      ? formatearFecha(
                          ticket.fechaCierre,
                        )
                      : 'Pendiente'}
                  </p>
                </div>
              </div>
            </div>

            {/* GESTIÓN */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 h-1 w-10 rounded-full bg-[#EC2328]" />

              <h2 className="text-lg font-bold text-[#1F4697]">
                Gestión del ticket
              </h2>

              <div className="mt-5">
                <p className="text-xs text-[#61605E]">
                  Estado actual
                </p>

                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${claseEstado(
                    ticket.estado.idEstado,
                  )}`}
                >
                  {ticket.estado.nombre}
                </span>
              </div>

              {/* GESTIÓN DEL TÉCNICO */}
              {esTecnico &&
              estadosPermitidos.length > 0 ? (
                <>
                  <label
                    htmlFor="estado"
                    className="mb-2 mt-6 block text-sm font-semibold text-slate-700"
                  >
                    Nuevo estado
                  </label>

                  <select
                    id="estado"
                    value={
                      estadoSeleccionado
                    }
                    onChange={(event) => {
                      const valor =
                        event.target.value;

                      setEstadoSeleccionado(
                        valor,
                      );

                      if (
                        Number(valor) !== 5
                      ) {
                        setResolucionTecnica(
                          '',
                        );
                      }

                      setMensaje('');
                      setMensajeExito('');
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Seleccione un estado
                    </option>

                    {estadosPermitidos.map(
                      (estado) => (
                        <option
                          key={
                            estado.idEstado
                          }
                          value={
                            estado.idEstado
                          }
                        >
                          {estado.nombre}
                        </option>
                      ),
                    )}
                  </select>

                  {seleccionaResuelto && (
                    <div className="mt-4">
                      <label
                        htmlFor="resolucion"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Solución aplicada
                      </label>

                      <textarea
                        id="resolucion"
                        rows={5}
                        value={
                          resolucionTecnica
                        }
                        onChange={(event) => {
                          setResolucionTecnica(
                            event.target.value,
                          );

                          setMensaje('');
                          setMensajeExito('');
                        }}
                        placeholder="Describa qué acciones se realizaron para resolver el incidente..."
                        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                      />

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Esta información será
                        presentada al solicitante
                        para que confirme si el
                        problema fue solucionado.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      actualizarEstado
                    }
                    disabled={
                      actualizando ||
                      !estadoSeleccionado ||
                      (
                        seleccionaResuelto &&
                        !resolucionTecnica.trim()
                      )
                    }
                    className="mt-4 w-full rounded-lg bg-[#1F4697] px-4 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {actualizando
                      ? 'Actualizando...'
                      : seleccionaResuelto
                        ? 'Registrar solución'
                        : 'Actualizar estado'}
                  </button>
                </>
              ) : esSolicitante &&
                ticket.estado.idEstado ===
                  5 ? (
                /*
                 * CONFIRMACIÓN DEL
                 * SOLICITANTE
                 */
                <div className="mt-6">
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-bold text-green-800">
                      Solución pendiente de confirmación
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      El técnico indicó que el
                      incidente fue solucionado.
                      Revise la solución propuesta
                      y confirme si el servicio
                      funciona correctamente.
                    </p>
                  </div>

                  <p className="mt-5 text-sm font-semibold text-slate-800">
                    ¿El problema fue solucionado?
                  </p>

                  <div className="mt-3 grid gap-3">
                    <button
                      type="button"
                      onClick={
                        confirmarResolucion
                      }
                      disabled={
                        procesandoConfirmacion
                      }
                      className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {procesandoConfirmacion
                        ? 'Procesando...'
                        : 'Sí, confirmar solución'}
                    </button>

                    {!mostrarReapertura && (
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarReapertura(
                            true,
                          );

                          setMensaje('');
                          setMensajeExito('');
                        }}
                        disabled={
                          procesandoConfirmacion
                        }
                        className="w-full rounded-lg border border-[#EC2328] bg-white px-4 py-3 text-sm font-semibold text-[#EC2328] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                      >
                        El problema continúa
                      </button>
                    )}
                  </div>

                  {mostrarReapertura && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                      <label
                        htmlFor="motivo-reapertura"
                        className="block text-sm font-semibold text-slate-800"
                      >
                        Motivo de reapertura
                      </label>

                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Explique qué problema
                        continúa presentándose.
                        Esta información será
                        enviada al técnico.
                      </p>

                      <textarea
                        id="motivo-reapertura"
                        rows={5}
                        value={
                          motivoReapertura
                        }
                        onChange={(event) => {
                          setMotivoReapertura(
                            event.target.value,
                          );

                          setMensaje('');
                        }}
                        placeholder="Ejemplo: El problema continúa al intentar ingresar nuevamente al sistema..."
                        className="mt-3 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#EC2328] focus:ring-2 focus:ring-red-100"
                      />

                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarReapertura(
                              false,
                            );

                            setMotivoReapertura(
                              '',
                            );

                            setMensaje('');
                          }}
                          disabled={
                            procesandoConfirmacion
                          }
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={
                            reabrirTicket
                          }
                          disabled={
                            procesandoConfirmacion ||
                            !motivoReapertura.trim()
                          }
                          className="flex-1 rounded-lg bg-[#EC2328] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {procesandoConfirmacion
                            ? 'Procesando...'
                            : 'Reabrir ticket'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : esTecnico ? (
                <p className="mt-5 text-sm leading-6 text-[#61605E]">
                  {ticket.estado
                    .idEstado === 6
                    ? 'El ticket se encuentra cerrado y ya no puede cambiar de estado.'
                    : ticket.estado
                          .idEstado === 5
                      ? 'El ticket se encuentra Resuelto y está pendiente de confirmación por parte del solicitante.'
                      : 'No hay cambios de estado disponibles.'}
                </p>
              ) : esSolicitante &&
                ticket.estado.idEstado ===
                  6 ? (
                <p className="mt-5 text-sm leading-6 text-[#61605E]">
                  El ticket se encuentra
                  cerrado. La solución fue
                  confirmada y el proceso de
                  atención ha finalizado.
                </p>
              ) : (
                <p className="mt-5 text-sm leading-6 text-[#61605E]">
                  El cambio de estado corresponde al
                  técnico asignado. Puede consultar el
                  seguimiento del incidente desde esta
                  pantalla.
                </p>
              )}

              {mensajeExito && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm leading-6 text-green-700">
                  {mensajeExito}
                </div>
              )}

              {mensaje && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
                  {mensaje}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}