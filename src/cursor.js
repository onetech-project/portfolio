// cursor.js — custom cursor for all pages
// Works as plain <script> tag (IIFE) AND as ES module import

(function () {
  function initCursor() {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let ringPos = { x: mouse.x, y: mouse.y };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
    });

    function loop() {
      ringPos.x += (mouse.x - ringPos.x) * 0.12;
      ringPos.y += (mouse.y - ringPos.y) * 0.12;
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
      requestAnimationFrame(loop);
    }
    loop();

    // scale on hover
    document.querySelectorAll('a, button, .project-card, .btn, .post-card').forEach(el => {
      el.addEventListener('mouseenter', () => { ring.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', () => { ring.classList.remove('cursor-hover'); });
    });
  }

  // Auto-initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCursor);
  } else {
    initCursor();
  }

  // Also expose for ES module context (main.js)
  window.__initCursor = initCursor;
})();
