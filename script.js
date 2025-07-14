document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('xpInput');
  const resultContainer = document.getElementById('result');
  const themeToggle = document.getElementById('themeToggle');
  const background = document.getElementById('background');

  const levels = [
    { xp: 1150, keys: '1 key' },
    { xp: 4675, keys: '2 keys' },
    { xp: 11825, keys: '2 keys' },
    { xp: 23850, keys: '2 keys' },
    { xp: 42000, keys: '2 keys' },
    { xp: 67525, keys: '3 keys' },
    { xp: 101675, keys: '3 keys' },
  ];

  async function searchXP() {
    const username = input.value.trim();
    if (!username) return;

    resultContainer.innerHTML = '⌛ Loading...';

    try {
      const res = await fetch(`/api/get-xp?username=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error('User not found or XP not available.');

      const data = await res.json();

      const nextLevels = levels.filter(lvl => lvl.xp > data.xp).map(lvl => {
        const diff = lvl.xp - data.xp;
        return `<li>${lvl.keys} — через ${diff.toLocaleString()} XP</li>`;
      });

      resultContainer.innerHTML = `
        <div>
          <h3>Player Info</h3>
          <p><strong>Username:</strong> ${data.username}</p>
          <p><strong>XP:</strong> ${data.xp.toLocaleString()}</p>
          <p><strong>Level:</strong> ${data.level}</p>
        </div>
        <div style="margin-top: 20px;">
          <h3>Keys Progress</h3>
          <ul>${nextLevels.length ? nextLevels.join('') : '<li>Все ключи собраны!</li>'}</ul>
        </div>
      `;
    } catch (err) {
      resultContainer.innerHTML = `<div class="error">❌ ${err.message}</div>`;
    }
  }

  // 🌙 Тема
  themeToggle.addEventListener('change', (e) => {
    document.body.classList.toggle('dark', e.target.checked);
  });

  // 🛠 Экспортируем функцию в глобал, чтобы кнопка работала
  window.searchXP = searchXP;
});
