import { analyzeTranscript } from './analysis.js';

function fmtMonthKey(d){ const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`; }

function lineChart(svg, points, {minY=0, maxY, padding=30}={}){
  const w=600, h=220; svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const keys = Object.keys(points).sort();
  const vals = keys.map(k=>points[k]);
  if(!keys.length){ svg.innerHTML = `<text x="16" y="24" fill="#a9b0d6">Sem dados</text>`; return; }
  maxY = maxY || Math.max(...vals, 10);
  const gx = (i)=> padding + i*( (w-2*padding) / Math.max(1, keys.length-1) );
  const gy = (v)=> h - padding - ( (v-minY)/(maxY-minY||1) ) * (h-2*padding);

  // eixos
  svg.innerHTML = `<path d="M${padding},${h-padding} H ${w-padding} M${padding},${padding} V ${h-padding}" stroke="#2a2f5a" />`;
  // grade horizontal
  for(let i=0;i<4;i++){
    const y= padding + i*( (h-2*padding)/3 );
    svg.innerHTML += `<line x1="${padding}" y1="${y}" x2="${w-padding}" y2="${y}" stroke="#1e2450"/>`;
  }
  // path linha
  let d=''; keys.forEach((k,i)=>{ const x=gx(i), y=gy(points[k]); d += (i? 'L':'M')+x+','+y+' '; });
  svg.innerHTML += `<path d="${d}" fill="none" stroke="#7bffdf" stroke-width="2"/>`;
  // marcadores + labels
  keys.forEach((k,i)=>{
    const x=gx(i), y=gy(points[k]);
    svg.innerHTML += `<circle cx="${x}" cy="${y}" r="3" fill="#7bffdf"/>`;
    svg.innerHTML += `<text x="${x}" y="${h-8}" font-size="10" text-anchor="middle" fill="#a9b0d6">${k.slice(2)}</text>`;
  });
}

function barChart(svg, items, {top=10, padding=30}={}){
  const w=600, h=260; svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  if(!items.length){ svg.innerHTML = `<text x="16" y="24" fill="#a9b0d6">Sem dados</text>`; return; }
  const data = items.slice(0, top);
  const maxV = Math.max(...data.map(d=>d[1]),1);
  const barH = (h-2*padding)/data.length;

  svg.innerHTML = `<path d="M${padding},${padding} V ${h-padding} H ${w-padding}" stroke="#2a2f5a"/>`;
  data.forEach((d,i)=>{
    const y = padding + i*barH + 4;
    const x2 = padding + ( (w-2*padding) * (d[1]/maxV) );
    svg.innerHTML += `<rect x="${padding}" y="${y}" width="${x2-padding}" height="${barH-8}" fill="#5b7fff"/>`;
    svg.innerHTML += `<text x="${padding+4}" y="${y+barH/2}" dominant-baseline="middle" font-size="11" fill="#eef1ff">${d[0]}</text>`;
    svg.innerHTML += `<text x="${x2-4}" y="${y+barH/2}" dominant-baseline="middle" font-size="11" text-anchor="end" fill="#a9b0d6">${d[1]}</text>`;
  });
}

export function updateCharts(records){
  const svgLine = document.getElementById('chartLine');
  const svgBars = document.getElementById('chartBars');
  if(!svgLine || !svgBars) return;

  // duração por mês
  const byMonth = {};
  records.forEach(r=>{
    const k = fmtMonthKey(r.createdAt);
    const m = parseInt(r.duration||0,10)||0;
    byMonth[k] = (byMonth[k]||0) + m;
  });
  lineChart(svgLine, byMonth, {});

  // termos mais frequentes (soma das transcrições)
  const freq = {};
  records.forEach(r=>{
    const an = analyzeTranscript(r.transcript||'');
    (an.topics||[]).forEach(t=> freq[t]=(freq[t]||0)+1 );
  });
  const items = Object.entries(freq).sort((a,b)=>b[1]-a[1]);
  barChart(svgBars, items, {top:12});
}
