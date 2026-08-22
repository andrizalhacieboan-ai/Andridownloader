import { detectPlatform } from './detect-platform';
import { isValidUrl } from './validators';

export async function processDownload(url: string) {
  if (!isValidUrl(url)) throw { type: 'INVALID_URL', message: 'URL tidak valid' };
  
  const platform = detectPlatform(url);
  if (!platform) throw { type: 'UNSUPPORTED_PLATFORM', message: 'Platform tidak didukung' };

  let result: any;
  
  try {
    switch(platform) {
      case 'tiktok': {
        // Cast as any untuk menghindari inferensi tipe ketat dari CJS
        const { scrapeTikTok } = await import('../scrapers/tiktok.cjs') as any;
        const res = await scrapeTikTok(url);
        const data = res.data;
        
        const media = data.isSlideshow && data.images 
          ? data.images.map((img: any, i: number) => ({ type: 'image', url: img.url, quality: 'original', format: 'jpg' }))
          : [{ type: 'video', url: data.video?.url, quality: 'best', format: 'mp4' }];

        result = {
          platform: 'tiktok',
          type: data.isSlideshow ? 'slideshow' : 'video',
          title: data.desc,
          thumbnail: data.covers?.cover,
          author: data.author?.nickname,
          duration: data.video?.duration ? data.video.duration / 1000 : null,
          media
        };
        break;
      }
      
      case 'instagram': {
        const { scrapeInstagram } = await import('../scrapers/instagram.cjs') as any;
        const res = await scrapeInstagram(url);
        const data = res.data;
        
        result = {
          platform: 'instagram',
          type: data.type,
          title: data.caption,
          thumbnail: data.media[0]?.thumbnail || data.media[0]?.url,
          author: data.owner?.username,
          duration: data.media[0]?.duration || null,
          media: data.media.map((m: any) => ({
            type: m.type === 'video' ? 'video' : 'image',
            url: m.url,
            quality: 'original',
            format: m.type === 'video' ? 'mp4' : 'jpg'
          }))
        };
        break;
      }
      
      case 'soundcloud': {
        const soundcloud = await import('../scrapers/soundcloud.mjs') as any;
        const data = await soundcloud.get(url);
        
        if (data.kind === 'track') {
          result = {
            platform: 'soundcloud',
            type: 'audio',
            title: data.title,
            thumbnail: data.artwork_url,
            author: data.artist,
            duration: data.duration_sec,
            media: [{ type: 'audio', url: data.download || data.stream, quality: 'original', format: 'mp3' }]
          };
        } else if (data.kind === 'playlist') {
          result = {
            platform: 'soundcloud',
            type: 'playlist',
            title: data.title,
            thumbnail: data.artwork_url,
            author: data.user,
            duration: null,
            media: data.tracks.map((t: any) => ({
              type: 'audio', url: t.download || t.stream, quality: 'original', format: 'mp3'
            }))
          };
        } else {
          throw new Error('Unsupported SoundCloud content');
        }
        break;
      }
      
      case 'spotify': {
        const { getSpotifyTrack } = await import('../scrapers/spotify.mjs') as any;
        const res = await getSpotifyTrack(url);
        if (!res.status) throw new Error('Spotify fetch failed');
        
        result = {
          platform: 'spotify',
          type: 'audio',
          title: res.result.title,
          thumbnail: res.result.cover,
          author: res.result.artist,
          duration: null,
          media: [{ type: 'audio', url: res.result.download_url, quality: 'original', format: 'mp3' }]
        };
        break;
      }
      
      case 'youtube': {
        const { scrapeYtmp3 } = await import('../scrapers/ytmp3.cjs') as any;
        const res = await scrapeYtmp3(url, 'mp3'); // default to mp3
        if (res.status !== 'success') throw new Error(res.message);
        
        result = {
          platform: 'youtube',
          type: 'video',
          title: res.title,
          thumbnail: `https://img.youtube.com/vi/${res.videoId}/hqdefault.jpg`,
          author: null,
          duration: null,
          media: [{ type: 'audio', url: res.downloadUrl, quality: 'best', format: res.format }]
        };
        break;
      }
      
      default:
        throw { type: 'UNSUPPORTED_PLATFORM', message: 'Platform tidak didukung' };
    }
    
    return result;

  } catch (error: any) {
    console.error(`Scraper Error [${platform}]:`, error.message);
    throw { type: 'SCRAPER_ERROR', message: 'Gagal mengambil media. Silakan coba lagi.' };
  }
}
