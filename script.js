function calculateXP() {
  const input = document.getElementById('xpInput');
  const xp = parseInt(input.value);

  if (isNaN(xp) || xp < 0) {
    document.getElementById('result').innerHTML = '<div>⚠️ Please enter a valid, non-negative XP amount.</div>';
    return;
  }

  localStorage.setItem('xp', xp);

  const levels = [
    { xp: 1150, keys: '1 key' },
    { xp: 4675, keys: '2 keys' },
    { xp: 11825, keys: '2 keys' },
    { xp: 23850, keys: '2 keys' },
    { xp: 42000, keys: '2 keys' },
    { xp: 67525, keys: '3 keys' },
    { xp: 101675, keys: '3 keys' },
  ];

  const minute = xp / 9.5;
  const hour = minute / 60;
  const day = hour / 24;

  let string = '';
  let target = 0;
  let prev = 0;

  for (let i = 0; i < levels.length; i++) {
    if (xp < levels[i].xp) {
      string = levels[i].keys;
      target = levels[i].xp;
      prev = i === 0 ? 0 : levels[i - 1].xp;
      break;
    }
  }

  if (target === 0) {
    document.getElementById('result').innerHTML = '<div>🏆 You have reached the max level. You beast!</div>';
    document.getElementById('progressBar').style.width = '100%';
    return;
  }

  const left = target - xp;
  const minute_lost = Math.round(left / 9.5);

  const days = Math.floor(minute_lost / 1440);
  const hours = Math.floor((minute_lost % 1440) / 60);
  const minutes = minute_lost % 60;

  const leftColumn = `
    <h3>🔑 Progress</h3>
    <p><strong>To reach:</strong> ${string}</p>
    <p><strong>XP left:</strong> ${left.toLocaleString()}</p>
    <p><strong>Time:</strong> ${days}d ${hours}h ${minutes}m</p>
  `;

  const rightColumn = `
    <h3>📊 Your Stats</h3>
    <p><strong>XP:</strong> ${xp.toLocaleString()}</p>
    <p><strong>Minutes:</strong> ${minute.toFixed(2)}</p>
    <p><strong>Hours:</strong> ${hour.toFixed(2)}</p>
    <p><strong>Days:</strong> ${day.toFixed(2)}</p>
  `;

  document.getElementById('result').innerHTML = `
    <div>${leftColumn}</div>
    <div>${rightColumn}</div>
  `;

  const progress = ((xp - prev) / (target - prev)) * 100;
  document.getElementById('progressBar').style.width = `${Math.min(progress, 100)}%`;
}

// Restore data and theme
window.addEventListener('load', () => {
  const savedXP = localStorage.getItem('xp');
  if (savedXP) {
    document.getElementById('xpInput').value = savedXP;
    calculateXP();
  }

  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('themeToggle').checked = true;
  }
});

// Theme toggle
document.getElementById('themeToggle').addEventListener('change', (e) => {
  if (e.target.checked) {
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
});
