/* ============================================================
   SESI, SINKRONISASI, MASUK/DAFTAR, DASBOR GURU.
   Bergantung pada Store (store.js). Fungsi/variabel dari app.js
   (state, setState, esc, $, app, ov, after, renderNav, popOpen, ...) dipakai saat runtime.
   ============================================================ */
/* siluet profil kosong (bukan huruf depan) */
const PFP='<svg class="pf" viewBox="0 0 24 24" aria-hidden="true"><circle class="pbg" cx="12" cy="12" r="12"/><circle class="pfg" cx="12" cy="9.3" r="4"/><path class="pfg" d="M4.6 20.6c.7-4 3.6-6.3 7.4-6.3s6.7 2.3 7.4 6.3a11.9 11.9 0 0 1-14.8 0z"/></svg>';
/* foto profil Google bila ada; bila gagal dimuat, siluet di bawahnya tetap terlihat */
const avatar=u=>u&&u.foto?`<span class="phw">${PFP}<img src="${esc(u.foto)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()"></span>`:PFP;
const avS=u=>u.foto?`<span class="av s pf">${avatar(u)}</span>`:`<span class="av s">${esc(ini(u.nama))}</span>`;
const idOf=u=>u.role==='guru'?(u.email||''):(u.nis?'NIS '+u.nis:(u.email||'Murid'));
const GIC='<svg class="gic" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
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
      if((h==='dasbor'||h==='panduan-guru'||h==='periksa')&&(!user||user.role!=='guru'))return'beranda';
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
    async out(){await Store.auth.logout();user=null;fb={};sessionStorage.removeItem(G);setState(ld(KEY,{}));closeOv(true);popClose(document.getElementById('accPop'),true);api.go('masuk')},
    guestGo(){sessionStorage.setItem(G,'1');api.go('beranda')},
    paint(){const b=document.getElementById('bAcc');if(!b)return;
      document.body.classList.toggle('is-auth',(location.hash||'').slice(1)==='masuk');document.body.dataset.role=user?user.role:'tamu';
      b.classList.toggle('on',!!user);b.setAttribute('aria-label',user?'Akun: '+user.nama:'Masuk');
      b.innerHTML=user?avatar(user):'<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.7-5.4 7-5.4s6.2 1.8 7 5.4"/></svg>'},
    /* akun: popover di desktop (tombol akun hanya tampil di desktop) */
    async panel(e){
      if(e&&e.stopPropagation)e.stopPropagation();
      if(!user){api.go('masuk');return}
      const p=document.getElementById('accPop');
      if(!p.classList.contains('hidden')&&!p.dataset.c){popClose(p);return}
      let c=null;try{c=await Store.teacher.classInfo(user.kelas)}catch(x){}
      p.innerHTML=`<div class="acc"><div class="av pf">${avatar(user)}</div><b>${esc(user.nama)}</b>
        <p class="meta">${user.role==='guru'?'Guru':'Murid'} · ${esc(idOf(user))}</p>
        <p class="kls">${c?esc(c.nama):''} <span>Kode kelas <b>${esc(user.kelas)}</b></span></p>
        <button type="button" class="btn" id="lo">Keluar</button></div>`;
      $('#lo').onclick=api.out;popOpen(p)}
  };
  document.getElementById('bAcc').onclick=api.panel;
  return api;
})();

/* ---------------- Masuk / Daftar ---------------- */
function viewMasuk(){
  let role='murid',mode='masuk';
  app.innerHTML=`<div class="authbox"><aside class="ab"><div class="abtop"><span class="logo" lang="zh" aria-hidden="true">史</span></div>
    <div class="abmid"><h1>Jejak yang Tersembunyi</h1><p class="sub">E-modul suplemen Sejarah kelas XI</p>
    <ul><li>Tujuh unit tentang peran etnis Tionghoa dalam sejarah Indonesia</li><li>Jawaban dan progres belajar tersimpan di akunmu</li><li>Guru memantau perkembangan kelas dari satu dasbor</li></ul></div>
    <div class="abbot"><small>${Store.mode==='lokal'?'Mode prototipe: data tersimpan di peramban ini dan belum tersinkron antarperangkat.':'Tersinkron ke server.'}</small></div>
    <span class="gl2" lang="zh" aria-hidden="true">史</span></aside>
    <div class="af"><div class="afi" id="afi"><div class="seg tabs2 hidden" role="tablist"><button type="button" role="tab" data-m="masuk">Masuk</button><button type="button" role="tab" data-m="daftar">Daftar</button></div><div id="pane"></div></div></div></div>`;
  const box=$('#afi'),pane=$('#pane'),tabs=$('.tabs2',box);
  const EZ='cubic-bezier(.32,.72,0,1)';
  /* ganti isi panel: tinggi kotak bermorf dari ukuran lama ke ukuran baru, isi bergeser naik */
  const setPane=(html,withTabs,first)=>{const h0=box.offsetHeight;
    tabs.classList.toggle('hidden',!withTabs);tabs.style.setProperty('--i',mode==='masuk'?0:1);
    $$('[data-m]',tabs).forEach(b=>b.setAttribute('aria-selected',b.dataset.m===mode));
    pane.innerHTML=html;
    if(!first&&!Fx.reduce()&&box.animate){const h1=box.offsetHeight;
      if(Math.abs(h1-h0)>1)box.animate([{height:h0+'px'},{height:h1+'px'}],{duration:480,easing:EZ});
      pane.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:480,easing:EZ})}};
  $$('[data-m]',tabs).forEach(b=>b.onclick=()=>{if(mode===b.dataset.m)return;mode=b.dataset.m;draw()});
  const F=(n,l,t,ph,ac)=>`<label class="fl"><span>${l}</span><input name="${n}" type="${t}" placeholder="${ph||''}" autocomplete="${ac||'off'}" required></label>`;
  const roleSeg=(from)=>`<div class="seg role" id="rs" style="--i:${from==='guru'?1:0}"><button type="button" data-r="murid" aria-pressed="${role==='murid'}">Murid</button><button type="button" data-r="guru" aria-pressed="${role==='guru'}">Guru</button></div>`;
  const slideRole=()=>{const s=$('#rs');if(s)requestAnimationFrame(()=>requestAnimationFrame(()=>s.style.setProperty('--i',role==='guru'?1:0)))};
  const shake=f=>f.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'none'}],{duration:260});
  const draw=(fromRole,first)=>{
    const L=mode==='masuk',M=role==='murid';
    setPane(`<h2>${L?'Selamat datang kembali':'Buat akun baru'}</h2>
    ${L?'':roleSeg(fromRole||role)}
    <form id="fm" novalidate>
     ${L?F('id','NIS atau email','text','mis. 2026001 atau guru@sekolah.id','username')+F('pw','Kata sandi','password','','current-password')
       :M?F('nama','Nama lengkap','text','','name')+F('nis','NIS','text','Nomor induk siswa','off')+F('kode','Kode kelas','text','5 karakter dari gurumu','off')+F('pw','Kata sandi (min. 6 karakter)','password','','new-password')
       :F('nama','Nama lengkap','text','','name')+F('email','Email','email','','email')+F('kelas','Nama kelas / mata pelajaran','text','mis. XI-3 Sejarah','off')+F('pw','Kata sandi (min. 6 karakter)','password','','new-password')}
     <p class="err" id="er" role="alert"></p>
     <button type="submit" class="btn full">${L?'Masuk':M?'Daftar dan masuk':'Buat akun guru'}</button></form>
    ${Store.auth.google?'<button type="button" class="lnk" id="bk">← Kembali ke masuk dengan Google</button>':''}
    <button type="button" class="lnk" id="gs">Lanjut tanpa akun (hanya di perangkat ini)</button>`,true,first);
    $$('[data-r]',pane).forEach(b=>b.onclick=()=>{if(role===b.dataset.r)return;const o=role;role=b.dataset.r;draw(o)});
    slideRole();
    $('#gs').onclick=Sess.guestGo;const bk=$('#bk');if(bk)bk.onclick=()=>home();
    $('#fm').onsubmit=async e=>{e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f)),bt=f.querySelector('.full'),er=$('#er');
      er.textContent='';
      try{await busy(bt,(async()=>{const u=L?await Store.auth.login({id:v.id,password:v.pw}):M?await Store.auth.registerStudent({nama:v.nama,nis:v.nis,kode:v.kode,password:v.pw}):await Store.auth.registerTeacher({nama:v.nama,email:v.email,kelas:v.kelas,password:v.pw});
        await Sess.enter(u)})(),L?'Memeriksa…':'Membuat akun…')}catch(x){er.textContent=x.message;shake(f)}};
  };
  /* ---- layar utama: Google ---- */
  const inApp=/FBAN|FBAV|Instagram|Line\/|TikTok|; wv\)/i.test(navigator.userAgent);
  const home=(first)=>{
    if(!Store.auth.google){draw(null,first);return}
    setPane(`<h2>Selamat datang</h2><p class="hint">Masuk dengan akun Google, untuk murid maupun guru. Cukup pilih akun.</p>
    ${inApp?'<p class="warnb">Kamu membuka lewat aplikasi lain. Google memblokir login di sini. Buka tautan ini di Chrome atau Safari.</p>':''}
    <button type="button" class="gbtn" id="gg">${GIC}<span>Lanjutkan dengan Google</span></button>
    <p class="err" id="er" role="alert"></p>
    <button type="button" class="lnk" id="pw">Punya akun NIS atau email dan kata sandi? Masuk di sini</button>
    <button type="button" class="lnk" id="gs">Lanjut tanpa akun (hanya di perangkat ini)</button>`,false,first);
    $('#gs').onclick=Sess.guestGo;$('#pw').onclick=()=>{mode='masuk';draw()};
    $('#gg').onclick=async e=>{const b=e.currentTarget,er=$('#er');er.textContent='';
      try{const r=await busy(b,Store.auth.google(),'Membuka Google…');
        if(r.user)await Sess.enter(r.user);else onboard(r.baru)}
      catch(x){er.textContent=x.message}};
  };
  /* ---- pengguna Google baru: pilih peran, lengkapi satu isian ---- */
  const onboard=g=>{
    let r='murid';
    const paint=(from)=>{const M=r==='murid';
      setPane(`<div class="lcard gme"><div class="av pf">${avatar(g)}</div><div class="lwho"><b>${esc(g.nama)}</b><small>${esc(g.email)}</small></div></div>
      <h2>Satu langkah lagi</h2><p class="hint">Kamu masuk sebagai siapa?</p>
      <div class="seg role" id="rs" style="--i:${from==='guru'?1:0}"><button type="button" data-r="murid" aria-pressed="${M}">Murid</button><button type="button" data-r="guru" aria-pressed="${!M}">Guru</button></div>
      <form id="fo" novalidate>
       ${F('nama','Nama lengkap','text','Tulis nama aslimu','name')}
       ${M?F('kode','Kode kelas','text','5 karakter dari gurumu','off')+'<label class="fl"><span>NIS (opsional)</span><input name="nis" type="text" inputmode="numeric" placeholder="Boleh dikosongkan" autocomplete="off"></label>'
          :F('kelas','Nama kelas / mata pelajaran','text','mis. XI-3 Sejarah','off')}
       <p class="err" id="er" role="alert"></p>
       <button type="submit" class="btn full">${M?'Gabung kelas':'Buat kelas'}</button></form>
      <button type="button" class="lnk" id="sw">Pakai akun Google lain</button>`,false);
      $$('[data-r]',pane).forEach(b=>b.onclick=()=>{if(r===b.dataset.r)return;const o=r;r=b.dataset.r;paint(o)});
      slideRole.call(null);const s=$('#rs');if(s)requestAnimationFrame(()=>requestAnimationFrame(()=>s.style.setProperty('--i',r==='guru'?1:0)));
      $('#sw').onclick=async()=>{try{await Store.auth.logout()}catch(e){}home()};
      $('#fo').onsubmit=async e=>{e.preventDefault();const f=e.target,v=Object.fromEntries(new FormData(f)),er=$('#er');er.textContent='';
        try{await busy(f.querySelector('.full'),(async()=>{await Sess.enter(await Store.auth.completeGoogle({role:r,nama:v.nama,kode:v.kode,nis:v.nis,kelas:v.kelas}))})(),'Menyimpan…')}
        catch(x){er.textContent=x.message;shake(f)}};
    };
    paint();
  };
  home(true);after();
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
  if(!soft){app.innerHTML='<div class="dash"><p class="meta"><i class="spin"></i>Memuat dasbor…</p></div>';after()}
  let info,R;
  try{info=await Store.teacher.classInfo(me.kelas)||{nama:'Kelas',kode:me.kelas};
    R=(await Store.teacher.roster(me.kelas)).map(r=>({...r,c:calc(r.progress)}))}
  catch(x){if(location.hash!=='#dasbor')return;
    if(soft){const u=$('#upd');if(u)u.textContent='Gagal memuat: '+x.message;return}
    app.innerHTML='<div class="dash"><p class="meta">Gagal memuat dasbor. '+esc(x.message)+'</p><button type="button" class="btn" id="rt">Coba lagi</button></div>';$('#rt').onclick=()=>viewDasbor();return}
  if(location.hash!=='#dasbor')return;
  const n=R.length,avg=n?Math.round(R.reduce((a,r)=>a+r.c.pct,0)/n):0,act=R.filter(r=>Date.now()-r.c.last<6048e5&&r.c.last).length,ans=R.reduce((a,r)=>a+r.c.ans,0);
  const kpi=(l,v,s)=>`<div class="kpi"><span>${l}</span><b>${v}</b><small>${s}</small></div>`;
  const short=t=>t.split(':')[0].length>46?t.slice(0,44)+'…':t.split(':')[0];
  const unitBars=UNITS.map(u=>{const d=n?Math.round(R.filter(r=>r.c.rows[u.id-1]&&r.c.rows[u.id-1].done).length/n*100):0;
    return`<div class="ub"><div class="un"><b>Unit ${u.id}</b><span>${esc(short(u.judul))}</span></div><div class="tr"><i data-w="${d}"></i></div><em>${d}%</em></div>`}).join('');
  const risk=R.filter(r=>!r.c.last||Date.now()-r.c.last>6048e5||r.c.pct<20).sort((a,b)=>a.c.last-b.c.last).slice(0,5);
  app.innerHTML=`<div class="dash">
   <div class="dh"><div><p class="meta">Dasbor guru</p><h1>${esc(info.nama)}</h1><p class="meta upd"><span id="upd">Diperbarui pukul ${new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</span><button class="btn ghost sm rf" id="rf" type="button">Segarkan</button></p></div>
    <div class="kode"><span>Kode kelas untuk murid</span><b id="kd">${esc(info.kode||me.kelas)}</b><button type="button" class="btn ghost sm" id="cp">Salin</button></div></div>
   ${n?`<div class="kpis">${kpi('Murid terdaftar',n,'di kelas ini')}${kpi('Rata-rata progres',avg+'%','dari tujuh unit')}${kpi('Aktif 7 hari terakhir',act+'<i>/'+n+'</i>','murid')}${kpi('Jawaban terkumpul',ans,'pemantik, refleksi, cek')}</div>
   <div class="dgrid"><section class="panel"><h3>Ketuntasan per unit</h3>${unitBars}</section>
    <section class="panel"><h3>Perlu perhatian</h3>${risk.length?risk.map(r=>`<button type="button" class="rk" data-i="${R.indexOf(r)}">${avS(r.user)}<span class="rkb"><b>${esc(r.user.nama)}</b><small>${!r.c.last?'Belum mulai belajar':Date.now()-r.c.last>6048e5?'Tidak aktif '+rel(r.c.last).replace(' lalu',''):'Progres masih '+r.c.pct+'%'}</small></span></button>`).join(''):'<p class="muted">Semua murid aktif dan berjalan baik.</p>'}</section></div>
   <section class="panel tbl"><div class="tb"><input class="find" id="q" placeholder="Cari nama atau NIS" aria-label="Cari murid"><select class="sel" id="so" aria-label="Urutkan"><option value="n">Urut nama</option><option value="p">Progres tertinggi</option><option value="pl">Progres terendah</option><option value="t">Terakhir aktif</option></select><button type="button" class="btn ghost sm" id="ex">CSV ringkasan</button><button type="button" class="btn ghost sm" id="ex2">CSV jawaban</button><span class="st" id="exs" role="status"></span></div>
    <div class="lg"><span><i class="hc s2"></i>Selesai</span><span><i class="hc s1"></i>Sedang dibaca</span><span><i class="hc s0"></i>Belum</span></div>
    <div class="rowh" aria-hidden="true"><span>Murid</span><span>Progres</span><span>Status per unit</span><span>Kata</span><span>Terakhir aktif</span></div>
    <div class="rows" id="rows"></div></section>`
   :`<section class="panel empty"><h3>Belum ada murid</h3><p>Bagikan kode kelas <b>${esc(info.kode||me.kelas)}</b> ke murid. Mereka mendaftar lewat tab <b>Daftar</b> sebagai Murid, lalu progresnya muncul di sini.</p>
    ${Store.mode==='lokal'?'<p class="muted">Ingin melihat tampilan dasbor yang terisi?</p><button type="button" class="btn" id="sd">Muat data contoh</button>':''}</section>`}</div>`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>$$('.tr i[data-w]').forEach(i=>i.style.width=i.dataset.w+'%')));
  $('#rf').onclick=e=>busy(e.currentTarget,viewDasbor(true),'Memuat…');
  const cp=$('#cp');if(cp)cp.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(info.kode||me.kelas);cp.textContent='Tersalin';setTimeout(()=>cp.textContent='Salin',1400)};
  const sd=$('#sd');if(sd)sd.onclick=async()=>{await Store.teacher.seedDemo(me.kelas,UNITS);viewDasbor()};
  if(!n)return;
  const draw=()=>{const q=$('#q').value.trim().toLowerCase(),s=$('#so').value;
    const L=R.filter(r=>!q||(r.user.nama+' '+(r.user.nis||'')+' '+(r.user.email||'')).toLowerCase().includes(q));
    L.sort(s==='p'?(a,b)=>b.c.pct-a.c.pct:s==='pl'?(a,b)=>a.c.pct-b.c.pct:s==='t'?(a,b)=>b.c.last-a.c.last:(a,b)=>a.user.nama.localeCompare(b.user.nama));
    $('#rows').innerHTML=L.length?L.map(r=>{const age=Date.now()-r.c.last,dot=!r.c.last?'off':age<2*864e5?'on':age<6048e5?'mid':'off';
      return`<div class="row" tabindex="0" role="button" data-i="${R.indexOf(r)}"><div class="who">${avS(r.user)}<span><b>${esc(r.user.nama)}</b><small>${esc(idOf(r.user))}</small></span></div>
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
  const dl=(nama,rows)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));a.download=nama;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2e3)};
  const ST=['belum','sedang dibaca','selesai'];
  $('#ex').onclick=()=>{
    const h=['Nama','NIS','Email','Kelas','Progres %','Unit selesai','Jawaban terkirim','Total kata','Terakhir aktif'];
    UNITS.forEach(u=>h.push('Unit '+u.id+' status','Unit '+u.id+' bagian dibaca (dari 8)','Unit '+u.id+' jawaban terkirim'));
    dl('ringkasan-'+kode+'-'+nowStr()+'.csv',[h,...R.map(r=>[r.user.nama,r.user.nis||'',r.user.email||'',info.nama,r.c.pct,r.c.doneN,r.c.ans,r.c.words,ts(r.c.last),
      ...r.c.rows.flatMap(x=>[ST[x.st],x.seen,x.ans])])])};
  const JENIS=k=>k==='pemantik'?'Pemantik':/^q\d+$/.test(k)?'Bandingkan sumber':k==='refleksi'?'Refleksi':/^c\d+$/.test(k)?'Cek pemahaman':'Lainnya';
  const TANYA=(u,k)=>k==='pemantik'?u.pemantik.teks:k==='refleksi'?u.refleksi:/^q\d+$/.test(k)?(u.banding.tanya[+k.slice(1)]||k):/^c\d+$/.test(k)?((u.cek[+k.slice(1)]||{}).q||k):k;
  const RK=k=>k==='pemantik'?0:/^q/.test(k)?1:k==='refleksi'?2:3;
  $('#ex2').onclick=async e=>{const st=$('#exs');st.textContent='';
    try{await busy(e.currentTarget,(async()=>{
      let gagal=0;const F=await Promise.all(R.map(r=>Store.feedback.load(r.user.uid).catch(()=>{gagal++;return{}})));
      const rows=[['Nama','NIS','Email','Unit','Judul unit','Jenis','Pertanyaan','Jawaban murid','Jumlah kata','Waktu dikirim','Umpan balik guru','Waktu umpan balik']];
      R.forEach((r,i)=>UNITS.forEach(u=>{const S=((r.progress.sent||{})[u.id])||{};
        Object.keys(S).filter(k=>wc(S[k].t)).sort((x,y)=>RK(x)-RK(y)||x.localeCompare(y,undefined,{numeric:true})).forEach(k=>{const f=F[i][u.id+'_'+k]||{};
          rows.push([r.user.nama,r.user.nis||'',r.user.email||'',u.id,u.judul,JENIS(k),TANYA(u,k),S[k].t,wc(S[k].t),ts(S[k].at),f.t||'',ts(f.at)])})}));
      if(rows.length<2){st.textContent='Belum ada jawaban yang dikirim murid.';return}
      dl('jawaban-'+kode+'-'+nowStr()+'.csv',rows);
      st.textContent=(rows.length-1)+' jawaban diunduh'+(gagal?' · umpan balik '+gagal+' murid gagal dimuat':'')})(),'Menyiapkan…')}
    catch(x){st.textContent='Gagal: '+x.message}};
}
/* rincian murid: panel samping di desktop, lembar bawah di seluler */
async function detail(r){
  const M=isM();
  const hd=`${r.user.foto?`<span class="av pf">${avatar(r.user)}</span>`:`<span class="av">${esc(ini(r.user.nama))}</span>`}<div><h3>${esc(r.user.nama)}</h3><p class="meta">${esc(idOf(r.user))} · ${r.c.pct}% · terakhir aktif ${rel(r.c.last)}</p></div><button type="button" class="btn ghost sm" id="dx" aria-label="Tutup">Tutup</button>`,
    load='<p class="meta dload"><i class="spin"></i>Memuat jawaban…</p>';
  /* kerangka dibuat SEKALI; hanya isi .dbody yang diganti setelah data datang, jadi animasinya tidak mengulang */
  if(M){openOv('ov sh',`<div class="box sheet dsheet" role="dialog" aria-modal="true" aria-label="Jawaban ${esc(r.user.nama)}"><div class="gh" data-notap="1"><div class="grab"></div><div class="dth">${hd}</div></div><div class="dbody">${load}</div></div>`);
    dragSheet();$('#dx').onclick=()=>closeOv()}
  else{openOv('ov drw',`<div class="box det" role="dialog" aria-modal="true" aria-label="Jawaban ${esc(r.user.nama)}"><div class="dth">${hd}</div><div class="dbody">${load}</div></div>`);
    $('#dx').onclick=()=>closeOv();$('#dx').focus()}
  const dbody=$('.dbody',ov);
  let FBK={};try{FBK=await Store.feedback.load(r.user.uid)}catch(e){}
  if(!dbody.isConnected)return;
  let op=0;
  const rank=k=>k==='pemantik'?0:/^q/.test(k)?1:k==='refleksi'?2:3,
    lab=(u,k)=>k==='pemantik'?'Pemantik, jawaban sementara':k==='refleksi'?'Refleksi: '+u.refleksi:/^q\d+$/.test(k)?'Bandingkan sumber: '+(u.banding.tanya[+k.slice(1)]||k):/^c\d+$/.test(k)?'Cek pemahaman: '+((u.cek[+k.slice(1)]||{}).q||k):k;
  const body=UNITS.map((u,i)=>{const x=r.c.rows[i],N=sentOf(r.progress,u.id),SA=((r.progress.sent||{})[u.id]||{}),ks=Object.keys(N).filter(k=>wc(N[k])).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));
    return`<details${ks.length&&!op&&(op=1)?' open':''}><summary><span class="hc s${x.st}"></span><b>Unit ${u.id}</b><em>${['Belum mulai','Sedang dibaca','Selesai'][x.st]} · ${x.seen}/8 bagian · ${x.ans} jawaban</em></summary>
      ${ks.length?ks.map(k=>{const id=u.id+'_'+k,f=FBK[id];return`<div class="ans"><small>${esc(lab(u,k))} · dikirim ${rel(SA[k]&&SA[k].at)}</small><p>${esc(N[k])}</p><div class="fbw"><textarea data-fbk="${id}" aria-label="Umpan balik" placeholder="Tulis umpan balik untuk murid…">${esc(f&&f.t||'')}</textarea><div class="btnrow"><button type="button" class="btn ghost sm" data-sfb="${id}">${f&&f.t?'Perbarui umpan balik':'Kirim umpan balik'}</button><span class="st">${f&&f.t?'Terkirim '+rel(f.at).toLowerCase():''}</span></div></div></div>`}).join(''):'<p class="muted">Belum ada jawaban yang dikirim.</p>'}</details>`}).join('');
  dbody.innerHTML=body;
  dbody.onclick=async e=>{const b=e.target.closest('[data-sfb]');if(!b)return;
    const id=b.dataset.sfb,ta=$(`[data-fbk="${id}"]`,ov),st=b.parentNode.querySelector('.st'),v=ta.value.trim();
    st.textContent='';
    try{await busy(b,Store.feedback.save(r.user.uid,id,v,Sess.user().nama),'Mengirim…');st.textContent='Terkirim ke murid';b.textContent=v?'Perbarui umpan balik':'Kirim umpan balik'}
    catch(x){st.textContent='Gagal: '+x.message}};
}
