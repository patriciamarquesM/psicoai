import { CID10, DSM5, searchCID, searchDSM, searchDescritor } from './codes.js';

function renderDatalist(el, items){
  el.innerHTML = items.map(it=>`<option value="${it.code}">${it.label}</option>`).join('');
}
function renderPills(container, items, onPick){
  container.classList.add('sugg');
  container.innerHTML = items.length
    ? 'Sugeridos: ' + items.map(it=>`<span class="pill" data-code="${it.code||it.term}" title="${it.label||it.term}">${it.code||it.term}</span>`).join('')
    : '<span class="muted small">Nenhuma sugestão.</span>';
  container.onclick = (ev)=>{
    const pill = ev.target.closest('.pill'); if(!pill) return;
    onPick(pill.dataset.code);
  };
}
function appendCodeToCommaList(input, code){
  const parts = (input.value||'').split(',').map(s=>s.trim()).filter(Boolean);
  if(!parts.includes(code)) parts.push(code);
  input.value = parts.join(', ');
  input.dispatchEvent(new Event('change'));
}

export function bindAutocomplete(){
  // datalists padrão
  renderDatalist(document.getElementById('cidList'), CID10);
  renderDatalist(document.getElementById('dsmList'), DSM5);

  const cidInput = document.getElementById('sessCID');
  const dsmInput = document.getElementById('sessDSM');
  const cidSugg  = document.getElementById('cidSugg');
  const dsmSugg  = document.getElementById('dsmSugg');
  const descSugg = document.getElementById('descSugg');

  function updateCID(){
    const token = cidInput.value.split(',').pop().trim();
    const items = token ? searchCID(token) : CID10.slice(0,8);
    renderPills(cidSugg, items, (code)=> appendCodeToCommaList(cidInput, code));
    renderDatalist(document.getElementById('cidList'), items);
    updateDescritor(token || dsmInput.value.split(',').pop().trim());
  }
  function updateDSM(){
    const token = dsmInput.value.split(',').pop().trim();
    const items = token ? searchDSM(token) : DSM5.slice(0,8);
    renderPills(dsmSugg, items, (code)=> appendCodeToCommaList(dsmInput, code));
    renderDatalist(document.getElementById('dsmList'), items);
    updateDescritor(token || cidInput.value.split(',').pop().trim());
  }
  function updateDescritor(token){
    const list = searchDescritor(token);
    // pílulas de descritor inserem códigos em ambos os campos (CID e DSM)
    descSugg.classList.add('sugg');
    descSugg.innerHTML = list.length
      ? 'Descritores: ' + list.map(d=>`<span class="pill" data-term="${d.term}" title="${d.term}">${d.term}</span>`).join('')
      : '<span class="muted small">—</span>';
    descSugg.onclick = (ev)=>{
      const pill = ev.target.closest('.pill'); if(!pill) return;
      const term = pill.dataset.term;
      const pick = list.find(d=>d.term===term);
      (pick?.codes?.cid||[]).forEach(c=> appendCodeToCommaList(cidInput, c));
      (pick?.codes?.dsm||[]).forEach(c=> appendCodeToCommaList(dsmInput, c));
    };
  }

  cidInput?.addEventListener('input', updateCID);
  dsmInput?.addEventListener('input', updateDSM);
  // inicial
  updateCID(); updateDSM();
}
