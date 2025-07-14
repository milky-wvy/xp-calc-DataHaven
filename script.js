document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const searchBtn = document.getElementById('searchBtn');
  const checkBtn = document.getElementById('checkBtn');
  const resultContainer = document.getElementById('result');
  const xpStats = document.getElementById('xp-stats');
  const rewardsStats = document.getElementById('rewards-stats');

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
    try {
      const res = await fetch(`/api/get-xp?username=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error('User not found or XP not available.');
      return await res.json();
    } catch (err) {
      throw err;
    }
  }

  function updateUI(data) {
    resultContainer.classList.add('visible');
    xpStats.innerHTML = `
      <h3>Player Info</h3>
      <p><strong>Username:</strong> ${data.username}</p>
      <p><strong>XP:</strong> ${data.xp}</p>
      <p><strong>Level:</strong> ${data.level}</p>
    `;

    const remaining = rewardLevels
      .filter(lvl => lvl.xp > data.xp)
      .map(lvl => {
        const diff = lvl.xp - data.xp;
        return `<li>${lvl.keys} — через ${diff.toLocaleString()} XP</li>`;
      });

    rewardsStats.innerHTML = `
      <h3>Keys Progress</h3>
      <ul>${remaining.join('')}</ul>
    `;
  }

  function showError(message) {
    resultContainer.classList.add('visible');
    xpStats.innerHTML = '';
    rewardsStats.innerHTML = '';
    resultContainer.innerHTML = `<div class="error">❌ ${message}</div>`;
  }

  async function handleSearch() {
    const username = usernameInput.value.trim();
    if (!username) return;

    resultContainer.innerHTML = '';
    try {
      const data = await fetchXP(username);
      updateUI(data);
    } catch (err) {
      showError(err.message);
    }
  }

  searchBtn.addEventListener('click', handleSearch);
  checkBtn.addEventListener('click', handleSearch);
});
