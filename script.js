function calculateXP() {
  const lvl5 = 1200;
  const lvl10 = 4700;
  const lvl15 = 11800;
  const lvl20 = 24000;
  const lvl25 = 42000;
  const lvl30 = 67000;
  const lvl35 = 109000;

  const input = document.getElementById('xpInput');
  const xp = parseInt(input.value);
  if (isNaN(xp) || xp < 0) return alert("Please enter a valid number");

  const minute = xp / 9.5;
  const hour = minute / 60;
  const day = hour / 24;

  let string = '';
  let target = 0;

  if (xp < lvl5) {
    string = '1 key';
    target = lvl5;
  } else if (xp < lvl10) {
    string = '2 keys';
    target = lvl10;
  } else if (xp < lvl15) {
    string = '2 keys';
    target = lvl15;
  } else if (xp < lvl20) {
    string = '2 keys';
    target = lvl20;
  } else if (xp < lvl25) {
    string = '2 keys';
    target = lvl25;
  } else if (xp < lvl30) {
    string = '3 keys';
    target = lvl30;
  } else if (xp < lvl35) {
    string = '3 keys';
    target = lvl35;
  } else {
    document.getElementById('result').innerText = 'You have reached the max level. You beast!';
    return;
  }

  const left = target - xp;
  const minute_lost = Math.round(left / 9.5);

  const days = Math.floor(minute_lost / 1440);
  const hours = Math.floor((minute_lost % 1440) / 60);
  const minutes = minute_lost % 60;

  const result = 
`
TIME SPENT ON THE SERVER:
Your XP: ${xp}
Your minutes: ${minute.toFixed(2)}
Your hours: ${hour.toFixed(2)}
Your days: ${day.toFixed(2)}

To reach ${string}, you need:
${days} days ${hours} hours ${minutes} minutes`;

  document.getElementById('result').innerText = result;
}
