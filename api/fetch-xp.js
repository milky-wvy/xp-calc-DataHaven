import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  const allUsers = [];

  for (let i = 0; i < 103; i++) {
    const response = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/1317255994459426868?limit=100&page=${i}`, {
      headers: {
        Authorization: process.env.MEE6_TOKEN,
        'User-Agent': 'XPCollector/1.0'
      }
    });

    const data = await response.json();
    if (!data.players || data.players.length === 0) break;

    allUsers.push(...data.players);
  }

  const formatted = allUsers.map(p => ({
    username: p.username,
    xp: p.xp,
    level: p.level
  }));

  const { error } = await supabase
    .from('users_xp')
    .upsert(formatted, { onConflict: ['username'] });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'DB write failed' });
  }

  return res.status(200).json({ message: 'XP saved to Supabase', total: formatted.length });
}
