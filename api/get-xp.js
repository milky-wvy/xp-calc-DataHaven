import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  const { data, error } = await supabase
    .from('users_xp')
    .select('username, xp, level')
    .ilike('username', username); // нечувствительный к регистру

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({ error: "Database error" });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  res.status(200).json(data[0]);
}
