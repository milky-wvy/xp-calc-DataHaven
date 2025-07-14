import { createClient } from '@supabase/supabase-js';
import HttpsProxyAgent from 'https-proxy-agent';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getRandomProxy() {
  const { data, error } = await supabase.from('proxies').select('proxy_url');
  if (error || !data || data.length === 0) throw new Error('No proxies found');
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex].proxy_url;
}

async function fetchPage(i) {
  for (let attempts = 0; attempts < 5; attempts++) {
    const proxyUrl = await getRandomProxy();
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
      const res = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/1317255994459426868?limit=100&page=${i}`, {
        headers: {
          Authorization: process.env.MEE6_TOKEN,
          'User-Agent': 'XPCollector/1.0'
        },
        agent
      });

      if (res.status === 429) {
        console.warn(`Page ${i} got 429. Retrying in 3s...`);
        await wait(3000);
        continue;
      }

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

      const json = await res.json();
      return json.players || [];

    } catch (err) {
      console.error(`Error fetching page ${i} with proxy ${proxyUrl}:`, err.message);
      await wait(2000);
    }
  }
  return [];
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  const concurrency = 10;
  const totalPages = 103;
  const queue = Array.from({ length: totalPages }, (_, i) => i);
  const results = [];

  async function worker() {
    while (queue.length) {
      const page = queue.shift();
      console.log(`Fetching page ${page}...`);
      const players = await fetchPage(page);
      results.push(...players);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));

  const formatted = results.map(p => ({
    discord_id: p.id,
    username: p.username,
    xp: p.xp,
    level: p.level
  }));

  const unique = new Map();
  formatted.forEach(user => {
    unique.set(user.discord_id, user);
  });

  const deduplicated = Array.from(unique.values());

  const { error } = await supabase.from('users_xp').upsert(deduplicated, {
    onConflict: ['discord_id']
  });

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'DB write failed', details: error.message });
  }

  return res.status(200).json({
    message: 'XP saved to Supabase',
    fetched: results.length,
    unique: deduplicated.length
  });
}
