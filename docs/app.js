import { init } from './components.js';
window.addEventListener('DOMContentLoaded', ()=>{ init(); });
// Tema claro/escuro persistente (não quebra nada do app)
(function(){
  const KEY='psicoai_theme';
  const html=document.documentElement;
  html.dataset.theme = localStorage.getItem(KEY) || 'light';
  document.getElementById('themeToggle')?.addEventListener('click', ()=>{
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next; localStorage.setItem(KEY,next);
  });
})();

(function themeSetup(){
  const KEY='psicoai_theme';
  const html=document.documentElement;
  html.dataset.theme = localStorage.getItem(KEY) || 'light';
  document.getElementById('themeToggle')?.addEventListener('click', ()=>{
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next; localStorage.setItem(KEY,next);
  });
})();



