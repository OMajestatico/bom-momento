(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const initIcons = () => {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.7 } });
  };
  initIcons();
  setTimeout(initIcons, 600);

  $('#year').textContent = new Date().getFullYear();

  // Barra superior + progresso
  const topbar = $('#topbar');
  const progress = $('.scroll-progress span');
  const onScroll = () => {
    const y = window.scrollY;
    topbar.classList.toggle('scrolled', y > 50);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = max > 0 ? `${Math.min(100, (y / max) * 100)}%` : '0%';
    if (!reduced) {
      $$('[data-parallax]').forEach(el => {
        const speed = Number(el.dataset.parallax || .05);
        el.style.transform = `translate3d(0, ${y * speed}px, 0) scale(1.02)`;
      });
    }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Menu mobile com trava de scroll
  const menu = $('#mobile-menu');
  const toggle = $('.menu-toggle');
  const close = $('.menu-close');
  function setMenu(open){
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  }
  toggle.addEventListener('click', () => setMenu(true));
  close.addEventListener('click', () => setMenu(false));
  $$('#mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Revelação ao entrar na tela
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('in'));

  // Tilt discreto apenas em dispositivos com mouse. Touch já sofre o bastante.
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
  }

  // Pilha 3D ambiente
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced) {
    const stack = $('.atmosphere-stack');
    if (stack) stack.addEventListener('pointermove', e => {
      const r = stack.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      const base = ['rotate(-5deg)','rotate(7deg)','rotate(2deg)'];
      $$('.stack-card', stack).forEach((el,i)=>{
        const d = Number(el.dataset.depth || i+1);
        el.style.transform = `${base[i]} translate3d(${x*d*12}px,${y*d*10}px,${d*6}px)`;
      });
    });
    if (stack) stack.addEventListener('pointerleave', () => $$('.stack-card', stack).forEach(el => el.style.transform=''));
  }

  // Carrossel nativo + snap proximity. Mouse arrasta; touch fica 100% nativo.
  $$('[data-carousel]').forEach(wrap => {
    const track = $('.carousel-track', wrap);
    const cards = $$('.snap-card', track);
    const dots = $('.carousel-dots', wrap);
    const prev = $('.prev', wrap), next = $('.next', wrap);

    cards.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', `Ir para item ${i+1}`);
      b.addEventListener('click', () => cards[i].scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' }));
      dots.appendChild(b);
    });
    const dotButtons = $$('button', dots);

    const nearest = () => {
      const center = track.scrollLeft + track.clientWidth/2;
      let idx=0, dist=Infinity;
      cards.forEach((c,i)=>{ const cCenter=c.offsetLeft+c.offsetWidth/2; const d=Math.abs(cCenter-center); if(d<dist){dist=d;idx=i;} });
      dotButtons.forEach((b,i)=>b.classList.toggle('active',i===idx));
      return idx;
    };
    let raf;
    track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf=requestAnimationFrame(nearest); }, {passive:true});
    nearest();

    const step = dir => {
      const idx = nearest();
      const to = Math.max(0, Math.min(cards.length-1, idx+dir));
      cards[to].scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
    };
    prev?.addEventListener('click',()=>step(-1)); next?.addEventListener('click',()=>step(1));

    if (matchMedia('(pointer:fine)').matches) {
      let down=false,startX=0,startScroll=0,moved=false;
      track.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        down=true;moved=false;startX=e.clientX;startScroll=track.scrollLeft;track.classList.add('dragging');track.setPointerCapture(e.pointerId);
      });
      track.addEventListener('pointermove', e => {
        if(!down) return;
        const dx=e.clientX-startX;
        if(Math.abs(dx)>3) moved=true;
        track.scrollLeft=startScroll-dx;
      });
      const finish = e => {
        if(!down) return; down=false; track.classList.remove('dragging');
        try{track.releasePointerCapture(e.pointerId)}catch(_){}
        if(moved){ const idx=nearest(); cards[idx].scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}); }
      };
      track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',finish);
      track.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopPropagation();}},true);
    }
  });
})();
