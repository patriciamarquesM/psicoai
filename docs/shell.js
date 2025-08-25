// shell.js — Cabeçalho, navegação e tema + CSS "FULL-WIDTH"
(function () {
  const PAGES = [
    { href: 'index.html',        label: 'Dashboard' },
    { href: 'pacientes.html',    label: 'Pacientes' },
    { href: 'prontuario.html',   label: 'Prontuário' },
    { href: 'transcricao.html',  label: 'Transcrição' },
    { href: 'relatorios.html',   label: 'Relatórios' },
    { href: 'configuracoes.html',label: 'Configurações' },
  ];

  // Tema persistente
  const THEME_KEY = 'psicoai_theme';
  const html = document.documentElement;
  html.dataset.theme = localStorage.getItem(THEME_KEY) || 'light';

  // Topo + navegação
  function renderTopbar() {
    const path = location.pathname.split('/').pop() || 'index.html';

    const top = document.createElement('header');
    top.className = 'topbar';
    top.innerHTML = `
      <div class="brand"><h1>PsicoAi</h1></div>
      <nav class="topnav">
        ${PAGES.map(p => `
          <a class="navlink ${p.href === path ? 'active' : ''}" href="${p.href}">${p.label}</a>
        `).join('')}
      </nav>
      <button id="themeToggle" class="icon-btn" title="Claro/Escuro">🌓</button>
    `;

    document.body.prepend(top);

    // toggle tema
    document.getElementById('themeToggle')?.addEventListener('click', () => {
      const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // CSS: força largura TOTAL e altura de página
  const css = `
    :root{ --topbar-h: 58px; }
    .topbar{ position:sticky; top:0; z-index:40; }
    /* FULL-WIDTH */
    .container{
      width:100%; max-width:none; min-height:calc(100vh - var(--topbar-h));
      padding:16px 24px 32px; display:block;
    }
    /* Nav */
    .topnav{ display:flex; gap:12px; margin-left:12px }
    .navlink{ padding:8px 12px; border-radius:10px; color:var(--muted); text-decoration:none; border:1px solid transparent }
    .navlink.active{ color:var(--text); border-color:var(--border); background:var(--surface) }
    .navlink:hover{ color:var(--primary); border-color:var(--primary) }
    /* Painéis ocupam toda a largura, com respiro */
    .panel{ width:100%; margin:0 0 16px; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  renderTopbar();
})();
