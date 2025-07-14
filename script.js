const xpStats = document.getElementById("xp-stats");
const rewardsStats = document.getElementById("rewards-stats");
const form = document.querySelector("form");
const input = document.querySelector("input[name='username']");
const toggle = document.getElementById("dark-toggle");

const levels = [
  { xp: 1150, keys: "1 key" },
  { xp: 4675, keys: "2 keys" },
  { xp: 11825, keys: "2 keys" },
  { xp: 23850, keys: "2 keys" },
  { xp: 42000, keys: "2 keys" },
  { xp: 67525, keys: "3 keys" },
  { xp: 101675, keys: "3 keys" }
];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = input.value.trim();
  if (!username) return;

  xpStats.innerHTML = "Loading...";
  rewardsStats.innerHTML = "";

  try {
    const res = await fetch(`/api/get-xp?username=${encodeURIComponent(username)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Request failed");

    const { xp, level } = data;

    xpStats.innerHTML = `
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>XP:</strong> ${xp.toLocaleString()}</p>
      <p><strong>Level:</strong> ${level}</p>
    `;

    // Вывод расчёта до ключей
    const lines = levels.map((lvl) => {
      if (xp >= lvl.xp) {
        return `<li><strong>${lvl.keys}</strong> — уже получено ✅</li>`;
      } else {
        const remaining = lvl.xp - xp;
        return `<li><strong>${lvl.keys}</strong> — осталось ${remaining.toLocaleString()} XP</li>`;
      }
    });

    rewardsStats.innerHTML = `<ul>${lines.join("")}</ul>`;
  } catch (err) {
    xpStats.innerHTML = `<span style="color:red">❌ ${err.message}</span>`;
  }
});

toggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", toggle.checked);
});
