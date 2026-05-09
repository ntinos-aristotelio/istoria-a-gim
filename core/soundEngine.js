/* Istoria V10 Sound Engine */
(function(){
  let enabled = localStorage.getItem('istoriaSoundEnabled') !== 'false';
  function play(type){
    if(!enabled) return;
    try{
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const now = ctx.currentTime;
      let freq = 520;
      if(type === 'success') freq = 720;
      if(type === 'error') freq = 180;
      if(type === 'badge') freq = 880;
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now);
      if(type === 'badge') o.frequency.exponentialRampToValueAtTime(1180, now + .16);
      g.gain.setValueAtTime(.0001, now);
      g.gain.exponentialRampToValueAtTime(.08, now + .02);
      g.gain.exponentialRampToValueAtTime(.0001, now + .18);
      o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + .20);
    }catch(e){}
  }
  function toggle(btn){
    enabled = !enabled;
    localStorage.setItem('istoriaSoundEnabled', enabled ? 'true' : 'false');
    if(btn) btn.textContent = enabled ? '🔊 Ήχοι: ON' : '🔇 Ήχοι: OFF';
    if(enabled) play('click');
  }
  document.addEventListener('click', function(e){
    const target = e.target.closest('button,a.btn,a.gold,a.secondary,a.blue');
    if(target && !target.classList.contains('sound-toggle')) play('click');
  });
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.sound-toggle').forEach(function(btn){ btn.textContent = enabled ? '🔊 Ήχοι: ON' : '🔇 Ήχοι: OFF'; });
  });
  window.playUISound = play;
  window.toggleIstoriaSound = toggle;
  window.IstoriaSound = {play:play, toggle:toggle, isEnabled:function(){return enabled;}};
})();
