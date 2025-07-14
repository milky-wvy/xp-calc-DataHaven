import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  const allUsers = [];
  const maxPagesPerRun = 25;
  let pagesFetched = 0;

  try {
    for (let i = 0; i < 103; i++) {
      console.log(`Fetching page ${i}...`);
      const response = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/1317255994459426868?limit=100&page=${i}`, {
        headers: {
          Authorization: process.env.MEE6_TOKEN,
          'User-Agent': 'XPCollector/1.0'
        }
      });

      if (response.status === 429) {
        console.warn(`429 rate limited at page ${i}, retrying after 3 minutes...`);
        await wait(180000); // 3 мин
        i--; // попробуем снова ту же страницу
        continue;
      }

      const data = await response.json();

      if (!data.players || data.players.length === 0) break;

      allUsers.push(...data.players);
      pagesFetched++;

      if (pagesFetched % maxPagesPerRun === 0) {
        console.log(`Reached ${maxPagesPerRun} pages. Pausing 5 minutes...`);
        break;
      }

      await wait(3000); // Пауза 3 сек между запросами
    }

    if (allUsers.length === 0) {
      console.error("No player data fetched");
      return res.status(500).json({ error: 'No player data fetched' });
    }

    const formatted = allUsers.map(p => ({
      discord_id: p.id,
      username: p.username,
      xp: p.xp,
      level: p.level
    }));

    // Убираем дубликаты по discord_id
    const unique = new Map();
    formatted.forEach(user => {
      unique.set(user.discord_id, user);
    });

    const deduplicated = Array.from(unique.values());

    console.log(`Total players fetched: ${allUsers.length}`);
    console.log(`Unique entries: ${deduplicated.length}`);
    console.log("Sample:", deduplicated.slice(0, 3));

    const { error } = await supabase
      .from('users_xp')
      .upsert(deduplicated, { onConflict: ['discord_id'] });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: 'DB write failed', details: error.message });
    }

    return res.status(200).json({
      message: 'XP saved to Supabase',
      fetched: allUsers.length,
      unique: deduplicated.length
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: 'Unexpected server error', details: err.message });
  }
}
