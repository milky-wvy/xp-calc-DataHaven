import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  try {
    // получаем с какой страницы начинать
    const { data: progressData } = await supabase
      .from('xp_fetch_progress')
      .select('last_page')
      .eq('id', 1)
      .single();

    let startPage = progressData?.last_page || 0;
    let endPage = startPage + 25;

    const allUsers = [];

    for (let i = startPage; i < endPage; i++) {
      console.log(`Fetching page ${i}...`);
      const response = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/1317255994459426868?limit=100&page=${i}`, {
        headers: {
          Authorization: process.env.MEE6_TOKEN,
          'User-Agent': 'XPCollector/1.0'
        }
      });

      if (response.status === 429) {
        console.warn(`429 at page ${i}, wait 3s...`);
        await sleep(3000);
        i--;
        continue;
      }

      const data = await response.json();
      if (!data.players || data.players.length === 0) break;

      allUsers.push(...data.players);

      await sleep(3000); // пауза между запросами
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

    const { error } = await supabase
      .from('users_xp')
      .upsert(formatted, { onConflict: ['discord_id'] });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: 'DB write failed', details: error.message });
    }

    // сохраняем прогресс
    await supabase
      .from('xp_fetch_progress')
      .upsert({ id: 1, last_page: endPage });

    return res.status(200).json({
      message: `XP saved to Supabase from pages ${startPage} to ${endPage - 1}`,
      total: formatted.length
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: 'Unexpected server error', details: err.message });
  }
}
