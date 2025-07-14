document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const input = document.getElementById('xpInput');
  const result = document.getElementById('result');
  const mooseMessage = document.getElementById('realMoose');

  const rewardLevels = [
    { xp: 1150, keys: '1 key' },
    { xp: 4675, keys: '2 keys' },
    { xp: 11825, keys: '2 keys' },
    { xp: 23850, keys: '2 keys' },
    { xp: 42000, keys: '2 keys' },
    { xp: 67525, keys: '3 keys' },
    { xp: 101675, keys: '3 keys' },
  ];

  async function fetchXP(username) {
    const res = await fetch(`/api/get-xp?username=${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error('User not found or XP not available.');
    return await res.json();
  }

  function updateResult(user) {
    const { xp, username } = user;
    const minute = xp / 9.5;
    const hour = minute / 60;
    const day = hour / 24;

    let nextReward = rewardLevels.find(lvl => lvl.xp > xp);
    let prevXP = 0;
    let message = '';
    let leftBlock = '';
    let rightBlock = `
      <h3>📊 Your Stats</h3>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>XP:</strong> ${xp.toLocaleString()}</p>
      <p><strong>Minutes:</strong> ${minute.toFixed(2)}</p>
      <p><strong>Hours:</strong> ${hour.toFixed(2)}</p>
      <p><strong>Days:</strong> ${day.toFixed(2)}</p>
    `;

    if (!nextReward) {
      message = '🏆 Max level reached!';
      mooseMessage.classList.remove('hidden');
    } else {
      mooseMessage.classList.add('hidden');
      const left = nextReward.xp - xp;
      const timeLeft = Math.round(left / 9.5);
      const days = Math.floor(timeLeft / 1440);
      const hours = Math.floor((timeLeft % 1440) / 60);
      const minutes = timeLeft % 60;

      const index = rewardLevels.findIndex(l => l.xp === nextReward.xp);
      prevXP = index > 0 ? rewardLevels[index - 1].xp : 0;

      leftBlock = `
        <h3>🔑 Progress</h3>
        <p><strong>To reach:</strong> ${nextReward.keys}</p>
        <p><strong>XP left:</strong> ${left.toLocaleString()}</p>
        <p><strong>Time:</strong> ${days}d ${hours}h ${minutes}m</p>
      `;
    }

    result.innerHTML = `
      <div>${leftBlock}</div>
      <div>${rightBlock}</div>
    `;
  }

  async function handleSearch() {
    const username = input.value.trim();
    if (!username) return;

    result.innerHTML = '';
    mooseMessage.classList.add('hidden');

    try {
      const data = await fetchXP(username);
      updateResult(data);
    } catch (err) {
      result.innerHTML = `<div class="error">❌ ${err.message}</div>`;
    }
  }

  searchBtn.addEventListener('click', handleSearch);

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.checked = true;
  }
  themeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  });

  // Load leaderboard
  async function loadLeaderboard() {
    try {
      const res = await fetch('/api/get-leaderboard'); // 🔧 должен возвращать top 10
      const data = await res.json();
      const list = document.getElementById('leaderboard-list');
      list.innerHTML = data.map((user, i) =>
        `<li>#${i + 1} ${user.username} — ${user.xp.toLocaleString()} XP</li>`
      ).join('');
    } catch (err) {
      console.error('Failed to load leaderboard');
    }
  }

  loadLeaderboard();
});
