// stt_offline.js — Transcrição offline de arquivo (Whisper tiny / Transformers.js)
// Funciona 100% no navegador. Primeiro uso baixa ~40–70 MB e cacheia (IndexedDB).

let transcriber = null;
let tf = null; // módulo carregado via CDN

async function ensureModel(setStatus) {
  setStatus?.('baixando modelo…');
  if (!tf) {
    tf = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@3.2.0');
    tf.env.useBrowserCache = true;
    tf.env.remoteModels = true;
  }
  if (!transcriber) {
    transcriber = await tf.pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      quantized: true
    });
  }
  setStatus?.('modelo carregado');
}

async function transcribeSelectedFile() {
  const fileInput = document.getElementById('audioFile');
  const statusEl  = document.getElementById('sttStatus');
  const btn       = document.getElementById('btnTranscribeFile');
  const ta        = document.getElementById('pastedTranscript');
  if (!fileInput || !fileInput.files || !fileInput.files[0]) {
    alert('Escolha um arquivo de áudio primeiro.');
    return;
  }
  const set = (s)=>{ if(statusEl) statusEl.textContent = s; };

  try{
    if(btn) btn.disabled = true;
    await ensureModel(set);
    set('transcrevendo…');
    const file = fileInput.files[0];
    const out = await transcriber(file, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false
    });
    set('pronto');
    ta.value = (ta.value ? ta.value.trim() + '\n\n' : '') + (out?.text || '');
    ta.dispatchEvent(new Event('input'));
  }catch(err){
    console.error('STT offline error:', err);
    set('erro');
    alert('Falha na transcrição offline. Abra F12 → Console para ver o erro detalhado.');
  }finally{
    if(btn) btn.disabled = false;
  }
}

// Liga o botão por event delegation (independe do components.js)
document.addEventListener('click', (ev)=>{
  const b = ev.target.closest('#btnTranscribeFile');
  if(!b) return;
  ev.preventDefault();
  transcribeSelectedFile();
});
