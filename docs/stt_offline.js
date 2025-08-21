// stt_offline.js — STT offline robusto (Whisper) com decode PCM + fallback + debug
let TF = null;
let transTiny = null;
let transSmall = null;

const CDNs = [
  'https://esm.sh/@xenova/transformers@3.0.0',
  'https://esm.sh/@xenova/transformers@2.15.0',
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@3.0.0?module',
  'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0?module',
];

function setStatus(t){ const el=document.getElementById('sttStatus'); if(el) el.textContent=t; }
function debug(msg,obj){
  const box = document.getElementById('sttDebug') || (()=>{ 
    const pre=document.createElement('pre'); pre.id='sttDebug';
    pre.style.cssText='margin-top:8px;max-height:140px;overflow:auto;background:#0f1330;border:1px solid #1e2450;border-radius:8px;padding:8px;color:#a9b0d6;font-size:12px';
    const area=document.querySelector('#pastedTranscript')?.parentElement; area?.appendChild(pre); return pre; 
  })();
  box.textContent = `[STT] ${msg}` + (obj ? '\n' + safeString(obj) : '');
}
function safeString(x){ try{ return JSON.stringify(x,null,2).slice(0,5000); }catch(e){ return String(x); } }

async function loadTF(){
  for(const url of CDNs){
    try{ setStatus(`carregando lib… ${new URL(url).host}`); const m = await import(/* @vite-ignore */ url);
      m.env.useBrowserCache = true; m.env.remoteModels = true; debug('library OK', {url}); return m;
    }catch(e){ debug('falhou CDN', {url, err:e?.message}); }
  }
  throw new Error('Não deu para carregar @xenova/transformers de nenhuma CDN.');
}

async function getTiny(){ if(!TF) TF = await loadTF(); if(!transTiny){ setStatus('baixando modelo (tiny)…'); transTiny = await TF.pipeline('automatic-speech-recognition','Xenova/whisper-tiny',{quantized:true}); setStatus('modelo tiny carregado'); } return transTiny; }
async function getSmall(){ if(!TF) TF = await loadTF(); if(!transSmall){ setStatus('baixando modelo (small)…'); transSmall = await TF.pipeline('automatic-speech-recognition','Xenova/whisper-small',{quantized:true}); setStatus('modelo small carregado'); } return transSmall; }

async function fileToPCMMono(file){
  const buf = await file.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC({sampleRate: 16000}); // força 16k quando possível
  const audio = await ac.decodeAudioData(buf);
  // mixdown para mono
  const len = audio.length;
  const out = new Float32Array(len);
  for(let ch=0; ch<audio.numberOfChannels; ch++){
    const data = audio.getChannelData(ch);
    for(let i=0;i<len;i++) out[i] += data[i] / audio.numberOfChannels;
  }
  try{ ac.close(); }catch(_){}
  // se for sampleRate diferente, deixamos o ac cuidar (16000 acima); se não, pega a do buffer
  const sr = ac.sampleRate || audio.sampleRate || 16000;
  return { array: out, sampling_rate: sr };
}

async function run(model, input){
  // força PT-BR e transcribe (não translate)
  return await model(input, {
    language: 'pt',
    task: 'transcribe',
    chunk_length_s: 20,
    stride_length_s: 5,
    return_timestamps: false
  });
}

async function transcribeSelectedFile(){
  const inp = document.getElementById('audioFile');
  const ta  = document.getElementById('pastedTranscript');
  const btn = document.getElementById('btnTranscribeFile');
  if(!inp?.files?.[0]){ alert('Escolha um arquivo de áudio primeiro.'); return; }
  const file = inp.files[0];

  try{
    btn && (btn.disabled = true);
    setStatus('preparando áudio…');
    const pcm = await fileToPCMMono(file);
    debug('PCM pronto', {samples: pcm.array.length, sr: pcm.sampling_rate});

    // 1) tiny
    const tiny = await getTiny();
    setStatus('transcrevendo (tiny)…');
    const outTiny = await run(tiny, pcm);
    debug('retorno tiny', outTiny);
    let text = (outTiny?.text || outTiny?.chunks?.map(c=>c.text).join(' ') || '').trim();

    // 2) fallback small se vazio
    if(!text){
      setStatus('resultado vazio — tentando modelo maior…');
      const small = await getSmall();
      const outSmall = await run(small, pcm);
      debug('retorno small', outSmall);
      text = (outSmall?.text || outSmall?.chunks?.map(c=>c.text).join(' ') || '').trim();
    }

    if(!text){
      setStatus('sem fala detectada');
      alert('Não foi detectada fala. Tente outro arquivo (MP3/WAV) ou verifique o volume/ruído.');
      return;
    }

    setStatus('pronto');
    ta.value = (ta.value ? ta.value.trim()+'\n\n' : '') + text;
    ta.dispatchEvent(new Event('input'));
  }catch(err){
    console.error('STT offline error:', err);
    debug('erro', {message: err?.message});
    setStatus('erro');
    alert('Falha na transcrição (veja detalhes no Console).');
  }finally{
    btn && (btn.disabled = false);
  }
}

// Gatilho do botão (independe do components.js)
document.addEventListener('click', (ev)=>{
  if(ev.target.closest('#btnTranscribeFile')){
    ev.preventDefault(); transcribeSelectedFile();
  }
});
