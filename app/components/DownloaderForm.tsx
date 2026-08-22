'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Link as LinkIcon, X } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';
import ResultCard from './ResultCard';
import LimitCounter from './LimitCounter';
import { detectPlatform } from '@/lib/detect-platform';

export default function DownloaderForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [usage, setUsage] = useState({ used: 0, limit: 5, remaining: 5, resetAt: new Date(Date.now() + 86400000).toISOString() });

  const detectedPlatform = useMemo(() => detectPlatform(url), [url]);

  useEffect(() => {
    fetch('/api/usage').then(r => r.json()).then(setUsage);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
      } else {
        setResult(data);
        setUsage(data.usage);
      }
    } catch (err) {
      setError('Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <LimitCounter used={usage.used} limit={usage.limit} resetAt={usage.resetAt} />
      
      <form onSubmit={handleSubmit} className="neu-card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <LinkIcon size={20} />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste URL di sini..."
              className="neu-input w-full pl-12 pr-10 py-4 text-white placeholder-gray-500"
              disabled={loading}
            />
            {url && (
              <button 
                type="button" 
                onClick={() => setUrl('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || !url}
            className="neu-button-primary px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search size={20} className="icon-smooth" />
            {loading ? 'Processing...' : 'Download'}
          </button>
        </div>
        
        {detectedPlatform && (
          <div className="mt-4 flex items-center gap-2 text-sm text-orange-500 animate-fade-in">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Platform detected: <span className="font-bold uppercase">{detectedPlatform}</span>
          </div>
        )}
      </form>

      {loading && <LoadingSkeleton />}
      
      {error && (
        <div className="neu-card p-4 mt-6 border-l-4 border-red-500 bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

      {result && <ResultCard data={result} />}
    </div>
  );
}
