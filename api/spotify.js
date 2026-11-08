const B = 'https://api.zenzxz.my.id';
module.exports = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Isi link atau judul lagu' });
  try {
    let link = q;
    if (!/^https?:\/\//i.test(q)) {
      const s = await (await fetch(B + '/search/spotify?q=' + encodeURIComponent(q))).json();
      const first = s && s.result && s.result.results && s.result.results[0];
      if (!first) return res.status(404).json({ error: 'Lagu tidak ditemukan' });
      link = 'https://open.spotify.com/track/' + first.id;
    }
    const d = await (await fetch(B + '/download/spotify?url=' + encodeURIComponent(link))).json();
    if (!d.status || !d.result || !d.result.download_url) return res.status(502).json({ error: 'Gagal ambil lagu' });
    res.json({ title: d.result.title, artist: d.result.artist, thumbnail: d.result.thumbnail, audio: d.result.download_url });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
