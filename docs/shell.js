// shell.js — Pro Clinic Shell (Sidebar + limpeza do topo antigo)
(function () {
  const PAGES = [
    { href:'index.html',        label:'Dashboard',    icon:'🏠' },
    { href:'pacientes.html',    label:'Pacientes',    icon:'👤' },
    { href:'prontuario.html',   label:'Prontuário',   icon:'🗂️' },
    { href:'transcricao.html',  label:'Transcrição',  icon:'🎙️' },
    { href:'relatorios.html',   label:'Relatórios',   icon:'📄' },
    { href:'configuracoes.html',label:'Configurações',icon:'⚙️' },
  ];
  const THEME_KEY='psicoai_theme';
  const html=document.documentElement;
  html.dataset.theme = localStorage.getItem(THEME_KEY) || 'light';

  // --- LIMPA topbar/nav antigos (evita sobreposição) ---
  function cleanupLegacyTop(){
    document.querySelectorAll('header.topbar, .topbar, nav.topnav').forEach(el=>el.remove());
    const oldToggle = document.querySelector('#themeToggle.icon-btn');
    if (oldToggle) oldToggle.remove();
  }

  // --- Monta layout: sidebar fixa + main + cabeçalho da página ---
  function mountLayout(){
    const path = location.pathname.split('/').pop() || 'index.html';
    const container = document.querySelector('.container') || (()=>{ const c=document.createElement('main'); c.className='container'; document.body.appendChild(c); return c; })();

    const layout  = document.createElement('div'); layout.className='layout';
    const sidebar = document.createElement('aside'); sidebar.className='sidebar';
    const main    = document.createElement('div'); main.className='main';

    sidebar.innerHTML = `
      <div class="brand"><h1>PsicoAi</h1></div>
      <nav class="nav">
        ${PAGES.map(p=>`<a class="${p.href===path?'active':''}" href="${p.href}"><span>${p.icon}</span><span>${p.label}</span></a>`).join('')}
      </nav>
      <div class="spacer"></div>
      <button id="themeToggle" class="themeBtn">🌓 Tema</button>
    `;

    const current = PAGES.find(p=>p.href===path) || PAGES[0];
    const head = document.createElement('div');
    head.className='pagehead';
    head.innerHTML = `<h2>${current.icon} ${current.label}</h2><div class="page-actions"></div>`;

    container.parentNode.insertBefore(layout, container);
    main.appendChild(head);
    main.appendChild(container);
    layout.appendChild(sidebar);
    layout.appendChild(main);

    // tema
    document.getElementById('themeToggle')?.addEventListener('click', ()=>{
      const next = html.dataset.theme==='dark' ? 'light' : 'dark';
      html.dataset.theme = next; localStorage.setItem(THEME_KEY,next);
    });
  }

  // --- Ações rápidas por página (canto direito do cabeçalho) ---
  function addPageActions(){
    const actions = document.querySelector('.page-actions'); if(!actions) return;
    const file = location.pathname.split('/').pop() || 'index.html';
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

  // --- CSS injetado (garante FULL e evita conflitos de topo antigo) ---
  const css = `
    :root{ --topbar-h:58px; }
    /* mata topbar/nav antigos se ainda aparecerem por cache */
    header.topbar, .topbar, nav.topnav, #themeToggle.icon-btn { display:none !important; }
    /* layout full */
    .layout{ display:grid; grid-template-columns:272px 1fr; min-height:100vh; }
    @media (max-width:980px){ .layout{ grid-template-columns:1fr } }
    .sidebar{ position:sticky; top:0; height:100vh; display:flex; flex-direction:column; gap:16px; padding:20px 16px; background:var(--surface); border-right:1px solid var(--border); }
    .brand{ display:flex; align-items:center; gap:10px } .brand h1{ margin:0; font-weight:700; font-size:18px }
    .nav{ display:flex; flex-direction:column; gap:6px; margin-top:6px }
    .nav a{ display:flex; gap:10px; align-items:center; padding:10px 12px; border-radius:10px; color:var(--muted); text-decoration:none; border:1px solid transparent }
    .nav a:hover{ color:var(--primary); border-color:var(--primary) }
    .nav a.active{ color:var(--text); background:var(--bg); border-color:var(--border) }
    .themeBtn{ border:1px solid var(--border); background:transparent; color:var(--muted); border-radius:10px; padding:8px 12px; cursor:pointer }
    .themeBtn:hover{ border-color:var(--primary); color:var(--primary) }
    .main{ min-height:100vh; display:flex; flex-direction:column }
    .pagehead{ display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid var(--border); background:linear-gradient(180deg, rgba(37,99,235,.06), transparent); }
    .pagehead h2{ margin:0; font-size:20px; font-weight:700 }
    .page-actions .btn{ margin-left:8px }
    .container{ width:100%; max-width:none; padding:24px 24px 40px; display:block }
    .panel{ width:100%; margin:0 0 16px; }
  `;
  const style=document.createElement('style'); style.textContent=css; document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', ()=>{
    cleanupLegacyTop();
    mountLayout();
    addPageActions();
  });
})();
