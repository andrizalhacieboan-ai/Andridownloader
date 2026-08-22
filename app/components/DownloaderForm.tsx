'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Link as LinkIcon, X, ShieldCheck } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';
import ResultCard from './ResultCard';
import LimitCounter from './LimitCounter';
import { detectPlatform } from '@/lib/detect-platform';

// Deklarasi tipe global untuk window.hcaptcha
declare global {
  interface Window {
    hcaptcha?: {
      reset: () => void;
    };
  }
}

export default function DownloaderForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [usage, setUsage] = useState({ used: 0, limit: 5, remaining: 5, resetAt: new Date(Date.now() + 86400000).toISOString() });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const detectedPlatform = useMemo(() => detectPlatform(url), [url]);

  useEffect(() => {
    fetch('/api/usage').then(r => r.json()).then(setUsage);
    
    // Setup callback global untuk hCaptcha
    (window as any).onCaptchaVerify = (token: string) => {
      setCaptchaToken(token);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !captchaToken) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, captchaToken })
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
      // Reset captcha setelah submit agar tidak bisa di-spam
      setCaptchaToken(null);
      if (window.hcaptcha) {
        window.hcaptcha.reset();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <LimitCounter used={usage.used} limit={usage.limit} resetAt={usage.resetAt} />
      
      <form onSubmit={handleSubmit} className="neu-card p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
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
          
          <div className="flex justify-center min-h-[80px] items-center">
            <div 
              className="h-captcha" 
              data-sitekey="c07c54d6-d866-402e-91e0-19528d52e66c" 
              data-theme="dark"
              data-callback="onCaptchaVerify"
            ></div>
          </div>

          <button
            type="submit"
            disabled={loading || !url || !captchaToken}
            className="neu-button-primary px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {captchaToken ? <Search size={20} className="icon-smooth" /> : <ShieldCheck size={20} className="icon-smooth" />}
            {loading ? 'Processing...' : captchaToken ? 'Download' : 'Selesaikan Captcha Dahulu'}
          </button>
          
          {detectedPlatform && captchaToken && (
            <div className="mt-2 flex items-center gap-2 text-sm text-orange-500 animate-fade-in">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              Platform detected: <span className="font-bold uppercase">{detectedPlatform}</span>
            </div>
          )}
        </div>
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
