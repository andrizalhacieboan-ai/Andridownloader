'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';

export default function Navbar() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    // Jika browser mendukung instalasi PWA otomatis
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      // Jika tidak didukung (misal di iOS Safari atau mode incognito), berikan panduan manual
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('install app');
      } else {
        alert('install aplikasi');
      }
    }
  };

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
          className="neu-button-primary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <Smartphone size={18} className="icon-smooth" />
          <span>Install App</span>
        </button>
      </div>
    </nav>
  );
}
