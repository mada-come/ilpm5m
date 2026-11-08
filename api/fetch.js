// Cek URL: status, tipe, ukuran, dan cuplikan isi. Alamat internal/lokal diblokir.
const BLOCK = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$|.*\.(local|internal)$)/i;
module.exports = async (req, res) => {
  let u;
  try { u = new URL(req.query.url); } catch { return res.status(400).json({ error: 'Link tidak valid' }); }
  if (!/^https?:$/.test(u.protocol) || BLOCK.test(u.hostname)) return res.status(400).json({ error: 'Alamat tidak diizinkan' });
  try {
    const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'Mozilla/5.0' } });
    const type = r.headers.get('content-type') || '';
    const out = { status: r.status, url: r.url, type, size: r.headers.get('content-length') };
    if (/text|json|xml|javascript/i.test(type)) out.preview = (await r.text()).slice(0, 3000);
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
