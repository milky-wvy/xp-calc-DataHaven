import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // обязательно service role!
);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const allUsers = [];

    for (let i = 0; i < 103; i++) {
      console.log(`Fetching page ${i}...`);
      const response = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/1317255994459426868?limit=100&page=${i}`, {
        headers: {
          Authorization: process.env.MEE6_TOKEN,
          'User-Agent': 'XPCollector/1.0'
        }
      });

      if (response.status === 429) {
        console.warn(`Rate limited at page ${i}, waiting 3s...`);
        await sleep(3000);
        i--; // повторим ту же страницу позже
        continue;
      }

      const data = await response.json();
      if (!data.players || data.players.length === 0) break;

      allUsers.push(...data.players);

      // 💤 Пауза между запросами — 3 секунды
      await sleep(3000);
    }

    if (allUsers.length === 0) {
      return res.status(500).json({ error: 'No player data fetched' });
    }

    const formatted = allUsers.map(p => ({
      discord_id: p.id,
      username: p.username,
      xp: p.xp,
      level: p.level
    }));

    console.log("Formatted data sample:", formatted.slice(0, 3));

    const { error } = await supabase
      .from('users_xp')
      .upsert(formatted, { onConflict: ['discord_id'] });

    if (error) {
      console.error("Supabase error details:", error);
      return res.status(500).json({ error: 'DB write failed', details: error.message });
    }

    return res.status(200).json({ message: 'XP saved to Supabase', total: formatted.length });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: 'Unexpected server error', details: err.message });
  }
}
