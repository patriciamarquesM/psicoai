import { DB } from './db.js';
import { analyzeTranscript } from './analysis.js';
import { hmacSha256Hex } from './utils.js';

function chips(arr){
  return arr && arr.length ? arr.map(x=>`<span style="display:inline-block;border:1px solid #ccc;border-radius:999px;padding:4px 8px;margin:2px 6px 2px 0;font-size:12px">${x}</span>`).join('') : '<em>—</em>';
}
async function buildSignature(payload){
  const s = DB.getSettings();
  const secret = s.signatureSecret || '';
  if(!secret) return {sig:'', note:'(Sem chave definida — assinatura desativada)'}; 
  const sig = await hmacSha256Hex(secret, payload);
  return {sig, note:`Assinado por ${s.clinicianName||'—'} (${s.clinicianReg||'—'})`};
}
// --- Relatório comparativo (dois períodos A x B) ---
export function bindReportUI(getActivePatientId, getFilters, getCompareRanges){
  // ... (suas ligações existentes para btnSingle e btnPeriod ficam como estão)

  const btnCompare = document.getElementById('pdfReportCompare');
  btnCompare?.addEventListener('click', async ()=>{
    const patientId = getActivePatientId();
    if(!patientId){ alert('Selecione um paciente.'); return; }
    const cmp = getCompareRanges ? getCompareRanges() : {A:{},B:{}};
    const s = DB.getSettings();
    const p = DB.getPatient(patientId);
    let all = DB.listRecordsByPatient(patientId);

    function filterRange(rg){
      const {from,to} = rg||{};
      return all.filter(r=>{
        if(from && new Date(r.createdAt)<new Date(from)) return false;
        if(to){ const end = new Date(to); end.setHours(23,59,59,999); if(new Date(r.createdAt)>end) return false; }
        return true;
      });
    }
    const A = filterRange(cmp.A);
    const B = filterRange(cmp.B);
    if(!A.length || !B.length){ alert('Ambos períodos precisam ter pelo menos uma sessão.'); return; }

    function metrics(arr){
      const total = arr.length;
      const min = arr.reduce((a,b)=>a+(parseInt(b.duration||0,10)||0),0);
      const tf={}, sf={}, cids=new Set(), dsms=new Set();
      arr.forEach(r=>{
        const an = analyzeTranscript(r.transcript||'');
        (an.topics||[]).forEach(t=> tf[t]=(tf[t]||0)+1 );
        (an.signals||[]).forEach(t=> sf[t]=(sf[t]||0)+1 );
        (r.cidCodes||[]).forEach(c=>cids.add(c));
        (r.dsmCodes||[]).forEach(c=>dsms.add(c));
      });
      const top = (obj, k=8)=> Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,k).map(([k,v])=>`${k} (${v})`);
      return {total, min, terms:top(tf,10), signals:top(sf,8), cids:[...cids], dsms:[...dsms]};
    }
    const mA = metrics(A), mB = metrics(B);

    function delta(a,b){ return (b-a>0?'+':'') + (b-a); }

    const payload = JSON.stringify({patient:p, cmp,
      sessions:{A:A.map(r=>r.id), B:B.map(r=>r.id)}, metrics:{A:mA, B:mB}});
    const {sig, note} = await (async()=>{ 
      const secret = DB.getSettings().signatureSecret; 
      if(!secret) return {sig:'', note:'(Sem chave definida — assinatura desativada)'}; 
      const { hmacSha256Hex } = await import('./utils.js'); 
      return {sig: await hmacSha256Hex(secret, payload), note:`Assinado por ${s.clinicianName||'—'} (${s.clinicianReg||'—'})`}; 
    })();

    const win = window.open('', '_blank');
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Relatório comparativo — ${p.nome}</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;color:#111}
      .box{border:1px solid #ddd;border-radius:10px;padding:12px;margin:12px 0}
      .kv span{display:inline-block;background:#f5f7ff;border:1px solid #e0e6ff;color:#2a3a8f;border-radius:999px;padding:6px 10px;margin:2px 6px 2px 0;font-size:12px}
      .sig{font-family:monospace;background:#f9f9f9;border:1px dashed #ccc;padding:8px;border-radius:8px}
      table{width:100%; border-collapse:collapse}
      th,td{border:1px solid #ddd; padding:6px}
      th{background:#f5f7ff; text-align:left}
      @media print{ .no-print{display:none} }
    </style></head><body>
      <h1>Relatório comparativo — ${p.nome}</h1>
      <p class="muted">Gerado em ${new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</p>

      <div class="box"><h2>Profissional</h2>
        <div class="kv"><span>${s.clinicianName||'—'}</span><span>${s.clinicianReg||'—'}</span></div>
      </div>

      <div class="box"><h2>Períodos</h2>
        <div class="kv">
          <span>A: ${cmp.A?.from||'—'} → ${cmp.A?.to||'—'}</span>
          <span>B: ${cmp.B?.from||'—'} → ${cmp.B?.to||'—'}</span>
        </div>
      </div>

      <div class="box"><h2>Métricas</h2>
        <table>
          <thead><tr><th></th><th>A</th><th>B</th><th>Δ (B−A)</th></tr></thead>
          <tbody>
            <tr><td>Sessões</td><td>${mA.total}</td><td>${mB.total}</td><td>${delta(mA.total, mB.total)}</td></tr>
            <tr><td>Minutos</td><td>${mA.min}</td><td>${mB.min}</td><td>${delta(mA.min, mB.min)}</td></tr>
            <tr><td>CID-10 (distintos)</td><td>${mA.cids.length}</td><td>${mB.cids.length}</td><td>${delta(mA.cids.length, mB.cids.length)}</td></tr>
            <tr><td>DSM-5 (distintos)</td><td>${mA.dsms.length}</td><td>${mB.dsms.length}</td><td>${delta(mA.dsms.length, mB.dsms.length)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="box"><h2>Conteúdo (Top termos/pistas)</h2>
        <div class="kv"><span><strong>Termos A:</strong> ${mA.terms.join(', ')||'—'}</span></div>
        <div class="kv"><span><strong>Termos B:</strong> ${mB.terms.join(', ')||'—'}</span></div>
        <div class="kv"><span><strong>Pistas A:</strong> ${mA.signals.join(', ')||'—'}</span></div>
        <div class="kv"><span><strong>Pistas B:</strong> ${mB.signals.join(', ')||'—'}</span></div>
      </div>

      <div class="box"><h2>Assinatura digital (HMAC-SHA-256)</h2>
        <p class="muted">${note}</p>
        <div class="sig">${sig||'—'}</div>
      </div>

      <p class="no-print"><button onclick="window.print()">Imprimir / Salvar como PDF</button></p>
    </body></html>`);
    win.document.close();
  });
}
