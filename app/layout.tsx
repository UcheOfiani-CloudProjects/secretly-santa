import type { Metadata, Viewport } from 'next';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './globals.css';
import Starfield from '@/components/Starfield';
import Snow from '@/components/Snow';

export const metadata: Metadata = {
  title: 'Secretly Santa',
  description: 'A little mystery. A thoughtful gift. A Christmas to remember.',
};
export const viewport: Viewport = { themeColor: '#1A0A10', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='24' fill='%23561827'/%3E%3Ctext x='50' y='72' font-size='64' text-anchor='middle' fill='%23FBF5ED' font-family='sans-serif'%3ES%3C/text%3E%3C/svg%3E" />
      </head>
      <body>
        <div className="bg-photo" aria-hidden />
        <Starfield />
        <Snow />
        {children}
      </body>
    </html>
  );
}
