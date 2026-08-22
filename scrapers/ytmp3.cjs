const fetch = require('node-fetch');

function extractVideoId(url) {
  if (!url) return null;

  let match = null;

  if (
    url.includes(
      "youtube.com/shorts/"
    ) ||
    url.includes(
      "youtu.be/"
    )
  ) {
    match =
      /\/([a-zA-Z0-9\-_]{11})/.exec(
        url
      );
  } else if (
    url.includes(
      "youtube.com"
    )
  ) {
    match =
      /v=([a-zA-Z0-9\-_]{11})/.exec(
        url
      );
  } else {
    // General fallback
    match =
      /[a-zA-Z0-9\-_]{11}/.exec(
        url
      );
  }

  return match
    ? match[1]
    : null;
}

/**
 * Main scraping function to get the download URL
 * @param {string} youtubeUrl - YouTube video URL
 * @param {string} format - 'mp3' or 'mp4'
 * @returns {Promise<object>} JSON response containing status, title, format, and download URL
 */
async function scrapeYtmp3(
  youtubeUrl,
  format = 'mp3'
) {
  const videoId =
    extractVideoId(
      youtubeUrl
    );

  if (!videoId) {
    throw new Error(
      'Invalid YouTube URL: Could not extract video ID.'
    );
  }

  const lowerFormat =
    format.toLowerCase();

  if (
    lowerFormat !== 'mp3' &&
    lowerFormat !== 'mp4'
  ) {
    throw new Error(
      'Invalid format: Must be either "mp3" or "mp4".'
    );
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/120.0.0.0 Safari/537.36',

    Accept: '*/*',

    'Accept-Language':
      'en-US,en;q=0.9',

    Origin:
      'https://id.ytmp3.mobi',

    Referer:
      'https://id.ytmp3.mobi/',

    'Sec-Fetch-Dest':
      'empty',

    'Sec-Fetch-Mode':
      'cors',

    'Sec-Fetch-Site':
      'cross-site',
  };

  try {
    // 1. Initialize session on backend
    const initUrl =
      `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${Math.random()}`;

    const initRes =
      await fetch(
        initUrl,
        {
          headers,
        }
      );

    if (!initRes.ok) {
      throw new Error(
        `Init request failed with status code ${initRes.status}`
      );
    }

    const initJson =
      await initRes.json();

    if (initJson.error > 0) {
      throw new Error(
        `Init API returned error: ${initJson.error}`
      );
    }

    // 2. Request conversion
    let convertUrl =
      initJson.convertURL;

    let convertRequestUrl =
      `${convertUrl}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;

    let convertJson;

    // Loop handles conversion redirection if returned by backend
    while (true) {
      const convertRes =
        await fetch(
          convertRequestUrl,
          {
            headers,
          }
        );

      if (!convertRes.ok) {
        throw new Error(
          `Convert request failed with status code ${convertRes.status}`
        );
      }

      convertJson =
        await convertRes.json();

      if (
        convertJson.error >
        0
      ) {
        throw new Error(
          `Convert API returned error: ${convertJson.error}`
        );
      }

      if (
        convertJson.redirect >
          0 &&
        convertJson.redirectURL
      ) {
        convertRequestUrl =
          `${convertJson.redirectURL}&v=${videoId}&f=${lowerFormat}&_=${Math.random()}`;

        continue;
      }

      break;
    }

    const progressUrl =
      convertJson.progressURL;

    const downloadUrl =
      convertJson.downloadURL;

    let title =
      convertJson.title ||
      '';

    if (!progressUrl) {
      throw new Error(
        'API conversion response is missing progress URL.'
      );
    }

    // 3. Poll progress URL until conversion is completed (progress >= 3)
    let progress = 0;
    let pollCount = 0;

    const maxPolls = 60;

    while (
      progress < 3 &&
      pollCount <
        maxPolls
    ) {
      // Wait 1 second before polling
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1000
          )
      );

      pollCount++;

      const progressRes =
        await fetch(
          progressUrl,
          {
            headers,
          }
        );

      if (!progressRes.ok) {
        throw new Error(
          `Progress request failed with status code ${progressRes.status}`
        );
      }

      const progressJson =
        await progressRes.json();

      if (
        progressJson.error >
        0
      ) {
        throw new Error(
          `Progress API returned error: ${progressJson.error}`
        );
      }

      progress =
        progressJson.progress;

      if (
        progressJson.title
      ) {
        title =
          progressJson.title;
      }
    }

    if (
      progress < 3
    ) {
      throw new Error(
        'Conversion process timed out (exceeded 60 seconds).'
      );
    }

    return {
      status: 'success',
      videoId,
      title,
      format: lowerFormat,
      downloadUrl,
    };
  } catch (error) {
    return {
      status: 'error',
      message:
        error.message,
    };
  }
}

// Export for module usage
module.exports = {
  scrapeYtmp3,
  extractVideoId,
};

// CLI implementation
if (
  require.main ===
  module
) {
  const args =
    process.argv.slice(2);

  if (
    args.length === 0
  ) {
    console.log(
      JSON.stringify(
        {
          status: 'error',
          message:
            'Usage: node ytmp3-scraper.js <youtube-url> [format: mp3|mp4]',
        },
        null,
        2
      )
    );

    process.exit(1);
  }

  const url =
    args[0];

  const format =
    args[1] ||
    'mp3';

  scrapeYtmp3(
    url,
    format
  )
    .then(
      (result) => {
        console.log(
          JSON.stringify(
            result,
            null,
            2
          )
        );

        process.exit(
          result.status ===
            'success'
            ? 0
            : 1
        );
      }
    )
    .catch(
      (err) => {
        console.log(
          JSON.stringify(
            {
              status:
                'error',
              message:
                err.message,
            },
            null,
            2
          )
        );

        process.exit(1);
      }
    );
}
