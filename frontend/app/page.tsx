'use client';

import Image from 'next/image';
import {
  FormEvent,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const [usuario, setUsuario] =
    useState('');

  const [contrasenia, setContrasenia] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const [cargando, setCargando] =
    useState(false);

  async function iniciarSesion(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMensaje('');
    setCargando(true);

    try {
      const respuesta = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            usuario: usuario.trim(),
            contrasenia,
          }),
        },
      );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          data.message ??
            'Usuario o contraseña incorrectos',
        );

        return;
      }

      const token =
        data.access_token ??
        data.token;

      if (!token) {
        setMensaje(
          'El servidor no devolvió un token válido.',
        );

        return;
      }

      localStorage.setItem(
        'access_token',
        token,
      );

      router.push('/dashboard');
    } catch {
      setMensaje(
        'No fue posible conectar con el servidor.',
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <div className="grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]">
        {/* SECCIÓN IZQUIERDA */}
        <section className="relative hidden overflow-hidden bg-[#1F4697] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute left-0 top-0 h-2 w-full bg-[#EC2328]" />

          <div className="relative z-10 px-16 pt-14">
            <div className="inline-flex rounded-xl bg-white px-6 py-4 shadow-sm">
              <Image
                src="/images/logo-master.png"
                alt="Master Auto"
                width={280}
                height={60}
                priority
                className="h-auto w-[260px] object-contain"
              />
            </div>
          </div>

          <div className="relative z-10 max-w-2xl px-16 pb-20">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-red-300">
              Departamento de IT
            </p>

            <h1 className="text-5xl font-bold leading-tight text-white">
              Gestión de
              <br />
              Incidentes TI
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Plataforma para el registro,
              seguimiento y atención de
              incidentes tecnológicos de
              Grupo Master.
            </p>

            <div className="mt-10 h-1 w-24 rounded-full bg-[#EC2328]" />
          </div>

          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full border-[45px] border-white/5" />

          <div className="absolute bottom-24 right-24 h-32 w-32 rounded-full border-[24px] border-[#EC2328]/20" />
        </section>

        {/* SECCIÓN DERECHA */}
        <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            {/* Logo móvil */}
            <div className="mb-8 text-center lg:hidden">
              <Image
                src="/images/logo-master.png"
                alt="Master Auto"
                width={230}
                height={50}
                priority
                className="mx-auto h-auto w-[220px] object-contain"
              />

              <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-[#EC2328]" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
              <div className="mb-8">
                <p className="mb-2 text-sm font-bold text-[#EC2328]">
                  Acceso al sistema
                </p>

                <h2 className="text-3xl font-bold text-[#1F4697]">
                  Iniciar sesión
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#61605E]">
                  Ingrese sus credenciales
                  para acceder a la plataforma
                  de Gestión de Incidentes TI.
                </p>
              </div>

              <form
                onSubmit={iniciarSesion}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="usuario"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Usuario
                  </label>

                  <input
                    id="usuario"
                    type="text"
                    value={usuario}
                    onChange={(event) =>
                      setUsuario(
                        event.target.value,
                      )
                    }
                    required
                    autoComplete="username"
                    placeholder="Ingrese su usuario"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contrasenia"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Contraseña
                  </label>

                  <input
                    id="contrasenia"
                    type="password"
                    value={contrasenia}
                    onChange={(event) =>
                      setContrasenia(
                        event.target.value,
                      )
                    }
                    required
                    autoComplete="current-password"
                    placeholder="Ingrese su contraseña"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1F4697] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full rounded-lg bg-[#1F4697] px-4 py-3.5 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cargando
                    ? 'Ingresando...'
                    : 'Iniciar sesión'}
                </button>

                {mensaje && (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                    {mensaje}
                  </div>
                )}
              </form>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="text-center text-xs leading-5 text-slate-400">
                  Plataforma de gestión y
                  seguimiento de incidentes
                  tecnológicos
                </p>

                <p className="mt-1 text-center text-xs font-semibold text-[#61605E]">
                  Grupo Master
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Acceso exclusivo para usuarios
              autorizados.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}