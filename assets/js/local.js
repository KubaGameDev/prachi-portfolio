(() => {
  const body=document.body;
  const ocean=window.Ocean;
  const nav = document.querySelector('.responsive-nav');
  const page = ocean?.scrollElement || document.querySelector('.site-wrap');
  const scrollRoot=ocean?.scrollElement || body;
  const scrollLocks=new Set();
  let previousOverflow='';
  const setOverlayState=(reason,open)=>{
    if(open){
      if(scrollLocks.has(reason))return;
      ocean?.setPaused(reason,true);
      if(!scrollLocks.size)previousOverflow=scrollRoot.style.overflow;
      scrollLocks.add(reason);
      scrollRoot.style.overflow='hidden';
    }else{
      if(!scrollLocks.has(reason))return;
      scrollLocks.delete(reason);
      if(!scrollLocks.size)scrollRoot.style.overflow=previousOverflow;
      ocean?.setPaused(reason,false);
    }
  };
  let navTrigger = null;
  let previousInert=false;
  const closeNav = (restoreFocus = true) => {
    if (!body.classList.contains('local-nav-open')) return;
    body.classList.remove('local-nav-open');
    if (page) page.inert = previousInert;
    setOverlayState('navigation',false);
    if (nav) nav.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.js-hamburger').forEach(el => el.setAttribute('aria-expanded', 'false'));
    if (restoreFocus && navTrigger?.isConnected) navTrigger.focus({preventScroll:true});
  };
  if (nav) {nav.id='mobile-navigation';nav.setAttribute('aria-hidden','true');}
  document.querySelectorAll('.js-hamburger').forEach(el => {
    el.setAttribute('role','button'); el.tabIndex=0;
    el.setAttribute('aria-label','Open navigation');el.setAttribute('aria-expanded','false');
    el.setAttribute('aria-controls','mobile-navigation');
    const open=()=>{
      if(body.classList.contains('local-nav-open'))return;
      navTrigger=el;body.classList.add('local-nav-open');el.setAttribute('aria-expanded','true');
      if(page){previousInert=page.inert;page.inert=true;}
      setOverlayState('navigation',true);
      if(nav){nav.setAttribute('aria-hidden','false');requestAnimationFrame(()=>nav.querySelector('.js-close-responsive-nav')?.focus());}
    };
    el.addEventListener('click',open);
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
  document.querySelectorAll('.js-close-responsive-nav').forEach(el=>{
    el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','Close navigation');
    el.addEventListener('click',()=>closeNav());
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();closeNav();}});
  });
  nav?.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const items=[...nav.querySelectorAll('a[href],[tabindex="0"]')];
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  });
  matchMedia('(max-width:932px)').addEventListener('change',e=>{if(!e.matches)closeNav(false);});
  const dialog=document.createElement('dialog');dialog.className='local-lightbox';dialog.setAttribute('aria-label','Enlarged artwork');
  dialog.innerHTML='<button type="button" aria-label="Close image">×</button><img alt="">';body.append(dialog);
  const img=dialog.querySelector('img');const shut=()=>{dialog.close();};
  dialog.querySelector('button').addEventListener('click',shut);dialog.addEventListener('click',e=>{if(e.target===dialog)shut();});dialog.addEventListener('close',()=>{setOverlayState('lightbox',false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav();});
  document.querySelectorAll('.js-grid-item-container,.js-lightbox').forEach(el=>{
    if(!el.querySelector('img'))return;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Enlarge artwork');
    const open=()=>{if(dialog.open)return;const pic=el.querySelector('img');img.src=pic.currentSrc||pic.src;img.alt=pic.alt||'Enlarged artwork';dialog.showModal();setOverlayState('lightbox',true);};
    el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
  // Reveal below-the-fold panels once; keep the first screen immediately readable.
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !motion.matches) {
    const panels = [...document.querySelectorAll('.project-covers > .project-cover')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}
      });
    }, {root:ocean?.scrollElement || null,rootMargin:'0px 0px -12% 0px',threshold:0.08});
    panels.forEach(panel => {
      panel.classList.add('motion-panel');
      if (panel.getBoundingClientRect().top < (ocean?.getViewport().top || 0)+80) panel.classList.add('is-revealed');
      else {panel.classList.add('reveal-pending');observer.observe(panel);}
      panel.addEventListener('focusin',()=>{panel.classList.add('is-revealed');observer.unobserve(panel);});
    });
    const revealAll=()=>{panels.forEach(p=>p.classList.add('is-revealed'));observer.disconnect();};
    motion.addEventListener('change',e=>{if(e.matches)revealAll();});
    if(ocean){
      const syncMotion=()=>{if(!ocean.effectsEnabled())revealAll();};
      document.addEventListener('ocean:state',syncMotion);
      syncMotion();
    }
  }
  if(ocean){
    document.querySelectorAll('.js-back-to-top,.back-to-top a').forEach(link=>{
      link.addEventListener('click',event=>{
        event.preventDefault();
        ocean.scrollTo(0,{behavior:motion.matches?'auto':'smooth'});
      });
    });
  }
  document.querySelectorAll('video.local-video').forEach(video=>{
    const fallback=()=>{if(!video.error)return;const note=document.createElement('div');note.className='local-media-note';note.style.cssText=video.style.cssText;const text=document.createElement('span');text.textContent='To play this video locally, extract Prachi_Gaur_Videos.zip beside the website ZIP so both merge into the same folder.';note.append(text);video.replaceWith(note);};
    video.addEventListener('error',fallback);fallback();
  });
})();
