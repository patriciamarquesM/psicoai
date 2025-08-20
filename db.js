const KEY = 'psicoai_db_v1';

const empty = ()=>({
  settings: {
    clinicianName: '', clinicianReg: '', signatureSecret: '',
    customFields: [] // [{id,label}]
  },
  patients: [], // {id, nome, cpfHash, cpfMasked, dob, email, endereco, createdAt}
  records: []   // {id, patientId, createdAt, source, audioName, audioUrl, transcript,
                //  duration, setting, interventions, cidCodes[], dsmCodes[], custom:{} }
});

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || empty(); }
  catch { return empty(); }
}
function save(db){ localStorage.setItem(KEY, JSON.stringify(db)); }

export const DB = {
  all(){ return load(); },

  // SETTINGS
  getSettings(){ return load().settings || empty().settings; },
  saveSettings(s){
    const db = load();
    db.settings = s;
    save(db);
  },

  // PATIENTS
  upsertPatient(p){
    const db = load();
    const i = db.patients.findIndex(x=>x.id===p.id);
    if(i>=0) db.patients[i] = p; else db.patients.push(p);
    save(db); return p;
  },
  deletePatient(id){
    const db = load();
    db.patients = db.patients.filter(p=>p.id!==id);
    db.records = db.records.filter(r=>r.patientId!==id);
    save(db);
  },
  listPatients(query=''){
    const db = load();
    const q = query.trim().toLowerCase();
    if(!q) return db.patients.sort((a,b)=>a.nome.localeCompare(b.nome));
    return db.patients.filter(p=>{
      return [p.nome, p.email, p.cpfMasked].some(v=>(v||'').toLowerCase().includes(q));
    }).sort((a,b)=>a.nome.localeCompare(b.nome));
  },
  getPatient(id){ return load().patients.find(p=>p.id===id); },

  // RECORDS
  addRecord(rec){
    const db = load();
    db.records.push(rec);
    save(db); return rec;
  },
  updateRecord(rec){
    const db = load();
    const i = db.records.findIndex(r=>r.id===rec.id);
    if(i>=0) db.records[i] = rec;
    save(db); return rec;
  },
  deleteRecord(id){
    const db = load();
    db.records = db.records.filter(r=>r.id!==id);
    save(db);
  },
  listRecordsByPatient(patientId){
    const db = load();
    return db.records
      .filter(r=>r.patientId===patientId)
      .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  }
};
