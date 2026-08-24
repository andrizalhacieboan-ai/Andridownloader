'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Smartphone } from 'lucide-react';

export default function Navbar() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Cek jika app sudah terinstall
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('menginstall aplikasi.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return null; // Sembunyikan tombol jika aplikasi sudah terinstall
  }

  return (
    <nav className="w-full fixed top-0 left-0 z-50 px-4 md:px-6 py-3">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base md:text-xl font-black tracking-tight text-white">
            ANDRI <span className="text-orange-500">DOWNLOADER</span>
          </span>
        </Link>
        
        {/* Tombol Download Aplikasi (PWA Install) */}
        <button 
          onClick={handleInstallClick}
          className="neu-button-primary px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2"
        >
          <Smartphone size={16} className="icon-smooth" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      </div>
    </nav>
  );
}
