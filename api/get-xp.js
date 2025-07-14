import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const { data, error } = await supabase
    .from('users_xp')
    .select('username, xp, level')
    .ilike('username', username);

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({ error: "Database error", details: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  const player = data[0];
  return res.status(200).json({ username: player.username, xp: player.xp, level: player.level });
}
