import { AuthContext } from '@/components/AuthContext';
import { Wrapper } from '@/components/Wrapper';
import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'SpotXLSX',
  description: 'Application that allows to download spotify playlists to an excel file.',
  icons: {
    icon: '/favicons/favicon.ico',
    apple: [
      { url: '/favicons/apple-icon-57x57.png', sizes: '57x57' },
      { url: '/favicons/apple-icon-60x60.png', sizes: '60x60' },
      { url: '/favicons/apple-icon-72x72.png', sizes: '72x72' },
      { url: '/favicons/apple-icon-76x76.png', sizes: '76x76' },
      { url: '/favicons/apple-icon-114x114.png', sizes: '114x114' },
      { url: '/favicons/apple-icon-120x120.png', sizes: '120x120' },
      { url: '/favicons/apple-icon-144x144.png', sizes: '144x144' },
      { url: '/favicons/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/favicons/apple-icon-180x180.png', sizes: '180x180' },
    ],
    other: [
      { rel: 'icon', type: 'image/png', sizes: '192x192', url: '/favicons/android-icon-192x192.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicons/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', url: '/favicons/favicon-96x96.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicons/favicon-16x16.png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  other: {
    'msapplication-TileColor': '#ffffff',
    'msapplication-TileImage': '/favicons/ms-icon-144x144.png',
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode,
}) {
  return (
    <AuthContext>
      <html lang="en">
        <Wrapper>
          {children}
        </Wrapper>
      </html>
    </AuthContext>
  )
}
