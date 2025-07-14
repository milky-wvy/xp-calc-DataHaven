// Запуск поиска XP по нику
async function searchXP() {
  const input = document.getElementById('xpInput');
  const username = input.value.trim();

  if (!username) {
    document.getElementById('result').innerText = '⚠️ Please enter a nickname';
    return;
  }

  try {
    const res = await fetch(`/api/get-xp?username=${encodeURIComponent(username)}`);
    if (!res.ok) {
      document.getElementById('result').innerText = '❌ User not found or XP not available.';
      return;
    }

    const data = await res.json();
    const xp = data.xp;
    const level = data.level;

    // Сохраняем последний ввод
    localStorage.setItem('lastUsername', username);

    // Статистика
    const minutes = xp / 9.5;
    const hours = minutes / 60;
    const days = hours / 24;

    document.getElementById('result').innerHTML = `
      <div class="result-grid">
        <div>
          <h3>🔑 Progress</h3>
          <p><strong>Level:</strong> ${level}</p>
          <p><strong>XP:</strong> ${xp.toLocaleString()}</p>
        </div>
        <div>
          <h3>📊 Your Stats</h3>
          <p><strong>Minutes:</strong> ${minutes.toFixed(2)}</p>
          <p><strong>Hours:</strong> ${hours.toFixed(2)}</p>
          <p><strong>Days:</strong> ${days.toFixed(2)}</p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById('result').innerText = '❌ Something went wrong.';
  }
}

// Автозагрузка по сохранённому нику
window.addEventListener('load', () => {
  const saved = localStorage.getItem('lastUsername');
  if (saved) {
    document.getElementById('xpInput').value = saved;
    searchXP();
  }

  // Тема
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('themeToggle').checked = true;
  }
});

// Переключение темы
document.getElementById('themeToggle').addEventListener('change', (e) => {
  if (e.target.checked) {
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
});
