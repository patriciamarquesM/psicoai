// shell.js — cabeçalho, navegação e tema (claro/escuro) para todas as páginas
(function(){
  const PAGES = [
    { href:'index.html',        label:'Dashboard' },
    { href:'pacientes.html',    label:'Pacientes' },
    { href:'prontuario.html',   label:'Prontuário' },
    { href:'transcricao.html',  label:'Transcrição' },
    { href:'relatorios.html',   label:'Relatórios' },
    { href:'configuracoes.html',label:'Configurações' },
  ];

  // Tema persistente
  const KEY='psicoai_theme';
  const html=document.documentElement;
  html.dataset.theme = localStorage.getItem(KEY) || 'light';

  function renderShell(){
    const path = location.pathname.split('/').pop() || 'index.html';
    const active = PAGES.find(p => p.href === path) || PAGES[0];

    const top = document.createElement('header');
    top.className = 'topbar';
    top.innerHTML = `
      <div class="brand"><h1>PsicoAi</h1></div>
      <nav class="topnav">
        ${PAGES.map(p=>`
          <a class="navlink ${p.href===active.href?'active':''}" href="${p.href}">${p.label}</a>
        `).join('')}
      </nav>
      <button id="themeToggle" class="icon-btn" title="Claro/Escuro">🌓</button>
    `;

    // Breadcrumb simples
    const bc = document.createElement('div');
    bc.className = 'breadcrumb';
    bc.innerHTML = `<span>${active.label}</span>`;

    // Injeta no body (antes do conteúdo)
    document.body.prepend(bc);
    document.body.prepend(top);

    // botão de tema
    document.getElementById('themeToggle')?.addEventListener('click', ()=>{
      const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next; localStorage.setItem(KEY,next);
    });
  }

  // pequenos estilos para navegação (não poluem seu styles.css)
  const css = `
    .topbar{ display:flex; gap:12px; align-items:center; }
    .topnav{ display:flex; gap:10px; margin-left:8px }
    .navlink{ padding:6px 10px; border-radius:8px; color:var(--muted); text-decoration:none; border:1px solid transparent }
    .navlink.active{ color:var(--text); border-color:var(--border); background:var(--surface) }
    .navlink:hover{ color:var(--primary); border-color:var(--primary) }
    .breadcrumb{ max-width:1200px; margin:10px auto 0; padding:0 16px; color:var(--muted); font-size:12.5px }
    .container{ max-width:1200px; margin:12px auto; padding:0 16px; display:grid; gap:16px }
    .panel{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; box-shadow:var(--shadow) }
    h2{ margin:0 0 8px; font-size:16px; font-weight:650 }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  renderShell();
})();
