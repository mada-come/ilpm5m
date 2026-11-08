module.exports = async (req, res) => {
  const url = req.query.url;
  if (!/^https?:\/\//i.test(url || '')) return res.status(400).json({ error: 'Link harus diawali http:// atau https://' });
  try {
    const r = await fetch('https://shinana-bentosnap.hf.space/api/screenshot', {
      method: 'POST',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, device: 'desktop_fhd', dark_mode: false, wait_ms: 1500 })
    });
    const d = await r.json();
    const image = d && (d.url || d.image || d.result || d.output || (d.data && d.data.url));
    if (!image) return res.status(502).json({ error: 'Gagal ambil screenshot' });
    res.json({ image });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
