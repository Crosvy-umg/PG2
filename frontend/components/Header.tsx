'use client';

import Image from 'next/image';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

interface HeaderProps {
  usuario: string;
  rol: string;
  onCerrarSesion: () => void;
}

interface Notificacion {
  idNotificacion: number;
  idUsuario: number;
  idTicket: number | null;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3000';

export default function Header({
  usuario,
  rol,
  onCerrarSesion,
}: HeaderProps) {
  const router = useRouter();

  const contenedorNotificaciones =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [
    notificaciones,
    setNotificaciones,
  ] = useState<Notificacion[]>([]);

  const [
    mostrarNotificaciones,
    setMostrarNotificaciones,
  ] = useState(false);

  const [
    cargandoNotificaciones,
    setCargandoNotificaciones,
  ] = useState(false);

  const [
    errorNotificaciones,
    setErrorNotificaciones,
  ] = useState('');

  const noLeidas =
    notificaciones.filter(
      (notificacion) =>
        !notificacion.leida,
    ).length;

  async function cargarNotificaciones() {
    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      return;
    }

    try {
      setCargandoNotificaciones(
        true,
      );

      setErrorNotificaciones('');

      const respuesta = await fetch(
        `${API_URL}/notificaciones/mis-notificaciones`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          cache: 'no-store',
        },
      );

      if (!respuesta.ok) {
        throw new Error(
          'No fue posible cargar las notificaciones',
        );
      }

      const datos:
        Notificacion[] =
        await respuesta.json();

      setNotificaciones(datos);
    } catch {
      setErrorNotificaciones(
        'No fue posible cargar las notificaciones.',
      );
    } finally {
      setCargandoNotificaciones(
        false,
      );
    }
  }

  async function marcarComoLeida(
    notificacion: Notificacion,
  ) {
    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      return;
    }

    try {
      if (!notificacion.leida) {
        const respuesta =
          await fetch(
            `${API_URL}/notificaciones/${notificacion.idNotificacion}/leida`,
            {
              method: 'PATCH',
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (!respuesta.ok) {
          throw new Error(
            'No fue posible marcar la notificación como leída',
          );
        }

        setNotificaciones(
          (actuales) =>
            actuales.map(
              (item) =>
                item.idNotificacion ===
                notificacion.idNotificacion
                  ? {
                      ...item,
                      leida: true,
                    }
                  : item,
            ),
        );
      }

      setMostrarNotificaciones(
        false,
      );

      if (
        notificacion.idTicket
      ) {
        router.push(
          `/tickets/${notificacion.idTicket}`,
        );
      }
    } catch {
      setErrorNotificaciones(
        'No fue posible actualizar la notificación.',
      );
    }
  }

  async function marcarTodasComoLeidas() {
    const token =
      localStorage.getItem(
        'access_token',
      );

    if (!token) {
      return;
    }

    try {
      const respuesta = await fetch(
        `${API_URL}/notificaciones/leer-todas`,
        {
          method: 'PATCH',
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      if (!respuesta.ok) {
        throw new Error(
          'No fue posible marcar todas las notificaciones',
        );
      }

      setNotificaciones(
        (actuales) =>
          actuales.map(
            (notificacion) => ({
              ...notificacion,
              leida: true,
            }),
          ),
      );

      setErrorNotificaciones('');
    } catch {
      setErrorNotificaciones(
        'No fue posible marcar todas las notificaciones como leídas.',
      );
    }
  }

  function formatearFecha(
    fecha: string,
  ) {
    const fechaObjeto =
      new Date(fecha);

    if (
      Number.isNaN(
        fechaObjeto.getTime(),
      )
    ) {
      return '';
    }

    return fechaObjeto.toLocaleString(
      'es-GT',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  }

  async function alternarNotificaciones() {
    const nuevoEstado =
      !mostrarNotificaciones;

    setMostrarNotificaciones(
      nuevoEstado,
    );

    if (nuevoEstado) {
      await cargarNotificaciones();
    }
  }

  useEffect(() => {
    cargarNotificaciones();

    const intervalo =
      window.setInterval(
        () => {
          cargarNotificaciones();
        },
        30000,
      );

    return () => {
      window.clearInterval(
        intervalo,
      );
    };
  }, []);

  useEffect(() => {
    function manejarClickExterior(
      evento: MouseEvent,
    ) {
      if (
        contenedorNotificaciones
          .current &&
        !contenedorNotificaciones
          .current.contains(
            evento.target as Node,
          )
      ) {
        setMostrarNotificaciones(
          false,
        );
      }
    }

    document.addEventListener(
      'mousedown',
      manejarClickExterior,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        manejarClickExterior,
      );
    };
  }, []);

  return (
    <header className="relative z-40 h-20 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Image
            src="/images/logo-master.png"
            alt="Master Auto"
            width={190}
            height={40}
            priority
            className="h-auto w-[170px] object-contain sm:w-[190px]"
          />

          <div className="hidden border-l border-slate-200 pl-4 md:block">
            <p className="font-semibold text-slate-900">
              Gestión de Incidentes TI
            </p>

            <p className="text-xs text-slate-500">
              Departamento de IT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            ref={
              contenedorNotificaciones
            }
            className="relative"
          >
            <button
              type="button"
              onClick={
                alternarNotificaciones
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-[#1F4697] hover:text-[#1F4697]"
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.311 6.022 23.848 23.848 0 0 0 5.454 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>

              {noLeidas > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#EC2328] px-1 text-[10px] font-bold text-white">
                  {noLeidas > 99
                    ? '99+'
                    : noLeidas}
                </span>
              )}
            </button>

            {mostrarNotificaciones && (
              <div className="absolute right-0 top-12 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <p className="font-semibold text-[#1F4697]">
                      Notificaciones
                    </p>

                    <p className="text-xs text-slate-500">
                      {noLeidas === 1
                        ? '1 notificación sin leer'
                        : `${noLeidas} notificaciones sin leer`}
                    </p>
                  </div>

                  {noLeidas > 0 && (
                    <button
                      type="button"
                      onClick={
                        marcarTodasComoLeidas
                      }
                      className="text-xs font-semibold text-[#1F4697] transition hover:text-[#EC2328]"
                    >
                      Marcar todas
                    </button>
                  )}
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {cargandoNotificaciones &&
                  notificaciones.length ===
                    0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Cargando
                      notificaciones...
                    </div>
                  ) : errorNotificaciones ? (
                    <div className="px-4 py-6 text-center text-sm text-red-600">
                      {
                        errorNotificaciones
                      }
                    </div>
                  ) : notificaciones.length ===
                    0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.311 6.022 23.848 23.848 0 0 0 5.454 1.31"
                          />
                        </svg>
                      </div>

                      <p className="font-semibold text-slate-700">
                        Sin
                        notificaciones
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        No tiene
                        notificaciones
                        disponibles.
                      </p>
                    </div>
                  ) : (
                    notificaciones.map(
                      (
                        notificacion,
                      ) => (
                        <button
                          key={
                            notificacion.idNotificacion
                          }
                          type="button"
                          onClick={() =>
                            marcarComoLeida(
                              notificacion,
                            )
                          }
                          className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-50 ${
                            !notificacion.leida
                              ? 'bg-blue-50/60'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                !notificacion.leida
                                  ? 'bg-[#EC2328]'
                                  : 'bg-slate-300'
                              }`}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p
                                  className={`text-sm text-slate-900 ${
                                    !notificacion.leida
                                      ? 'font-bold'
                                      : 'font-semibold'
                                  }`}
                                >
                                  {
                                    notificacion.titulo
                                  }
                                </p>

                                {!notificacion.leida && (
                                  <span className="shrink-0 rounded-full bg-[#EC2328] px-2 py-0.5 text-[10px] font-bold text-white">
                                    Nueva
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs leading-5 text-slate-600">
                                {
                                  notificacion.mensaje
                                }
                              </p>

                              <div className="mt-2 flex items-center justify-between gap-3">
                                <p className="text-[11px] text-slate-400">
                                  {formatearFecha(
                                    notificacion.fechaCreacion,
                                  )}
                                </p>

                                {notificacion.idTicket && (
                                  <span className="text-[11px] font-semibold text-[#1F4697]">
                                    Ver ticket
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ),
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {usuario}
            </p>

            <p className="text-xs text-slate-500">
              {rol}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrarSesion}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#EC2328] hover:text-[#EC2328]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}