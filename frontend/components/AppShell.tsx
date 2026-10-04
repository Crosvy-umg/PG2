'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import Header from './Header';
import Sidebar from './Sidebar';

interface Perfil {
  sub: number;
  usuario: string;
  idRol: number;
  rol: string;
}

interface AppShellProps {
  perfil: Perfil;
  children: ReactNode;
}

export default function AppShell({
  perfil,
  children,
}: AppShellProps) {
  const router = useRouter();

  function cerrarSesion() {
    localStorage.removeItem(
      'access_token',
    );

    router.replace('/');
  }

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-[#F5F6F8]">
      <Sidebar
        rol={perfil.rol}
        idRol={perfil.idRol}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <Header
          usuario={perfil.usuario}
          rol={perfil.rol}
          onCerrarSesion={
            cerrarSesion
          }
        />

        <main className="min-w-0 max-w-full flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}