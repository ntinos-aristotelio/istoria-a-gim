/* Istoria V10 Storage Engine - shared local progress/profile system */
(function(){
  const APP_KEY = 'istoriaAGymnasiouProgress';
  const LEGACY_KEY = 'istoriaProgress';
  const DEFAULT_PROFILE = {version:'10.2', chapters:{}, minigames:{}, daily:{}, achievements:{}, weakTopics:{}, history:[]};
  function cloneDefault(){ return JSON.parse(JSON.stringify(DEFAULT_PROFILE)); }
  function safeParse(value, fallback){ try{return JSON.parse(value) || fallback;}catch(e){return fallback;} }
  function normalize(progress){
    progress = progress && typeof progress === 'object' ? progress : cloneDefault();
    progress.version = progress.version || '10.2';
    progress.chapters = progress.chapters || {};
    progress.minigames = progress.minigames || {};
    progress.daily = progress.daily || {};
    progress.achievements = progress.achievements || {};
    progress.weakTopics = progress.weakTopics || {};
    progress.history = Array.isArray(progress.history) ? progress.history : [];
    return progress;
  }
  function load(){
    const current = safeParse(localStorage.getItem(APP_KEY), null);
    if(current) return normalize(current);
    const legacy = safeParse(localStorage.getItem(LEGACY_KEY), null);
    if(legacy){
      const migrated = normalize({version:'10.2', chapters:{}, minigames:legacy.minigames||{}, daily:legacy.daily||{}, achievements:{}, weakTopics:{}, history:[]});
      Object.keys(legacy).forEach(function(key){
        const m = key.match(/^chapter(\d+)$/);
        if(m) migrated.chapters[m[1]] = legacy[key];
      });
      save(migrated);
      return migrated;
    }
    return cloneDefault();
  }
  function save(progress){ localStorage.setItem(APP_KEY, JSON.stringify(normalize(progress))); return progress; }
  function update(mutator){ const progress = load(); mutator(progress); progress.updatedAt = new Date().toISOString(); return save(progress); }
  function legacyMirror(progress){
    try{
      const legacy = {};
      Object.keys(progress.chapters||{}).forEach(function(id){ legacy['chapter'+id] = progress.chapters[id]; });
      legacy.minigames = progress.minigames || {};
      legacy.daily = progress.daily || {};
      localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));
    }catch(e){}
  }
  window.IstoriaStorage = {APP_KEY:APP_KEY, LEGACY_KEY:LEGACY_KEY, load:load, save:function(p){const s=save(p); legacyMirror(s); return s;}, update:function(fn){const s=update(fn); legacyMirror(s); return s;}};
  window.loadAppProgress = load;
  window.saveAppProgress = function(progress){ return window.IstoriaStorage.save(progress); };
})();
