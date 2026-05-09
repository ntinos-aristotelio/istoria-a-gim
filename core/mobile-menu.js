
(function(){
  function setupMobileMenus(){
    document.querySelectorAll('header .bar').forEach(function(bar){
      if(bar.querySelector('.mobile-menu-toggle')) return;

      var nav = bar.querySelector(':scope > .nav, :scope > nav.nav');
      if(!nav) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mobile-menu-toggle';
      btn.setAttribute('aria-label', 'Άνοιγμα μενού');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '☰ Μενού';

      bar.insertBefore(btn, nav);

      btn.addEventListener('click', function(event){
        event.stopPropagation();
        var open = bar.classList.toggle('mobile-menu-open');
        document.body.classList.toggle('mobile-menu-active', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.innerHTML = open ? '✕ Κλείσιμο' : '☰ Μενού';
      });

      nav.querySelectorAll('a').forEach(function(link){
        link.addEventListener('click', function(){
          bar.classList.remove('mobile-menu-open');
          document.body.classList.remove('mobile-menu-active');
          btn.setAttribute('aria-expanded', 'false');
          btn.innerHTML = '☰ Μενού';
        });
      });
    });

    document.addEventListener('click', function(event){
      document.querySelectorAll('header .bar.mobile-menu-open').forEach(function(bar){
        if(!bar.contains(event.target)){
          bar.classList.remove('mobile-menu-open');
          document.body.classList.remove('mobile-menu-active');
          var btn = bar.querySelector('.mobile-menu-toggle');
          if(btn){
            btn.setAttribute('aria-expanded', 'false');
            btn.innerHTML = '☰ Μενού';
          }
        }
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', setupMobileMenus);
  }else{
    setupMobileMenus();
  }
})();
