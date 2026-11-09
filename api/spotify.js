// Spotify: coba API download dulu; kalau gagal, pakai cuplikan 30 detik dari iTunes (selalu tersedia).
const B = 'https://api.zenzxz.my.id';
const H = { 'user-agent': 'Mozilla/5.0', accept: 'application/json' };
const why = (e) => (e.cause && (e.cause.code || e.cause.message)) || e.message;
const jget = async (u) => {
  const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
};

async function viaZenz(q) {
  let link = q;
  if (!/^https?:\/\//i.test(q)) {
    const s = await jget(B + '/search/spotify?q=' + encodeURIComponent(q));
    const first = s && s.result && s.result.results && s.result.results[0];
    if (!first) throw new Error('Lagu tidak ditemukan');
    link = 'https://open.spotify.com/track/' + first.id;
  }
  const d = await jget(B + '/download/spotify?url=' + encodeURIComponent(link));
  if (!d.status || !d.result || !d.result.download_url) throw new Error('Respons download kosong');
  return { title: d.result.title, artist: d.result.artist, thumbnail: d.result.thumbnail, audio: d.result.download_url };
}

async function viaItunes(q) {
  let term = q;
  if (/^https?:\/\//i.test(q)) { // link Spotify -> ambil judulnya lewat oEmbed
    const o = await jget('https://open.spotify.com/oembed?url=' + encodeURIComponent(q));
    term = o.title;
  }
  const r = await jget('https://itunes.apple.com/search?media=music&entity=song&limit=1&term=' + encodeURIComponent(term));
  const t = r.results && r.results[0];
  if (!t || !t.previewUrl) throw new Error('Lagu tidak ditemukan di iTunes');
  return { title: t.trackName, artist: t.artistName, thumbnail: (t.artworkUrl100 || '').replace('100x100', '400x400'), audio: t.previewUrl, preview: true };
}

module.exports = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Isi link atau judul lagu' });
  let e1;
  try { return res.json(await viaZenz(q)); } catch (e) { e1 = e; }
  try { return res.json(await viaItunes(q)); } catch (e2) {
    res.status(502).json({ error: 'Server download: ' + why(e1) + ' | Cadangan: ' + why(e2) });
  }
};
