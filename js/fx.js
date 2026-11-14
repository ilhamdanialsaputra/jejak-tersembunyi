/* ============================================================
   FX — animasi perpindahan halaman + indikator navigasi.
   Perpindahan: tiga lapis tirai (merah, emas, kertas) menyapu layar
   searah navigasi (maju = kiri→kanan, mundur = kanan→kiri), tirai
   terakhir memuat nama tujuan. Isi halaman diganti saat layar tertutup,
   lalu tirai terbuka dan isi masuk dari arah yang sama.
   Otomatis dimatikan bila perangkat meminta "kurangi gerakan".
   ============================================================ */
/* lompat ke atas seketika (mengabaikan scroll-behavior:smooth di CSS) */
function jumpTop(){const r=document.documentElement,o=r.style.scrollBehavior;
  r.style.scrollBehavior='auto';window.scrollTo(0,0);r.scrollTop=0;document.body.scrollTop=0;
  requestAnimationFrame(()=>{r.style.scrollBehavior=o});}
try{history.scrollRestoration='manual'}catch(e){}
const Fx=(()=>{
  const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches||!Element.prototype.animate;
  const EASE='cubic-bezier(.76,0,.18,1)',OUT='cubic-bezier(.2,.7,.2,1)';
  let el=null,busy=false,phase='',next=null,pi=null;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const build=()=>{el=document.createElement('div');el.className='curtain';el.setAttribute('aria-hidden','true');
    el.innerHTML='<i class="c1"></i><i class="c2"></i><i class="c3"><div class="lab"><span class="z" lang="zh">史</span><b></b><small></small></div></i>';
    document.body.appendChild(el)};
  const FIX={glosarium:['Glosarium','Istilah kunci'],tokoh:['Tokoh','Kartu tokoh'],'panduan-guru':['Panduan guru','Untuk pengajar'],dasbor:['Dasbor','Pantau kelas'],periksa:['Periksa','Untuk penyusun'],masuk:['Masuk','Akun']};
  const ORD=['glosarium','tokoh','panduan-guru','dasbor','periksa','masuk'];
  const order=h=>h===''||h==='beranda'?0:h.startsWith('unit-')?+h.slice(5):100+(ORD.indexOf(h)<0?9:ORD.indexOf(h));
  const label=h=>{if(h===''||h==='beranda')return['Beranda','Peta modul'];
    if(h.startsWith('unit-')){const u=UNITS.find(x=>x.id===+h.slice(5));return u?['Unit '+u.id,u.periode]:['','']}
    return FIX[h]||['','']};
  const run=(n,kf,o)=>n.animate(kf,Object.assign({fill:'both',easing:EASE},o)).finished;

  async function go(a,b,fn){
    if(reduce()||a===b){fn();return}
    next=fn;
    if(busy){if(phase==='reveal'){const f=next;next=null;f()}return}
    busy=true;phase='cover';
    try{
      if(!el)build();
      const d=order(b)>=order(a)?1:-1,P=[...el.children],lab=el.querySelector('.lab'),[t,s]=label(b);
      lab.querySelector('b').textContent=t;lab.querySelector('small').textContent=s;
      el.classList.add('on');
      const from=d>0?'inset(0 100% 0 0)':'inset(0 0 0 100%)',full='inset(0 0 0 0)',to=d>0?'inset(0 0 0 100%)':'inset(0 100% 0 0)';
      await Promise.all(P.map((n,i)=>run(n,[{clipPath:from},{clipPath:full}],{duration:380,delay:i*70})));
      lab.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:300,fill:'both',easing:OUT});
      jumpTop();const f=next;next=null;if(f)f();jumpTop();
      await wait(170);
      phase='reveal';
      lab.animate([{opacity:1},{opacity:0}],{duration:160,fill:'both'});
      const app=document.getElementById('app');
      app.animate([{opacity:0,transform:`translateX(${d*40}px)`},{opacity:1,transform:'none'}],{duration:760,delay:140,easing:OUT,fill:'backwards'});
      await Promise.all([...P].reverse().map((n,i)=>run(n,[{clipPath:full},{clipPath:to}],{duration:460,delay:i*70})));
    }finally{
      if(el){el.getAnimations({subtree:true}).forEach(x=>x.cancel());el.classList.remove('on')}
      if(next){const f=next;next=null;f()}
      busy=false;phase='';
    }
  }

  /* garis indikator tab yang meluncur dari tab lama ke tab baru */
  function nav(){return;
    const nv=document.getElementById('nav');if(!nv)return;
    const a=nv.querySelector('a.active');let i=nv.querySelector('.ind');
    if(!i){i=document.createElement('i');i.className='ind';nv.appendChild(i)}
    if(!a){i.style.opacity=0;return}
    const x=a.offsetLeft+12,w=Math.max(8,a.offsetWidth-24);
    if(pi){i.style.transition='none';i.style.transform=`translateX(${pi.x}px)`;i.style.width=pi.w+'px';i.getBoundingClientRect()}
    i.style.opacity=1;i.style.transition='';i.style.transform=`translateX(${x}px)`;i.style.width=w+'px';pi={x,w};
  }
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{pi=null;nav()},150)});
  return{go,nav};
})();
