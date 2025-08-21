// stt_offline.js — STT offline robusto (Whisper) com fallback e logs
let TF = null;
let transcriberTiny = null;
let transcriberSmall = null;

const CDN_TRIES = [
  'https://esm.sh/@xenova/transformers@3.0.0',
  'https://esm.sh/@xenova/transformers@2.15.0',
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.0.0?module',
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0?module',
];

async function loadTF(set){
  for(const url of CDN_TRIES){
    try{
      set?.(`carregando lib… ${new URL(url).host}`);
      const m = await import(/* @vite-ignore */ url);
      console.info('[STT] OK from', url);
      m.env.useBrowserCache = true; m.env.remoteModels = true;
      return m;
    }catch(e){ console.warn('[STT] falhou', url, e?.message||e); }
  }
  throw new Error('Nenhuma CDN funcionou.');
}

async function getTiny(set){
  if(!TF) TF = await loadTF(set);
  if(!transcriberTiny){
    set?.('baixando modelo (tiny)…');
    transcriberTiny = await TF.pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', { quantized:true });
    set?.('modelo tiny carregado');
  }
  return transcriberTiny;
}
async function getSmall(set){
  if(!TF) TF = await loadTF(set);
  if(!transcriberSmall){
    set?.('baixando modelo (small)…');
    transcriberSmall = await TF.pipeline('automatic-speech-recognition', 'Xenova/whisper-small', { quantized:true });
    set?.('modelo small carregado');
  }
  return transcriberSmall;
}

function ui(){
  return {
    file: document.getElementById('audioFile'),
    ta: document.getElementById('pastedTranscript'),
    status: document.getElementById('sttStatus'),
    btn: document.getElementById('btnTranscribeFile'),
  };
}
function setStatus(el, t){ if(el) el.textContent = t; }

async function runModel(model, file, set){
  return await model(file, {
    // parâmetros que ajudam o Whisper
    language: 'pt',          // força PT (evita falha na detecção)
    task: 'transcribe',      // não traduz, só transcreve
    chunk_length_s: 20,      // chunks menores = mais estável em PCs modestos
    stride_length_s: 5,
    return_timestamps: false
  });
}

async function transcribeSelectedFile(){
  const {file, ta, status, btn} = ui();
  if(!file?.files?.[0]){ alert('Escolha um arquivo de áudio primeiro.'); return; }
  const f = file.files[0];
  const set = t => setStatus(status, t);

  try{
    btn && (btn.disabled = true);

    // 1) tenta TINY
    const tiny = await getTiny(set);
    set('transcrevendo (tiny)…');
    console.time('[STT] tiny');
    let out = await runModel(tiny, f, set);
    console.timeEnd('[STT] tiny');
    console.log('[STT] tiny retorno:', out);

    let text = (out && (out.text || out?.chunks?.map(c=>c.text).join(' ') || '')).trim();

    // 2) se vazio, tenta SMALL (fallback)
    if(!text){
      set('resultado vazio — tentando modelo maior…');
      const small = await getSmall(set);
      console.time('[STT] small');
      out = await runModel(small, f, set);
      console.timeEnd('[STT] small');
      console.log('[STT] small retorno:', out);
      text = (out && (out.text || out?.chunks?.map(c=>c.text).join(' ') || '')).trim();
    }

    if(!text){
      set('sem fala detectada');
      alert('O modelo não detectou fala no arquivo. Tente outro formato (MP3/WAV) ou verifique o áudio.');
      return;
    }

    set('pronto');
    ta.value = (ta.value ? ta.value.trim()+'\n\n' : '') + text;
    ta.dispatchEvent(new Event('input'));
  }catch(err){
    console.error('STT offline error:', err);
    set('erro');
    alert('Falha na transcrição. Veja o Console (F12) para detalhes.');
  }finally{
    btn && (btn.disabled = false);
  }
}

document.addEventListener('click', (ev)=>{
  if(ev.target.closest('#btnTranscribeFile')){
    ev.preventDefault();
    transcribeSelectedFile();
  }
});
