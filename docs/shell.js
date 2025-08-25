// shell.js — Pro Clinic Shell (Sidebar fixa + título da página + tema)
(function () {
  const PAGES = [
    { href: 'index.html',        label: 'Dashboard',    icon: '🏠' },
    { href: 'pacientes.html',    label: 'Pacientes',    icon: '👤' },
    { href: 'prontuario.html',   label: 'Prontuário',   icon: '🗂️' },
    { href: 'transcricao.html',  label: 'Transcrição',  icon: '🎙️' },
    { href: 'relatorios.html',   label: 'Relatórios',   icon: '📄' },
    { href: 'configuracoes.html',label: 'Configurações',icon: '⚙️' },
  ];
  const THEME_KEY = 'psicoai_theme';
  const html = document.documentElement;
  html.dataset.theme = localStorage.getItem(THEME_KEY) || 'light';

  // 1) Cria layout .layout (sidebar + main) e move a .container existente para dentro da .main
  function mountLayout() {
    const container = document.querySelector('.container') || (() => {
      const c = document.createElement('main'); c.className = 'container'; document.body.appendChild(c); return c;
    })();

    const layout = document.createElement('div'); layout.className = 'layout';
    const main   = document.createElement('div'); main.className   = 'main';
    const sidebar= document.createElement('aside'); sidebar.className = 'sidebar';

    // Sidebar
    const path = location.pathname.split('/').pop() || 'index.html';
    sidebar.innerHTML = `
      <div class="brand"><h1>PsicoAi</h1></div>
      <nav class="nav">
        ${PAGES.map(p => `
          <a class="${p.href===path ? 'active':''}" href="${p.href}">
            <span>${p.icon}</span><span>${p.label}</span>
          </a>
        `).join('')}
      </nav>
      <div class="spacer"></div>
      <button id="themeToggle" class="themeBtn">🌓 Tema</button>
    `;

    // Cabeçalho da página
    const current = PAGES.find(p => p.href===path) || PAGES[0];
    const head = document.createElement('div');
    head.className = 'pagehead';
    head.innerHTML = `
      <h2>${current.icon} ${current.label}</h2>
      <div class="page-actions"></div>
    `;

    // Encaixa
    container.parentNode.insertBefore(layout, container);
    main.appendChild(head);
    main.appendChild(container);
    layout.appendChild(sidebar);
    layout.appendChild(main);

    // Tema claro/escuro
    document.getElementById('themeToggle')?.addEventListener('click', ()=>{
      const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next; localStorage.setItem(THEME_KEY,next);
    });
  }

  // 2) Atalhos de ação por página (aparecem no canto direito do cabeçalho)
  function addPageActions() {
    const actions = document.querySelector('.page-actions');
    const file = location.pathname.split('/').pop() || 'index.html';
    if(!actions) return;

    const btn = (href,label,primary=false)=>`<a class="btn ${primary?'primary':''}" href="${href}">${label}</a>`;

    if(file==='index.html'){
      actions.innerHTML = btn('pacientes.html','Novo paciente',true) + btn('transcricao.html','Nova transcrição') + btn('prontuario.html','Abrir prontuário');
    } else if(file==='pacientes.html'){
      actions.innerHTML = btn('transcricao.html','Nova transcrição',true);
    } else if(file==='prontuario.html'){
      actions.innerHTML = btn('transcricao.html','Nova transcrição',true) + btn('relatorios.html','Gerar relatório');
    } else if(file==='transcricao.html'){
      actions.innerHTML = btn('prontuario.html','Ver prontuário',true);
    } else if(file==='relatorios.html'){
      actions.innerHTML = btn('prontuario.html','Voltar ao prontuário',true);
    } else if(file==='configuracoes.html'){
      actions.innerHTML = btn('pacientes.html','Pacientes');
    }
  }

  // Monta
  document.addEventListener('DOMContentLoaded', ()=>{
    mountLayout();
    addPageActions();
  });
})();
