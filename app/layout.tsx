import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'İbrahim Müdürün Çiftliği | Sürü Yönetimi',
  description: 'İbrahim Müdürün Çiftliği için koyun kayıt ve sağlık takip sistemi.',
  openGraph: {
    title: 'İbrahim Müdürün Çiftliği',
    description: 'Akıllı Sürü Yönetim Sistemi',
    images: [{ url: '/og.png', width: 1729, height: 910, alt: 'İbrahim Müdürün Çiftliği' }],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'İbrahim Müdürün Çiftliği',
    description: 'Akıllı Sürü Yönetim Sistemi',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}

