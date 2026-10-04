'use client';

import Image from 'next/image';

interface HeaderProps {
  usuario: string;
  rol: string;
  onCerrarSesion: () => void;
}

export default function Header({
  usuario,
  rol,
  onCerrarSesion,
}: HeaderProps) {
  return (
    <header className="h-20 border-b border-slate-200 bg-white">
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