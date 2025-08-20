// ----- CID-10 e DSM-5 (amostra offline; edite/largue quando quiser) -----
export const CID10 = [
  {code:'F20.0', label:'Esquizofrenia paranoide'},
  {code:'F31.1', label:'Transtorno afetivo bipolar, episódio atual depressivo moderado'},
  {code:'F31.2', label:'TAB, episódio depressivo grave sem sintomas psicóticos'},
  {code:'F32.0', label:'Episódio depressivo leve'},
  {code:'F32.1', label:'Episódio depressivo moderado'},
  {code:'F32.2', label:'Episódio depressivo grave sem sintomas psicóticos'},
  {code:'F33.1', label:'Transtorno depressivo recorrente, episódio atual moderado'},
  {code:'F40.1', label:'Fobia social'},
  {code:'F41.0', label:'Transtorno do pânico'},
  {code:'F41.1', label:'Ansiedade generalizada'},
  {code:'F42.2', label:'TOC (predom. atos)'},
  {code:'F43.1', label:'TEPT'},
  {code:'F43.2', label:'Transtornos de adaptação'},
  {code:'F44.4', label:'Transtornos dissociativos'},
  {code:'F45.0', label:'Transtorno somatoforme'},
  {code:'F50.0', label:'Anorexia nervosa'},
  {code:'F50.2', label:'Bulimia nervosa'},
  {code:'F60.3', label:'Transtorno de personalidade borderline'},
  {code:'F84.0', label:'Autismo infantil'},
  {code:'F90.0', label:'TDAH, tipo desatento'}
];

export const DSM5 = [
  {code:'296.32', label:'TDM, episódio único, moderado'},
  {code:'296.33', label:'TDM, episódio único, grave sem sintomas psicóticos'},
  {code:'300.02', label:'Transtorno de ansiedade generalizada'},
  {code:'300.01', label:'Transtorno do pânico'},
  {code:'300.3',  label:'Transtorno obsessivo-compulsivo'},
  {code:'309.81', label:'TEPT'},
  {code:'301.83', label:'Transtorno de personalidade borderline'},
  {code:'307.1',  label:'Anorexia nervosa'},
  {code:'307.51', label:'Bulimia nervosa'},
  {code:'299.00', label:'Transtorno do espectro do autismo'}
];

// ----- Índice por descritor (sinônimos → códigos) -----
export const DESCRITORES = [
  {term:'depressão', codes:{cid:['F32.0','F32.1','F32.2','F33.1'], dsm:['296.32','296.33']}},
  {term:'tristeza',  codes:{cid:['F32.0','F32.1'], dsm:['296.32']}},
  {term:'pânico',    codes:{cid:['F41.0'], dsm:['300.01']}},
  {term:'ansiedade', codes:{cid:['F41.1'], dsm:['300.02']}},
  {term:'fobia social', codes:{cid:['F40.1'], dsm:[]}},
  {term:'toc', codes:{cid:['F42.2'], dsm:['300.3']}},
  {term:'obsessão', codes:{cid:['F42.2'], dsm:['300.3']}},
  {term:'compulsão', codes:{cid:['F42.2'], dsm:['300.3']}},
  {term:'trauma', codes:{cid:['F43.1'], dsm:['309.81']}},
  {term:'tept', codes:{cid:['F43.1'], dsm:['309.81']}},
  {term:'adaptação', codes:{cid:['F43.2'], dsm:[]}},
  {term:'dissociação', codes:{cid:['F44.4'], dsm:[]}},
  {term:'somatização', codes:{cid:['F45.0'], dsm:[]}},
  {term:'anorexia', codes:{cid:['F50.0'], dsm:['307.1']}},
  {term:'bulimia', codes:{cid:['F50.2'], dsm:['307.51']}},
  {term:'borderline', codes:{cid:['F60.3'], dsm:['301.83']}},
  {term:'autismo', codes:{cid:['F84.0'], dsm:['299.00']}},
  {term:'tdah', codes:{cid:['F90.0'], dsm:[]}},
];

function norm(s){ return (s||'').toLowerCase(); }
export function searchCID(q){
  q = norm(q);
  return CID10.filter(x=> norm(x.code).startsWith(q) || norm(x.label).includes(q) ).slice(0,12);
}
export function searchDSM(q){
  q = norm(q);
  return DSM5.filter(x=> norm(x.code).startsWith(q) || norm(x.label).includes(q) ).slice(0,12);
}
export function searchDescritor(q){
  q = norm(q);
  if(!q) return DESCRITORES.slice(0,8);
  return DESCRITORES.filter(x=> norm(x.term).includes(q) ).slice(0,12);
}
