// hello-animation.js
export default function initHelloAnimation() {
  const el = document.querySelector('.brand-hello')
  if (!el) return

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
  ]

  let gi = 0
  let ci = 0
  let deleting = false

  const TYPE_BASE = 58
  const DELETE_BASE = 34
  const PAUSE_AFTER = 1500
  const PAUSE_BEFORE = 220

  function getDelay(char, isDeleting) {
    const base = isDeleting ? DELETE_BASE : TYPE_BASE
    const jitter = Math.floor(Math.random() * 36)
    if (!char) return base
    if (',.;:+/'.includes(char)) return base + 90 + jitter
    if ('!?'.includes(char)) return base + 130 + jitter
    if (char === ' ') return base + 20 + jitter
    return base + jitter
  }

  function tick() {
    const word = greetings[gi]
    el.classList.toggle('is-deleting', deleting)

    if (!deleting) {
      el.textContent = word.slice(0, ++ci)
      if (ci === word.length) {
        deleting = true
        setTimeout(tick, PAUSE_AFTER)
        return
      }
      setTimeout(tick, getDelay(word[ci - 1], false))
    } else {
      el.textContent = word.slice(0, --ci)
      if (ci === 0) {
        deleting = false
        gi = (gi + 1) % greetings.length
        setTimeout(tick, PAUSE_BEFORE)
        return
      }
      setTimeout(tick, getDelay(word[ci - 1], true))
    }
  }

  tick()
}
