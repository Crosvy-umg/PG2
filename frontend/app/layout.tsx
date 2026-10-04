import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';

import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: [
    '400',
    '500',
    '600',
    '700',
  ],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title:
    'Gestión de Incidentes TI | Grupo Master',

  description:
    'Plataforma de gestión y seguimiento de incidentes tecnológicos de Grupo Master.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={roboto.variable}
    >
      <body
        className={`${roboto.className} min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}