
import { fileURLToPath } from 'node:url'

const API = 'https://api-v2.soundcloud.com'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/131.0.0.0 Safari/537.36'

let cachedClientId = null

async function fetchClientId() {
  if (cachedClientId) {
    return cachedClientId
  }

  const html = await (
    await fetch('https://soundcloud.com/', {
      headers: {
        'User-Agent': UA,
      },
    })
  ).text()

  const scripts = [
    ...html.matchAll(
      /<script[^>]+src="(https:\/\/[^"]+\.js)"/g
    ),
  ]
    .map((m) => m[1])
    .reverse()

  for (const src of scripts) {
    try {
      const js = await (
        await fetch(src, {
          headers: {
            'User-Agent': UA,
          },
        })
      ).text()

      const m = js.match(
        /client_id\s*:\s*"([0-9a-zA-Z]{32})"/
      )

      if (m) {
        cachedClientId = m[1]
        return cachedClientId
      }
    } catch {}
  }

  throw new Error(
    'Gagal mengambil client_id dari SoundCloud'
  )
}

async function api(
  path,
  params = {}
) {
  const client_id =
    await fetchClientId()

  let full

  try {
    full = path.startsWith('http')
      ? new URL(path)
      : new URL(path, API)
  } catch {
    throw new Error(
      'Path API tidak valid'
    )
  }

  full.searchParams.set(
    'client_id',
    client_id
  )

  for (
    const [k, v] of Object.entries(
      params
    )
  ) {
    if (v != null) {
      full.searchParams.set(
        k,
        String(v)
      )
    }
  }

  const res = await fetch(
    full,
    {
      headers: {
        'User-Agent': UA,
        Accept:
          'application/json',
      },
      redirect: 'follow',
    }
  )

  if (!res.ok) {
    const text =
      await res
        .text()
        .catch(() => '')

    throw new Error(
      `API ${res.status}: ${text.slice(
        0,
        180
      )}`
    )
  }

  return res.json()
}

function normalizeUrl(input) {
  if (
    !input ||
    typeof input !== 'string'
  ) {
    throw new Error(
      'URL kosong atau tidak valid'
    )
  }

  let url = input
    .trim()
    .replace(
      /^['"]|['"]$/g,
      ''
    )
    .replace(/\s+/g, '')

  url = url.replace(
    /^https?:\/\/m\.soundcloud\.com/i,
    'https://soundcloud.com'
  )

  if (
    !/^https?:\/\//i.test(url)
  ) {
    url =
      'https://' + url
  }

  url = url.replace(
    /^http:/i,
    'https:'
  )

  let parsed

  try {
    parsed = new URL(url)
  } catch {
    throw new Error(
      'Format URL tidak dikenali'
    )
  }

  if (
    !parsed.hostname.endsWith(
      'soundcloud.com'
    ) &&
    !parsed.hostname.includes(
      'snd.sc'
    ) &&
    !parsed.hostname.includes(
      'on.soundcloud'
    )
  ) {
    throw new Error(
      'Bukan URL SoundCloud'
    )
  }

  parsed.hash = ''
  parsed.search = ''

  return (
    parsed.origin +
    parsed.pathname
  ).replace(
    /\/+$/,
    ''
  )
}

export async function resolve(
  url
) {
  let clean =
    normalizeUrl(url)

  if (
    /on\.soundcloud\.com|snd\.sc|soundcloud\.app\.goo\.gl/i.test(
      clean
    )
  ) {
    try {
      const r = await fetch(
        clean,
        {
          redirect:
            'manual',
          headers: {
            'User-Agent': UA,
          },
        }
      )

      const loc =
        r.headers.get(
          'location'
        )

      if (loc) {
        clean =
          normalizeUrl(loc)
      }
    } catch {}
  }

  let data =
    await api('/resolve', {
      url: clean,
    })

  if (!data?.kind) {
    const alt = clean.replace(
      '://soundcloud.com',
      '://www.soundcloud.com'
    )

    data =
      await api('/resolve', {
        url: alt,
      }).catch(
        () => null
      )
  }

  if (!data?.kind) {
    throw new Error(
      `Gagal resolve: ${clean}`
    )
  }

  return data
}

async function resolveStream(
  transcoding
) {
  if (!transcoding?.url) {
    return null
  }

  try {
    const data =
      await api(
        transcoding.url
      )

    return (
      data?.url ||
      null
    )
  } catch {
    return null
  }
}

async function formatTrack(
  track
) {
  const trans =
    track.media
      ?.transcodings ||
    []

  const progressive =
    trans.find(
      (t) =>
        t.format?.protocol ===
          'progressive' &&
        t.format?.mime_type?.includes(
          'mpeg'
        )
    )

  const hls =
    trans.find(
      (t) =>
        t.format?.protocol ===
          'hls' &&
        (
          t.format?.mime_type?.includes(
            'mpeg'
          ) ||
          t.format?.mime_type?.includes(
            'mp4'
          )
        )
    )

  const [
    streamUrl,
    downloadUrl,
  ] = await Promise.all([
    resolveStream(
      hls ||
        progressive
    ),

    resolveStream(
      progressive ||
        hls
    ),
  ])

  return {
    kind: 'track',
    id: track.id,
    title: track.title,

    artist:
      track.user?.username ||
      track.user?.full_name ||
      null,

    artist_url:
      track.user
        ?.permalink_url ||
      null,

    duration:
      track.duration,

    duration_sec:
      Math.round(
        (track.duration || 0) /
          1000
      ),

    genre:
      track.genre ||
      null,

    description:
      track.description ||
      null,

    permalink_url:
      track.permalink_url,

    artwork_url:
      track.artwork_url
        ?.replace(
          '-large',
          '-t500x500'
        ) ||
      track.artwork_url ||
      null,

    playback_count:
      track.playback_count,

    likes_count:
      track.likes_count,

    created_at:
      track.created_at,

    stream:
      streamUrl,

    download:
      downloadUrl ||
      streamUrl,
  }
}

async function fetchTracksByIds(
  ids
) {
  if (!ids.length) {
    return []
  }

  const results = []

  for (
    let i = 0;
    i < ids.length;
    i += 50
  ) {
    const chunk =
      ids.slice(
        i,
        i + 50
      )

    try {
      const data =
        await api(
          '/tracks',
          {
            ids: chunk.join(','),
            limit:
              chunk.length,
          }
        )

      if (
        Array.isArray(data)
      ) {
        results.push(
          ...data
        )
      } else if (
        data?.collection
      ) {
        results.push(
          ...data.collection
        )
      }
    } catch {}
  }

  return results
}

export async function get(
  url
) {
  const data =
    await resolve(url)

  if (
    data.kind === 'track'
  ) {
    return formatTrack(
      data
    )
  }

  if (
    data.kind ===
      'playlist' ||
    data.kind ===
      'system-playlist'
  ) {
    const partial =
      data.tracks ||
      []

    const ids =
      partial
        .map((t) => t.id)
        .filter(Boolean)

    let fullTracks =
      ids.length
        ? await fetchTracksByIds(
            ids
          )
        : []

    const map =
      new Map(
        fullTracks.map(
          (t) => [
            t.id,
            t,
          ]
        )
      )

    const tracks = []

    for (
      const t of partial
    ) {
      let track =
        map.get(t.id) ||
        (t.media ? t : null)

      if (!track) {
        track =
          await api(
            `/tracks/${t.id}`
          ).catch(
            () => null
          )
      }

      if (track) {
        tracks.push(
          await formatTrack(
            track
          )
        )
      }
    }

    return {
      kind: data.kind,
      id: data.id,

      title:
        data.title ||
        data.short_title ||
        null,

      description:
        data.description ||
        data.short_description ||
        null,

      user:
        data.user?.username ||
        'SoundCloud',

      track_count:
        data.track_count ||
        tracks.length,

      permalink_url:
        data.permalink_url,

      artwork_url:
        (
          data.artwork_url ||
          data.calculated_artwork_url ||
          ''
        ).replace(
          '-large',
          '-t500x500'
        ) ||
        null,

      tracks,
    }
  }

  return {
    kind: data.kind,
    id: data.id,

    title:
      data.title ||
      data.username ||
      data.full_name ||
      null,

    permalink_url:
      data.permalink_url,

    raw: data,
  }
}

// ─── CLI ───────────────────────────────────────────────────────────────
async function cli() {
  const args =
    process.argv.slice(2)

  const url =
    args.find(
      (a) =>
        !a.startsWith('-')
    )

  const pretty =
    args.includes(
      '--pretty'
    ) ||
    args.includes('-p')

  if (!url) {
    console.error(
      'Usage: node SoundCloud.js <url> [--pretty]'
    )

    process.exit(1)
  }

  try {
    const result =
      await get(url)

    console.log(
      pretty
        ? JSON.stringify(
            result,
            null,
            2
          )
        : JSON.stringify(
            result
          )
    )
  } catch (err) {
    console.error(
      JSON.stringify({
        error:
          err.message,
      })
    )

    process.exit(1)
  }
}

const isMain =
  process.argv[1] &&
  (
    fileURLToPath(
      import.meta.url
    ) ===
      process.argv[1] ||
    process.argv[1].endsWith(
      'SoundCloud.js'
    )
  )

if (isMain) cli()

export default {
  get,
  resolve,
  fetchClientId,
}
