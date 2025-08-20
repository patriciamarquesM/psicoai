// Motor de análise local com eixos Freud • Klein • Lacan
// Tudo 100% offline, heurístico.

function sentences(text){
  return (text||'').split(/(?<=[\.\!\?])\s+/).map(s=>s.trim()).filter(Boolean);
}
function tokens(text){
  return (text||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g,' ')
    .split(/\s+/).filter(Boolean);
}
function topTerms(text, k=10){
  const toks = tokens(text);
  const stop = new Set('a o e de da do das dos em um uma umas uns para por com sem sob sobre que na no nos nas como mais menos muito pouco se eu tu ele ela eles elas nós voces você vocês lhe lhes me te meu minha seu sua seus suas este esta isto esse essa isso aquele aquela aquilo entre tanto talvez já ainda porém portanto porque quando onde enquanto desde antes depois muito também então nem já lá cá vai vem'.split(/\s+/));
  const freq = {};
  toks.forEach(t=>{ if(!stop.has(t) && t.length>2) freq[t]=(freq[t]||0)+1; });
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,k).map(([t])=>t);
}
function naiveSummary(text, maxSent=5){
  const sents = sentences(text);
  if(sents.length<=maxSent) return text.trim();
  const termSet = new Set(topTerms(text, 20));
  const scored = sents.map((s,i)=>{
    const score = tokens(s).reduce((acc,t)=>acc+(termSet.has(t)?1:0),0) + (i===0?1:0);
    return {s, i, score};
  });
  scored.sort((a,b)=>b.score-a.score);
  const top = scored.slice(0, maxSent).sort((a,b)=>a.i-b.i).map(x=>x.s);
  return top.join(' ');
}

// Marcadores gerais
function generalSignals(text){
  const rules = [
    {key:'transferencia', rx:/transfer[eê]ncia|contratransfer[eê]ncia|analista|paciente/i},
    {key:'defesas', rx:/nega[cç][aã]o|proje[cç][aã]o|identifica[cç][aã]o|racionaliza[cç][aã]o|repress[aã]o|cis[aã]o|isolamento|form[aá]o reativa|anula[cç][aã]o/i},
    {key:'afeto/angustia', rx:/ang[úu]stia|ansiedade|p[âa]nico|medo|culpa|vergonha/i},
    {key:'depressivos', rx:/depress[aã]o|anedonia|melancol/i},
    {key:'trauma/luto', rx:/trauma|traum[aá]tico|luto|perda|abandono/i},
    {key:'sintomas', rx:/sintoma|compuls/i},
    {key:'relações', rx:/rel[aá]c(ao|ão|oes|ões)|v[ií]nculo|fam[ií]lia|parceir|conjugal/i},
    {key:'sonhos', rx:/sonho|onir|pesadelo/i},
  ];
  return rules.filter(r=>r.rx.test(text||'')).map(r=>r.key);
}

// Eixos Freud
function freudSignals(text){
  const rules = [
    {key:'id-ego-superego', rx:/id|ego|superego|super-?ego|eu|isso/i},
    {key:'pulsao', rx:/puls[aã]o|trieb|libido|agress[ií]v[ao]/i},
    {key:'edipo/castracao', rx:/[ée]dipo|castra[cç][aã]o|complexo|pai|m[aã]e|rival/i},
    {key:'ato falho/compulsao a repeticao', rx:/ato falho|lapsus|repeti[cç][aã]o|compuls[aã]o a repet/i},
  ];
  return rules.filter(r=>r.rx.test(text||'')).map(r=>r.key);
}

// Eixos Klein
function kleinSignals(text){
  const rules = [
    {key:'posicao_paranoide_esquizoide', rx:/paranoide|paran[oó]ide|esquizoide|cis[aã]o/i},
    {key:'posicao_depressiva', rx:/posi[cç][aã]o depressiva|culpa|repara[cç][aã]o/i},
    {key:'identificacao_projetiva', rx:/identifica[cç][aã]o projetiva|projet[aã]o no outro/i},
    {key:'objetos_parciais', rx:/seio bom|seio mau|objeto parcial/i},
  ];
  return rules.filter(r=>r.rx.test(text||'')).map(r=>r.key);
}

// Eixos Lacan
function lacanSignals(text){
  const rules = [
    {key:'rsi', rx:/real|simb[oó]lico|imagin[aá]rio|RSI/i},
    {key:'desejo/jouissance', rx:/desejo|falta|gozo|jouissance/i},
    {key:'nome_do_pai', rx:/nome do pai|lei paterna|met[aá]fora paterna/i},
    {key:'objeto_a', rx:/objeto a|objet petit a|resto|causa do desejo/i},
  ];
  return rules.filter(r=>r.rx.test(text||'')).map(r=>r.key);
}

// Etiquetas de recomendação clínica (heurística leve)
function clinicalHints(text){
  const hints = [];
  if(/auto(mutil|les[aã]o)|suic[ií]d/i.test(text)) hints.push('⚠️ Risco: avaliar segurança / rede de apoio.');
  if(/viol[eê]ncia|abuso|amea[cç]a/i.test(text)) hints.push('⚠️ Violência/abuso: considerar encaminhamentos legais/éticos.');
  if(/subst[aâ]ncia|[aá]lcool|droga/i.test(text)) hints.push('Comorbidades com uso de substâncias: articular cuidado multiprofissional.');
  if(/crian[cç]a|adolesc/i.test(text)) hints.push('Atenção ao enquadre com crianças/adolescentes (responsáveis, escola).');
  return hints;
}

export function analyzeTranscript(text){
  const clean = (text||'').trim();
  if(!clean) return { summary:'', topics:[], signals:[], jung:[], freud:[], klein:[], lacan:[], hints:[] };

  return {
    summary: naiveSummary(clean, 5),
    topics: topTerms(clean, 12),
    signals: generalSignals(clean),
    jung: ( ()=>{ // temas jungianos básicos
      const t = [];
      if(/sonho|onir|pesadelo/i.test(clean)) t.push('Trabalho com sonhos (amplificação/arquetípico)');
      if(/sombra|culpa|vergonha/i.test(clean)) t.push('Sombra (integração do self)');
      if(/persona|pap[eé]is sociais?/i.test(clean)) t.push('Persona e papéis sociais');
      if(/anima|animus/i.test(clean)) t.push('Complexo Anima/Animus');
      if(/sincronicidade|coincid[eê]ncia/i.test(clean)) t.push('Sincronicidade');
      return t;
    })(),
    freud: freudSignals(clean),
    klein: kleinSignals(clean),
    lacan: lacanSignals(clean),
    hints: clinicalHints(clean),
  };
}
