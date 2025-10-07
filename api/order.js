// api/order.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method Not Allowed' });
  try {
    const { icName = '', items = [], total = 0 } = req.body || {};
    if (!icName || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ ok:false, error:'Missing icName or items' });
    }

    // 1) Enviar a Discord
    const fmt = n => "$" + Number(n).toLocaleString("es-CO");
    const description = items.map(x => `• ${x.name} x${x.qty} — ${fmt(x.price * x.qty)}`).join('\n');
    const payload = {
      embeds: [{
        title: "📦 Nuevo pedido — Khusland (Distrito Capital)",
        description,
        color: 0xe5c77b,
        fields: [
          { name: "Nombre IC", value: icName, inline: true },
          { name: "Total", value: fmt(total), inline: true },
          { name: "Estado", value: "⏳ Pendiente (usa reacciones ✅ / ❌ para gestionar)" }
        ],
        footer: { text: "Khusland — La raíz del negocio legal" },
        timestamp: new Date().toISOString()
      }]
    };

    const wh = process.env.DISCORD_WEBHOOK_URL;
    if (!wh) return res.status(500).json({ ok:false, error:'Missing DISCORD_WEBHOOK_URL' });
    const wr = await fetch(wh, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    if (!wr.ok) {
      const t = await wr.text();
      console.error('Webhook error:', t);
    }

    // 2) Guardar en GitHub para el panel
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const branch = process.env.GITHUB_BRANCH || 'main';
    const filePath = process.env.GITHUB_FILE_PATH || 'data/orders.json';
    if (!repo || !token) {
      return res.status(200).json({ ok:true, warn:'Missing GitHub storage config' });
    }

    const ghHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' };

    const getUrl = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
    let sha = null;
    let orders = [];
    let gr = await fetch(getUrl, { headers: ghHeaders });
    if (gr.status === 200) {
      const j = await gr.json();
      sha = j.sha;
      const content = Buffer.from(j.content, 'base64').toString('utf-8');
      try { orders = JSON.parse(content); } catch { orders = []; }
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    orders.push({
      id, icName, items, total,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    const newContent = Buffer.from(JSON.stringify(orders, null, 2)).toString('base64');
    const putUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const pr = await fetch(putUrl, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `chore: append order ${id}`,
        content: newContent,
        sha,
        branch
      })
    });
    if (!pr.ok) {
      const t = await pr.text();
      console.error('GitHub write error:', t);
      return res.status(200).json({ ok:true, warn:'Order saved to Discord but not to GitHub' });
    }

    return res.status(200).json({ ok:true, id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, error:'Server error' });
  }
}
