(() => {
  const body=document.body;
  const nav = document.querySelector('.responsive-nav');
  const page = document.querySelector('.site-wrap');
  let navTrigger = null;
  const closeNav = (restoreFocus = true) => {
    if (!body.classList.contains('local-nav-open')) return;
    body.classList.remove('local-nav-open');
    if (page) page.inert = false;
    if (nav) nav.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.js-hamburger').forEach(el => el.setAttribute('aria-expanded', 'false'));
    if (restoreFocus && navTrigger) navTrigger.focus();
  };
  if (nav) {nav.id='mobile-navigation';nav.setAttribute('aria-hidden','true');}
  document.querySelectorAll('.js-hamburger').forEach(el => {
    el.setAttribute('role','button'); el.tabIndex=0;
    el.setAttribute('aria-label','Open navigation');el.setAttribute('aria-expanded','false');
    el.setAttribute('aria-controls','mobile-navigation');
    const open=()=>{
      navTrigger=el;body.classList.add('local-nav-open');el.setAttribute('aria-expanded','true');
      if(page) page.inert=true;
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
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  });
  matchMedia('(max-width:932px)').addEventListener('change',e=>{if(!e.matches)closeNav(false);});
  const dialog=document.createElement('dialog');dialog.className='local-lightbox';dialog.setAttribute('aria-label','Enlarged artwork');
  dialog.innerHTML='<button type="button" aria-label="Close image">×</button><img alt="">';body.append(dialog);
  const img=dialog.querySelector('img');const shut=()=>{dialog.close();body.style.overflow='';};
  dialog.querySelector('button').addEventListener('click',shut);dialog.addEventListener('click',e=>{if(e.target===dialog)shut();});dialog.addEventListener('close',()=>{body.style.overflow='';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav();});
  document.querySelectorAll('.js-grid-item-container,.js-lightbox').forEach(el=>{
    if(!el.querySelector('img'))return;el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Enlarge artwork');
    const open=()=>{if(dialog.open)return;const pic=el.querySelector('img');img.src=pic.currentSrc||pic.src;img.alt=pic.alt||'Enlarged artwork';dialog.showModal();body.style.overflow='hidden';};
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
    }, {rootMargin:'0px 0px -24px 0px',threshold:0});
    panels.forEach(panel => {
      panel.classList.add('motion-panel');
      if (panel.getBoundingClientRect().top < innerHeight - 24) panel.classList.add('is-revealed');
      else {panel.classList.add('reveal-pending');observer.observe(panel);}
      panel.addEventListener('focusin',()=>{panel.classList.add('is-revealed');observer.unobserve(panel);});
    });
    motion.addEventListener('change',e=>{if(e.matches){panels.forEach(p=>p.classList.add('is-revealed'));observer.disconnect();}});
  }
  document.querySelectorAll('video.local-video').forEach(video=>{
    const fallback=()=>{if(!video.error)return;const note=document.createElement('div');note.className='local-media-note';note.style.cssText=video.style.cssText;const text=document.createElement('span');text.textContent='To play this video locally, extract Prachi_Gaur_Videos.zip beside the website ZIP so both merge into the same folder.';note.append(text);video.replaceWith(note);};
    video.addEventListener('error',fallback);fallback();
  });
})();