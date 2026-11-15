/* ============================================================
   SESI, SINKRONISASI, MASUK/DAFTAR, DASBOR GURU.
   Bergantung pada Store (store.js). Fungsi/variabel dari app.js
   (state, setState, esc, $, app, ov, after, renderNav) dipakai saat runtime.
   ============================================================ */
/* siluet profil kosong (bukan huruf depan) */
const PFP='<svg class="pf" viewBox="0 0 24 24" aria-hidden="true"><circle class="pbg" cx="12" cy="12" r="12"/><circle class="pfg" cx="12" cy="9.3" r="4"/><path class="pfg" d="M4.6 20.6c.7-4 3.6-6.3 7.4-6.3s6.7 2.3 7.4 6.3a11.9 11.9 0 0 1-14.8 0z"/></svg>';
const Sess=(()=>{
  let user=null,timer=null,fb={};const G='jejak-guest';
  const api={
    user:()=>user,role:()=>user&&user.role,
    guest:()=>sessionStorage.getItem(G)==='1',
    syncs:()=>!!user&&user.role==='murid',
    async init(){user=await Store.auth.current();return api.syncs()?Store.progress.load(user.uid):null},
    /* aturan akses: kembalikan hash tujuan bila halaman tidak boleh dibuka */
    gate(h){
      if(!user&&!api.guest())return h==='masuk'?null:'masuk';
      if(user&&h==='masuk')return user.role==='guru'?'dasbor':'beranda';
      if(h==='dasbor'&&(!user||user.role!=='guru'))return'beranda';
      if(h==='panduan-guru'&&user&&user.role==='murid')return'beranda';
      return null},
    /* simpan progres murid (ditunda 0,7 detik agar tidak menulis tiap ketikan) */
    push(){if(!api.syncs())return;clearTimeout(timer);
      const st=()=>document.getElementById('saved');if(st())st().textContent='Menyimpan…';
      timer=setTimeout(async()=>{try{await Store.progress.save(user.uid,state);if(st())st().textContent='Tersimpan ke akunmu'}
        catch(e){if(st())st().textContent='Gagal menyimpan. Periksa koneksi.'}},700)},
    /* kirim sekarang (dipakai tombol Kirim jawaban); gagal bila lebih dari 20 detik */
    async flush(){clearTimeout(timer);await Store.progress.save(user.uid,state);const st=document.getElementById('saved');if(st)st.textContent='Tersimpan ke akunmu'},
    fb:()=>fb,
    async loadFb(){if(!api.syncs())return fb;try{fb=await Store.feedback.load(user.uid)}catch(e){}return fb},
    msg:()=>api.syncs()?'Menyimpan…':'Tersimpan di peramban ini',
    go(t){location.hash==='#'+t?route():location.hash='#'+t},
    async enter(u){user=u;sessionStorage.removeItem(G);
      setState(api.syncs()?await Store.progress.load(u.uid):ld(KEY,{}));api.go(u.role==='guru'?'dasbor':'beranda')},
    async out(){await Store.auth.logout();user=null;fb={};sessionStorage.removeItem(G);setState(ld(KEY,{}));closeOv();api.go('masuk')},
    guestGo(){sessionStorage.setItem(G,'1');api.go('beranda')},
    paint(){const b=document.getElementById('bAcc');if(!b)return;
      document.body.classList.toggle('is-auth',(location.hash||'').slice(1)==='masuk');
      b.classList.toggle('on',!!user);b.setAttribute('aria-label',user?'Akun: '+user.nama:'Masuk');
      b.innerHTML=user?PFP:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.7-5.4 7-5.4s6.2 1.8 7 5.4"/></svg>'},
    async panel(){
      if(!user){api.go('masuk');return}
      const c=await Store.teacher.classInfo(user.kelas);
      ov.className='ov';ov.innerHTML=`<div class="box acc"><div class="av pf">${PFP}</div><h3>${esc(user.nama)}</h3>
        <p class="meta">${user.role==='guru'?'Guru':'Murid'} · ${esc(user.role==='guru'?user.email:'NIS '+user.nis)}</p>
        <p class="kls">${c?esc(c.nama):''} <span>Kode kelas <b>${esc(user.kelas)}</b></span></p>
        <div class="btnrow"><button id="lo">Keluar</button><button class="ghost" id="cl">Tutup</button></div></div>`;
      $('#lo').onclick=api.out;$('#cl').onclick=closeOv;ov.onclick=e=>{if(e.target===ov)closeOv()}}
  };
  document.getElementById('bAcc').onclick=api.panel;
  return api;
})();

/* ---------------- Masuk / Daftar ---------------- */
function viewMasuk(){
  let role='murid',mode='masuk';
  app.innerHTML=`<div class="authbox"><aside class="ab"><span class="logo" lang="zh">史</span>
    <h1>Jejak yang Tersembunyi</h1><p class="sub">E-modul suplemen Sejarah kelas XI</p>
    <ul><li>Tujuh unit tentang peran etnis Tionghoa dalam sejarah Indonesia</li><li>Jawaban dan progres belajar tersimpan di akunmu</li><li>Guru memantau perkembangan kelas dari satu dasbor</li></ul>
    <small>${Store.mode==='lokal'?'Mode prototipe: data tersimpan di peramban ini dan belum tersinkron antarperangkat.':'Tersinkron ke server.'}</small></aside>
    <div class="af"><div class="afi" id="afi"></div></div></div>`;
  const box=$('#afi');
  const F=(n,l,t,ph,ac)=>`<label class="fl"><span>${l}</span><input name="${n}" type="${t}" placeholder="${ph||''}" autocomplete="${ac||'off'}" required></label>`;
  const draw=()=>{
    const L=mode==='masuk',M=role==='murid';
    box.innerHTML=`<div class="tabs2" role="tablist"><button type="button" role="tab" aria-selected="${L}" data-m="masuk">Masuk</button><button type="button" role="tab" aria-selected="${!L}" data-m="daftar">Daftar</button><i></i></div>
    <h2>${L?'Selamat datang kembali':'Buat akun baru'}</h2>
    ${L?'':`<div class="seg role"><button type="button" data-r="murid" aria-pressed="${M}">Murid</button><button type="button" data-r="guru" aria-pressed="${!M}">Guru</button></div>`}
    <form id="fm" novalidate>
     ${L?F('id','NIS atau email','text','mis. 2026001 atau guru@sekolah.id','username')+F('pw','Kata sandi','password','','current-password')
       :M?F('nama','Nama lengkap','text','','name')+F('nis','NIS','text','Nomor induk siswa','off')+F('kode','Kode kelas','text','5 karakter dari gurumu','off')+F('pw','Kata sandi (min. 6 karakter)','password','','new-password')
       :F('nama','Nama lengkap','text','','name')+F('email','Email','email','','email')+F('kelas','Nama kelas / mata pelajaran','text','mis. XI-3 Sejarah','off')+F('pw','Kata sandi (min. 6 karakter)','password','','new-password')}
     <p class="err" id="er" role="alert"></p>
     <button type="submit" class="full">${L?'Masuk':M?'Daftar dan masuk':'Buat akun guru'}</button></form>
    <button type="button" class="lnk" id="gs">Lanjut tanpa akun (hanya di perangkat ini)</button>`;
    box.querySelector('.tabs2').style.setProperty('--i',L?0:1);
    box.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;draw()});
    box.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{role=b.dataset.r;draw()});
    $('#gs').onclick=Sess.guestGo;
    $('#fm').onsubmit=async e=>{e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f)),bt=f.querySelector('.full'),er=$('#er');
      er.textContent='';
      try{await busy(bt,(async()=>{const u=L?await Store.auth.login({id:v.id,password:v.pw}):M?await Store.auth.registerStudent({nama:v.nama,nis:v.nis,kode:v.kode,password:v.pw}):await Store.auth.registerTeacher({nama:v.nama,email:v.email,kelas:v.kelas,password:v.pw});
        await Sess.enter(u)})(),L?'Memeriksa…':'Membuat akun…')}catch(x){er.textContent=x.message;f.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'none'}],{duration:260})}};
    if(box.animate)box.querySelector('form').animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.2,.7,.2,1)'});
  };
  draw();after(true);
}

/* ---------------- Dasbor guru ---------------- */
const rel=t=>{if(!t)return'Belum pernah';const s=(Date.now()-t)/1e3;
  if(s<90)return'Baru saja';if(s<3600)return Math.round(s/60)+' menit lalu';if(s<86400)return Math.round(s/3600)+' jam lalu';
  if(s<604800)return Math.round(s/86400)+' hari lalu';return new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'short'})};
const wc=v=>{v=String(v||'').trim();return v?v.split(/\s+/).length:0};
const sentOf=(p,id)=>Object.fromEntries(Object.entries(((p&&p.sent)||{})[id]||{}).map(([k,v])=>[k,v.t]));
function calc(p){
  const rows=UNITS.map(u=>{const seen=Object.keys((p.seen||{})[u.id]||{}).length,N=sentOf(p,u.id),ks=Object.keys(N).filter(k=>wc(N[k]));
    const done=!!(p.done||{})[u.id];return{id:u.id,seen,done,ans:ks.length,words:ks.reduce((a,k)=>a+wc(N[k]),0),st:done?2:(seen||ks.length?1:0)}});
  return{rows,pct:Math.round(rows.reduce((a,r)=>a+(r.done?1:Math.min(r.seen,8)/8*.9),0)/rows.length*100),
    doneN:rows.filter(r=>r.done).length,ans:rows.reduce((a,r)=>a+r.ans,0),words:rows.reduce((a,r)=>a+r.words,0),last:p.updated||0}
}
async function viewDasbor(soft){
  renderNav('dasbor');const me=Sess.user();
  if(!soft){app.innerHTML='<div class="dash"><p class="meta"><i class="spin"></i>Memuat dasbor…</p></div>';after(true)}
  let info,R;
  try{info=await Store.teacher.classInfo(me.kelas)||{nama:'Kelas',kode:me.kelas};
    R=(await Store.teacher.roster(me.kelas)).map(r=>({...r,c:calc(r.progress)}))}
  catch(x){if(location.hash!=='#dasbor')return;
    if(soft){const u=$('#upd');if(u)u.textContent='Gagal memuat: '+x.message;return}
    app.innerHTML='<div class="dash"><p class="meta">Gagal memuat dasbor. '+esc(x.message)+'</p><button id="rt">Coba lagi</button></div>';$('#rt').onclick=()=>viewDasbor();return}
  if(location.hash!=='#dasbor')return;
  const n=R.length,avg=n?Math.round(R.reduce((a,r)=>a+r.c.pct,0)/n):0,act=R.filter(r=>Date.now()-r.c.last<6048e5&&r.c.last).length,ans=R.reduce((a,r)=>a+r.c.ans,0);
  const kpi=(l,v,s)=>`<div class="kpi"><span>${l}</span><b>${v}</b><small>${s}</small></div>`;
  const short=t=>t.split(':')[0].length>46?t.slice(0,44)+'…':t.split(':')[0];
  const unitBars=UNITS.map(u=>{const d=n?Math.round(R.filter(r=>r.c.rows[u.id-1]&&r.c.rows[u.id-1].done).length/n*100):0;
    return`<div class="ub"><div class="un"><b>Unit ${u.id}</b><span>${esc(short(u.judul))}</span></div><div class="tr"><i data-w="${d}"></i></div><em>${d}%</em></div>`}).join('');
  const risk=R.filter(r=>!r.c.last||Date.now()-r.c.last>6048e5||r.c.pct<20).sort((a,b)=>a.c.last-b.c.last).slice(0,5);
  app.innerHTML=`<div class="dash">
   <header class="dh"><div><p class="meta">Dasbor guru</p><h1>${esc(info.nama)}</h1><p class="meta upd"><span id="upd">Diperbarui pukul ${new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span><button class="ghost rf" id="rf" type="button">Segarkan</button></p></div>
    <div class="kode"><span>Kode kelas untuk murid</span><b id="kd">${esc(info.kode||me.kelas)}</b><button class="ghost" id="cp">Salin</button></div></header>
   ${n?`<div class="kpis">${kpi('Murid terdaftar',n,'di kelas ini')}${kpi('Rata-rata progres',avg+'%','dari tujuh unit')}${kpi('Aktif 7 hari terakhir',act+'<i>/'+n+'</i>','murid')}${kpi('Jawaban terkumpul',ans,'pemantik, refleksi, cek')}</div>
   <div class="dgrid"><section class="panel"><h3>Ketuntasan per unit</h3>${unitBars}</section>
    <section class="panel"><h3>Perlu perhatian</h3>${risk.length?risk.map(r=>`<button class="rk" data-i="${R.indexOf(r)}"><span class="av s">${esc(ini(r.user.nama))}</span><span><b>${esc(r.user.nama)}</b><small>${!r.c.last?'Belum mulai belajar':Date.now()-r.c.last>6048e5?'Tidak aktif '+rel(r.c.last).replace(' lalu',''):'Progres masih '+r.c.pct+'%'}</small></span></button>`).join(''):'<p class="muted">Semua murid aktif dan berjalan baik.</p>'}</section></div>
   <section class="panel tbl"><div class="tb"><input class="find" id="q" placeholder="Cari nama atau NIS" aria-label="Cari murid"><select id="so" aria-label="Urutkan"><option value="n">Urut nama</option><option value="p">Progres tertinggi</option><option value="pl">Progres terendah</option><option value="t">Terakhir aktif</option></select><button class="ghost" id="ex" type="button">CSV ringkasan</button><button class="ghost" id="ex2" type="button">CSV jawaban</button><span class="st" id="exs" role="status"></span></div>
    <div class="lg"><span><i class="hc s2"></i>Selesai</span><span><i class="hc s1"></i>Sedang dibaca</span><span><i class="hc s0"></i>Belum</span></div>
    <div class="rows" id="rows"></div></section>`
   :`<section class="panel empty"><h3>Belum ada murid</h3><p>Bagikan kode kelas <b>${esc(info.kode||me.kelas)}</b> ke murid. Mereka mendaftar lewat tab <b>Daftar</b> sebagai Murid, lalu progresnya muncul di sini.</p>
    ${Store.mode==='lokal'?'<p class="muted">Ingin melihat tampilan dasbor yang terisi?</p><button id="sd">Muat data contoh</button>':''}</section>`}</div>`;
  requestAnimationFrame(()=>$$('.tr i').forEach(i=>i.style.width=i.dataset.w+'%'));
  $('#rf').onclick=e=>busy(e.currentTarget,viewDasbor(true),'Memuat…');
  const cp=$('#cp');if(cp)cp.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(info.kode||me.kelas);cp.textContent='Tersalin';setTimeout(()=>cp.textContent='Salin',1400)};
  const sd=$('#sd');if(sd)sd.onclick=async()=>{await Store.teacher.seedDemo(me.kelas,UNITS);viewDasbor()};
  if(!n)return;
  const draw=()=>{const q=$('#q').value.trim().toLowerCase(),s=$('#so').value;
    const L=R.filter(r=>!q||(r.user.nama+' '+r.user.nis).toLowerCase().includes(q));
    L.sort(s==='p'?(a,b)=>b.c.pct-a.c.pct:s==='pl'?(a,b)=>a.c.pct-b.c.pct:s==='t'?(a,b)=>b.c.last-a.c.last:(a,b)=>a.user.nama.localeCompare(b.user.nama));
    $('#rows').innerHTML=L.length?L.map(r=>{const age=Date.now()-r.c.last,dot=!r.c.last?'off':age<2*864e5?'on':age<6048e5?'mid':'off';
      return`<div class="row" tabindex="0" role="button" data-i="${R.indexOf(r)}"><div class="who"><span class="av s">${esc(ini(r.user.nama))}</span><span><b>${esc(r.user.nama)}</b><small>NIS ${esc(r.user.nis)}</small></span></div>
       <div class="pg"><div class="tr"><i style="width:${r.c.pct}%"></i></div><b>${r.c.pct}%</b></div>
       <div class="hm" aria-label="Status tiap unit">${r.c.rows.map(x=>`<i class="hc s${x.st}" title="Unit ${x.id}: ${['belum','sedang dibaca','selesai'][x.st]}"></i>`).join('')}</div>
       <div class="wd">${r.c.words}<small>kata</small></div><div class="la"><i class="dot ${dot}"></i>${rel(r.c.last)}</div></div>`}).join(''):'<p class="muted pad">Tidak ada murid yang cocok.</p>'};
  draw();$('#q').oninput=draw;$('#so').onchange=draw;
  $('#rows').onclick=e=>{const r=e.target.closest('.row');if(r)detail(R[+r.dataset.i])};
  $('#rows').onkeydown=e=>{if(e.key==='Enter'){const r=e.target.closest('.row');if(r)detail(R[+r.dataset.i])}};
  $$('.rk').forEach(b=>b.onclick=()=>detail(R[+b.dataset.i]));
  /* ---- unduh CSV ---- */
  const kode=info.kode||'kelas',nowStr=()=>new Date().toISOString().slice(0,10);
  const ts=t=>t?new Date(t-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16).replace('T',' '):'';
  const cell=v=>{let t=v==null?'':String(v);if(typeof v==='string'&&/^[=+\-@\t\r]/.test(t))t="'"+t;return'"'+t.replace(/"/g,'""')+'"'};
  const dl=(nama,rows)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));a.download=nama;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2e3)};
  const ST=['belum','sedang dibaca','selesai'];
  $('#ex').onclick=()=>{
    const h=['Nama','NIS','Kelas','Progres %','Unit selesai','Jawaban terkirim','Total kata','Terakhir aktif'];
    UNITS.forEach(u=>h.push('Unit '+u.id+' status','Unit '+u.id+' bagian dibaca (dari 8)','Unit '+u.id+' jawaban terkirim'));
    dl('ringkasan-'+kode+'-'+nowStr()+'.csv',[h,...R.map(r=>[r.user.nama,r.user.nis,info.nama,r.c.pct,r.c.doneN,r.c.ans,r.c.words,ts(r.c.last),
      ...r.c.rows.flatMap(x=>[ST[x.st],x.seen,x.ans])])])};
  const JENIS=k=>k==='pemantik'?'Pemantik':/^q\d+$/.test(k)?'Bandingkan sumber':k==='refleksi'?'Refleksi':/^c\d+$/.test(k)?'Cek pemahaman':'Lainnya';
  const TANYA=(u,k)=>k==='pemantik'?u.pemantik.teks:k==='refleksi'?u.refleksi:/^q\d+$/.test(k)?(u.banding.tanya[+k.slice(1)]||k):/^c\d+$/.test(k)?((u.cek[+k.slice(1)]||{}).q||k):k;
  const RK=k=>k==='pemantik'?0:/^q/.test(k)?1:k==='refleksi'?2:3;
  $('#ex2').onclick=async e=>{const st=$('#exs');st.textContent='';
    try{await busy(e.currentTarget,(async()=>{
      let gagal=0;const F=await Promise.all(R.map(r=>Store.feedback.load(r.user.uid).catch(()=>{gagal++;return{}})));
      const rows=[['Nama','NIS','Unit','Judul unit','Jenis','Pertanyaan','Jawaban murid','Jumlah kata','Waktu dikirim','Umpan balik guru','Waktu umpan balik']];
      R.forEach((r,i)=>UNITS.forEach(u=>{const S=((r.progress.sent||{})[u.id])||{};
        Object.keys(S).filter(k=>wc(S[k].t)).sort((x,y)=>RK(x)-RK(y)||x.localeCompare(y,undefined,{numeric:true})).forEach(k=>{const f=F[i][u.id+'_'+k]||{};
          rows.push([r.user.nama,r.user.nis,u.id,u.judul,JENIS(k),TANYA(u,k),S[k].t,wc(S[k].t),ts(S[k].at),f.t||'',ts(f.at)])})}));
      if(rows.length<2){st.textContent='Belum ada jawaban yang dikirim murid.';return}
      dl('jawaban-'+kode+'-'+nowStr()+'.csv',rows);
      st.textContent=(rows.length-1)+' jawaban diunduh'+(gagal?' · umpan balik '+gagal+' murid gagal dimuat':'')})(),'Menyiapkan…')}
    catch(x){st.textContent='Gagal: '+x.message}};
}
async function detail(r){
  ov.className='ov';ov.innerHTML='<div class="box det"><p class="meta" style="padding:24px"><i class="spin"></i>Memuat jawaban…</p></div>';
  let FBK={};try{FBK=await Store.feedback.load(r.user.uid)}catch(e){}
  if(ov.classList.contains('hidden'))return;
  const rank=k=>k==='pemantik'?0:/^q/.test(k)?1:k==='refleksi'?2:3,
    lab=(u,k)=>k==='pemantik'?'Pemantik, jawaban sementara':k==='refleksi'?'Refleksi: '+u.refleksi:/^q\d+$/.test(k)?'Bandingkan sumber: '+(u.banding.tanya[+k.slice(1)]||k):/^c\d+$/.test(k)?'Cek pemahaman: '+((u.cek[+k.slice(1)]||{}).q||k):k;
  const body=UNITS.map((u,i)=>{const x=r.c.rows[i],N=sentOf(r.progress,u.id),SA=((r.progress.sent||{})[u.id]||{}),ks=Object.keys(N).filter(k=>wc(N[k])).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));
    return`<details><summary><span class="hc s${x.st}"></span><b>Unit ${u.id}</b><em>${['Belum mulai','Sedang dibaca','Selesai'][x.st]} · ${x.seen}/8 bagian · ${x.ans} jawaban</em></summary>
      ${ks.length?ks.map(k=>{const id=u.id+'_'+k,f=FBK[id];return`<div class="ans"><small>${esc(lab(u,k))} · dikirim ${rel(SA[k]&&SA[k].at)}</small><p>${esc(N[k])}</p><div class="fbw"><textarea data-fbk="${id}" aria-label="Umpan balik" placeholder="Tulis umpan balik untuk murid…">${esc(f&&f.t||'')}</textarea><div class="btnrow"><button type="button" class="ghost" data-sfb="${id}">${f&&f.t?'Perbarui umpan balik':'Kirim umpan balik'}</button><span class="st">${f&&f.t?'Terkirim '+rel(f.at).toLowerCase():''}</span></div></div></div>`}).join(''):'<p class="muted">Belum ada jawaban yang dikirim.</p>'}</details>`}).join('');
  ov.className='ov';ov.innerHTML=`<div class="box det"><div class="dt"><span class="av">${esc(ini(r.user.nama))}</span><div><h3>${esc(r.user.nama)}</h3><p class="meta">NIS ${esc(r.user.nis)} · ${r.c.pct}% · terakhir aktif ${rel(r.c.last)}</p></div><button class="ghost" id="dx" aria-label="Tutup">Tutup</button></div><div class="dbody">${body}</div></div>`;
  $('#dx').onclick=closeOv;ov.onclick=e=>{if(e.target===ov)closeOv()};
  $('.dbody',ov).onclick=async e=>{const b=e.target.closest('[data-sfb]');if(!b)return;
    const id=b.dataset.sfb,ta=$(`[data-fbk="${id}"]`,ov),st=b.parentNode.querySelector('.st'),v=ta.value.trim();
    st.textContent='';
    try{await busy(b,Store.feedback.save(r.user.uid,id,v,Sess.user().nama),'Mengirim…');st.textContent='Terkirim ke murid';b.textContent=v?'Perbarui umpan balik':'Kirim umpan balik'}
    catch(x){st.textContent='Gagal: '+x.message}};
}
