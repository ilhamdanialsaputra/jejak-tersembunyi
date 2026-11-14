/* Logika tampilan e-modul. Isi teks ada di data.js (tidak diubah). */
const KEY='jejak-tersembunyi-v1',PK='jejak-prefs-v1';
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let state=ld(KEY,{});state.done=state.done||{};state.notes=state.notes||{};state.seen=state.seen||{};
const save=()=>sv(KEY,state);
let prefs=Object.assign({tema:'auto',ukuran:100,proyektor:false},ld(PK,{}));
const app=document.getElementById('app'),$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let obs=null,spy=null;

/* ---------- teks: istilah glosarium + penanda draf ---------- */
const GLR=new RegExp('\\b('+GLOSARIUM.map(g=>g[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).sort((a,b)=>b.length-a.length).join('|')+')\\b','gi');
const draf=h=>h.replace(/\[[^\]]+\]/g,m=>`<span class="draf" title="Bagian ini masih draf / perlu diisi penyusun">${m}</span>`);
const T=s=>draf(esc(s));
function TG(s,used){return draf(esc(s).replace(GLR,m=>{const k=m.toLowerCase();if(used.has(k))return m;used.add(k);const g=GLOSARIUM.find(x=>x[0].toLowerCase()===k);return `<button type="button" class="gl" data-def="${esc(g[1])}">${m}</button>`}))}

/* ---------- media ---------- */
const IC={Foto:'<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="12" cy="12" r="3.5"/>',Gambar:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 16l5-5 4 4 3-3 6 6"/>',Peta:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14"/>',Dokumen:'<path d="M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h7"/>',Koran:'<path d="M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5"/>',Kliping:'<path d="M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5"/>',Arsip:'<path d="M4 6h16v4H4z M6 10v9h12v-9 M10 14h4"/>',Rekaman:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/>',Video:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>'};
const phEl=(k,jenis)=>{const j=(jenis||(k||'').split(':')[0]||'').trim();return `<div class="ph"><svg viewBox="0 0 24 24">${IC[j]||IC.Dokumen}</svg><span>${esc(k)}</span><small>Berkas belum dimasukkan</small></div>`};
function media(path,alt,ket,jenis){
  const k=esc(ket).replace(/'/g,'&#39;');
  if(!path)return phEl(ket,jenis);
  if(/^https?:\/\//.test(path)){const y=path.match(/(?:youtu\.be\/|v=)([\w-]{11})/);if(y)return `<iframe src="https://www.youtube-nocookie.com/embed/${y[1]}" title="${esc(alt)}" loading="lazy" allowfullscreen></iframe>`;return `<div class="ph"><a href="${esc(path)}" target="_blank" rel="noopener">Buka: ${esc(alt)}</a></div>`}
  if(/\.(mp3|m4a|ogg|wav)$/i.test(path))return `<div class="ph"><audio controls preload="none" src="${esc(path)}" data-k="${k}" data-j="${esc(jenis||'')}"></audio></div>`;
  if(/\.(mp4|webm)$/i.test(path))return `<div class="ph"><video controls preload="none" src="${esc(path)}" data-k="${k}"></video></div>`;
  return `<img src="${esc(path)}" alt="${esc(alt)}" loading="lazy" data-k="${k}" data-j="${esc(jenis||'')}">`;
}
document.addEventListener('error',e=>{const t=e.target;if(!t.dataset||t.dataset.k===undefined)return;
  if(t.closest('.potret')){t.replaceWith(document.createTextNode(t.dataset.k));return}
  const w=document.createElement('div');w.innerHTML=phEl(t.dataset.k,t.dataset.j);t.closest('.ph')?t.closest('.ph').replaceWith(w.firstChild):t.replaceWith(w.firstChild)},true);
const ini=n=>n.replace(/\(.*?\)/g,'').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,3).toUpperCase();
const potret=n=>`<div class="potret"><img src="assets/tokoh/${slug(n)}.jpg" alt="${esc(n)}" data-k="${esc(ini(n))}"></div>`;

/* ---------- pengaturan tampilan ---------- */
function applyPrefs(){const r=document.documentElement;prefs.tema==='auto'?r.removeAttribute('data-theme'):r.dataset.theme=prefs.tema;r.style.fontSize=prefs.ukuran+'%';document.body.classList.toggle('proyektor',!!prefs.proyektor);sv(PK,prefs)}
function setPop(){const p=$('#setPop');const seg=(k,o)=>`<div class="seg">${o.map(([v,l])=>`<button data-k="${k}" data-v="${v}" aria-pressed="${String(prefs[k])===String(v)}">${l}</button>`).join('')}</div>`;
  p.innerHTML=`<h4>Tema</h4>${seg('tema',[['auto','Otomatis'],['light','Terang'],['dark','Gelap']])}<h4>Ukuran teks</h4>${seg('ukuran',[[90,'Kecil'],[100,'Normal'],[115,'Besar']])}<h4>Mode proyektor (teks besar)</h4>${seg('proyektor',[[false,'Mati'],[true,'Hidup']])}<button class="ghost" id="bPrint" style="width:100%">Cetak halaman ini</button>`;
  $$('button[data-k]',p).forEach(b=>b.onclick=()=>{let v=b.dataset.v;prefs[b.dataset.k]=v==='true'?true:v==='false'?false:(isNaN(v)?v:+v);applyPrefs();setPop()});$('#bPrint').onclick=()=>print()}
$('#bSet').onclick=e=>{e.stopPropagation();const p=$('#setPop');const o=p.classList.toggle('hidden');$('#bSet').setAttribute('aria-expanded',!o);if(!o)setPop()};
document.addEventListener('click',e=>{const p=$('#setPop');if(!p.classList.contains('hidden')&&!e.target.closest('#setPop')){p.classList.add('hidden')}
  const g=e.target.closest('.gl'),tip=$('#tip');if(g){const r=g.getBoundingClientRect();tip.textContent=g.dataset.def;tip.classList.remove('hidden');tip.style.left=Math.max(8,Math.min(innerWidth-310,r.left+scrollX))+'px';tip.style.top=(r.bottom+scrollY+6)+'px'}else tip.classList.add('hidden');
  const im=e.target.closest('img');if(im&&im.closest('.media,figure')&&!im.closest('.potret'))lightbox(im)});

/* ---------- overlay: pencarian dan lightbox ---------- */
const ov=$('#ov');const closeOv=()=>{ov.classList.add('hidden');ov.className='ov hidden';ov.innerHTML=''};
ov.addEventListener('click',e=>{if(e.target===ov||ov.classList.contains('lb'))closeOv()});
function lightbox(im){const f=im.closest('figure');ov.className='ov lb';ov.innerHTML=`<div class="box"><img src="${esc(im.src)}" alt="${esc(im.alt)}"><p style="margin-top:10px;font-size:.9rem">${f?esc($('figcaption b',f).textContent):esc(im.alt)}</p></div>`}
function index(){const r=[];UNITS.forEach(u=>{r.push({t:'Unit '+u.id,a:u.judul,s:u.periode,h:'#unit-'+u.id,k:[u.judul,...u.sehari,...u.peristiwa].join(' ')});u.tokoh.forEach(x=>{if(!x.nama.startsWith('['))r.push({t:'Tokoh',a:x.nama,s:'Unit '+u.id+' · '+x.tindakan,h:'#unit-'+u.id,k:x.nama+' '+x.tindakan})})});GLOSARIUM.forEach(g=>r.push({t:'Istilah',a:g[0],s:g[1],h:'#glosarium',k:g[0]+' '+g[1]}));return r}
function openSearch(){ov.className='ov';ov.innerHTML=`<div class="box"><input class="find" id="q" placeholder="Cari unit, tokoh, atau istilah" style="max-width:none;margin:0 0 8px" aria-label="Cari"><div class="res" id="res"></div></div>`;const I=index(),q=$('#q'),res=$('#res');
  const go=()=>{const s=q.value.trim().toLowerCase();const m=s?I.filter(x=>x.k.toLowerCase().includes(s)).slice(0,12):[];res.innerHTML=m.length?m.map(x=>`<a href="${x.h}"><em>${esc(x.t)}</em>${esc(x.a)}<small>${esc(x.s)}</small></a>`).join(''):`<p class="meta" style="padding:8px">${s?'Tidak ada hasil.':'Ketik untuk mencari.'}</p>`;$$('a',res).forEach(a=>a.onclick=closeOv)};q.oninput=go;go();q.focus()}
$('#bSearch').onclick=openSearch;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOv();if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();openSearch()}});

/* ---------- navigasi ---------- */
function renderNav(a){const nv0=$('#nav'),sl0=nv0.scrollLeft;nv0.innerHTML=[['beranda','Beranda'],...UNITS.map(u=>['unit-'+u.id,String(u.id),u]),['glosarium','Glosarium'],['tokoh','Tokoh'],['panduan-guru','Panduan guru']].map(([h,l,u])=>`<a href="#${h}" class="${a===h?'active':''} ${u&&state.done[u.id]?'done':''}" ${u?`title="${esc(u.judul)}" aria-label="Unit ${u.id}"`:''} ${a===h?'aria-current="page"':''}>${u?'Unit '+l:l}</a>`).join('');nv0.scrollLeft=sl0;const act=$('#nav a.active');if(act)ctr(act);fades()}
function after(wide){wide=wide||/^(beranda|tokoh)?$/.test(location.hash.slice(1));app.classList.toggle('wide',!!wide);$$('#nav,.tl,.toc ol,.chips').forEach(x=>x.classList.add('dragx'));fades();window.scrollTo(0,0);app.focus({preventScroll:true});if(obs)obs.disconnect();obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});$$('.rv').forEach(x=>obs.observe(x))}
addEventListener('scroll',()=>{const h=document.documentElement;$('#bar').style.transform='scaleX('+(h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight))+')'},{passive:true});

/* ---------- beranda ---------- */
function viewHome(){renderNav('beranda');
  const selesai=Object.keys(state.done).filter(k=>state.done[k]).length;
  const nT=UNITS.reduce((a,u)=>a+u.tokoh.filter(t=>!t.nama.startsWith('[')).length,0),nG=UNITS.reduce((a,u)=>a+u.galeri.length,0);
  app.innerHTML=`
  <section class="hero"><div>
   <p class="meta">E-modul suplemen Sejarah kelas XI (Fase F) · 6 unit inti + 1 unit lanjutan · prototipe</p>
   <h1>Jejak yang Tersembunyi</h1><p class="sub">Peran Etnis Tionghoa dalam Sejarah Indonesia</p>
   <div class="acts btnrow" style="margin:0"><a class="btn" href="#unit-1">Mulai dari Unit 1</a><a class="btn ghost" href="#panduan-guru">Panduan guru</a></div>
   <div class="stats"><div><b>${UNITS.length}</b><span>unit</span></div><div><b>${nT}</b><span>kartu tokoh bernama</span></div><div><b>${nG}</b><span>sumber di galeri</span></div><div><b>${UNITS[0].periode.slice(0,4)}–${UNITS[UNITS.length-1].periode.slice(-4)}</b><span>rentang waktu</span></div></div>
  </div></section>
  <p class="lead rv">Buku teks Sejarah kelas XI menyebut etnis Tionghoa pada sembilan halaman dan hanya menamai satu orang. Rumah tempat Sumpah Pemuda diikrarkan disebut, pemiliknya tidak. Rumah tempat Sukarno dan Hatta diinapkan di Rengasdengklok disebut, pemiliknya tidak. Modul ini menceritakan sisanya: dari pasar dan kampung tempat mereka hidup, lewat tokoh-tokoh bernama, sampai peristiwa besar yang sudah kalian kenal.</p>
  <h2 class="rv">Lini masa</h2>
  <div class="tl rv" role="list">${UNITS.map(u=>`<a role="listitem" href="#unit-${u.id}"><span class="y">${esc(u.periode)}</span><span class="t">Unit ${u.id} · ${esc(u.judul.split(':')[0])}</span></a>`).join('')}</div>
  <h2 class="rv">Tiga kebiasaan membaca</h2>
  <div class="tahap rv">
    <div><b>Siapa yang membuat sumber ini?</b>Laporan pejabat VOC tentang 1740 ditulis oleh orang yang perlu membela diri; babad Jawa tentang peristiwa yang sama ditulis oleh pihak lain.</div>
    <div><b>Apa yang bisa dan tidak bisa ditunjukkan sumber ini?</b>Foto rumah di Kramat 106 menunjukkan bentuk rumahnya, bukan siapa pemiliknya.</div>
    <div><b>Siapa yang belum terdengar?</b>Kalau sebuah bab menyebut “peranakan Tionghoa” sebagai golongan tanpa satu pun nama, itu bukan karena namanya tidak ada.</div></div>
  <h2 class="rv" style="margin-top:2.4rem">Peta modul <span class="pill">${selesai}/7 unit selesai</span></h2>
  <div class="peta rv">${UNITS.map(u=>`<a href="#unit-${u.id}" class="${state.done[u.id]?'done':''}"><span class="n"><i>${u.id}</i>${esc(u.periode)}</span><b>${esc(u.judul)}</b><span>${esc(u.bab)} · ${esc(u.waktu)}${u.sensitif?' · episode sensitif':''}</span></a>`).join('')}</div>
  <h2 class="rv" style="margin-top:2.4rem">Pola setiap unit</h2>
  <p class="rv">Setiap unit dibuka dari kehidupan sehari-hari, bukan dari peristiwa politik; bertumpu pada kartu tokoh bernama; membawa satu foto, satu dokumen, dan satu video dengan asal sumbernya; dan selalu diakhiri dengan satu latihan membandingkan dua sumber, karena sejarah yang baik bukan sejarah yang dihafal, melainkan sejarah yang diperiksa. Panjang tiap unit 600–900 kata, paling banyak lima nama baru.</p>
  <h2 class="rv">Tujuan pembelajaran</h2>
  <p class="rv">Setelah menyelesaikan setiap unit, siswa dapat (1) menyebutkan sekurang-kurangnya dua tokoh atau kelompok etnis Tionghoa yang terlibat beserta tindakannya; (2) menjelaskan konteks sosial sehari-hari yang melatari peristiwa; (3) membandingkan dua sumber tentang peristiwa yang sama dan menyimpulkan apa yang tidak dapat ditunjukkan tiap sumber; (4) mengidentifikasi apa yang belum disebut buku teks; (5) menunjukkan sikap menghargai kontribusi kelompok yang berbeda dalam sejarah bangsa.</p>
  <div class="btnrow"><a class="btn" href="#unit-1">Mulai dari Unit 1</a><button class="ghost" id="reset">Hapus catatan dan kemajuan</button></div>`;
  $('#reset').onclick=()=>{if(confirm('Hapus semua catatan refleksi, jawaban, dan tanda selesai di peramban ini?')){state={done:{},notes:{},seen:{}};save();viewHome()}};
  after(false)}

/* ---------- unit ---------- */
const SEC=['Pemantik','Kehidupan sehari-hari','Kartu tokoh','Peristiwa','Galeri sumber','Bandingkan sumber','Apa kata buku teks?','Refleksi dan cek pemahaman'];
function viewUnit(id){const u=UNITS.find(x=>x.id===id);if(!u){location.hash='#beranda';return}
  renderNav('unit-'+u.id);const N=state.notes[u.id]=state.notes[u.id]||{},prev=UNITS.find(x=>x.id===id-1),next=UNITS.find(x=>x.id===id+1),used=new Set();
  const S=(n,b)=>`<section class="sec rv" id="s${n}" data-s="${n}"><h2><i class="seal">${u.id}.${n}</i>${SEC[n-1]}</h2>${b}</section>`;
  const ta=(k,lab,v)=>`<div class="qa"><label for="t-${k}">${lab}</label><textarea id="t-${k}" data-k="${k}">${esc(v||'')}</textarea><div class="cnt"><span data-c="${k}"></span></div></div>`;
  const jn=[...new Set(u.galeri.map(g=>g.jenis))];
  const bt=u.bukuteks.split(/(?=Yang (?:belum disebut|perlu dipastikan ada):)/);
  const sehariKey=u.cek||[];
  app.innerHTML=`<div class="ulay"><aside class="toc" aria-label="Isi unit"><div class="prog"><i id="tp"></i></div><ol>${SEC.map((s,i)=>`<li><button type="button" class="ghost" data-go="${i+1}"><span>${u.id}.${i+1}</span><span>${s}</span></button></li>`).join('')}</ol></aside>
  <article><p class="meta">Unit ${u.id} · ${esc(u.bab)} · ${esc(u.periode)} · waktu baca ${esc(u.waktu)}${u.sensitif?' · <b>episode sensitif, guru membaca Panduan L.4 lebih dulu</b>':''}</p>
  <h1>${esc(u.judul)}</h1>
  ${S(1,`<div class="pemantik"><div class="media">${media(ASET_PEMANTIK[u.id],u.pemantik.gambar,u.pemantik.gambar,'Foto')}</div><p class="q">${T(u.pemantik.teks)}</p></div>${ta('pemantik','Jawaban sementaraku',N.pemantik)}`)}
  ${S(2,u.sehari.map(p=>`<p>${TG(p,used)}</p>`).join(''))}
  ${S(3,`<div class="cards">${u.tokoh.map(t=>`<div class="card">${potret(t.nama)}<b>${T(t.nama)}</b><span class="thn">${T(t.tahun)}</span><span class="tn">${T(t.tindakan)}</span><span class="src">Sumber: ${T(t.sumber)}</span></div>`).join('')}</div>`)}
  ${S(4,u.peristiwa.map(p=>`<p>${TG(p,used)}</p>`).join(''))}
  ${S(5,`<div class="chips" role="group" aria-label="Filter jenis sumber"><button class="ghost" aria-pressed="true" data-f="">Semua</button>${jn.map(j=>`<button class="ghost" aria-pressed="false" data-f="${esc(j)}">${esc(j)}</button>`).join('')}</div><div class="gal">${u.galeri.map((g,i)=>`<figure data-j="${esc(g.jenis)}"><div class="m">${media((ASET_GALERI[u.id]||[])[i],g.judul,g.jenis+': '+g.judul,g.jenis)}</div><figcaption><em>${esc(g.jenis)}</em><b>${T(g.judul)}</b><span>${T(g.ket)}</span></figcaption></figure>`).join('')}</div>`)}
  ${S(6,`<div class="banding"><div class="sumber"><h4>${T(u.banding.a.judul)}</h4><p>${T(u.banding.a.isi)}</p></div><div class="sumber b"><h4>${T(u.banding.b.judul)}</h4><p>${T(u.banding.b.isi)}</p></div></div>${u.banding.tanya.map((t,i)=>ta('q'+i,`${i+1}. ${esc(t)}`,N['q'+i])).join('')}`)}
  ${S(7,bt.length>1?`<div class="bt"><div class="a">${T(bt[0])}</div><div class="b">${T(bt[1])}</div></div>`:`<div class="callout"><p style="margin:0">${T(u.bukuteks)}</p></div>`)}
  ${S(8,`${ta('refleksi','Refleksi: '+esc(u.refleksi),N.refleksi)}<h3>Cek pemahaman</h3>${u.cek.map((c,i)=>`<div class="cek"><p>${i+1}. ${esc(c.q)}</p><textarea data-k="c${i}" aria-label="Jawaban ${i+1}" style="min-height:56px">${esc(N['c'+i]||'')}</textarea><div class="btnrow" style="margin:8px 0 0"><button class="ghost" data-key="${i}" aria-expanded="false">Lihat kunci</button></div><div class="kunci hidden"><b>Kunci:</b> ${esc(c.k)}</div></div>`).join('')}<h3>Rujukan unit</h3><ul class="rujukan">${u.rujukan.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>`)}
  <div class="btnrow"><button id="selesai">${state.done[u.id]?'Unit ditandai selesai (klik untuk membatalkan)':'Tandai unit selesai'}</button>${prev?`<a class="btn ghost" href="#unit-${prev.id}">← Unit ${prev.id}</a>`:''}${next?`<a class="btn ghost" href="#unit-${next.id}">Unit ${next.id} →</a>`:`<a class="btn ghost" href="#beranda">Kembali ke peta modul</a>`}<a class="btn ghost" href="pdf/unit-${u.id}.pdf" download>Unduh PDF unit ini</a><span class="saved" id="saved"></span></div></article></div>`;
  const cnt=t=>{const c=$(`[data-c="${t.dataset.k}"]`);if(c)c.textContent=(t.value.trim()?t.value.trim().split(/\s+/).length:0)+' kata'};
  $$('textarea',app).forEach(t=>{cnt(t);t.addEventListener('input',()=>{N[t.dataset.k]=t.value;save();cnt(t);$('#saved').textContent='Tersimpan di peramban ini'})});
  $$('[data-key]',app).forEach(b=>b.onclick=()=>{const k=b.closest('.cek').querySelector('.kunci'),h=k.classList.toggle('hidden');b.textContent=h?'Lihat kunci':'Sembunyikan kunci';b.setAttribute('aria-expanded',!h)});
  $$('[data-f]',app).forEach(b=>b.onclick=()=>{$$('[data-f]',app).forEach(x=>x.setAttribute('aria-pressed',x===b));$$('figure',app).forEach(f=>f.classList.toggle('hidden',!!b.dataset.f&&f.dataset.j!==b.dataset.f))});
  $('#selesai').onclick=()=>{state.done[u.id]=!state.done[u.id];save();viewUnit(id)};
  /* daftar isi + scrollspy */
  const seen=state.seen[u.id]=state.seen[u.id]||{},tb=$$('.toc [data-go]',app),mark=()=>{tb.forEach(b=>b.classList.toggle('seen',!!seen[b.dataset.go]));$('#tp').style.transform='scaleX('+Object.keys(seen).length/8+')'};mark();
  tb.forEach(b=>b.onclick=()=>$('#s'+b.dataset.go).scrollIntoView({behavior:'smooth'}));
  if(spy)spy.disconnect();spy=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const n=e.target.dataset.s;tb.forEach(b=>{const on=b.dataset.go===n;b.classList.toggle('on',on);if(on)ctr(b)});if(!seen[n]){seen[n]=1;save();mark()}}}),{rootMargin:'-30% 0px -60% 0px'});$$('.sec',app).forEach(s=>spy.observe(s));
  after(true)}

/* ---------- glosarium, tokoh ---------- */
function viewGlosarium(){renderNav('glosarium');
  app.innerHTML=`<h1>Glosarium</h1><p class="meta">Istilah Belanda dan Tionghoa yang muncul dalam unit.</p><input class="find" id="f" placeholder="Cari istilah" aria-label="Cari istilah"><div class="tscroll"><table><thead><tr><th>Istilah</th><th>Arti dalam modul ini</th></tr></thead><tbody id="tb">${GLOSARIUM.map(g=>`<tr><td><b>${esc(g[0])}</b></td><td>${esc(g[1])}</td></tr>`).join('')}</tbody></table></div>`;
  $('#f').oninput=e=>{const s=e.target.value.toLowerCase();$$('#tb tr').forEach(r=>r.classList.toggle('hidden',!r.textContent.toLowerCase().includes(s)))};after(false)}
function viewTokoh(){renderNav('tokoh');const rows=[];UNITS.forEach(u=>u.tokoh.forEach(t=>{if(!t.nama.startsWith('['))rows.push({n:t.nama,u:u.id,th:t.tahun,t:t.tindakan})}));rows.sort((a,b)=>a.n.localeCompare(b.n));
  app.innerHTML=`<h1>Indeks tokoh</h1><p class="meta">${rows.length} kartu tokoh, urut abjad, dengan unit tempatnya muncul.</p><input class="find" id="f" placeholder="Cari nama atau tindakan" aria-label="Cari tokoh"><div class="chips"><button class="ghost" aria-pressed="true" data-u="">Semua unit</button>${UNITS.map(u=>`<button class="ghost" aria-pressed="false" data-u="${u.id}">Unit ${u.id}</button>`).join('')}</div>
  <div class="cards" id="cs">${rows.map(r=>`<a class="card" href="#unit-${r.u}" data-u="${r.u}" style="text-decoration:none;color:inherit">${potret(r.n)}<b>${esc(r.n)}</b><span class="thn">${esc(r.th)}</span><span class="tn">${esc(r.t)}</span><span class="src">Unit ${r.u}</span></a>`).join('')}</div>`;
  let uf='';const ap=()=>{const s=$('#f').value.toLowerCase();$$('#cs .card').forEach(c=>c.classList.toggle('hidden',(uf&&c.dataset.u!==uf)||!c.textContent.toLowerCase().includes(s)))};
  $('#f').oninput=ap;$$('.chips [data-u]').forEach(b=>b.onclick=()=>{uf=b.dataset.u;$$('.chips [data-u]').forEach(x=>x.setAttribute('aria-pressed',x===b));ap()});after(false)}

/* ---------- panduan guru (teks sama dengan versi sebelumnya) ---------- */
function viewGuru(){renderNav('panduan-guru');
  const F=[[0,5,'Pemantik: tampilkan foto, ajukan pertanyaan pembuka, tampung 3–4 jawaban','Tanpa koreksi dulu'],[5,20,'Baca mandiri Kehidupan sehari-hari, Kartu tokoh, Peristiwa di ponsel atau proyektor','Bila ponsel dilarang, guru memproyeksikan dan membaca bergiliran'],[20,35,'Bandingkan sumber dalam kelompok campur 4 orang; tiap kelompok menjawab 2 dari 4 pertanyaan','Guru berkeliling, menegaskan asal sumber'],[35,42,'Dua kelompok melaporkan; guru menutup dengan Apa kata buku teks','Penutup objektif wajib pada Unit 1, 6, 7'],[42,45,'Refleksi satu kalimat; cek pemahaman sebagai PR','']];
  app.innerHTML=`<h1>Panduan guru</h1>
  <h2>Skenario 45 menit per unit</h2>
  <div class="fase" aria-hidden="true">${F.map(f=>`<i style="flex:${f[1]-f[0]}">${f[0]}–${f[1]}</i>`).join('')}</div>
  <div class="tscroll"><table><thead><tr><th>Menit</th><th>Kegiatan</th><th>Catatan</th></tr></thead><tbody>${F.map(f=>`<tr><td>${f[0]}–${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td></tr>`).join('')}</tbody></table></div>
  <p style="margin-top:1em">Bila jam terpotong: bagian baca mandiri dan cek pemahaman dikerjakan di rumah lewat tautan modul; pertemuan dipakai untuk bandingkan sumber dan penutup (25 menit).</p>
  <h2 style="margin-top:2.2rem">Rubrik tugas bandingkan sumber</h2>
  <div class="tscroll"><table><thead><tr><th>Tingkat</th><th>Deskripsi</th><th>Skor</th></tr></thead><tbody>
  <tr><td>1. Mengenali</td><td>Menyebutkan siapa pembuat tiap sumber dan kapan dibuat</td><td>1</td></tr>
  <tr><td>2. Menjelaskan</td><td>Menjelaskan perbedaan isi kedua sumber dan mengaitkannya dengan kepentingan pembuatnya</td><td>2</td></tr>
  <tr><td>3. Menyimpulkan</td><td>Menyebutkan apa yang tidak dapat ditunjukkan tiap sumber dan suara siapa yang belum ada</td><td>3</td></tr></tbody></table></div>
  <h2 style="margin-top:2.2rem">Panduan episode sensitif (Unit 1, 6, 7)</h2>
  <p>Prinsipnya: bahas peristiwanya, bukan kelompoknya; pakai bukti, bukan dugaan; tutup dengan sintesis, jangan biarkan diskusi menggantung.</p>
  <ol>
   <li><b>Sebelum:</b> baca unit sampai selesai, periksa komposisi kelas, dan putuskan apakah ada siswa yang perlu diberi tahu lebih dulu.</li>
   <li><b>Pertanyaan pembingkai:</b> “Apa yang terjadi, siapa yang melakukan apa kepada siapa, dan dari sumber mana kita tahu?” Hindari “siapa yang salah” pada awal diskusi.</li>
   <li><b>Aturan diskusi:</b> berbicara tentang orang-orang dalam peristiwa, bukan tentang teman sekelas; kritik tindakan, bukan kelompok; setiap pendapat menyebut sumbernya.</li>
   <li><b>Bila muncul ucapan diskriminatif:</b> jangan menghukum di depan kelas; minta siswa menjelaskan dasar pernyataannya, lalu kembalikan ke sumber.</li>
   <li><b>Kalimat penutup objektif (contoh Mei 1998):</b> “Peristiwa ini terjadi karena krisis, kebijakan negara selama puluhan tahun, dan tindakan orang-orang tertentu, bukan karena sifat suatu kelompok. Negara sendiri kemudian mengakui kesalahannya dengan mencabut kebijakan diskriminatif.”</li>
   <li><b>Sesudah:</b> beri kesempatan menulis refleksi pribadi tanpa dibacakan; tindak lanjuti secara pribadi siswa yang tampak terganggu.</li></ol>
  <div class="callout"><p style="margin:0"><b>Kelas majemuk.</b> Jangan menjadikan siswa Tionghoa sebagai juru bicara (“bagaimana menurutmu sebagai orang Tionghoa?”). Bila mereka ingin berbagi pengalaman keluarga, itu sumbangan sukarela, bukan kewajiban.</p></div>
  <h2 style="margin-top:2.2rem">Versi PDF dan perluasan</h2>
  <p>Unduh: ${UNITS.map(u=>`<a href="pdf/unit-${u.id}.pdf" download>Unit ${u.id}</a>`).join(' · ')} · <a href="pdf/panduan-guru.pdf" download>Panduan guru</a></p>
  <p>Versi PDF memuat seluruh teks, foto, dan dokumen; video dan audio diganti tautan yang diputar guru. Struktur delapan bagian per unit dipakai untuk unit paralel tentang etnis Arab (Sumpah Pemuda Keturunan Arab 1934, A. R. Baswedan), Indo-Eropa (Indische Partij), dan India.</p>`;after(false)}

/* ---------- periksa kelengkapan (untuk penyusun) ---------- */
function viewPeriksa(){renderNav('');const dr=[],as=[];
  const walk=(o,p)=>{if(typeof o==='string'){(o.match(/\[[^\]]+\]/g)||[]).forEach(m=>dr.push([p,m]))}else if(o&&typeof o==='object')for(const k in o)walk(o[k],p+' › '+k)};
  UNITS.forEach(u=>walk(u,'Unit '+u.id));
  UNITS.forEach(u=>{if(ASET_PEMANTIK[u.id])as.push(ASET_PEMANTIK[u.id]);(ASET_GALERI[u.id]||[]).forEach(a=>a&&as.push(a));u.tokoh.forEach(t=>t.nama[0]!=='['&&as.push('assets/tokoh/'+slug(t.nama)+'.jpg'))});
  app.innerHTML=`<h1>Periksa kelengkapan</h1><p class="meta">Halaman bantu untuk penyusun; tidak ada di navigasi siswa.</p>
  <h2>Bagian draf dalam data.js (${dr.length})</h2><div class="tscroll"><table><thead><tr><th>Lokasi</th><th>Teks</th></tr></thead><tbody>${dr.map(d=>`<tr><td>${esc(d[0])}</td><td>${esc(d[1].slice(0,160))}</td></tr>`).join('')||'<tr><td colspan="2">Tidak ada.</td></tr>'}</tbody></table></div>
  <h2 style="margin-top:2.2rem">Berkas media (${as.length})</h2><div class="tscroll"><table><thead><tr><th>Berkas</th><th>Status</th></tr></thead><tbody>${as.map((a,i)=>`<tr><td>${esc(a)}</td><td id="as${i}">memeriksa…</td></tr>`).join('')}</tbody></table></div>`;
  as.forEach((a,i)=>{const set=ok=>{const c=$('#as'+i);if(c){c.textContent=ok?'ada':'belum ada';c.className=ok?'ok':'no'}};
    if(/^https?:/.test(a)){set(true);return}const el=/\.mp3|\.m4a|\.ogg|\.wav/i.test(a)?new Audio():new Image();el.onerror=()=>set(false);el[el instanceof Audio?'onloadedmetadata':'onload']=()=>set(true);el.src=a});after(false)}

function route(){closeOv();const h=(location.hash||'#beranda').slice(1);
  if(h===''||h==='beranda')return viewHome();if(h.startsWith('unit-'))return viewUnit(parseInt(h.slice(5),10));
  if(h==='glosarium')return viewGlosarium();if(h==='tokoh')return viewTokoh();if(h==='panduan-guru')return viewGuru();if(h==='periksa')return viewPeriksa();viewHome()}
addEventListener('hashchange',route);applyPrefs();route();

/* ---------- gulir geser (mouse), pudar tepi, tinggi header, pusatkan item aktif ---------- */
function ctr(el){const sc=el.closest('nav,ol');if(!sc||sc.scrollWidth<=sc.clientWidth+2)return;const a=el.getBoundingClientRect(),b=sc.getBoundingClientRect(),m=48;let d=0;if(a.left<b.left+m)d=a.left-b.left-m;else if(a.right>b.right-m)d=a.right-b.right+m;if(Math.abs(d)>1)sc.scrollTo({left:Math.max(0,sc.scrollLeft+d),behavior:'smooth'})}
function fades(){$$('.dragx').forEach(e=>{const m=e.scrollWidth-e.clientWidth;e.style.setProperty('--fl',m>2&&e.scrollLeft>4?'28px':'0px');e.style.setProperty('--fr',m>2&&e.scrollLeft<m-4?'28px':'0px')})}
(function(){let el=null,sx=0,sl=0,mv=false;
 document.addEventListener('pointerdown',e=>{mv=false;if(e.pointerType!=='mouse'||e.button)return;const t=e.target.closest('.dragx');if(!t||t.scrollWidth<=t.clientWidth)return;el=t;sx=e.clientX;sl=t.scrollLeft});
 addEventListener('pointermove',e=>{if(!el)return;const d=e.clientX-sx;if(!mv&&Math.abs(d)>5){mv=true;el.classList.add('drag')}if(mv)el.scrollLeft=sl-d});
 addEventListener('pointerup',()=>{if(el){const t=el;el=null;setTimeout(()=>t.classList.remove('drag'),0)}});
 document.addEventListener('click',e=>{if(mv){e.preventDefault();e.stopPropagation();mv=false}},true);
 document.addEventListener('dragstart',e=>{if(e.target.closest&&e.target.closest('.dragx'))e.preventDefault()});
 document.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('dragx'))fades()},true);
 addEventListener('resize',fades);
 const hd=document.querySelector('header.top'),sh=()=>document.documentElement.style.setProperty('--hh',hd.offsetHeight+'px');sh();
 if(window.ResizeObserver)new ResizeObserver(sh).observe(hd);
})();
