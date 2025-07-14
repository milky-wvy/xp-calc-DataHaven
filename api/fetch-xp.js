import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_PAGES = 103;
const MAX_RETRIES = 10;

// ⚙️ Получаем список прокси из Supabase
async function getProxies() {
  const { data, error } = await supabase.from('proxies').select('proxy_url');
  if (error || !data) throw new Error('Failed to load proxies from Supabase');
  return data.map(p => p.proxy_url);
}

// 📥 Один запрос с ретраями
async function fetchPage(page, proxies) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    const agent = new HttpsProxyAgent({
      ...new URL(proxy),
      rejectUnauthorized: false
    });

    try {
      console.log(`Page ${page} | Attempt ${attempt} | Proxy: ${proxy}`);

      const res = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/1317255994459426868?limit=100&page=${page}`, {
        agent,
        headers: {
          Authorization: process.env.MEE6_TOKEN,
          'User-Agent': 'XPCollector/1.0'
        },
        timeout: 15000
      });

      if (!res.ok) {
        console.warn(`Page ${page} failed with status ${res.status}`);
        continue;
      }

      const data = await res.json();
      return data.players || [];

    } catch (err) {
      console.warn(`Page ${page} error: ${err.message}`);
    }
  }

  console.error(`Page ${page} failed after ${MAX_RETRIES} attempts`);
  return [];
}

// 🚀 Основной handler
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const proxies = await getProxies();
    if (!proxies.length) throw new Error('No proxies available');

    const allResults = await Promise.all(
      Array.from({ length: MAX_PAGES }, (_, i) => fetchPage(i, proxies))
    );

    const allPlayers = allResults.flat().filter(p => p && p.id && p.username);

    if (allPlayers.length === 0) {
      return res.status(500).json({ error: 'No data collected' });
    }

    const unique = new Map();
    allPlayers.forEach(p => {
      unique.set(p.id, {
        discord_id: p.id,
        username: p.username,
        xp: p.xp,
        level: p.level
      });
    });

    const deduped = Array.from(unique.values());

    const { error } = await supabase
      .from('users_xp')
      .upsert(deduped, { onConflict: ['discord_id'] });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: 'DB write failed', details: error.message });
    }

    return res.status(200).json({
      message: 'XP saved',
      total: deduped.length
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: 'Unexpected server error', details: err.message });
  }
}
