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
        const { scrapeTikTok } = await import('../scrapers/tiktok.cjs') as any;
        const res = await scrapeTikTok(url);
        const data = res.data;
        
        let media: any[] = [];
        if (data.isSlideshow && data.images) {
          media = data.images.map((img: any, i: number) => ({ 
            type: 'image', url: img.url, quality: `Image ${i + 1}`, format: 'jpg' 
          }));
        } else if (data.video?._urls?.length) {
          const urls = data.video._urls.slice(0, 3);
          const labels = ['Best Quality', 'Medium Quality', 'Low Quality'];
          media = urls.map((u: string, i: number) => ({
            type: 'video', url: u, quality: labels[i] || 'Original', format: 'mp4'
          }));
        }

        if (data.music?.playUrl) {
          media.push({ type: 'audio', url: data.music.playUrl, quality: 'Original Audio', format: 'mp3' });
        }

        result = {
          platform: 'tiktok', type: data.isSlideshow ? 'slideshow' : 'video',
          title: data.desc, thumbnail: data.covers?.cover, author: data.author?.nickname,
          duration: data.video?.duration ? data.video.duration / 1000 : null, media
        };
        break;
      }
      
      case 'instagram': {
        const { scrapeInstagram } = await import('../scrapers/instagram.cjs') as any;
        const res = await scrapeInstagram(url);
        const data = res.data;
        const media = data.media.map((m: any, i: number) => ({
          type: m.type === 'video' ? 'video' : 'image', url: m.url,
          quality: m.type === 'video' ? 'Best Quality' : 'Original',
          format: m.type === 'video' ? 'mp4' : 'jpg'
        }));

        result = {
          platform: 'instagram', type: data.type, title: data.caption,
          thumbnail: data.media[0]?.thumbnail || data.media[0]?.url, author: data.owner?.username,
          duration: data.media[0]?.duration || null, media
        };
        break;
      }
      
      case 'soundcloud': {
        const soundcloud = await import('../scrapers/soundcloud.mjs') as any;
        const data = await soundcloud.get(url);
        
        if (data.kind === 'track') {
          result = {
            platform: 'soundcloud', type: 'audio', title: data.title, thumbnail: data.artwork_url,
            author: data.artist, duration: data.duration_sec,
            media: [{ type: 'audio', url: data.download || data.stream, quality: 'Best Quality', format: 'mp3' }]
          };
        } else if (data.kind === 'playlist') {
          result = {
            platform: 'soundcloud', type: 'playlist', title: data.title, thumbnail: data.artwork_url,
            author: data.user, duration: null,
            media: data.tracks.map((t: any, i: number) => ({
              type: 'audio', url: t.download || t.stream, quality: `Track ${i + 1}`, format: 'mp3'
            }))
          };
        } else throw new Error('Unsupported SoundCloud content');
        break;
      }
      
      case 'spotify': {
        const { getSpotifyTrack } = await import('../scrapers/spotify.mjs') as any;
        const res = await getSpotifyTrack(url);
        if (!res.status) throw new Error('Spotify fetch failed');
        
        result = {
          platform: 'spotify', type: 'audio', title: res.result.title, thumbnail: res.result.cover,
          author: res.result.artist, duration: null,
          media: [{ type: 'audio', url: res.result.download_url, quality: 'Best Quality', format: 'mp3' }]
        };
        break;
      }
      
      case 'youtube': {
        const { scrapeYtmp3 } = await import('../scrapers/ytmp3.cjs') as any;
        const [mp3Res, mp4Res] = await Promise.all([
          scrapeYtmp3(url, 'mp3').catch(() => null),
          scrapeYtmp3(url, 'mp4').catch(() => null)
        ]);
        
        const media: any[] = [];
        if (mp3Res?.status === 'success' && mp3Res.downloadUrl) {
          media.push({ type: 'audio', url: mp3Res.downloadUrl, quality: 'Audio MP3', format: 'mp3' });
        }
        if (mp4Res?.status === 'success' && mp4Res.downloadUrl) {
          media.push({ type: 'video', url: mp4Res.downloadUrl, quality: 'Video MP4', format: 'mp4' });
        }
        
        if (media.length === 0) throw new Error('Gagal mengambil media YouTube. Coba lagi.');
        result = {
          platform: 'youtube', type: 'video', title: mp3Res?.title || mp4Res?.title || 'YouTube Video',
          thumbnail: `https://img.youtube.com/vi/${mp3Res?.videoId || mp4Res?.videoId}/hqdefault.jpg`,
          author: null, duration: null, media
        };
        break;
      }

      // TAMBAHAN FACEBOOK
      case 'facebook': {
        const { Yt5sFB } = await import('../scrapers/facebook.mjs') as any;
        const fb = new Yt5sFB();
        const res = await fb.download({ url });
        
        if (!res || !res.links || res.links.length === 0) throw new Error('Gagal mengambil media Facebook.');
        
        const media = res.links.map((l: any) => {
          const isAudio = l.quality.toLowerCase().includes('mp3');
          const isImage = l.quality.toLowerCase().includes('image') || l.quality.toLowerCase().includes('jpg');
          return {
            type: isAudio ? 'audio' : isImage ? 'image' : 'video',
            url: l.url,
            quality: l.quality || 'Original',
            format: isAudio ? 'mp3' : isImage ? 'jpg' : 'mp4'
          };
        });

        result = {
          platform: 'facebook', type: media[0].type, title: res.title || 'Facebook Media',
          thumbnail: res.img, author: null, duration: res.duration || null, media
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
