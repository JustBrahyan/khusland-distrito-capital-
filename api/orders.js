// api/orders.js
export default async function handler(req, res) {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const filePath = process.env.GITHUB_FILE_PATH || 'data/orders.json';
  if (!repo || !token) return res.status(500).json({ ok:false, error:'Storage not configured' });

  const ghHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' };

  async function fetchOrders() {
    const getUrl = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
    const gr = await fetch(getUrl, { headers: ghHeaders });
    if (gr.status === 404) return { orders: [], sha: null };
    if (!gr.ok) throw new Error('GitHub read failed');
    const j = await gr.json();
    const content = Buffer.from(j.content, 'base64').toString('utf-8');
    let orders = [];
    try { orders = JSON.parse(content); } catch { orders = []; }
    return { orders, sha: j.sha };
  }

  async function saveOrders(orders, sha) {
    const newB64 = Buffer.from(JSON.stringify(orders, null, 2)).toString('base64');
    const putUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const pr = await fetch(putUrl, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `chore: update orders`,
        content: newB64,
        sha,
        branch
      })
    });
    if (!pr.ok) throw new Error('GitHub write failed');
  }

  try {
    if (req.method === 'GET') {
      const { orders } = await fetchOrders();
      return res.status(200).json({ ok:true, orders });
    }

    if (req.method === 'PATCH') {
      const { id, status } = req.body || {};
      if (!id || !['pending','accepted','rejected'].includes(status)) {
        return res.status(400).json({ ok:false, error:'Bad payload' });
      }
      const { orders, sha } = await fetchOrders();
      const i = orders.findIndex(o => o.id === id);
      if (i < 0) return res.status(404).json({ ok:false, error:'Not found' });
      orders[i].status = status;
      orders[i].updatedAt = new Date().toISOString();
      await saveOrders(orders, sha);
      return res.status(200).json({ ok:true });
    }

    return res.status(405).json({ ok:false, error:'Method Not Allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, error:'Server error' });
  }
}
