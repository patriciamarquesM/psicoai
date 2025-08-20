// Web Speech API — ditado por microfone (quando disponível no navegador)
let recognition = null;
let listening = false;
let buffer = '';

function getRecog(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return null;
  const r = new SR();
  r.lang = 'pt-BR';
  r.interimResults = true;
  r.continuous = true;
  return r;
}

export function speechSupported(){
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startDictation({onUpdate, onStatus}){
  if(listening) return;
  recognition = getRecog();
  if(!recognition) throw new Error('Ditado não suportado neste navegador.');

  buffer = '';
  listening = true;
  onStatus?.('gravando');

  recognition.onresult = (e)=>{
    let interim = '';
    for(let i=e.resultIndex; i<e.results.length; i++){
      const t = e.results[i][0].transcript;
      if(e.results[i].isFinal) buffer += t + ' ';
      else interim += t + ' ';
    }
    onUpdate?.(buffer + interim);
  };
  recognition.onerror = (e)=>{ onStatus?.('erro: '+e.error); };
  recognition.onend = ()=>{ listening=false; onStatus?.('parado'); };
  recognition.start();
}

export function stopDictation(){
  if(recognition && listening){
    recognition.stop();
  }
}

export function currentBuffer(){ return buffer.trim(); }
