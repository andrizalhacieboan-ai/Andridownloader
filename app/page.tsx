import DownloaderForm from './components/DownloaderForm';
import { Music, Video, Instagram, Youtube, Cloud } from 'lucide-react';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
          ANDRI<span className="text-orange-500">ALL DOWNLOADER</span>
        </h1>
        <p className="mt-3 text-gray-400 text-sm md:text-base max-w-xl mx-auto">
          Download Video, Foto & Audio Dalam Satu Tempat.
        </p>
      </header>

      <DownloaderForm />

      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold mb-8 text-white">Supported Platforms</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {[
            { name: 'TikTok', icon: Video, desc: 'Video & Photo' },
            { name: 'Instagram', icon: Instagram, desc: 'Reels & Photo' },
            { name: 'YouTube', icon: Youtube, desc: 'MP3 & MP4' },
            { name: 'SoundCloud', icon: Cloud, desc: 'Track & Playlist' },
            { name: 'Spotify', icon: Music, desc: 'Track' },
            { name: 'Facebook', icon: Facebook, desc: 'Video, MP3 & Photo' },
          ].map((p) => (
            <div key={p.name} className="neu-chip p-4 rounded-xl flex flex-col items-center gap-2 text-center">
              <p.icon className="icon-smooth text-orange-500" size={24} />
              <span className="font-bold text-white text-sm">{p.name}</span>
              <span className="text-xs text-gray-500">{p.desc}</span>
            </div>
          ))}
        </div>
      </section>
      
      <footer className="mt-16 text-center text-gray-600 text-sm">
        <p>© 2026 Andri All Downloader</p>
        <p className="mt-2 text-xs max-w-md mx-auto">
          Users are responsible for ensuring they have the rights or permission to download and use content.
        </p>
      </footer>
    </main>
  );
}
