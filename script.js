function calculateXP() {
  const input = document.getElementById('xpInput');
  const xp = parseInt(input.value);

  if (isNaN(xp) || xp < 0) {
    document.getElementById('result').innerText = '⚠️ Please enter a valid, non-negative XP amount.';
    return;
  }

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

  for (let i = 0; i < levels.length; i++) {
    if (xp < levels[i].xp) {
      string = levels[i].keys;
      target = levels[i].xp;
      break;
    }
  }

  if (target === 0) {
    document.getElementById('result').innerText = '🏆 You have reached the max level. You beast!';
    return;
  }

  const left = target - xp;
  const minute_lost = Math.round(left / 9.5);

  const days = Math.floor(minute_lost / 1440);
  const hours = Math.floor((minute_lost % 1440) / 60);
  const minutes = minute_lost % 60;

  const result = 
`📊 TIME SPENT ON THE SERVER:
XP: ${xp.toLocaleString()}
⏱ Minutes: ${minute.toFixed(2)}
🕒 Hours: ${hour.toFixed(2)}
📆 Days: ${day.toFixed(2)}

🎯 To reach ${string}, you need:
${days}d ${hours}h ${minutes}m`;

  document.getElementById('result').innerText = result;
}
