// hello-animation.js — cycling "Hello" in multiple languages like Apple Mac setup
export default function initHelloAnimation() {
  const el = document.querySelector('.brand-hello');
  if (!el) return;

  const greetings = [
    'Hello, World',
    'Halo, Dunia',
    'こんにちは、世界',
    'Bonjour, Monde',
    '안녕하세요',
    'Hola, Mundo',
    'مرحباً بالعالم',
    'Ciao, Mondo',
    'Привет, Мир',
    'Hello, World',  // back to English
  ];

  let gi = 0;       // greeting index
  let ci = 0;       // char index
  let deleting = false;
  let pauseTicks = 0;

  const TYPE_SPEED   = 68;   // ms per char typing
  const DELETE_SPEED = 32;   // ms per char deleting
  const PAUSE_AFTER  = 1800; // ms to hold full word
  const PAUSE_BEFORE = 220;  // ms before next word starts

  function tick() {
    const word = greetings[gi];

    if (!deleting) {
      // typing
      ci++;
      el.textContent = word.slice(0, ci);

      if (ci === word.length) {
        // fully typed — pause then delete
        deleting = true;
        setTimeout(tick, PAUSE_AFTER);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      // deleting
      ci--;
      el.textContent = word.slice(0, ci);

      if (ci === 0) {
        // fully deleted — move to next greeting
        deleting = false;
        gi = (gi + 1) % greetings.length;
        setTimeout(tick, PAUSE_BEFORE);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  // kick off
  el.textContent = '';
  setTimeout(tick, 400);
}
