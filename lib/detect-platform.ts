export function detectPlatform(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '').replace('m.', '');

    if (host.includes('tiktok.com') || host.includes('vt.tiktok.com') || host.includes('vm.tiktok.com') || host === 't.tiktok.com') return 'tiktok';
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('soundcloud.com') || host.includes('snd.sc') || host.includes('on.soundcloud.com')) return 'soundcloud';
    if (host.includes('open.spotify.com')) return 'spotify';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    
    return null;
  } catch {
    return null;
  }
}
