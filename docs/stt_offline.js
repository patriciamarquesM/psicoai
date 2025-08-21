// stt_offline.js — Transcrição offline de arquivo com Whisper (Transformers.js)
// Corrigido com loader de fallback (várias CDNs/versões) para evitar 404.

let transcriber = null;
let TF = null; // módulo da lib

const CANDIDATES = [
  // jsDelivr (v3 empacotado)
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.0.0/dist/transformers.min.js',
  // jsDelivr (v3 ESM)
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.0.0?module',
  // jsDelivr (v2 estável)
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0?module',
  // unpkg (v3 empacotado)
  'https://unpkg.com/@xenova/transformers@3.0.0/dist/transformers.min.js',
  // unpkg (v2 empacotado)
  'https://unpkg.com/@xenova/transformers@2.15.0/dist/transformers.min.js',
];

async function loadTransformers(setStatus){
  for (const url of CANDIDATES){
    try{
      setStatus?.(`carregando lib… (${new URL(url).host})`);
      const m = await import(/* @vite-ignore */ url);
      return m;
    }catch(e){
      console.warn('[STT] falhou importar', url, e);
      // tenta o próximo
    }
  }
  throw new Error('Não foi possível carregar Transformers.js de nenhuma CDN.');
}

async function ensureModel(setStatus){
  if (!TF){
    TF = await loadTransformers(setStatus);
    // cache em IndexedDB
    TF.env.useBrowserCache = true;
    TF.env.remoteModels = true;
  }
  if (!transcriber){
    setStatus?.('baixando modelo…');
    transcriber = await TF.pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny', // multilíngue, pequeno
      { quantized: true }
    );
    setStatus?.('modelo carregado');
  }
}

async function transcribeSelectedFile(){
  const fileInput = document.getElementById('audioFile');
  const statusEl  = document.getElementById('sttStatus');
  const btn       = document.getElementById('btnTranscribeFile');
  const ta        = document.getElementById('pastedTranscript');

  if(!fileInput || !fileInput.files || !fileInput.files[0]){
    alert('Escolha um arquivo de áudio primeiro.'); return;
  }
  const set = s => { if(statusEl) statusEl.textContent = s; };

  try{
    if(btn) btn.disabled = true;
    await ensureModel(set);
    set('transcrevendo…');
    const out = await transcriber(fileInput.files[0], {
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
    alert('Falha na transcrição offline. Veja o Console (F12) para detalhes.');
  }finally{
    if(btn) btn.disabled = false;
  }
}

// Event delegation (independe do components.js)
document.addEventListener('click', ev=>{
  const b = ev.target.closest('#btnTranscribeFile');
  if(!b) return;
  ev.preventDefault();
  transcribeSelectedFile();
});
