import { DB } from './db.js';
import { uid } from './utils.js';

const $ = sel => document.querySelector(sel);

function renderCustomFields(fields){
  const list = $('#customFieldsList');
  list.innerHTML = '';
  if(!fields.length){ list.innerHTML = '<p class="muted">Nenhum campo ainda. Adicione acima.</p>'; return; }
  fields.forEach(f=>{
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div class="meta"><strong>${f.label}</strong><span class="small">ID: ${f.id}</span></div>
      <div class="actions">
        <button class="btn" data-act="edit" data-id="${f.id}">Renomear</button>
        <button class="btn danger" data-act="del" data-id="${f.id}">Excluir</button>
      </div>
    `;
    list.appendChild(el);
  });
  list.onclick = (ev)=>{
    const btn = ev.target.closest('button[data-act]');
    if(!btn) return;
    const id = btn.dataset.id;
    const s = DB.getSettings();
    if(btn.dataset.act==='del'){
      if(confirm('Remover este campo customizado?')) {
        s.customFields = s.customFields.filter(x=>x.id!==id);
        DB.saveSettings(s);
        renderCustomFields(s.customFields);
      }
    }
    if(btn.dataset.act==='edit'){
      const f = s.customFields.find(x=>x.id===id);
      const nv = prompt('Novo rótulo:', f.label);
      if(nv && nv.trim()){
        f.label = nv.trim();
        DB.saveSettings(s);
        renderCustomFields(s.customFields);
      }
    }
  };
}

export function initSettingsUI(){
  const s = DB.getSettings();
  $('#clinicianName').value = s.clinicianName||'';
  $('#clinicianReg').value = s.clinicianReg||'';
  $('#signatureSecret').value = s.signatureSecret||'';
  renderCustomFields(s.customFields||[]);

  $('#addField').onclick = ()=>{
    const label = $('#newFieldLabel').value.trim();
    if(!label) return;
    const cfg = DB.getSettings();
    cfg.customFields = cfg.customFields || [];
    cfg.customFields.push({id: uid('fld'), label});
    DB.saveSettings(cfg);
    $('#newFieldLabel').value = '';
    renderCustomFields(cfg.customFields);
  };

  $('#saveSettings').onclick = ()=>{
    const cfg = DB.getSettings();
    cfg.clinicianName = $('#clinicianName').value.trim();
    cfg.clinicianReg = $('#clinicianReg').value.trim();
    cfg.signatureSecret = $('#signatureSecret').value;
    DB.saveSettings(cfg);
    alert('Configurações salvas.');
  };

  $('#resetSettings').onclick = ()=>{
    if(!confirm('Restaurar configurações padrão?')) return;
    DB.saveSettings({clinicianName:'', clinicianReg:'', signatureSecret:'', customFields:[]});
    initSettingsUI();
  };
}
