import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // 🔐 Проверка доступа по секрету
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  const token = process.env.MEE6_TOKEN;
  const guildId = "1317255994459426868";

  if (!token) {
    return res.status(500).json({ error: "MEE6_TOKEN is not set" });
  }

  const allPlayers = [];
  let page = 0;

  while (true) {
    const url = `https://mee6.xyz/api/plugins/levels/leaderboard/${guildId}?limit=100&page=${page}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": token,
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch page ${page}: ${response.statusText}`
      });
    }

    const data = await response.json();
    const players = data?.players || [];

    if (players.length === 0) break;

    allPlayers.push(...players);
    console.log(`Fetched page ${page} (${players.length} players)`);
    page++;
    await new Promise(r => setTimeout(r, 500)); // ⏳ защитимся от спама
  }

  // 💾 Сохраняем JSON
  const filePath = path.resolve('./data/xp.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(allPlayers, null, 2));

  return res.status(200).json({
    message: "XP data saved successfully.",
    total: allPlayers.length
  });
}
