// hello-animation.js — cycling "Hello" in multiple languages like Apple Mac setup
// Loaded as plain <script> on blog pages — NO ES module syntax

(function () {
  function initHelloAnimation() {
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
      'Hello, World',
    ];

    let gi = 0;
    let ci = 0;
    let deleting = false;

    const TYPE_SPEED   = 68;
    const DELETE_SPEED = 32;
    const PAUSE_AFTER  = 1800;
    const PAUSE_BEFORE = 220;

    function tick() {
      const word = greetings[gi];

      if (!deleting) {
        ci++;
        el.textContent = word.slice(0, ci);
        if (ci === word.length) {
          deleting = true;
          setTimeout(tick, PAUSE_AFTER);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      } else {
        ci--;
        el.textContent = word.slice(0, ci);
        if (ci === 0) {
          deleting = false;
          gi = (gi + 1) % greetings.length;
          setTimeout(tick, PAUSE_BEFORE);
          return;
        }
        setTimeout(tick, DELETE_SPEED);
      }
    }

    tick();
  }

  // Auto-initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelloAnimation);
  } else {
    initHelloAnimation();
  }

  // Expose globally so ES module can call it too if needed
  window.__initHelloAnimation = initHelloAnimation;
})();
