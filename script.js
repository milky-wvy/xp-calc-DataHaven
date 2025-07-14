
const levels = [
  { xp: 1150, keys: '1 key' },
  { xp: 4675, keys: '2 keys' },
  { xp: 11825, keys: '2 keys' },
  { xp: 23850, keys: '2 keys' },
  { xp: 42000, keys: '2 keys' },
  { xp: 67525, keys: '3 keys' },
  { xp: 101675, keys: '3 keys' }
];

async function calculateXP() {
  const username = document.getElementById('xpInput').value.trim();
  const result = document.getElementById('result');
  const message = document.getElementById('realMooseMessage');
  result.innerHTML = '';
  message.textContent = '';

  if (!username) return;

  try {
    const res = await fetch(`/api/get-xp?username=${encodeURIComponent(username)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Unknown error');

    const { xp, level } = data;
    const minute = xp / 9.5;
    const hour = minute / 60;
    const day = hour / 24;

    let progressHTML = '';
    let statsHTML = `
      <h3>📊 Your Stats</h3>
      <p><strong>Username:</strong> ${data.username}</p>
      <p><strong>XP:</strong> ${xp.toLocaleString()}</p>
      <p><strong>Minutes:</strong> ${minute.toFixed(2)}</p>
      <p><strong>Hours:</strong> ${hour.toFixed(2)}</p>
      <p><strong>Days:</strong> ${day.toFixed(2)}</p>
    `;

    let target = 0, prev = 0, reward = '';
    for (let i = 0; i < levels.length; i++) {
      if (xp < levels[i].xp) {
        reward = levels[i].keys;
        target = levels[i].xp;
        prev = i === 0 ? 0 : levels[i - 1].xp;
        break;
      }
    }

    if (target === 0) {
      result.innerHTML = `<div>${statsHTML}</div>`;
      message.textContent = 'You are Real Moose!';
      result.style.justifyContent = 'center';
      return;
    }

    const left = target - xp;
    const minutesLeft = Math.round(left / 9.5);
    const days = Math.floor(minutesLeft / 1440);
    const hours = Math.floor((minutesLeft % 1440) / 60);
    const minutes = minutesLeft % 60;

    progressHTML = `
      <h3>🔑 Progress</h3>
      <p><strong>To reach:</strong> ${reward}</p>
      <p><strong>XP left:</strong> ${left.toLocaleString()}</p>
      <p><strong>Time:</strong> ${days}d ${hours}h ${minutes}m</p>
    `;

    result.innerHTML = `<div>${progressHTML}</div><div>${statsHTML}</div>`;
    result.style.justifyContent = 'space-between';

  } catch (e) {
    result.innerHTML = `<div class="error">❌ ${e.message}</div>`;
  }
}

window.onload = async () => {
  const savedXP = localStorage.getItem('xpInput');
  if (savedXP) {
    document.getElementById('xpInput').value = savedXP;
    calculateXP();
  }

  // Load leaderboard
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    const list = document.getElementById('leaderboardList');
    list.innerHTML = data.slice(0, 10).map(
      (u, i) => `<li>#${i + 1} ${u.username} — ${u.xp.toLocaleString()} XP</li>`
    ).join('');
  } catch {}
}
