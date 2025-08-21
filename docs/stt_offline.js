// stt_offline.js — STT offline (Whisper tiny) com loader robusto
let TF = null;        // módulo transformers
let transcriber = null;

const CANDIDATES = [
  'https://esm.sh/@xenova/transformers@3.0.0',          // ESM estável
  'https://esm.sh/@xenova/transformers@2.15.0',         // ESM fallback
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.0.0?module',
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0?module',
];

async function loadTransformers(setStatus){
  for(const url of CANDIDATES){
    try{
      setStatus?.(`carregando lib… ${new URL(url).host}`);
      const m = await import(/* @vite-ignore */ url);
      console.info('[STT] transformers carregado de', url);
      return m;
    }catch(e){
      console.warn('[STT] falhou', url, e?.message||e);
    }
  }
  throw new Error('Nenhuma CDN funcionou para @xenova/transformers.');
}

async function ensureModel(setStatus){
  if(!TF){
    TF = await loadTransformers(setStatus);
    TF.env.useBrowserCache = true;
    TF.env.remoteModels = true;
  }
  if(!transcriber){
    setStatus?.('baixando modelo…');
    transcriber = await TF.pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny',   // multilíngue, pequeno
      { quantized: true }
    );
    setStatus?.('modelo carregado');
  }
}

async function transcribeSelectedFile(){
  const inp = document.getElementById('audioFile');
  const ta  = document.getElementById('pastedTranscript');
  const sEl = document.getElementById('sttStatus');
  const btn = document.getElementById('btnTranscribeFile');
  if(!inp?.files?.[0]){ alert('Escolha um arquivo de áudio primeiro.'); return; }
  const set = (t)=>{ if(sEl) sEl.textContent = t; };

  try{
    btn && (btn.disabled = true);
    await ensureModel(set);
    set('transcrevendo…');
    const out = await transcriber(inp.files[0], {
      chunk_length_s: 30, stride_length_s: 5, return_timestamps: false
    });
    set('pronto');
    ta.value = (ta.value ? ta.value.trim()+'\n\n' : '') + (out?.text || '');
    ta.dispatchEvent(new Event('input'));
  }catch(err){
    console.error('STT offline error:', err);
    set('erro'); alert('Falha na transcrição. Veja o Console (F12) para detalhes.');
  }finally{
    btn && (btn.disabled = false);
  }
}

// liga o botão mesmo sem código no components.js
document.addEventListener('click', (ev)=>{
  if(ev.target.closest('#btnTranscribeFile')){
    ev.preventDefault(); transcribeSelectedFile();
  }
});
