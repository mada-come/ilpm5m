module.exports = async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Link kosong' });
  try {
    const r = await (await fetch('https://www.tikwm.com/api/?hd=1&url=' + encodeURIComponent(url))).json();
    const d = r && r.data;
    if (!d) return res.status(502).json({ error: 'Gagal ambil video (link salah atau layanan down)' });
    const abs = (u) => (u && u[0] === '/' ? 'https://www.tikwm.com' + u : u);
    res.json({ title: d.title, author: d.author && (d.author.nickname || d.author.unique_id), cover: abs(d.cover), video: abs(d.hdplay || d.play), music: abs(d.music), images: d.images || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
