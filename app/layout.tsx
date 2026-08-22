import type { Metadata } from 'next';
import Script from 'next/script';
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
        {/* Script hCaptcha */}
        <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
      </head>
      <body className="antialiased">
        {/* Iklan Adsterra - Popunder */}
        <Script 
          src="https://pl30973511.profitableratecpmnetwork.com/56/20/11/56201152cd774433823838ab783b6cc1.js" 
          strategy="afterInteractive"
        ></Script>
        
        {/* Iklan Adsterra - Social Bar */}
        <Script 
          src="https://pl30973512.profitableratecpmnetwork.com/cd/ac/8f/cdac8f4a73fb58f8d1e2474ecbbb84a7.js" 
          strategy="afterInteractive"
        ></Script>

        {children}
      </body>
    </html>
  );
}
