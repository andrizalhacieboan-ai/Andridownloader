export function detectPlatform(url: string): string | null {
  try {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('tiktok.com') || lowerUrl.includes('vt.tiktok.com') || lowerUrl.includes('vm.tiktok.com')) return 'tiktok';
    if (lowerUrl.includes('instagram.com')) return 'instagram';
    if (lowerUrl.includes('soundcloud.com') || lowerUrl.includes('snd.sc') || lowerUrl.includes('on.soundcloud.com')) return 'soundcloud';
    if (lowerUrl.includes('open.spotify.com') || lowerUrl.includes('spotify.com')) return 'spotify';
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com')) return 'facebook';
    
    return null;
  } catch {
    return null;
  }
}
