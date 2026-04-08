// Theme management for portfolio
function initTheme() {
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'system';
  
  if (savedTheme === 'system') {
    html.classList.remove('light-mode', 'dark-mode');
  } else if (savedTheme === 'light') {
    html.classList.add('light-mode');
    html.classList.remove('dark-mode');
  } else {
    html.classList.add('dark-mode');
    html.classList.remove('light-mode');
  }
  
  updateThemeButton();
}

function updateThemeButton() {
  const html = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;
  
  if (html.classList.contains('light-mode')) {
    toggle.textContent = '🌙';
  } else if (html.classList.contains('dark-mode')) {
    toggle.textContent = '☀️';
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    toggle.textContent = prefersDark ? '☀️' : '🌙';
  }
}

function cycleTheme() {
  const html = document.documentElement;
  let newTheme = 'system';
  
  if (html.classList.contains('light-mode')) {
    newTheme = 'dark';
  } else if (html.classList.contains('dark-mode')) {
    newTheme = 'system';
  } else {
    newTheme = 'light';
  }
  
  localStorage.setItem('theme', newTheme);
  initTheme();
}

// Initialize theme on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}

// Setup toggle listener
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('click', cycleTheme);
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);
    }
  });
} else {
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', cycleTheme);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);
  }
}
