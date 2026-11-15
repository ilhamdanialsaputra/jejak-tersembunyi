/* FX: perpindahan halaman memakai View Transitions (judul unit bermorfosis dari kartu ke halaman),
   cadangan berupa satu gerak naik halus. Tanpa tirai, tanpa pantulan. Mati bila perangkat meminta kurangi gerakan. */
function jumpTop(){const r=document.documentElement;if(!(window.pageYOffset||r.scrollTop||document.body.scrollTop))return;const o=r.style.scrollBehavior;
  r.style.scrollBehavior='auto';window.scrollTo(0,0);r.scrollTop=0;document.body.scrollTop=0;
  requestAnimationFrame(()=>{r.style.scrollBehavior=o});}
try{history.scrollRestoration='manual'}catch(e){}
const Fx=(()=>{
  const reduce=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  const clear=()=>document.querySelectorAll('[style*="view-transition-name"]').forEach(e=>e.style.viewTransitionName='');
  function go(a,b,fn){
    if(reduce()||a===b){fn();return}
    const app=document.getElementById('app');
    if(!document.startViewTransition){fn();app.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'});return}
    const l=/^unit-/.test(b)&&app.querySelector(`:is(.peta a,.uc)[href="#${b}"]`),src=l&&l.querySelector('b');
    if(src)src.style.viewTransitionName='ut';
    const t=document.startViewTransition(()=>{clear();fn();const h=document.querySelector('#app h1.ut');if(src&&h)h.style.viewTransitionName='ut'});
    t.finished.finally(clear)
  }
  /* garis indikator tab yang meluncur dari tab lama ke tab baru */
  let pi=null;
  function nav(){
    const nv=document.getElementById('nav');if(!nv)return;
    const a=nv.querySelector('a.active');let i=nv.querySelector('.ind');
    if(!i){i=document.createElement('i');i.className='ind';nv.appendChild(i)}
    if(!a||!a.offsetWidth){i.style.opacity=0;return}
    const x=a.offsetLeft+14,w=Math.max(8,a.offsetWidth-28);
    if(pi){i.style.transition='none';i.style.transform=`translateX(${pi.x}px)`;i.style.width=pi.w+'px';i.getBoundingClientRect()}
    i.style.opacity=1;i.style.transition='';i.style.transform=`translateX(${x}px)`;i.style.width=w+'px';pi={x,w};
  }
  let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{pi=null;nav()},150)});
  return{go,nav};
})();
