import { DB } from './db.js';
import { validateCPF, sha256Hex, maskCPF, isEmail, uid } from './utils.js';
import { analyzeTranscript } from './analysis.js';
import { speechSupported, startDictation, stopDictation, currentBuffer } from './speech.js';
import { bindExportImportUI } from './export.js';
import { bindReportUI } from './report.js';   // <<< apenas UMA VEZ
import { initSettingsUI } from './settings.js';
import { bindAutocomplete } from './autocomplete.js';
import { updateCharts } from './charts.js';
import { transcribeFileOffline } from './stt_offline.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

let activePatientId = null;
let lastAnalysisText = '';
let filterFrom = null;
let filterTo = null;

function toast(msg){ console.log('[INFO]', msg); }

// ---------- Paciente: CRUD ----------
async function handlePatientSubmit(e){
  e.preventDefault();
  const form = e.target;
  const id = form.id.value || uid('pac');
  const nome = form.nome.value.trim();
  const cpfRaw = form.cpf.value.trim();
  const dob = form.dob.value;
  const email = form.email.value.trim();
  const endereco = form.endereco.value.trim();

  if(!validateCPF(cpfRaw)) { alert('CPF inválido.'); return; }
  if(!isEmail(email)) { alert('E-mail inválido.'); return; }

  const cpfHash = await sha256Hex(cpfRaw);
  const cpfMasked = maskCPF(cpfRaw);

  const p = { id, nome, cpfHash, cpfMasked, dob, email, endereco, createdAt: new Date().toISOString() };
  DB.upsertPatient(p);
  form.id.value = id;
  renderPatients($('#searchBox').value);
  renderRecordView();
  toast('Paciente salvo com sucesso.');
}

function fillForm(p){
  const form = $('#patientForm');
  form.id.value = p.id;
  form.nome.value = p.nome;
  form.cpf.value = '';
  form.dob.value = p.dob || '';
  form.email.value = p.email || '';
  form.endereco.value = p.endereco || '';
}

function clearForm(){
  const form = $('#patientForm');
  form.reset();
  form.id.value = '';
}

function renderPatients(query=''){
  const list = $('#patientList');
  const items = DB.listPatients(query);
  list.innerHTML = '';
  items.forEach(p=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="meta">
        <strong>${p.nome}</strong>
        <span class="small">CPF: ${p.cpfMasked} • Email: ${p.email}</span>
      </div>
      <div class="actions">
        <button class="btn" data-act="open" data-id="${p.id}">Abrir</button>
        <button class="btn" data-act="edit" data-id="${p.id}">Editar</button>
        <button class="btn danger" data-act="del" data-id="${p.id}">Excluir</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.onclick = (ev)=>{
    const btn = ev.target.closest('button[data-act]');
    if(!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    const p = DB.getPatient(id);
    if(act==='open'){ activePatientId = id; renderRecordView(); scrollToView('#recordView'); }
    if(act==='edit'){ fillForm(p); scrollToView('#patientForm'); }
    if(act==='del'){
      if(confirm(`Excluir paciente "${p.nome}" e todo o seu prontuário?`)){
        DB.deletePatient(id);
        if(activePatientId===id) activePatientId = null;
        renderPatients($('#searchBox').value);
        renderRecordView();
      }
    }
  };
}

function scrollToView(sel){
  const el = $(sel);
  el?.scrollIntoView({behavior:'smooth', block:'start'});
}

// ---------- Helpers: filtros ----------
function recordPassesFilter(rec){
  if(filterFrom){
    const d = new Date(rec.createdAt);
    if(d < new Date(filterFrom)) return false;
  }
  if(filterTo){
    const d = new Date(rec.createdAt);
    const end = new Date(filterTo);
    end.setHours(23,59,59,999);
    if(d > end) return false;
  }
  return true;
}

// ---------- Prontuário ----------
function renderRecordView(){
  const view = $('#recordView');
  if(!activePatientId){
    view.classList.add('empty');
    view.innerHTML = `<p>Selecione um paciente para visualizar o prontuário.</p>`;
    renderAnalysis('');
    return;
  }
  const p = DB.getPatient(activePatientId);
  let recs = DB.listRecordsByPatient(activePatientId).filter(recordPassesFilter);

  view.classList.remove('empty');
  view.innerHTML = `
    <div class="kv">
      <span class="chip">Nome: <strong>${p.nome}</strong></span>
      <span class="chip">CPF (mascarado): ${p.cpfMasked}</span>
      <span class="chip">E‑mail: ${p.email}</span>
      <span class="chip">Nascimento: ${p.dob||'-'}</span>
      <span class="chip">Entradas: ${recs.length}</span>
    </div>
    <div class="row" style="margin-top:10px;">
      <button id="newTranscription" class="btn primary">Nova transcrição</button>
    </div>
    <div id="recordsWrap"></div>
  `;

  $('#newTranscription').onclick = openTranscriptionModal;

  const wrap = $('#recordsWrap');
  wrap.innerHTML = recs.map(r=>{
    const chipsCID = (r.cidCodes||[]).map(c=>`<span class="chip">${c}</span>`).join(' ');
    const chipsDSM = (r.dsmCodes||[]).map(c=>`<span class="chip">${c}</span>`).join(' ');
    const custom = r.custom||{};
    const customHtml = Object.keys(custom).map(k=>`<span class="chip">${k}: ${custom[k]}</span>`).join(' ');
    return `
    <div class="record">
      <header>
        <div>
          <strong>${r.source==='mic'?'Ditado (microfone)':'Arquivo importado'}</strong>
          <div class="small">Registrado em ${new Date(r.createdAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</div>
          <div class="small">Duração: ${r.duration||'-'} min • Setting: ${r.setting||'-'}</div>
          ${r.interventions?`<div class="small">Intervenções: ${r.interventions}</div>`:''}
          ${(r.cidCodes?.length||0)>0?`<div class="small">CID‑10: ${chipsCID}</div>`:''}
          ${(r.dsmCodes?.length||0)>0?`<div class="small">DSM‑5: ${chipsDSM}</div>`:''}
          ${customHtml?`<div class="small">Campos: ${customHtml}</div>`:''}
        </div>
        <div class="actions">
          ${r.audioUrl?`<a class="btn" href="${r.audioUrl}" target="_blank" rel="noopener">Ouvir</a>`:''}
          <button class="btn" data-act="edit" data-id="${r.id}">Editar</button>
          <button class="btn danger" data-act="del" data-id="${r.id}">Excluir</button>
        </div>
      </header>
      <textarea data-id="${r.id}" class="transcript" rows="6">${(r.transcript||'')}</textarea>
    </div>`;
  }).join('') || `<p class="muted">Nenhuma transcrição neste período.</p>`;

  // ações
  wrap.onclick = (ev)=>{
    const btn = ev.target.closest('button[data-act]');
    if(!btn) return;
    const recId = btn.dataset.id;
    if(btn.dataset.act==='del'){
      if(confirm('Excluir esta entrada de transcrição?')){
        DB.deleteRecord(recId);
        renderRecordView();
      }
    } else if(btn.dataset.act==='edit'){
      const ta = wrap.querySelector(`textarea[data-id="${recId}"]`);
      ta?.focus();
    }
  };

  // autosave texto
  wrap.oninput = (ev)=>{
    const ta = ev.target.closest('textarea.transcript');
    if(!ta) return;
    const id = ta.dataset.id;
    const recsAll = DB.listRecordsByPatient(activePatientId);
    const rec = recsAll.find(x=>x.id===id);
    rec.transcript = ta.value;
    DB.updateRecord(rec);
    lastAnalysisText = ta.value;
    renderAnalysis(lastAnalysisText);
  };

  // análise: usa a transcrição mais recente dentro do filtro
  lastAnalysisText = recs[0]?.transcript || '';
  renderAnalysis(lastAnalysisText);
}

// ---------- Modal Transcrição ----------
function openTranscriptionModal(){
  const modal = $('#transcriptionModal');
  modal.classList.remove('hidden');

  // construir campos customizados conforme settings
  const s = DB.getSettings();
  const cont = $('#customFieldsContainer');
  cont.innerHTML = (s.customFields||[]).map(f=>
    `<label class="full">${f.label}<input data-custom="${f.id}" placeholder="${f.label}"></label>`
  ).join('');

  // Tabs
  const tabs = $$('.tab'); const panels = $$('.tab-panel');
  tabs.forEach(t=>t.onclick=()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const target = t.dataset.tab;
    panels.forEach(p=>p.classList.toggle('hidden', p.dataset.panel!==target));
  });

  const startBtn = $('#startMic');
  const stopBtn = $('#stopMic');
  const status = $('#micStatus');
  const live = $('#liveTranscript');

  if(!speechSupported()){
    startBtn.disabled = true; stopBtn.disabled = true;
    status.textContent = 'indisponível';
  } else {
    startBtn.onclick = ()=>{
      live.value = '';
      startBtn.disabled = true; stopBtn.disabled = false;
      startDictation({ onUpdate: (txt)=> live.value = txt, onStatus: (s)=> status.textContent = s });
    };
    stopBtn.onclick = ()=>{
      stopBtn.disabled = true; startBtn.disabled = false;
      stopDictation(); live.value = currentBuffer();
    };
  }

  $('#saveTranscript').onclick = ()=>{
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    let transcript = '';
    let source = '';
    let audioName = '';
    let audioUrl = '';

    if(activeTab==='mic'){ transcript = $('#liveTranscript').value.trim(); source = 'mic'; }
    else {
      source = 'upload';
      transcript = $('#pastedTranscript').value.trim();
      const f = $('#audioFile').files[0];
      if(f){ audioName = f.name; audioUrl = URL.createObjectURL(f); }
    }

    if(!activePatientId){ alert('Selecione um paciente antes.'); return; }
    if(!transcript && !audioUrl){
      if(!confirm('Salvar sem transcrição (apenas anexando o áudio)?')) return;
    }

    // Metadados
    const duration = parseInt($('#sessDuration').value || '0', 10) || null;
    const setting = $('#sessSetting').value.trim();
    const interventions = $('#sessInterv').value.trim();

    const cidCodes = ($('#sessCID').value || '')
      .split(',').map(s=>s.trim().toUpperCase()).filter(v=>/^[A-TV-Z]\d{2}(\.\d+)?$/.test(v)); // validação simples (CID-10)
    const dsmCodes = ($('#sessDSM').value || '')
      .split(',').map(s=>s.trim()).filter(v=>/^\d{3}(\.\d{2})?$/.test(v)); // simples (ex.: 300.02)

    const custom = {};
    (s.customFields||[]).forEach(f=>{
      const el = document.querySelector(`[data-custom="${f.id}"]`);
      if(el && el.value.trim()) custom[f.label] = el.value.trim();
    });

    DB.addRecord({
      id: uid('rec'),
      patientId: activePatientId,
      createdAt: new Date().toISOString(),
      source, audioName, audioUrl,
      transcript,
      duration, setting, interventions,
      cidCodes, dsmCodes,
      custom
    });

    renderRecordView();
// análise: usa a transcrição mais recente dentro do filtro
lastAnalysisText = recs[0]?.transcript || '';
renderAnalysis(lastAnalysisText);

// >>> NOVO: atualizar gráficos com as sessões filtradas
updateCharts(recs);

    closeTranscriptionModal();
  };

  $('#cancelTranscript').onclick = closeTranscriptionModal;
  $('#closeModal').onclick = closeTranscriptionModal;
}

function closeTranscriptionModal(){
  const modal = $('#transcriptionModal');
  const f = document.querySelector('#audioFile');
  if(f && f.files && f.files[0]) URL.revokeObjectURL(f.files[0]);
  modal.classList.add('hidden');
  ['#audioFile','#pastedTranscript','#liveTranscript','#sessDuration','#sessSetting','#sessInterv','#sessCID','#sessDSM']
    .forEach(id=>{ const el=document.querySelector(id); if(el) el.value=''; });
  $('#customFieldsContainer').innerHTML = '';
}

// ---------- Painel Inteligente ----------
function renderAnalysis(text){
  const panel = $('#analysisPanel');
  if(!text){
    panel.innerHTML = `<p class="muted">Inclua uma transcrição para ver o resumo, tópicos e comparações teóricas.</p>`;
    return;
  }
  const res = analyzeTranscript(text);
  panel.innerHTML = `
    <div class="box">
      <strong>Resumo automático</strong>
      <p>${res.summary || '<span class="muted">Sem conteúdo suficiente para resumir.</span>'}</p>
    </div>
    <div class="box">
      <strong>Termos salientes</strong>
      <p>${res.topics.map(t=>`<span class="chip">${t}</span>`).join(' ') || '<span class="muted">—</span>'}</p>
    </div>
    <div class="box">
      <strong>Geral — Pistas psicodinâmicas</strong>
      <p>${res.signals.length? res.signals.map(s=>`<span class="chip">${s}</span>`).join(' ') : '<span class="muted">—</span>'}</p>
    </div>
    <div class="box"><strong>Freud</strong><p>${res.freud?.length? res.freud.map(s=>`<span class="chip">${s}</span>`).join(' ') : '<span class="muted">—</span>'}</p></div>
    <div class="box"><strong>Klein</strong><p>${res.klein?.length? res.klein.map(s=>`<span class="chip">${s}</span>`).join(' ') : '<span class="muted">—</span>'}</p></div>
    <div class="box"><strong>Lacan</strong><p>${res.lacan?.length? res.lacan.map(s=>`<span class="chip">${s}</span>`).join(' ') : '<span class="muted">—</span>'}</p></div>
    <div class="box"><strong>Jung</strong><p>${res.jung?.length? res.jung.map(s=>`<span class="chip">${s}</span>`).join(' ') : '<span class="muted">—</span>'}</p></div>
    <div class="box"><strong>Observações clínicas</strong><ul>${(res.hints||[]).map(h=>`<li>${h}</li>`).join('') || '<li><span class="muted">—</span></li>'}</ul></div>
  `;
}

// ---------- Search & Filters ----------
function bindSearch(){
  const input = $('#searchBox');
  input.oninput = ()=> renderPatients(input.value);
  $('#applyFilter').onclick = ()=>{
    filterFrom = $('#filterFrom').value || null;
    filterTo   = $('#filterTo').value || null;
    renderRecordView();
  };
  $('#clearFilter').onclick = ()=>{
    $('#filterFrom').value=''; $('#filterTo').value='';
    filterFrom = filterTo = null;
    renderRecordView();
  };
}

// ---------- Init ----------
export function init(){
  $('#patientForm').addEventListener('submit', handlePatientSubmit);
  $('#resetForm').addEventListener('click', (e)=>{ e.preventDefault(); clearForm(); });
  renderPatients();
  bindSearch();
  renderRecordView();

  // Export/Import + Relatórios + Settings + Autocomplete + Charts
  bindExportImportUI();
  bindReportUI(
    ()=>activePatientId,
    ()=>({from: filterFrom, to: filterTo}),
    ()=>({ // <<< comparativo A/B pego direto dos inputs
      A: {from: document.getElementById('compAFrom').value || null, to: document.getElementById('compATo').value || null},
      B: {from: document.getElementById('compBFrom').value || null, to: document.getElementById('compBTo').value || null}
    })
  );
  initSettingsUI();
  bindAutocomplete();
}



