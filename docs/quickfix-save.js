// quickfix-save.js — intercepta o submit do formulário e salva no localStorage
(function(){
  const KEY = 'psicoai_db_v1';

  function uid(prefix='pac_'){ return prefix + Math.random().toString(36).slice(2,9); }
  function maskCPF(c){
    c = (c||'').replace(/\D/g,'').padStart(11,'0').slice(0,11);
    return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  async function sha256hex(str){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str||''));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function loadDB(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || {}; }catch(e){ return {}; }
  }
  function saveDB(db){ localStorage.setItem(KEY, JSON.stringify(db)); }

  async function handleSubmit(ev){
    const form = ev.target;
    if(!form || form.id !== 'patientForm') return;
    ev.preventDefault();
    ev.stopImmediatePropagation(); // impede outros handlers bugados

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    const nome = (data.nome||'').trim();
    const cpfRaw = (data.cpf||'').trim();
    const email = (data.email||'').trim();
    const dob = data.dob || '';
    const endereco = (data.endereco||'').trim();

    if(!nome || !cpfRaw || !email || !dob){
      alert('Preencha Nome, CPF, E-mail e Data de nascimento.');
      return;
    }

    const cpfNum = cpfRaw.replace(/\D/g,'');
    const cpfHash = await sha256hex(cpfNum || (nome+email));
    const cpfMasked = maskCPF(cpfNum);

    const pac = {
      id: data.id && data.id.trim() ? data.id : uid(),
      nome, cpfHash, cpfMasked, email, dob, endereco,
      createdAt: new Date().toISOString()
    };

    // grava no banco
    const db = loadDB();
    db.settings = db.settings || {};
    db.patients = db.patients || [];
    db.records = db.records || [];

    const idx = db.patients.findIndex(p=>p.id===pac.id);
    if(idx>=0) db.patients[idx] = { ...db.patients[idx], ...pac };
    else db.patients.push(pac);

    saveDB(db);
    alert('Paciente salvo com sucesso!');
    location.reload();
  }

  document.addEventListener('submit', handleSubmit, true); // captura antes dos outros
})();
