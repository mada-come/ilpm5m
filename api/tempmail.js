const B = 'https://tempail.top/api', H = { 'user-agent': 'Postify/1.0.0' };
module.exports = async (req, res) => {
  const { action, token, id } = req.query;
  try {
    if (action === 'new') {
      const r = await (await fetch(B + '/email/create/ApiTempail', { method: 'POST', headers: H })).json();
      if (r.status !== 'success') throw new Error('Gagal membuat email');
      return res.json({ email: r.data.email, token: r.data.email_token, deletedIn: r.data.deleted_in });
    }
    if (action === 'inbox' && token) {
      const r = await (await fetch(B + '/messages/' + encodeURIComponent(token) + '/ApiTempail', { headers: H })).json();
      if (r.status !== 'success') throw new Error('Gagal ambil inbox');
      return res.json({ messages: r.data.messages || [] });
    }
    if (action === 'read' && id) {
      const r = await (await fetch(B + '/message/' + encodeURIComponent(id) + '/ApiTempail', { headers: H })).json();
      const m = r.status === 'success' && r.data && r.data[0];
      if (!m) throw new Error('Gagal ambil pesan');
      return res.json({ subject: m.subject, from: m.from, content: m.content });
    }
    res.status(400).json({ error: 'Parameter salah' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
