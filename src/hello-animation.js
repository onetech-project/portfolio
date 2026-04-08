// hello-animation.js
export default function initHelloAnimation() {
  const el = document.querySelector('.brand-hello');
  if (!el) return;

  const greetings = [
    'Hello, World', 'Halo, Dunia', 'こんにちは、世界', 'Bonjour, Monde',
    '안녕하세요', 'Hola, Mundo', 'مرحباً بالعالم', 'Ciao, Mondo',
    'Привет, Мир', 'Hello, World',
  ];

  let gi = 0, ci = 0, deleting = false;
  const TYPE_SPEED = 68, DELETE_SPEED = 32, PAUSE_AFTER = 1800, PAUSE_BEFORE = 220;

  function tick() {
    const word = greetings[gi];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(tick, PAUSE_AFTER); return; }
      setTimeout(tick, TYPE_SPEED);
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; gi = (gi + 1) % greetings.length; setTimeout(tick, PAUSE_BEFORE); return; }
      setTimeout(tick, DELETE_SPEED);
    }
  }
  tick();
}
