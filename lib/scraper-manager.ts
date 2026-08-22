import { detectPlatform } from './detect-platform';
import { isValidUrl } from './validators';

export async function processDownload(url: string) {
  if (!isValidUrl(url)) throw { type: 'INVALID_URL', message: 'URL tidak valid' };
  
  const platform = detectPlatform(url);
  if (!platform) throw { type: 'UNSUPPORTED_PLATFORM', message: 'Platform tidak didukung' };

  let data: any;
  
  try {
    switch(platform) {
      case 'tiktok': {
        const { scrapeTikTok } = await import('../scraper/tiktok.cjs');
        const res = await scrapeTikTok(url);
        data = res.data;
        
        const media = data.isSlideshow && data.images 
          ? data.images.map((img: any, i: number) => ({ type: 'image', url: img.url, quality: 'original', format: 'jpg' }))
          : [{ type: 'video', url: data.video?.url, quality: 'best', format: 'mp4' }];

        return {
          platform: 'tiktok',
          type: data.isSlideshow ? 'slideshow' : 'video',
          title: data.desc,
          thumbnail: data.covers?.cover,
          author: data.author?.nickname,
          duration: data.video?.duration ? data.video.duration / 1000 : null,
          media
        };
      }
      
      case 'instagram': {
        const { scrapeInstagram } = await import('../scraper/instagram.cjs');
        const res = await scrapeInstagram(url);
        data = res.data;
        
        return {
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
      }
      
      case 'soundcloud': {
        const soundcloud = await import('../scraper/soundcloud.mjs');
        const data = await soundcloud.get(url);
        
        if (data.kind === 'track') {
          return {
            platform: 'soundcloud',
            type: 'audio',
            title: data.title,
            thumbnail: data.artwork_url,
            author: data.artist,
            duration: data.duration_sec,
            media: [{ type: 'audio', url: data.download || data.stream, quality: 'original', format: 'mp3' }]
          };
        } else if (data.kind === 'playlist') {
          return {
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
        }
        throw new Error('Unsupported SoundCloud content');
      }
      
      case 'spotify': {
        const { getSpotifyTrack } = await import('../scraper/spotify.mjs');
        const res = await getSpotifyTrack(url);
        if (!res.status) throw new Error('Spotify fetch failed');
        
        return {
          platform: 'spotify',
          type: 'audio',
          title: res.result.title,
          thumbnail: res.result.cover,
          author: res.result.artist,
          duration: null,
          media: [{ type: 'audio', url: res.result.download_url, quality: 'original', format: 'mp3' }]
        };
      }
      
      case 'youtube': {
        const { scrapeYtmp3 } = await import('../scraper/ytmp3.cjs');
        const res = await scrapeYtmp3(url, 'mp3'); // default to mp3
        if (res.status !== 'success') throw new Error(res.message);
        
        return {
          platform: 'youtube',
          type: 'video',
          title: res.title,
          thumbnail: `https://img.youtube.com/vi/${res.videoId}/hqdefault.jpg`,
          author: null,
          duration: null,
          media: [{ type: 'audio', url: res.downloadUrl, quality: 'best', format: res.format }]
        };
      }
      
      default:
        throw { type: 'UNSUPPORTED_PLATFORM', message: 'Platform tidak didukung' };
    }
  } catch (error: any) {
    console.error(`Scraper Error [${platform}]:`, error.message);
    throw { type: 'SCRAPER_ERROR', message: 'Gagal mengambil media. Silakan coba lagi.' };
  }
          }
