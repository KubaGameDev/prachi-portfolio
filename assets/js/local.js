(() => {
  const body=document.body;
  document.querySelectorAll('.js-hamburger').forEach(el=>{
    el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','Open navigation');
    const open=()=>{body.classList.add('local-nav-open');el.setAttribute('aria-expanded','true');};
    el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
  const closeNav=()=>{body.classList.remove('local-nav-open');document.querySelectorAll('.js-hamburger').forEach(el=>el.setAttribute('aria-expanded','false'));};
  document.querySelectorAll('.js-close-responsive-nav').forEach(el=>{el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','Close navigation');el.addEventListener('click',closeNav);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();closeNav();}});});
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
  document.querySelectorAll('form').forEach(f=>f.addEventListener('submit',e=>e.preventDefault()));
  document.querySelectorAll('video.local-video').forEach(video=>{
    const fallback=()=>{if(!video.error)return;const note=document.createElement('div');note.className='local-media-note';note.style.cssText=video.style.cssText;const text=document.createElement('span');text.textContent='To play this video locally, extract Prachi_Gaur_Videos.zip beside the website ZIP so both merge into the same folder.';note.append(text);video.replaceWith(note);};
    video.addEventListener('error',fallback);fallback();
  });
})();