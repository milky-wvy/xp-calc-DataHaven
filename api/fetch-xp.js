import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const GUILD_ID = '1317255994459426868';
const LIMIT = 100;
const MAX_PAGES = 103;

export default async function handler(req, res) {
  try {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const allUsers = [];

    for (let i = 0; i < MAX_PAGES; i++) {
      console.log(`Fetching page ${i}...`);
      const response = await fetch(
        `https://mee6.xyz/api/plugins/levels/leaderboard/${GUILD_ID}?limit=${LIMIT}&page=${i}`,
        {
          headers: {
            Authorization: process.env.MEE6_TOKEN,
            'User-Agent': 'XPCollector/1.0',
          },
        }
      );

      if (response.status === 429) {
        console.warn(`429 rate limit on page ${i} — pausing for 3 minutes...`);
        await sleep(180000); // ⏳ 3 минуты
        i--; // попробовать снова
        continue;
      }

      if (!response.ok) {
        console.error(`Failed to fetch page ${i}, status: ${response.status}`);
        break;
      }

      const data = await response.json();

      if (!data.players || data.players.length === 0) {
        console.log(`Page ${i} is empty. Stopping.`);
        break;
      }

      allUsers.push(...data.players);
      await sleep(200); // чуть больше между обычными запросами
    }

    if (!allUsers.length) {
      return res.status(500).json({ error: 'No player data fetched' });
    }

    const formatted = allUsers.map((p) => ({
      discord_id: p.id,
      username: p.username,
      xp: p.xp,
      level: p.level,
    }));

    const { error } = await supabase
      .from('users_xp')
      .upsert(formatted, { onConflict: ['discord_id'] });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'DB write failed', details: error.message });
    }

    return res.status(200).json({ message: 'XP saved to Supabase', total: formatted.length });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Unexpected server error', details: error.message });
  }
}
