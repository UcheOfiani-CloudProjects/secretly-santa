import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Secretly Santa',
    short_name: 'Secret Santa',
    description: 'A little mystery. A thoughtful gift. A Christmas to remember.',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: '#1A0A10',
    theme_color: '#561827',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
