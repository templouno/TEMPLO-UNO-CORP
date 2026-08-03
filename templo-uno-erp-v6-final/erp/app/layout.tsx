import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Templo Uno Corp ERP', description: 'Sistema ERP para Templo Uno Corp' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body></html>;
}
