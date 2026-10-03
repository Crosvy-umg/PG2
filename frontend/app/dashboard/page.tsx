'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Perfil {
  sub: number;
  usuario: string;
  idRol: number;
  rol: string;
  iat?: number;
  exp?: number;
}

export default function DashboardPage() {
  const router = useRouter();

  const [perfil, setPerfil] =
    useState<Perfil | null>(null);

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {
    async function cargarPerfil() {
      const token =
        localStorage.getItem('access_token');

      if (!token) {
        router.replace('/');
        return;
      }

      try {
        const respuesta = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/perfil`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!respuesta.ok) {
          localStorage.removeItem(
            'access_token',
          );

          router.replace('/');
          return;
        }

        const data = await respuesta.json();

        const perfilNormalizado: Perfil =
          data.usuario &&
          typeof data.usuario === 'object'
            ? data.usuario
            : data;

        setPerfil(perfilNormalizado);
      } catch {
        localStorage.removeItem(
          'access_token',
        );

        router.replace('/');
      } finally {
        setCargando(false);
      }
    }

    cargarPerfil();
  }, [router]);

  function cerrarSesion() {
    localStorage.removeItem(
      'access_token',
    );

    router.replace('/');
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

  if (!perfil) {
    return null;
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
              Grupo Master
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-slate-900">
                {perfil.usuario}
              </p>

              <p className="text-sm text-slate-500">
                {perfil.rol}
              </p>
            </div>

            <button
              onClick={cerrarSesion}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Bienvenido, {perfil.usuario}
          </h2>

          <p className="mt-1 text-slate-500">
            Rol actual: {perfil.rol}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Usuario
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {perfil.usuario}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Rol
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {perfil.rol}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Estado
            </p>

            <p className="mt-2 text-xl font-bold text-green-600">
              Sesión activa
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            Opciones
          </h3>

          {perfil.rol === 'Técnico' && (
            <button
              onClick={() =>
                router.push('/tickets/asignados')
              }
              className="rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800"
            >
              Ver tickets asignados
            </button>
          )}
        </div>
      </section>
    </main>
  );
}