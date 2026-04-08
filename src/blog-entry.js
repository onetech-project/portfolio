// blog-entry.js — shared entry for blog pages
// Imported as <script type="module"> by blog.html and blog-posts/index.html
import '../src/style.css';
import initHelloAnimation from '../src/hello-animation.js';
import initCursor from '../src/cursor.js';
import initThemeManager from '../src/theme-manager.js';

// Nav scroll class
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// Burger menu
const toggleBtn = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggleBtn && navLinks) {
  toggleBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggleBtn.classList.toggle('open', open);
    toggleBtn.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggleBtn.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', false);
    });
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      navLinks.classList.remove('open');
      toggleBtn.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', false);
    }
  });
}

initHelloAnimation();
initCursor();
initThemeManager();
