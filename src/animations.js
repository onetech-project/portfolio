import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export default function initAnimations(){
  // hero text
  gsap.from('.hero-content',{y:30,opacity:0,duration:1,ease:'power3.out'});

  // about card
  gsap.from('.about-card',{x:-40,opacity:0,duration:.9,scrollTrigger:{trigger:'.about-card',start:'top 80%'}});

  // timeline items
  gsap.utils.toArray('.timeline-item').forEach((el,i)=>{
    gsap.from(el,{y:20,opacity:0,duration:.7,delay:i*0.12,scrollTrigger:{trigger:el,start:'top 85%'}});
  });

  // projects
  gsap.utils.toArray('.project-card').forEach((el,i)=>{
    gsap.from(el,{y:30,opacity:0,duration:.8,delay:i*0.08,scrollTrigger:{trigger:el,start:'top 88%'}});
  });

  // contact
  gsap.from('.contact-grid',{y:20,opacity:0,duration:.8,scrollTrigger:{trigger:'.contact-grid',start:'top 90%'}});
}
