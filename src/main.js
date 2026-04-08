import './style.css';
import initThree from './three-scene.js';
import initAnimations from './animations.js';
import initCursor from './cursor.js';

// initialize features
initThree();
initCursor();
initAnimations();
// hello-animation is loaded via <script> tag in index.html and auto-inits

// nav: scrolled class + hamburger
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// hamburger menu (mobile)
const toggleBtn = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');

if (toggleBtn && navLinks) {
  toggleBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggleBtn.classList.toggle('open', open);
    toggleBtn.setAttribute('aria-expanded', open);
  });

  // close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggleBtn.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', false);
    });
  });

  // close menu on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      navLinks.classList.remove('open');
      toggleBtn.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', false);
    }
  });
}

// smooth anchor scroll (with offset for fixed nav)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    e.preventDefault();

    // href="#" or href="#hero" → scroll to top
    if (href === '#' || href === '#hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const el = document.querySelector(href);
    if (el) {
      // scroll-margin-top handles the nav offset natively;
      // use scrollIntoView for consistent cross-browser/iOS behavior
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// project card tilt
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateZ(0)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// contact form — mailto fallback
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const name    = document.getElementById('cf-name').value.trim();
    const email   = document.getElementById('cf-email').value.trim();
    const message = document.getElementById('cf-message').value.trim();
    const status  = document.getElementById('cf-status');
    const btn     = document.getElementById('cf-submit');

    if (!name || !email || !message) return;

    const subject = encodeURIComponent(`Portfolio Contact from ${name}`);
    const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    const mailto  = `mailto:putra.faris295@gmail.com?subject=${subject}&body=${body}`;

    // Open email client in new tab
    window.open(mailto, '_blank');

    // Show success feedback
    btn.textContent = '✓ Opening email client...';
    btn.disabled = true;
    status.style.display = 'block';
    status.style.color = '#6C8EF5';
    status.textContent = 'Your email client should open with the message pre-filled. Just hit Send!';

    setTimeout(() => {
      btn.textContent = 'Send Message';
      btn.disabled = false;
      status.style.display = 'none';
      contactForm.reset();
    }, 5000);
  });
}
