import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Лог переменных окружения (не выводим значения токенов напрямую)
  console.log("Start fetch-xp");
  console.log("MEE6_TOKEN:", process.env.MEE6_TOKEN ? "✅" : "❌ missing");
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "✅" : "❌ missing");
  console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "✅" : "❌ missing");

  // Проверка авторизации
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn("Unauthorized request");
    return res.status(401).send('Unauthorized');
  }

  const allUsers = [];

  try {
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
      console.error("Supabase DB error:", error);
      return res.status(500).json({ error: 'DB write failed' });
    }

    console.log(`Success: Saved ${formatted.length} users`);
    return res.status(200).json({ message: 'XP saved to Supabase', total: formatted.length });

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
