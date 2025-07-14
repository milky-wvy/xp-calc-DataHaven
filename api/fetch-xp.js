import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const MEE6_LIMIT = 100;
const MEE6_TOTAL_PAGES = 103;

export default async function handler(req, res) {
  try {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("Unauthorized request");
      return res.status(401).send('Unauthorized');
    }

    console.log('Starting XP fetch...');
    console.log('MEE6_TOKEN:', process.env.MEE6_TOKEN ? 'present' : 'missing');

    const allPlayers = [];

    for (let i = 0; i < MEE6_TOTAL_PAGES; i++) {
      const page = i + 1;
      console.log(`Fetching page ${page}...`);

      const response = await fetch(`https://mee6.xyz/api/plugins/levels/leaderboard/1317255994459426868?limit=${MEE6_LIMIT}&page=${page}`, {
        headers: {
          Authorization: process.env.MEE6_TOKEN,
          'User-Agent': 'XPCollector/1.0'
        }
      });

      console.log(`Page ${page} response status: ${response.status}`);

      if (!response.ok) {
        console.warn(`Failed to fetch page ${page}, status: ${response.status}`);
        break;
      }

      const data = await response.json();
      console.log(`Page ${page} players count: ${data.players ? data.players.length : 0}`);

      if (!data.players || data.players.length === 0) {
        console.log('No more players data on this page, stopping.');
        break;
      }

      allPlayers.push(...data.players);
    }

    console.log(`Total players fetched: ${allPlayers.length}`);

    if (!allPlayers.length) {
      console.warn('No player data fetched.');
      return res.status(500).json({ error: 'No player data fetched' });
    }

    const formatted = allPlayers.map(p => ({
      username: p.username,
      xp: p.xp,
      level: p.level
    }));

    console.log('Formatted data sample:', formatted.slice(0, 3));

    const { error } = await supabase
      .from('users_xp')
      .upsert(formatted, { onConflict: ['username'] });

    if (error) {
      console.error('Supabase error details:', error);
      return res.status(500).json({ error: 'DB write failed', details: error.message });
    }

    console.log(`Successfully saved ${formatted.length} users`);

    return res.status(200).json({ message: 'XP saved to Supabase', total: formatted.length });

  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Unexpected server error', details: error.message });
  }
}
