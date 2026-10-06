'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  rol: string;
  idRol: number;
}

interface OpcionMenu {
  nombre: string;
  ruta: string;
  visible: boolean;
}

export default function Sidebar({
  rol,
  idRol,
}: SidebarProps) {
  const pathname = usePathname();

  const esSolicitante =
    idRol === 1 ||
    rol?.trim() === 'Solicitante';

  const esTecnico =
    idRol === 2 ||
    rol?.trim() === 'Técnico';

  const esSupervisor =
    idRol === 6 ||
    rol?.trim() === 'Supervisor';

  const esAdministrador =
    idRol === 7 ||
    rol?.trim() === 'Administrador';

  const esAdministrativo =
    esSupervisor || esAdministrador;

  const opciones: OpcionMenu[] = [
    {
      nombre: 'Inicio',
      ruta: '/dashboard',
      visible: true,
    },
    {
      nombre: 'Crear ticket',
      ruta: '/tickets/nuevo',
      visible: esSolicitante,
    },
    {
      nombre: 'Mis tickets',
      ruta: '/tickets/mis-tickets',
      visible: esSolicitante,
    },
    {
      nombre: 'Tickets asignados',
      ruta: '/tickets/asignados',
      visible: esTecnico,
    },
    {
      nombre: 'Gestionar tickets',
      ruta: '/tickets/gestion',
      visible: esAdministrativo,
    },
    {
      nombre: 'Todos los tickets',
      ruta: '/tickets/todos',
      visible: esAdministrativo,
    },
    {
      nombre: 'Usuarios',
      ruta: '/usuarios',
      visible: esAdministrador,
    },
    {
      nombre: 'Categorías',
      ruta: '/categorias',
      visible: esAdministrador,
    },
    {
      nombre: 'Prioridades',
      ruta: '/prioridades',
      visible: esAdministrador,
    },
  ];

  function esDetalleTicket() {
    return /^\/tickets\/\d+$/.test(
      pathname,
    );
  }

  function estaActivo(
    ruta: string,
  ) {
    if (ruta === '/dashboard') {
      return pathname === '/dashboard';
    }

    if (pathname === ruta) {
      return true;
    }

    if (esDetalleTicket()) {
      if (
        esSolicitante &&
        ruta === '/tickets/mis-tickets'
      ) {
        return true;
      }

      if (
        esTecnico &&
        ruta === '/tickets/asignados'
      ) {
        return true;
      }

      if (
        esAdministrativo &&
        ruta === '/tickets/todos'
      ) {
        return true;
      }
    }

    return false;
  }

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-20 items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo-master-icon.png"
            alt="Master Auto"
            width={42}
            height={42}
            className="h-10 w-10 object-contain"
          />

          <div>
            <p className="text-sm font-bold text-slate-900">
              Incidentes TI
            </p>

            <p className="text-xs text-[#61605E]">
              Grupo Master
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          Menú principal
        </p>

        <div className="space-y-1">
          {opciones
            .filter(
              (opcion) =>
                opcion.visible,
            )
            .map((opcion) => {
              const activo =
                estaActivo(
                  opcion.ruta,
                );

              return (
                <Link
                  key={opcion.ruta}
                  href={opcion.ruta}
                  className={`block w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                    activo
                      ? 'bg-[#1F4697] text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#1F4697]'
                  }`}
                >
                  {opcion.nombre}
                </Link>
              );
            })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            Rol actual
          </p>

          <p className="mt-1 text-sm font-semibold text-[#1F4697]">
            {rol}
          </p>
        </div>
      </div>
    </aside>
  );
}