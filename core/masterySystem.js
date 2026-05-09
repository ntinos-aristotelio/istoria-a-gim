
(function(){
  const KEY='istoria_v13_mastery';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
  function save(v){localStorage.setItem(KEY,JSON.stringify(v));}
  function pct(ch){const s=load()[ch]||{};const q=s.quiz||0, r=s.revision||0, sim=s.simulation||0;return Math.max(0,Math.min(100,Math.round(q*.55+r*.25+sim*.20)));}
  function add(ch,kind,points){const d=load();d[ch]=d[ch]||{};d[ch][kind]=Math.max(d[ch][kind]||0,Math.min(100,(d[ch][kind]||0)+points));save(d);return pct(ch)}
  window.IstoriaMastery={load,save,pct,add};
})();
