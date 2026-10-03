'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const [usuario, setUsuario] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

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
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usuario,
            contrasenia,
          }),
        },
      );

      const data = await respuesta.json();

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white">
            IT
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Gestión de Incidentes TI
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Grupo Master
          </p>
        </div>

        <form
          onSubmit={iniciarSesion}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="usuario"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Usuario
            </label>

            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(event) =>
                setUsuario(event.target.value)
              }
              required
              autoComplete="username"
              placeholder="Ingrese su usuario"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label
              htmlFor="contrasenia"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>

            <input
              id="contrasenia"
              type="password"
              value={contrasenia}
              onChange={(event) =>
                setContrasenia(event.target.value)
              }
              required
              autoComplete="current-password"
              placeholder="Ingrese su contraseña"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-700 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando
              ? 'Ingresando...'
              : 'Iniciar sesión'}
          </button>

          {mensaje && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {mensaje}
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-slate-400">
          Plataforma de gestión y seguimiento de incidentes
        </p>
      </div>
    </main>
  );
}