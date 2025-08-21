// Transcrição offline de arquivo com Whisper tiny (Transformers.js)
// Baixa e cacheia o modelo na primeira vez.
let transcriber = null;

export async function transcribeFileOffline(file, onStatus = (s)=>console.log('[STT]', s)) {
  if (!file) throw new Error('Nenhum arquivo selecionado.');
  onStatus('carregando modelo...');
  // Carrega a lib via CDN (ESM)
  const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@3.2.0');
  // Cache no navegador (IndexedDB) para próximas vezes
  env.useBrowserCache = true;
  env.remoteModels = true;
  // Instancia 1 vez
  if (!transcriber) {
    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      quantized: true // reduz tamanho/ram
    });
  }
  onStatus('transcrevendo...');
  // Pode passar o File direto; a lib faz a conversão internamente
  const out = await transcriber(file, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: false
  });
  onStatus('pronto');
  return out?.text || '';
}
