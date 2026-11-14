/* ============================================================
   STORE — satu-satunya pintu ke data (akun, kelas, progres).
   Sekarang: adapter LOKAL (localStorage) untuk demo/prototipe.
   Nanti: ganti isi adapter ini dengan Firebase; UI tidak perlu diubah.
   Semua fungsi async supaya bentuknya sama dengan Firebase.

   Skema (siap dipindah ke Firestore):
     users/{uid}      {uid, role:'murid'|'guru', nama, nis?, email?, kelas}
     classes/{kode}   {kode, nama, guruUid, dibuat}
     progress/{uid}   {done, notes, seen, updated, nama, nis, kelas}
   Login murid memakai NIS; di Firebase NIS dipetakan ke email semu
   "<nis>@murid.jejak.id" (Firebase Auth hanya mengenal email+sandi).
   ============================================================ */
const Store=(()=>{
  const DB='jejak-db-v1',SES='jejak-session-v1',AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const empty=()=>({users:{},classes:{},progress:{}});
  const rd=()=>{try{return JSON.parse(localStorage.getItem(DB))||empty()}catch(e){return empty()}};
  const wr=d=>localStorage.setItem(DB,JSON.stringify(d));
  const rid=()=>'u'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
  const fail=m=>{throw new Error(m)};
  const hash=async s=>{
    s='jejak|'+s;
    if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
    let h=5381;for(const c of s)h=((h<<5)+h+c.charCodeAt(0))>>>0;return'x'+h};
  const newCode=d=>{let k;do{k=Array.from({length:5},()=>AL[Math.floor(Math.random()*AL.length)]).join('')}while(d.classes[k]);return k};
  const pub=u=>u&&{uid:u.uid,role:u.role,nama:u.nama,nis:u.nis,email:u.email,kelas:u.kelas};
  const open=(d,u)=>{localStorage.setItem(SES,u.uid);return pub(u)};

  return{
    mode:'lokal',   /* 'lokal' | 'firebase' */
    auth:{
      async current(){const d=rd(),id=localStorage.getItem(SES);return id&&d.users[id]?pub(d.users[id]):null},
      async registerStudent({nama,nis,kode,password}){
        const d=rd();nama=(nama||'').trim();nis=(nis||'').trim();kode=(kode||'').trim().toUpperCase();
        if(!nama||!nis||!kode||!password)fail('Lengkapi semua kolom.');
        if(!/^\d{4,20}$/.test(nis))fail('NIS berisi angka saja (4–20 digit).');
        if(password.length<6)fail('Kata sandi minimal 6 karakter.');
        if(!d.classes[kode])fail('Kode kelas tidak ditemukan. Minta kode ke gurumu.');
        if(Object.values(d.users).some(u=>u.nis===nis))fail('NIS ini sudah terdaftar. Silakan masuk.');
        const u={uid:rid(),role:'murid',nama,nis,kelas:kode,pw:await hash(password)};
        d.users[u.uid]=u;wr(d);return open(d,u)},
      async registerTeacher({nama,email,password,kelas}){
        const d=rd();nama=(nama||'').trim();email=(email||'').trim().toLowerCase();kelas=(kelas||'').trim();
        if(!nama||!email||!kelas||!password)fail('Lengkapi semua kolom.');
        if(!/^\S+@\S+\.\S+$/.test(email))fail('Format email belum benar.');
        if(password.length<6)fail('Kata sandi minimal 6 karakter.');
        if(Object.values(d.users).some(u=>u.email===email))fail('Email ini sudah terdaftar. Silakan masuk.');
        const kode=newCode(d),u={uid:rid(),role:'guru',nama,email,kelas:kode,pw:await hash(password)};
        d.users[u.uid]=u;d.classes[kode]={kode,nama:kelas,guruUid:u.uid,dibuat:Date.now()};wr(d);return open(d,u)},
      async login({id,password}){
        const d=rd();id=(id||'').trim().toLowerCase();
        const u=Object.values(d.users).find(x=>x.email===id||x.nis===id);
        if(!u||u.pw!==await hash(password||''))fail('NIS/email atau kata sandi salah.');
        return open(d,u)},
      async logout(){localStorage.removeItem(SES)}
    },
    progress:{
      async load(uid){const p=rd().progress[uid];return p?{done:p.done||{},notes:p.notes||{},seen:p.seen||{}}:{done:{},notes:{},seen:{}}},
      async save(uid,s){const d=rd(),u=d.users[uid];if(!u)return;
        d.progress[uid]={done:s.done,notes:s.notes,seen:s.seen,updated:Date.now(),nama:u.nama,nis:u.nis,kelas:u.kelas};wr(d)}
    },
    teacher:{
      async classInfo(kode){return rd().classes[kode]||null},
      /* daftar murid sekelas + progresnya. Firestore: where('kelas','==',kode) pada progress/ & users/ */
      async roster(kode){const d=rd();return Object.values(d.users).filter(u=>u.role==='murid'&&u.kelas===kode)
        .map(u=>({user:pub(u),progress:d.progress[u.uid]||{done:{},notes:{},seen:{},updated:0}}))},
      /* hanya mode lokal: isi kelas dengan murid contoh supaya dasbor bisa dilihat */
      async seedDemo(kode,units){
        const d=rd(),N=['Aisyah Putri','Bagas Pratama','Citra Lestari','Dimas Anggara','Eka Wulandari','Farhan Maulana','Gita Safitri','Hafiz Ramadhan','Indah Permata','Joko Santoso','Kirana Dewi','Luthfi Hakim','Maya Salsabila','Naufal Rizky'];
        const L=['Menurutku mereka tinggal berkelompok karena aturan VOC, tetapi lama-lama menjadi pusat ekonomi.','Sumber A menekankan sisi politik, sumber B lebih ke ekonomi. Keduanya perlu dibandingkan.','Pelajaran penting: sejarah tidak hanya diisi tokoh yang sering disebut di buku.','Aku baru tahu peran mereka sebesar ini dalam perjuangan.'];
        N.forEach((nama,i)=>{const uid='demo'+i,nis=String(2026001+i);
          d.users[uid]={uid,role:'murid',nama,nis,kelas:kode,pw:'-'};
          const lvl=i<3?units.length:i<9?1+Math.floor(Math.random()*units.length):Math.floor(Math.random()*3),p={done:{},notes:{},seen:{}};
          units.forEach((u,k)=>{
            if(k<lvl){p.done[u.id]=true;p.seen[u.id]={1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1};
              p.notes[u.id]={pemantik:L[(i+k)%4],q0:L[(i+k+1)%4],refleksi:L[(i+k+2)%4],c0:L[(i+k+3)%4]}}
            else if(k===lvl&&i%2){p.seen[u.id]={1:1,2:1,3:1,4:1};p.notes[u.id]={pemantik:L[i%4]}}});
          p.updated=Date.now()-Math.floor(Math.random()*(i<10?4:14))*864e5-Math.random()*36e5*5;
          p.nama=nama;p.nis=nis;p.kelas=kode;d.progress[uid]=p});wr(d)},
      async clearDemo(){const d=rd();Object.keys(d.users).filter(k=>k.startsWith('demo')).forEach(k=>{delete d.users[k];delete d.progress[k]});wr(d)}
    }
  };
})();
