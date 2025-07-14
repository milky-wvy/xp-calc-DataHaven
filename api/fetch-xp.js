import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  const { data: proxyData, error: proxyError } = await supabase.from('proxies').select('proxy_url');
  if (proxyError || !proxyData || proxyData.length === 0) {
    return res.status(500).json({ error: 'Failed to fetch proxies' });
  }

  const proxyList = proxyData.map(p => p.proxy_url);

  const fetchPage = async (page) => {
    const proxyUrl = proxyList[Math.floor(Math.random() * proxyList.length)];
    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await fetch(
      `https://mee6.xyz/api/plugins/levels/leaderboard/1317255994459426868?limit=100&page=${page}`,
      {
        headers: {
          Authorization: process.env.MEE6_TOKEN,
          'User-Agent': 'XPCollector/1.0'
        },
        agent
      }
    );

    if (!response.ok) {
      console.warn(`Page ${page} failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.players || [];
  };

  const allUsers = [];

  const worker = async (page) => {
    console.log(`Fetching page ${page}...`);
    const users = await fetchPage(page);
    allUsers.push(...users);
  };

  const pages = Array.from({ length: 103 }, (_, i) => i);
  await Promise.all(pages.map(worker));

  if (allUsers.length === 0) {
    return res.status(500).json({ error: 'No player data fetched' });
  }

  const formatted = allUsers.map(p => ({
    discord_id: p.id,
    username: p.username,
    xp: p.xp,
    level: p.level
  }));

  const uniqueMap = new Map();
  formatted.forEach(user => uniqueMap.set(user.discord_id, user));
  const deduplicated = Array.from(uniqueMap.values());

  const { error } = await supabase
    .from('users_xp')
    .upsert(deduplicated, { onConflict: ['discord_id'] });

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'DB write failed', details: error.message });
  }

  return res.status(200).json({
    message: 'XP saved to Supabase',
    fetched: allUsers.length,
    unique: deduplicated.length
  });
}
