// HD foto lewat iLoveIMG (upscale). Terima POST berisi gambar mentah (JPEG), kembalikan gambar hasil.
const TASK = 'r68zl88mq72xq94j2d5p66bn2z9lrbx20njsbw2qsAvgmzr11lvfhAx9kl87pp6yqgx7c8vg7sfbqnrr42qb16v0gj8jl5s0kq1kgp26mdyjjspd8c5A2wk8b4Adbm6vf5tpwbqlqdr8A9tfn7vbqvy28ylphlxdl379psxpd8r70nzs3sk1';
const SERVERS = ['api1g', 'api2g', 'api3g', 'api8g', 'api9g', 'api10g', 'api11g', 'api12g', 'api13g', 'api14g', 'api15g', 'api16g', 'api17g', 'api18g', 'api19g', 'api20g', 'api21g', 'api22g', 'api24g', 'api25g'];

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

async function getToken() {
  const html = await (await fetch('https://www.iloveimg.com/upscale-image', { headers: { 'user-agent': 'Mozilla/5.0' } })).text();
  const cfg = html.split('ilovepdfConfig = ')[1];
  const csrf = (html.match(/<meta name="csrf-token" content="([^"]+)"/) || [])[1];
  if (!cfg || !csrf) throw new Error('Gagal ambil token iLoveIMG');
  return { token: JSON.parse(cfg.split(';')[0]).token, csrf };
}

async function upscale(buf, scale) {
  const { token, csrf } = await getToken();
  const server = SERVERS[Math.floor(Math.random() * SERVERS.length)];
  const headers = { Authorization: 'Bearer ' + token, Origin: 'https://www.iloveimg.com/', Cookie: '_csrf=' + csrf, 'User-Agent': 'Mozilla/5.0' };

  const up = new FormData();
  up.append('name', 'image.jpg'); up.append('chunk', '0'); up.append('chunks', '1');
  up.append('task', TASK); up.append('preview', '1');
  up.append('file', new Blob([buf], { type: 'image/jpeg' }), 'image.jpg');
  const ur = await fetch(`https://${server}.iloveimg.com/v1/upload`, { method: 'POST', headers, body: up });
  if (!ur.ok) throw new Error('Upload ke iLoveIMG gagal (' + ur.status + ')');
  const uj = await ur.json();

  const f = new FormData();
  f.append('task', TASK); f.append('server_filename', uj.server_filename); f.append('scale', String(scale));
  const r = await fetch(`https://${server}.iloveimg.com/v1/upscale`, { method: 'POST', headers, body: f });
  if (!r.ok) throw new Error('Proses HD gagal (' + r.status + ')');
  return Buffer.from(await r.arrayBuffer());
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Gunakan POST' });
  const scale = req.query.scale === '4' ? 4 : 2;
  try {
    const buf = await readBody(req);
    if (!buf.length) return res.status(400).json({ error: 'Gambar kosong' });
    let out, err;
    for (let i = 0; i < 2 && !out; i++) { try { out = await upscale(buf, scale); } catch (e) { err = e; } }
    if (!out) return res.status(502).json({ error: err.message });
    res.setHeader('content-type', 'image/jpeg');
    res.status(200).end(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
