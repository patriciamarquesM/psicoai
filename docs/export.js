import { DB } from './db.js';

function download(filename, mime, content){
  const blob = new Blob([content], {type: mime});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

function csvEscape(v){
  if(v==null) return '';
  const s = String(v).replace(/"/g,'""');
  return /[",\n;]/.test(s) ? `"${s}"` : s;
}

function toCsv(rows){
  if(!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const head = headers.map(csvEscape).join(',');
  const lines = rows.map(r=>headers.map(h=>csvEscape(r[h])).join(','));
  return [head, ...lines].join('\n');
}

export function bindExportImportUI(){
  const btnJson = document.getElementById('exportJson');
  const btnCsvPatients = document.getElementById('exportCsvPatients');
  const btnCsvRecords = document.getElementById('exportCsvRecords');
  const btnImport = document.getElementById('importJsonBtn');
  const inputImport = document.getElementById('importJsonInput');

  btnJson?.addEventListener('click', ()=>{
    const data = DB.all();
    download(`psicoai_backup_${new Date().toISOString().slice(0,10)}.json`, 'application/json', JSON.stringify(data, null, 2));
  });

  btnCsvPatients?.addEventListener('click', ()=>{
    const {patients} = DB.all();
    const rows = patients.map(p=>({
      id: p.id,
      nome: p.nome,
      cpf_masked: p.cpfMasked,
      cpf_hash: p.cpfHash,
      dob: p.dob,
      email: p.email,
      endereco: p.endereco,
      createdAt: p.createdAt
    }));
    download(`psicoai_pacientes_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8', toCsv(rows));
  });

  btnCsvRecords?.addEventListener('click', ()=>{
    const {records} = DB.all();
    const rows = records.map(r=>({
      id: r.id,
      patientId: r.patientId,
      createdAt: r.createdAt,
      source: r.source,
      audioName: r.audioName||'',
      transcript: r.transcript||''
    }));
    download(`psicoai_prontuarios_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8', toCsv(rows));
  });

  btnImport?.addEventListener('click', ()=> inputImport.click());
  inputImport?.addEventListener('change', (ev)=>{
    const file = ev.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        if(!confirm('Importar este JSON e substituir o banco atual? (um backup é recomendado antes)')) return;
        localStorage.setItem('psicoai_db_v1', JSON.stringify(data));
        alert('Importação concluída.');
        location.reload();
      }catch(e){
        alert('JSON inválido: ' + e.message);
      }
    };
    reader.readAsText(file);
  });
}
