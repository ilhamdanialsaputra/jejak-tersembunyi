/* ============================================================
   FX — gerak halaman.
   - Perpindahan halaman: View Transitions API. Judul kartu unit bermorf menjadi
     judul unit (nama transisi "ut"); sisa halaman bergeser searah navigasi.
     Cadangan (peramban lama): Web Animations pada #app.
   - flipFilter: tata letak grid bermorf saat difilter.
   - parallax: pergeseran kecil untuk elemen [data-par], hanya desktop.
   Semua gerak mati bila perangkat meminta "kurangi gerakan".
   ============================================================ */
/* lompat ke atas seketika (mengabaikan scroll-behavior:smooth di CSS) */
function jumpTop(){const r=document.documentElement;if(!(window.pageYOffset||r.scrollTop||document.body.scrollTop))return;const o=r.style.scrollBehavior;
  r.style.scrollBehavior='auto';window.scrollTo(0,0);r.scrollTop=0;document.body.scrollTop=0;
  requestAnimationFrame(()=>{r.style.scrollBehavior=o});}
try{history.scrollRestoration='manual'}catch(e){}
const Fx=(()=>{
  const EASE='cubic-bezier(.32,.72,0,1)';
  const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  const canVT=()=>!reduce()&&typeof document.startViewTransition==='function';
  const root=document.documentElement;
  let inVt=false;
  const ORD=['glosarium','tokoh','panduan-guru','dasbor','periksa','lainnya','masuk'];
  const order=h=>h==='masuk'?-1:h===''||h==='beranda'?0:h==='unit'?.5:h.startsWith('unit-')?+h.slice(5):100+(ORD.indexOf(h)<0?9:ORD.indexOf(h));
  const setName=(el,n)=>{if(el)el.style.viewTransitionName=n};
  const clearNames=()=>document.querySelectorAll('[style*="view-transition-name"]').forEach(e=>{e.style.viewTransitionName=''});

  const clearOld=()=>{};
  /* perpindahan halaman */
  function go(a,b,fn){
    if(reduce()||a===b){fn();return}
    const dir=order(b)>=order(a)?'fwd':'back',fromUnit=a.startsWith('unit-'),toUnit=b.startsWith('unit-');
    if(canVT()){
      root.dataset.vt='page';root.dataset.dir=dir;
      const vis=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+40&&r.width>0};
      const card=h=>document.querySelector('a[href="#'+h+'"] [data-vt]');
      if(fromUnit){const t=document.querySelector('.ut');if(vis(t))setName(t,'ut')}
      else if(toUnit){const t=card(b);if(vis(t))setName(t,'ut')}
      const t=document.startViewTransition(()=>{
        inVt=true;try{fn()}finally{inVt=false}
        clearOld();
        if(toUnit)setName(document.querySelector('.ut'),'ut');
        else if(fromUnit){const t=card(a);if(vis(t))setName(t,'ut')}
      });
      t.finished.catch(()=>{}).finally(()=>{clearNames();delete root.dataset.vt;delete root.dataset.dir});
      return;
    }
    /* cadangan */
    const app=document.getElementById('app'),d=dir==='fwd'?1:-1;
    if(!app.animate){fn();return}
    app.animate([{opacity:1,transform:'none'},{opacity:0,transform:`translateX(${-d*28}px)`}],{duration:220,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}).finished.then(()=>{
      jumpTop();fn();
      app.animate([{opacity:0,transform:`translateX(${d*40}px)`},{opacity:1,transform:'none'}],{duration:520,easing:EASE});
      app.getAnimations().forEach(x=>{if(x.playState==='finished'&&x.effect.getKeyframes()[1].opacity==='0')x.cancel()});
    }).catch(()=>fn());
  }

  /* ganti tema tanpa lonjakan */
  function theme(fn){
    if(!canVT()){fn();return}
    root.dataset.vt='theme';
    const t=document.startViewTransition(fn);
    t.finished.catch(()=>{}).finally(()=>{delete root.dataset.vt});
  }

  /* filter grid dengan morf posisi: item yang hilang menyusut, sisanya meluncur ke tempat baru */
  async function flipFilter(items,show){
    const live=items.filter(e=>!e.classList.contains('hidden')),
      out=live.filter(e=>!show(e)),
      inc=items.filter(e=>e.classList.contains('hidden')&&show(e));
    if(reduce()||!items[0].animate){items.forEach(e=>e.classList.toggle('hidden',!show(e)));return}
    if(out.length)await Promise.all(out.map(e=>e.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.97)'}],{duration:180,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{})));
    const stay=items.filter(e=>!e.classList.contains('hidden')&&show(e)),first=new Map(stay.map(e=>[e,e.getBoundingClientRect()]));
    items.forEach(e=>{e.getAnimations().forEach(x=>x.cancel());e.classList.toggle('hidden',!show(e))});
    stay.forEach(e=>{const a=first.get(e),b=e.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;
      if(dx||dy)e.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:520,easing:EASE})});
    inc.forEach((e,i)=>e.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:520,delay:80+i*40,easing:EASE,fill:'backwards'}));
  }

  /* parallax: --py pada elemen [data-par="faktor"] (maks. data-range px) */
  let pl=[],pt=0;
  const pOn=()=>!reduce()&&matchMedia('(min-width:900px)').matches;
  const pStep=()=>{pt=0;if(!pOn())return;const h=innerHeight;
    pl.forEach(el=>{const r=el.getBoundingClientRect();if(r.bottom<-200||r.top>h+200)return;
      const f=parseFloat(el.dataset.par)||.1,m=parseFloat(el.dataset.range)||24,off=r.top+r.height/2-h/2;
      el.style.setProperty('--py',Math.max(-m,Math.min(m,-off*f)).toFixed(1)+'px')})};
  const pKick=()=>{if(!pt)pt=requestAnimationFrame(pStep)};
  addEventListener('scroll',pKick,{passive:true});addEventListener('resize',pKick);
  function parallax(){pl=[...document.querySelectorAll('[data-par]')];if(!pOn()){pl.forEach(e=>e.style.removeProperty('--py'));return}pStep()}

  return{go,theme,flipFilter,parallax,inVt:()=>inVt,reduce,EASE};
})();
