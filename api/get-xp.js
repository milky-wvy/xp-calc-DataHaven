import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { username } = req.query;

  if (!username) return res.status(400).json({ error: "Username is required" });

  const filePath = path.resolve('./data/xp.json');
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Data not found" });

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const player = data.find(p => p.username.toLowerCase() === username.toLowerCase());

  if (!player) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ username: player.username, xp: player.xp, level: player.level });
}
