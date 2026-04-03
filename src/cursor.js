export default function initCursor(){
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if(!dot||!ring) return;

  let mouse = {x:window.innerWidth/2,y:window.innerHeight/2};
  let ringPos = {x:mouse.x,y:mouse.y};

  window.addEventListener('mousemove', (e)=>{ mouse.x = e.clientX; mouse.y = e.clientY; dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`; });

  function loop(){
    ringPos.x += (mouse.x - ringPos.x) * 0.12;
    ringPos.y += (mouse.y - ringPos.y) * 0.12;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
    requestAnimationFrame(loop);
  }
  loop();

  // scale on hover
  document.querySelectorAll('a, button, .project-card, .btn').forEach(el=>{
    el.addEventListener('mouseenter', ()=>{ ring.style.transform += ' scale(1.25)'; });
    el.addEventListener('mouseleave', ()=>{ ring.style.transform = ring.style.transform.replace(' scale(1.25)',''); });
  });
}
