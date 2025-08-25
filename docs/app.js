import { init } from './components.js';
window.addEventListener('DOMContentLoaded', ()=>{ init(); });
(function themeSetup(){
  const KEY='psicoai_theme';
  const html=document.documentElement;
  html.dataset.theme = localStorage.getItem(KEY) || 'light';
  document.getElementById('themeToggle')?.addEventListener('click', ()=>{
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next; localStorage.setItem(KEY,next);
  });
})();


