import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // важно: service role
);

export default async function handler(req, res) {
  try {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const allUsers = [];
    for (let i = 0; i < 103; i++) {
      console.log(`Fetching page ${i}...`);
      const response = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/1317255994459426868?limit=100&page=${i}`, {
        headers: {
          Authorization: process.env.MEE6_TOKEN,
          'User-Agent': 'XPCollector/1.0'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch page ${i}, status: ${response.status}`);
        break;
      }

      const data = await response.json();
      if (!data.players || data.players.length === 0) break;
      allUsers.push(...data.players);
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

    console.log("Sample data:", formatted.slice(0, 3));

    const { error } = await supabase
      .from('users_xp')
      .upsert(formatted, { onConflict: ['discord_id'] });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: 'DB write failed', details: error.message });
    }

    return res.status(200).json({ message: 'XP saved to Supabase', total: formatted.length });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: 'Unexpected server error', details: error.message });
  }
}
