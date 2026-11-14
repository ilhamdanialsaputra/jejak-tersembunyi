/* Logika tampilan e-modul. Isi teks ada di data.js. */
const KEY='jejak-tersembunyi-v1';
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
function save(d){ try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} }
let state = load();
state.done = state.done || {}; state.notes = state.notes || {};

/* ====================== HELPERS ====================== */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const app = document.getElementById('app');
/* ====================== MEDIA ====================== */
function media(path, alt, keterangan){
  if(!path) return `<div class="ph">${esc(keterangan)}</div>`;
  const ph = esc(keterangan).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  if(/^https?:\/\//.test(path)) return `<div class="ph"><a href="${esc(path)}" target="_blank" rel="noopener">Buka: ${esc(alt)}</a></div>`;
  if(/\.(mp3|m4a|ogg|wav)$/i.test(path)) return `<div class="ph"><audio controls preload="none" src="${esc(path)}" onerror="this.parentNode.textContent='${ph}'">${esc(alt)}</audio></div>`;
  if(/\.(mp4|webm)$/i.test(path)) return `<div class="ph"><video controls preload="none" src="${esc(path)}" onerror="this.parentNode.textContent='${ph}'"></video></div>`;
  return `<img src="${esc(path)}" alt="${esc(alt)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;ph&quot;>${ph}</div>'">`;
}
function potret(nama){
  const ini = nama.split(' ').map(w=>w[0]).join('').slice(0,3);
  return `<div class="potret"><img src="assets/tokoh/${slug(nama)}.jpg" alt="${esc(nama)}" onerror="this.outerHTML='${esc(ini)}'"></div>`;
}


function renderNav(active){
  const n = document.getElementById('nav');
  n.innerHTML = `<a href="#beranda" class="${active==='beranda'?'active':''}">Beranda</a>` +
    UNITS.map(u=>`<a href="#unit-${u.id}" class="${active==='unit-'+u.id?'active':''} ${state.done[u.id]?'done':''}" title="${esc(u.judul)}">${u.id}</a>`).join('') +
    `<a href="#glosarium" class="${active==='glosarium'?'active':''}">Glosarium</a>` +
    `<a href="#tokoh" class="${active==='tokoh'?'active':''}">Tokoh</a>` +
    `<a href="#panduan-guru" class="${active==='panduan-guru'?'active':''}">Panduan guru</a>`;
}

function viewHome(){
  renderNav('beranda');
  const selesai = Object.keys(state.done).filter(k=>state.done[k]).length;
  app.innerHTML = `
  <p class="meta">E-modul suplemen Sejarah kelas XI (Fase F) · 6 unit inti + 1 unit lanjutan · prototipe</p>
  <h1>Jejak yang Tersembunyi: Peran Etnis Tionghoa dalam Sejarah Indonesia</h1>
  <p class="lead">Buku teks Sejarah kelas XI menyebut etnis Tionghoa pada sembilan halaman dan hanya menamai satu orang. Rumah tempat Sumpah Pemuda diikrarkan disebut, pemiliknya tidak. Rumah tempat Sukarno dan Hatta diinapkan di Rengasdengklok disebut, pemiliknya tidak. Modul ini menceritakan sisanya: dari pasar dan kampung tempat mereka hidup, lewat tokoh-tokoh bernama, sampai peristiwa besar yang sudah kalian kenal.</p>

  <h2>Tiga kebiasaan membaca</h2>
  <div class="tahap">
    <div><b>Siapa yang membuat sumber ini?</b>Laporan pejabat VOC tentang 1740 ditulis oleh orang yang perlu membela diri; babad Jawa tentang peristiwa yang sama ditulis oleh pihak lain.</div>
    <div><b>Apa yang bisa dan tidak bisa ditunjukkan sumber ini?</b>Foto rumah di Kramat 106 menunjukkan bentuk rumahnya, bukan siapa pemiliknya.</div>
    <div><b>Siapa yang belum terdengar?</b>Kalau sebuah bab menyebut “peranakan Tionghoa” sebagai golongan tanpa satu pun nama, itu bukan karena namanya tidak ada.</div>
  </div>

  <h2>Peta modul <span class="pill">${selesai}/7 unit selesai</span></h2>
  <div class="peta">
   ${UNITS.map(u=>`<a href="#unit-${u.id}" class="${state.done[u.id]?'done':''}"><span class="n">Unit ${u.id} · ${esc(u.periode)}</span><b>${esc(u.judul)}</b><span>${esc(u.bab)} · ${esc(u.waktu)}${u.sensitif?' · episode sensitif':''}</span></a>`).join('')}
  </div>

  <h2>Pola setiap unit</h2>
  <p>Setiap unit dibuka dari kehidupan sehari-hari, bukan dari peristiwa politik; bertumpu pada kartu tokoh bernama; membawa satu foto, satu dokumen, dan satu video dengan asal sumbernya; dan selalu diakhiri dengan satu latihan membandingkan dua sumber, karena sejarah yang baik bukan sejarah yang dihafal, melainkan sejarah yang diperiksa. Panjang tiap unit 600–900 kata, paling banyak lima nama baru.</p>

  <h2>Tujuan pembelajaran</h2>
  <p>Setelah menyelesaikan setiap unit, siswa dapat (1) menyebutkan sekurang-kurangnya dua tokoh atau kelompok etnis Tionghoa yang terlibat beserta tindakannya; (2) menjelaskan konteks sosial sehari-hari yang melatari peristiwa; (3) membandingkan dua sumber tentang peristiwa yang sama dan menyimpulkan apa yang tidak dapat ditunjukkan tiap sumber; (4) mengidentifikasi apa yang belum disebut buku teks; (5) menunjukkan sikap menghargai kontribusi kelompok yang berbeda dalam sejarah bangsa.</p>
  <div class="btnrow"><a class="btn" href="#unit-1">Mulai dari Unit 1</a><button class="ghost" id="reset">Hapus catatan dan kemajuan</button></div>`;
  document.getElementById('reset').onclick = ()=>{ if(confirm('Hapus semua catatan refleksi, jawaban, dan tanda selesai di peramban ini?')){ state={done:{},notes:{}}; save(state); viewHome(); } };
}

function viewUnit(id){
  const u = UNITS.find(x=>x.id===id); if(!u){ location.hash='#beranda'; return; }
  renderNav('unit-'+u.id);
  const notes = state.notes[u.id] || {};
  const prev = UNITS.find(x=>x.id===id-1), next = UNITS.find(x=>x.id===id+1);
  app.innerHTML = `
  <p class="meta">Unit ${u.id} · ${esc(u.bab)} · ${esc(u.periode)} · waktu baca ${esc(u.waktu)}${u.sensitif?' · <b>episode sensitif, guru membaca Panduan L.4 lebih dulu</b>':''}</p>
  <h1>${esc(u.judul)}</h1>

  <h2>${u.id}.1 Pemantik</h2>
  <div class="pemantik"><div class="media">${media(ASET_PEMANTIK[u.id], u.pemantik.gambar, u.pemantik.gambar)}</div><div><p>${esc(u.pemantik.teks)}</p></div></div>

  <h2>${u.id}.2 Kehidupan sehari-hari</h2>
  ${u.sehari.map(p=>`<p>${esc(p)}</p>`).join('')}

  <h2>${u.id}.3 Kartu tokoh</h2>
  <div class="cards">${u.tokoh.map(t=>`<div class="card">${potret(t.nama)}<b>${esc(t.nama)}</b><span class="thn">${esc(t.tahun)}</span><span>${esc(t.tindakan)}</span><span class="src">Sumber: ${esc(t.sumber)}</span></div>`).join('')}</div>

  <h2>${u.id}.4 Peristiwa</h2>
  ${u.peristiwa.map(p=>`<p>${esc(p)}</p>`).join('')}

  <h2>${u.id}.5 Galeri sumber</h2>
  <div class="gal">${u.galeri.map((g,i)=>`<figure>${media((ASET_GALERI[u.id]||[])[i], g.judul, g.jenis+": "+g.judul)}<figcaption><b>${esc(g.judul)}</b><span>${esc(g.ket)}</span></figcaption></figure>`).join('')}</div>

  <h2>${u.id}.6 Bandingkan sumber</h2>
  <div class="banding"><div class="sumber"><h4>${esc(u.banding.a.judul)}</h4><p>${esc(u.banding.a.isi)}</p></div><div class="sumber b"><h4>${esc(u.banding.b.judul)}</h4><p>${esc(u.banding.b.isi)}</p></div></div>
  ${u.banding.tanya.map((t,i)=>`<div class="q"><label for="q${u.id}-${i}">${i+1}. ${esc(t)}</label><textarea id="q${u.id}-${i}" data-k="q${i}">${esc(notes['q'+i]||'')}</textarea></div>`).join('')}

  <h2>${u.id}.7 Apa kata buku teks?</h2>
  <div class="callout"><p style="margin:0">${esc(u.bukuteks)}</p></div>

  <h2>${u.id}.8 Refleksi dan cek pemahaman</h2>
  <div class="q"><label for="r${u.id}">Refleksi: ${esc(u.refleksi)}</label><textarea id="r${u.id}" data-k="refleksi">${esc(notes.refleksi||'')}</textarea></div>
  ${u.cek.map((c,i)=>`<details><summary>${i+1}. ${esc(c.q)}</summary><p><b>Kunci:</b> ${esc(c.k)}</p></details>`).join('')}

  <h3>Rujukan unit</h3>
  <ul class="rujukan">${u.rujukan.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>

  <div class="btnrow">
    <button id="selesai">${state.done[u.id]?'Unit ditandai selesai ✓ (klik untuk membatalkan)':'Tandai unit selesai'}</button>
    ${prev?`<a class="btn ghost" href="#unit-${prev.id}">← Unit ${prev.id}</a>`:''}
    ${next?`<a class="btn ghost" href="#unit-${next.id}">Unit ${next.id} →</a>`:`<a class="btn ghost" href="#beranda">Kembali ke peta modul</a>`}
    <a class="btn ghost" href="pdf/unit-${u.id}.pdf" download>Unduh PDF unit ini</a><span class="saved" id="saved"></span>
  </div>`;
  app.querySelectorAll('textarea').forEach(t=>{
    t.addEventListener('input', ()=>{ state.notes[u.id] = state.notes[u.id]||{}; state.notes[u.id][t.dataset.k]=t.value; save(state); document.getElementById('saved').textContent='Tersimpan di peramban ini'; });
  });
  document.getElementById('selesai').onclick = ()=>{ state.done[u.id]=!state.done[u.id]; save(state); viewUnit(id); };
  window.scrollTo(0,0);
}

function viewGlosarium(){
  renderNav('glosarium');
  app.innerHTML = `<h1>Glosarium</h1><p class="meta">Istilah Belanda dan Tionghoa yang muncul dalam unit.</p>
  <div class="tscroll"><table><thead><tr><th>Istilah</th><th>Arti dalam modul ini</th></tr></thead><tbody>${GLOSARIUM.map(g=>`<tr><td><b>${esc(g[0])}</b></td><td>${esc(g[1])}</td></tr>`).join('')}</tbody></table></div>`;
  window.scrollTo(0,0);
}

function viewTokoh(){
  renderNav('tokoh');
  const rows=[]; UNITS.forEach(u=>u.tokoh.forEach(t=>{ if(!t.nama.startsWith('[')) rows.push({n:t.nama,u:u.id,t:t.tindakan}); }));
  rows.sort((a,b)=>a.n.localeCompare(b.n));
  app.innerHTML = `<h1>Indeks tokoh</h1><p class="meta">${rows.length} kartu tokoh, urut abjad, dengan unit tempatnya muncul.</p>
  <div class="tscroll"><table><thead><tr><th>Tokoh</th><th>Unit</th><th>Satu tindakan terdokumentasi</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.n)}</b></td><td><a href="#unit-${r.u}">Unit ${r.u}</a></td><td>${esc(r.t)}</td></tr>`).join('')}</tbody></table></div>`;
  window.scrollTo(0,0);
}

function viewGuru(){
  renderNav('panduan-guru');
  app.innerHTML = `<h1>Panduan guru</h1>
  <h2>Skenario 45 menit per unit</h2>
  <div class="tscroll"><table><thead><tr><th>Menit</th><th>Kegiatan</th><th>Catatan</th></tr></thead><tbody>
  <tr><td>0–5</td><td>Pemantik: tampilkan foto, ajukan pertanyaan pembuka, tampung 3–4 jawaban</td><td>Tanpa koreksi dulu</td></tr>
  <tr><td>5–20</td><td>Baca mandiri Kehidupan sehari-hari, Kartu tokoh, Peristiwa di ponsel atau proyektor</td><td>Bila ponsel dilarang, guru memproyeksikan dan membaca bergiliran</td></tr>
  <tr><td>20–35</td><td>Bandingkan sumber dalam kelompok campur 4 orang; tiap kelompok menjawab 2 dari 4 pertanyaan</td><td>Guru berkeliling, menegaskan asal sumber</td></tr>
  <tr><td>35–42</td><td>Dua kelompok melaporkan; guru menutup dengan Apa kata buku teks</td><td>Penutup objektif wajib pada Unit 1, 6, 7</td></tr>
  <tr><td>42–45</td><td>Refleksi satu kalimat; cek pemahaman sebagai PR</td><td></td></tr></tbody></table></div>
  <p>Bila jam terpotong: bagian baca mandiri dan cek pemahaman dikerjakan di rumah lewat tautan modul; pertemuan dipakai untuk bandingkan sumber dan penutup (25 menit).</p>

  <h2>Rubrik tugas bandingkan sumber</h2>
  <div class="tscroll"><table><thead><tr><th>Tingkat</th><th>Deskripsi</th><th>Skor</th></tr></thead><tbody>
  <tr><td>1. Mengenali</td><td>Menyebutkan siapa pembuat tiap sumber dan kapan dibuat</td><td>1</td></tr>
  <tr><td>2. Menjelaskan</td><td>Menjelaskan perbedaan isi kedua sumber dan mengaitkannya dengan kepentingan pembuatnya</td><td>2</td></tr>
  <tr><td>3. Menyimpulkan</td><td>Menyebutkan apa yang tidak dapat ditunjukkan tiap sumber dan suara siapa yang belum ada</td><td>3</td></tr></tbody></table></div>

  <h2>Panduan episode sensitif (Unit 1, 6, 7)</h2>
  <p>Prinsipnya: bahas peristiwanya, bukan kelompoknya; pakai bukti, bukan dugaan; tutup dengan sintesis, jangan biarkan diskusi menggantung.</p>
  <ol>
   <li><b>Sebelum:</b> baca unit sampai selesai, periksa komposisi kelas, dan putuskan apakah ada siswa yang perlu diberi tahu lebih dulu.</li>
   <li><b>Pertanyaan pembingkai:</b> “Apa yang terjadi, siapa yang melakukan apa kepada siapa, dan dari sumber mana kita tahu?” Hindari “siapa yang salah” pada awal diskusi.</li>
   <li><b>Aturan diskusi:</b> berbicara tentang orang-orang dalam peristiwa, bukan tentang teman sekelas; kritik tindakan, bukan kelompok; setiap pendapat menyebut sumbernya.</li>
   <li><b>Bila muncul ucapan diskriminatif:</b> jangan menghukum di depan kelas; minta siswa menjelaskan dasar pernyataannya, lalu kembalikan ke sumber.</li>
   <li><b>Kalimat penutup objektif (contoh Mei 1998):</b> “Peristiwa ini terjadi karena krisis, kebijakan negara selama puluhan tahun, dan tindakan orang-orang tertentu, bukan karena sifat suatu kelompok. Negara sendiri kemudian mengakui kesalahannya dengan mencabut kebijakan diskriminatif.”</li>
   <li><b>Sesudah:</b> beri kesempatan menulis refleksi pribadi tanpa dibacakan; tindak lanjuti secara pribadi siswa yang tampak terganggu.</li>
  </ol>
  <div class="callout"><p style="margin:0"><b>Kelas majemuk.</b> Jangan menjadikan siswa Tionghoa sebagai juru bicara (“bagaimana menurutmu sebagai orang Tionghoa?”). Bila mereka ingin berbagi pengalaman keluarga, itu sumbangan sukarela, bukan kewajiban.</p></div>

  <h2>Versi PDF dan perluasan</h2>
  <p>Unduh: <a href="pdf/unit-1.pdf" download>Unit 1</a> · <a href="pdf/unit-2.pdf" download>Unit 2</a> · <a href="pdf/unit-3.pdf" download>Unit 3</a> · <a href="pdf/unit-4.pdf" download>Unit 4</a> · <a href="pdf/unit-5.pdf" download>Unit 5</a> · <a href="pdf/unit-6.pdf" download>Unit 6</a> · <a href="pdf/unit-7.pdf" download>Unit 7</a> · <a href="pdf/panduan-guru.pdf" download>Panduan guru</a></p>
  <p>Versi PDF memuat seluruh teks, foto, dan dokumen; video dan audio diganti tautan yang diputar guru. Struktur delapan bagian per unit dipakai untuk unit paralel tentang etnis Arab (Sumpah Pemuda Keturunan Arab 1934, A. R. Baswedan), Indo-Eropa (Indische Partij), dan India.</p>`;
  window.scrollTo(0,0);
}

function route(){
  const h = (location.hash||'#beranda').replace('#','');
  if(h==='beranda'||h==='') return viewHome();
  if(h.startsWith('unit-')) return viewUnit(parseInt(h.slice(5),10));
  if(h==='glosarium') return viewGlosarium();
  if(h==='tokoh') return viewTokoh();
  if(h==='panduan-guru') return viewGuru();
  viewHome();
}
window.addEventListener('hashchange', route);
route();
