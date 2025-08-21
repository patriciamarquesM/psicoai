const tz = 'America/Sao_Paulo';

export function nowBr() {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: tz, dateStyle: 'short', timeStyle: 'medium'
  });
  return fmt.format(d);
}
export function formatDateISOToBR(iso) {
  if(!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat('pt-BR', { timeZone: tz }).format(d);
}
export function maskCPF(cpf) {
  const only = (cpf || '').replace(/\D/g,'').padStart(11,'•');
  return `${only.slice(0,3)}.${only.slice(3,6)}.${only.slice(6,9)}-${only.slice(9,11)}`;
}
export function validateCPF(cpf) {
  let s = (cpf||'').replace(/\D/g,'');
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
  let calc = (base) => {
    let sum = 0;
    for (let i=0; i<base; i++) sum += parseInt(s[i]) * (base + 1 - i);
    let mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  return calc(9) === parseInt(s[9]) && calc(10) === parseInt(s[10]);
}
export async function sha256Hex(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function hmacSha256Hex(secret, message){
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function uid(prefix='id'){
  return `${prefix}_${Math.random().toString(36).slice(2,10)}_${Date.now().toString(36)}`;
}
export function assert(cond, msg){ if(!cond) throw new Error(msg); }
export function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v||''); }
