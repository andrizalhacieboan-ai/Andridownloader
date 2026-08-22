import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ANDRI ALL DOWNLOADER — Download Video, Audio & Media',
  description: 'Download video, photo, and audio from supported platforms quickly with Andri All Downloader.',
  keywords: ['video downloader', 'TikTok downloader', 'Instagram downloader', 'YouTube downloader', 'SoundCloud downloader', 'Spotify downloader', 'media downloader'],
  openGraph: {
    title: 'ANDRI ALL DOWNLOADER',
    description: 'Download video, photo, and audio from supported platforms quickly.',
    type: 'website',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
