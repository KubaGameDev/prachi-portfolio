/* Local refraction: neutral displacement outside expanding pointer ripples. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  const defs = document.createElementNS(ns, 'defs'); svg.append(defs); document.body.append(svg);
  const map = document.createElement('canvas');
  const ctx = map.getContext('2d');
  if (!ctx) return;
  let waves = [], targets = [], frame = 0, lastFrame = 0, lastPoint = null;
  const allowed = () => fine.matches && !reduced.matches && !document.hidden && !document.body.classList.contains('local-nav-open');
  function reset() {
    cancelAnimationFrame(frame); frame = 0; waves = []; lastPoint = null;
    targets.forEach(t => {t.el.style.filter = t.original;}); targets = []; defs.replaceChildren();
  }
  function collect() {
    targets.forEach(t => {t.el.style.filter = t.original;}); defs.replaceChildren();
    // Refract each complete panel, including its background, image and hover layer.
    // Gallery tiles stay independent so a long gallery never becomes one huge filter.
    const candidates = [...document.querySelectorAll(
      '.site-header,.masthead,.page-header,.project-cover,.grid__item-container,.project-module'
    )].filter(el => !el.matches('.project-module') || !el.querySelector('.grid__item-container'));
    const panels = candidates.filter(el => !candidates.some(parent => parent !== el && parent.contains(el)));
    targets = panels
      .filter(el => {const r = el.getBoundingClientRect(); return r.width && r.height && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;})
      .map((el, i) => {
        const rect = el.getBoundingClientRect();
        const filter = document.createElementNS(ns, 'filter');
        filter.id = `pond-${i}`;
        for (const [key, value] of Object.entries({filterUnits:'userSpaceOnUse',primitiveUnits:'userSpaceOnUse',x:0,y:0,width:rect.width,height:rect.height,'color-interpolation-filters':'sRGB'})) filter.setAttribute(key,value);
        const source = document.createElementNS(ns,'feImage');
        for (const [key,value] of Object.entries({x:-rect.left,y:-rect.top,width:innerWidth,height:innerHeight,preserveAspectRatio:'none',result:'ripples'})) source.setAttribute(key,value);
        const displacement = document.createElementNS(ns,'feDisplacementMap');
        for (const [key,value] of Object.entries({in:'SourceGraphic',in2:'ripples',scale:18,xChannelSelector:'R',yChannelSelector:'G'})) displacement.setAttribute(key,value);
        filter.append(source,displacement); defs.append(filter);
        return {el,rect,source,id:filter.id,original:el.style.filter};
      });
  }
  function draw(now) {
    frame = 0;
    if (!allowed()) {reset();return;}
    if (now-lastFrame < 32) {frame=requestAnimationFrame(draw);return;}
    lastFrame=now; waves=waves.filter(w=>now-w.time<950);
    if (!waves.length) {reset();return;}
    const scale=.4, width=Math.ceil(innerWidth*scale),height=Math.ceil(innerHeight*scale);
    if(map.width!==width||map.height!==height){map.width=width;map.height=height;}
    const pixels=ctx.createImageData(width,height), data=pixels.data;
    for(let i=0;i<data.length;i+=4){data[i]=128;data[i+1]=128;data[i+2]=128;data[i+3]=255;}
    for(const wave of waves){
      const age=(now-wave.time)/950, radius=8+age*90, extent=radius+22;
      const left=Math.max(0,Math.floor((wave.x-extent)*scale)),right=Math.min(width,Math.ceil((wave.x+extent)*scale));
      const top=Math.max(0,Math.floor((wave.y-extent)*scale)),bottom=Math.min(height,Math.ceil((wave.y+extent)*scale));
      for(let y=top;y<bottom;y++) for(let x=left;x<right;x++){
        const dx=x/scale-wave.x,dy=y/scale-wave.y,d=Math.hypot(dx,dy);
        if(d<1)continue;
        const envelope=Math.exp(-Math.pow((d-radius)/16,2));
        const force=Math.sin((d-radius)/5)*envelope*Math.pow(1-age,2)*36;
        const i=(y*width+x)*4;
        data[i]+=force*dx/d;data[i+1]+=force*dy/d;
      }
    }
    ctx.putImageData(pixels,0,0);
    const url=map.toDataURL();
    targets.forEach(t=>{t.source.setAttribute('href',url);t.el.style.filter=`url(#${t.id})`;});
    frame=requestAnimationFrame(draw);
  }
  document.addEventListener('pointermove',event=>{
    if(!allowed()||event.pointerType==='touch')return;
    const samples=event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    for(const p of samples.length?samples:[event]){
      const point={x:p.clientX,y:p.clientY};
      const distance=lastPoint?Math.hypot(point.x-lastPoint.x,point.y-lastPoint.y):0;
      const count=Math.max(1,Math.ceil(distance/12));
      for(let i=1;i<=Math.min(count,24);i++){
        const t=i/Math.min(count,24);
        waves.push({x:lastPoint?lastPoint.x+(point.x-lastPoint.x)*t:point.x,y:lastPoint?lastPoint.y+(point.y-lastPoint.y)*t:point.y,time:performance.now()});
      }
      lastPoint=point;
    }
    waves=waves.slice(-48);
    if(!frame){collect();frame=requestAnimationFrame(draw);}
  },{passive:true});
  window.addEventListener('resize',reset,{passive:true});
  window.addEventListener('scroll',reset,{passive:true});
  window.addEventListener('blur',reset);
  document.documentElement.addEventListener('pointerleave',reset);
  document.addEventListener('visibilitychange',reset);
  reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
})();
