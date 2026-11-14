/* ============================================================
   SESI, SINKRONISASI, MASUK/DAFTAR, DASBOR GURU.
   Bergantung pada Store (store.js). Fungsi/variabel dari app.js
   (state, setState, esc, $, app, ov, after, renderNav) dipakai saat runtime.
   ============================================================ */
const Sess=(()=>{
  let user=null,timer=null;const G='jejak-guest';
  const api={
    user:()=>user,role:()=>user&&user.role,
    guest:()=>sessionStorage.getItem(G)==='1',
    syncs:()=>!!user&&user.role==='murid',
    async init(){try{user=await Store.auth.current()}catch(e){user=null}return api.syncs()?Store.progress.load(user.uid):null},
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
    msg:()=>api.syncs()?'Menyimpan…':'Tersimpan di peramban ini',
    go(t){location.hash==='#'+t?route():location.hash='#'+t},
    async enter(u){user=u;sessionStorage.removeItem(G);
      setState(api.syncs()?await Store.progress.load(u.uid):ld(KEY,{}));api.go(u.role==='guru'?'dasbor':'beranda')},
    async out(){await Store.auth.logout();user=null;sessionStorage.removeItem(G);setState(ld(KEY,{}));closeOv();api.go('masuk')},
    guestGo(){sessionStorage.setItem(G,'1');api.go('beranda')},
    paint(){const b=document.getElementById('bAcc');if(!b)return;
      document.body.classList.toggle('auth',(location.hash||'').slice(1)==='masuk');
      b.classList.toggle('on',!!user);b.setAttribute('aria-label',user?'Akun: '+user.nama:'Masuk');
      b.innerHTML=user?`<span>${esc(ini(user.nama))}</span>`:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.7-5.4 7-5.4s6.2 1.8 7 5.4"/></svg>'},
    async panel(){
      if(!user){api.go('masuk');return}
      const c=await Store.teacher.classInfo(user.kelas);
      ov.className='ov';ov.innerHTML=`<div class="box acc"><div class="av">${esc(ini(user.nama))}</div><h3>${esc(user.nama)}</h3>
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
  app.innerHTML=`<div class="auth"><aside class="ab"><span class="logo" lang="zh">史</span>
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
      bt.disabled=true;er.textContent='';
      try{const u=L?await Store.auth.login({id:v.id,password:v.pw}):M?await Store.auth.registerStudent({nama:v.nama,nis:v.nis,kode:v.kode,password:v.pw}):await Store.auth.registerTeacher({nama:v.nama,email:v.email,kelas:v.kelas,password:v.pw});
        await Sess.enter(u)}catch(x){er.textContent=x.message;bt.disabled=false;f.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'none'}],{duration:260})}};
    if(box.animate)box.querySelector('form').animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:320,easing:'cubic-bezier(.2,.7,.2,1)'});
  };
  draw();after(true);
}

/* ---------------- Dasbor guru ---------------- */
const rel=t=>{if(!t)return'Belum pernah';const s=(Date.now()-t)/1e3;
  if(s<90)return'Baru saja';if(s<3600)return Math.round(s/60)+' menit lalu';if(s<86400)return Math.round(s/3600)+' jam lalu';
  if(s<604800)return Math.round(s/86400)+' hari lalu';return new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'short'})};
const wc=v=>{v=String(v||'').trim();return v?v.split(/\s+/).length:0};
function calc(p){
  const rows=UNITS.map(u=>{const seen=Object.keys((p.seen||{})[u.id]||{}).length,N=(p.notes||{})[u.id]||{},ks=Object.keys(N).filter(k=>wc(N[k]));
    const done=!!(p.done||{})[u.id];return{id:u.id,seen,done,ans:ks.length,words:ks.reduce((a,k)=>a+wc(N[k]),0),st:done?2:(seen||ks.length?1:0)}});
  return{rows,pct:Math.round(rows.reduce((a,r)=>a+(r.done?1:Math.min(r.seen,8)/8*.9),0)/rows.length*100),
    doneN:rows.filter(r=>r.done).length,ans:rows.reduce((a,r)=>a+r.ans,0),words:rows.reduce((a,r)=>a+r.words,0),last:p.updated||0}
}
async function viewDasbor(){
  renderNav('dasbor');const me=Sess.user();
  app.innerHTML='<div class="dash"><p class="meta">Memuat dasbor…</p></div>';after(true);
  const info=await Store.teacher.classInfo(me.kelas)||{nama:'Kelas',kode:me.kelas};
  let R=(await Store.teacher.roster(me.kelas)).map(r=>({...r,c:calc(r.progress)}));
  if(location.hash!=='#dasbor')return;
  const n=R.length,avg=n?Math.round(R.reduce((a,r)=>a+r.c.pct,0)/n):0,act=R.filter(r=>Date.now()-r.c.last<6048e5&&r.c.last).length,ans=R.reduce((a,r)=>a+r.c.ans,0);
  const kpi=(l,v,s)=>`<div class="kpi"><span>${l}</span><b>${v}</b><small>${s}</small></div>`;
  const short=t=>t.split(':')[0].length>46?t.slice(0,44)+'…':t.split(':')[0];
  const unitBars=UNITS.map(u=>{const d=n?Math.round(R.filter(r=>r.c.rows[u.id-1]&&r.c.rows[u.id-1].done).length/n*100):0;
    return`<div class="ub"><div class="un"><b>Unit ${u.id}</b><span>${esc(short(u.judul))}</span></div><div class="tr"><i data-w="${d}"></i></div><em>${d}%</em></div>`}).join('');
  const risk=R.filter(r=>!r.c.last||Date.now()-r.c.last>6048e5||r.c.pct<20).sort((a,b)=>a.c.last-b.c.last).slice(0,5);
  app.innerHTML=`<div class="dash">
   <header class="dh"><div><p class="meta">Dasbor guru</p><h1>${esc(info.nama)}</h1></div>
    <div class="kode"><span>Kode kelas untuk murid</span><b id="kd">${esc(info.kode||me.kelas)}</b><button class="ghost" id="cp">Salin</button></div></header>
   ${n?`<div class="kpis">${kpi('Murid terdaftar',n,'di kelas ini')}${kpi('Rata-rata progres',avg+'%','dari tujuh unit')}${kpi('Aktif 7 hari terakhir',act+'<i>/'+n+'</i>','murid')}${kpi('Jawaban terkumpul',ans,'pemantik, refleksi, cek')}</div>
   <div class="dgrid"><section class="panel"><h3>Ketuntasan per unit</h3>${unitBars}</section>
    <section class="panel"><h3>Perlu perhatian</h3>${risk.length?risk.map(r=>`<button class="rk" data-i="${R.indexOf(r)}"><span class="av s">${esc(ini(r.user.nama))}</span><span><b>${esc(r.user.nama)}</b><small>${!r.c.last?'Belum mulai belajar':Date.now()-r.c.last>6048e5?'Tidak aktif '+rel(r.c.last).replace(' lalu',''):'Progres masih '+r.c.pct+'%'}</small></span></button>`).join(''):'<p class="muted">Semua murid aktif dan berjalan baik.</p>'}</section></div>
   <section class="panel tbl"><div class="tb"><input class="find" id="q" placeholder="Cari nama atau NIS" aria-label="Cari murid"><select id="so" aria-label="Urutkan"><option value="n">Urut nama</option><option value="p">Progres tertinggi</option><option value="pl">Progres terendah</option><option value="t">Terakhir aktif</option></select><button class="ghost" id="ex">Unduh CSV</button></div>
    <div class="lg"><span><i class="hc s2"></i>Selesai</span><span><i class="hc s1"></i>Sedang dibaca</span><span><i class="hc s0"></i>Belum</span></div>
    <div class="rows" id="rows"></div></section>`
   :`<section class="panel empty"><h3>Belum ada murid</h3><p>Bagikan kode kelas <b>${esc(info.kode||me.kelas)}</b> ke murid. Mereka mendaftar lewat tab <b>Daftar</b> sebagai Murid, lalu progresnya muncul di sini.</p>
    ${Store.mode==='lokal'?'<p class="muted">Ingin melihat tampilan dasbor yang terisi?</p><button id="sd">Muat data contoh</button>':''}</section>`}</div>`;
  requestAnimationFrame(()=>$$('.tr i').forEach(i=>i.style.width=i.dataset.w+'%'));
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
  $('#ex').onclick=()=>{const h=['Nama','NIS','Progres %','Unit selesai','Kata jawaban','Terakhir aktif',...UNITS.map(u=>'Unit '+u.id)];
    const q=v=>'"'+String(v).replace(/"/g,'""')+'"';
    const csv=[h,...R.map(r=>[r.user.nama,r.user.nis,r.c.pct,r.c.doneN,r.c.words,r.c.last?new Date(r.c.last).toISOString().slice(0,16).replace('T',' '):'',...r.c.rows.map(x=>['belum','sedang','selesai'][x.st])])].map(a=>a.map(q).join(',')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));a.download='progres-'+(info.kode||'kelas')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2e3)};
}
function detail(r){
  const rank=k=>k==='pemantik'?0:/^q/.test(k)?1:k==='refleksi'?2:3,
    lab=(u,k)=>k==='pemantik'?'Pemantik, jawaban sementara':k==='refleksi'?'Refleksi: '+u.refleksi:/^q\d+$/.test(k)?'Bandingkan sumber: '+(u.banding.tanya[+k.slice(1)]||k):/^c\d+$/.test(k)?'Cek pemahaman: '+((u.cek[+k.slice(1)]||{}).q||k):k;
  const body=UNITS.map((u,i)=>{const x=r.c.rows[i],N=(r.progress.notes||{})[u.id]||{},ks=Object.keys(N).filter(k=>wc(N[k])).sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));
    return`<details><summary><span class="hc s${x.st}"></span><b>Unit ${u.id}</b><em>${['Belum mulai','Sedang dibaca','Selesai'][x.st]} · ${x.seen}/8 bagian · ${x.ans} jawaban</em></summary>
      ${ks.length?ks.map(k=>`<div class="ans"><small>${esc(lab(u,k))}</small><p>${esc(N[k])}</p></div>`).join(''):'<p class="muted">Belum ada jawaban.</p>'}</details>`}).join('');
  ov.className='ov';ov.innerHTML=`<div class="box det"><div class="dt"><span class="av">${esc(ini(r.user.nama))}</span><div><h3>${esc(r.user.nama)}</h3><p class="meta">NIS ${esc(r.user.nis)} · ${r.c.pct}% · terakhir aktif ${rel(r.c.last)}</p></div><button class="ghost" id="dx" aria-label="Tutup">Tutup</button></div><div class="dbody">${body}</div></div>`;
  $('#dx').onclick=closeOv;ov.onclick=e=>{if(e.target===ov)closeOv()};
}
