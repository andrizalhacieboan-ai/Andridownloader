import fetch from 'node-fetch';

async function getSpotifyTrack(
  spotifyUrl
) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0',

    Accept: '*/*',

    'Accept-Language':
      'en-US,en;q=0.9',

    Referer:
      'https://spotyloader.com/',

    Origin:
      'https://spotyloader.com',

    'Content-Type':
      'application/json',
  };

  try {
    const infoRes =
      await fetch(
        `https://spotyloader.com/api/spotify/info?url=${encodeURIComponent(
          spotifyUrl
        )}`,
        {
          headers,
        }
      );

    if (!infoRes.ok) {
      throw new Error(
        `Failed info fetch with status ${infoRes.status}`
      );
    }

    const trackRes =
      await fetch(
        'https://spotyloader.com/api/spotify/track',
        {
          method: 'POST',
          headers,

          body: JSON.stringify({
            url: spotifyUrl,
            format: 'mp3',
          }),
        }
      );

    const trackData =
      await trackRes.json();

    const jobId =
      trackData.jobId;

    if (!jobId) {
      throw new Error(
        'Job ID not found'
      );
    }

    let statusData;
    let attempts = 0;

    while (
      attempts < 15
    ) {
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            3000
          )
      );

      const statusRes =
        await fetch(
          `https://spotyloader.com/api/spotify/track/status/${jobId}`,
          {
            headers,
          }
        );

      statusData =
        await statusRes.json();

      if (
        statusData.status ===
        'ready'
      ) {
        break;
      }

      attempts++;
    }

    return {
      status: true,
      code: 200,
      query: spotifyUrl,
      result: statusData,
    };
  } catch (error) {
    return {
      status: false,
      code: 500,
      query: spotifyUrl,

      result: {
        error:
          error.message,
      },
    };
  }
}


export {
  getSpotifyTrack,
};
