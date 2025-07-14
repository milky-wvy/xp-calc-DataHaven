import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const token = process.env.MEE6_TOKEN; // ⚠️ Указывай именно так в Vercel
  const guildId = "1317255994459426868";

  if (!token) return res.status(401).json({ error: "MEE6_TOKEN missing in env vars" });

  const allPlayers = [];
  let page = 0;

  while (true) {
    const url = `https://mee6.xyz/api/plugins/levels/leaderboard/${guildId}?limit=100&page=${page}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": token, // ⚠️ Без "Bearer"
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch: ${response.status}` });
    }

    const data = await response.json();
    if (!data.players || data.players.length === 0) break;

    allPlayers.push(...data.players);
    page++;
    await new Promise(r => setTimeout(r, 500)); // пауза между запросами
  }

  // Путь для сохранения
  const filePath = path.resolve('./data/xp.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(allPlayers, null, 2));

  res.status(200).json({ message: "Saved", count: allPlayers.length });
}
