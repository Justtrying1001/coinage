import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coinage | Sector Command',
  description: 'World map strategy shell with Map, Faction, and City views.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
