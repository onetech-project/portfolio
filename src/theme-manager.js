// theme-manager.js
export default function initThemeManager() {
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
    if (html.classList.contains('light-mode')) toggle.textContent = '🌙';
    else if (html.classList.contains('dark-mode')) toggle.textContent = '☀️';
    else toggle.textContent = window.matchMedia('(prefers-color-scheme: dark)').matches ? '☀️' : '🌙';
  }

  function cycleTheme() {
    const html = document.documentElement;
    let newTheme = 'system';
    if (html.classList.contains('light-mode')) newTheme = 'dark';
    else if (html.classList.contains('dark-mode')) newTheme = 'system';
    else newTheme = 'light';
    localStorage.setItem('theme', newTheme);
    initTheme();
  }

  initTheme();

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', cycleTheme);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);
  }
}
