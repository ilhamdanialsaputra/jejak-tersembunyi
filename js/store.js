/* ============================================================
   STORE — adapter FIREBASE (Auth + Firestore), antarmuka sama
   dengan adapter lokal. UI (auth.js, app.js) tidak perlu diubah.
   Butuh di index.html, SEBELUM store.js:
     firebase-app-compat.js, firebase-auth-compat.js, firebase-firestore-compat.js
   Skema Firestore:
     users/{uid}      {uid, role, nama, nis?, email?, foto?, kelas}
     classes/{kode}   {kode, nama, guruUid, dibuat}
     progress/{uid}   {done, notes, seen, updated, nama, nis, kelas}
   NIS murid (akun lama) dipetakan ke email semu "<nis>@murid.jejak.id".
   Masuk dengan Google: Store.auth.google() lalu, untuk pengguna baru,
   Store.auth.completeGoogle(). Nama diisi sendiri; hanya foto disinkronkan dari Google.
   ============================================================ */

/* TEMPEL firebaseConfig dari Firebase Console di sini */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAtNAA1kSm7p2qyMGcx5pJs-BUEeUuMn98",
  authDomain: "jejak-tersembunyi.firebaseapp.com",
  projectId: "jejak-tersembunyi",
  storageBucket: "jejak-tersembunyi.firebasestorage.app",
  messagingSenderId: "899290427392",
  appId: "1:899290427392:web:b89ef0b06cb78274a2a8e5"
};

const Store = (() => {
  firebase.initializeApp(FIREBASE_CONFIG);
  const A = firebase.auth(), D = firebase.firestore();
  const AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', DOM = '@murid.jejak.id';
  const fail = m => { throw new Error(m); };
  const pub = u => u && { uid: u.uid, role: u.role, nama: u.nama, nis: u.nis, email: u.email, foto: u.foto, kelas: u.kelas };

  const PESAN = {
    'auth/email-already-in-use': 'NIS/email ini sudah terdaftar. Silakan masuk.',
    'auth/invalid-credential': 'NIS/email atau kata sandi salah.',
    'auth/invalid-login-credentials': 'NIS/email atau kata sandi salah.',
    'auth/wrong-password': 'NIS/email atau kata sandi salah.',
    'auth/user-not-found': 'NIS/email atau kata sandi salah.',
    'auth/invalid-email': 'Format email/NIS belum benar.',
    'auth/weak-password': 'Kata sandi minimal 6 karakter.',
    'auth/network-request-failed': 'Koneksi bermasalah. Periksa internetmu.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
    'auth/popup-closed-by-user': 'Masuk dengan Google dibatalkan.',
    'auth/cancelled-popup-request': 'Masuk dengan Google dibatalkan.',
    'auth/popup-blocked': 'Jendela Google diblokir peramban. Izinkan pop-up untuk situs ini, lalu coba lagi.',
    'auth/unauthorized-domain': 'Alamat situs ini belum didaftarkan di Firebase (Authorized domains).',
    'auth/operation-not-allowed': 'Masuk dengan Google belum diaktifkan di Firebase.',
    'auth/account-exists-with-different-credential': 'Email ini sudah terdaftar dengan cara masuk lain. Masuk dengan kata sandi dulu.',
    'auth/user-disabled': 'Akun ini dinonaktifkan.',
    'auth/web-storage-unsupported': 'Peramban memblokir penyimpanan. Aktifkan cookie atau keluar dari mode privat.',
    'permission-denied': 'Akses ditolak oleh server.',
    'unavailable': 'Server tidak terjangkau. Periksa koneksi.'
  };
  const LAMBAT = 'Koneksi lambat atau terputus. Coba lagi.';
  const msgOf = e => e && e.code ? (PESAN[e.code] || PESAN[e.code.replace('firestore/', '')] || e.message) : ((e && e.message) || 'Terjadi kesalahan.');
  const wrap = async f => {
    let tm;
    try { return await Promise.race([f(), new Promise((_, no) => { tm = setTimeout(() => no(new Error(LAMBAT)), 30000); })]); }
    catch (e) { throw new Error(msgOf(e)); }
    finally { clearTimeout(tm); }
  };

  /* tunggu status login pertama (Firebase memulihkan sesi secara asinkron) */
  const ready = new Promise(res => { const un = A.onAuthStateChanged(u => { un(); res(u); }); });
  const profile = async uid => { const s = await D.collection('users').doc(uid).get(); return s.exists ? pub(s.data()) : null; };
  /* ---- Google ---- */
  const isG = au => (au.providerData || []).some(p => p.providerId === 'google.com');
  const gInfo = au => ({
    nama: (au.displayName || '').trim() || (au.email || '').split('@')[0] || 'Pengguna',
    email: (au.email || '').toLowerCase(), foto: au.photoURL || ''
  });
  /* samakan nama + foto dengan profil Google terbaru. Bila aturan Firestore belum
     mengizinkan update, tampilan tetap memakai data Google terbaru (hanya lokal). */
  const sync = async (au, p) => {
    if (!isG(au)) return p;
    const g = gInfo(au), ch = {};
    if (g.foto !== (p.foto || '')) ch.foto = g.foto;
    if (!Object.keys(ch).length) return p;
    try { await D.collection('users').doc(p.uid).update(ch); } catch (e) { /* abaikan */ }
    return { ...p, ...ch };
  };
  const newCode = async () => {
    for (let i = 0; i < 12; i++) {
      const k = Array.from({ length: 5 }, () => AL[Math.floor(Math.random() * AL.length)]).join('');
      if (!(await D.collection('classes').doc(k).get()).exists) return k;
    }
    fail('Gagal membuat kode kelas. Coba lagi.');
  };

  return {
    mode: 'firebase',
    auth: {
      current: () => wrap(async () => {
        await ready;
        const u = A.currentUser;
        if (!u) return null;
        const p = await profile(u.uid);
        return p ? sync(u, p) : null;
      }),
      /* langkah 1: pilih akun Google. {user} bila sudah punya profil, {baru} bila perlu melengkapi */
      google: async () => {
        const prov = new firebase.auth.GoogleAuthProvider();
        prov.setCustomParameters({ prompt: 'select_account' });
        let cred;
        try { cred = await A.signInWithPopup(prov); } catch (e) { throw new Error(msgOf(e)); }
        return wrap(async () => {
          const p = await profile(cred.user.uid);
          return p ? { user: await sync(cred.user, p) } : { baru: gInfo(cred.user) };
        });
      },
      /* langkah 2 (hanya pengguna baru): pilih peran lalu buat profil */
      completeGoogle: ({ role, nama, kode, nis, kelas }) => wrap(async () => {
        const au = A.currentUser;
        if (!au) fail('Sesi Google berakhir. Silakan ulangi masuk.');
        const ada = await profile(au.uid);
        if (ada) return ada;
        const g = gInfo(au);
        nama = (nama || '').trim().replace(/\s+/g, ' ');
        if (!nama) fail('Isi nama lengkapmu.');
        if (nama.length > 100) fail('Nama terlalu panjang.');
        if (role === 'murid') {
          kode = (kode || '').trim().toUpperCase(); nis = (nis || '').trim();
          if (!kode) fail('Isi kode kelas dari gurumu.');
          if (nis && !/^\d{4,20}$/.test(nis)) fail('NIS berisi angka saja (4–20 digit), atau kosongkan.');
          if (!(await D.collection('classes').doc(kode).get()).exists) fail('Kode kelas tidak ditemukan. Minta kode ke gurumu.');
          const u = { uid: au.uid, role: 'murid', nama, nis, email: g.email, foto: g.foto, kelas: kode };
          await D.collection('users').doc(u.uid).set(u);
          return pub(u);
        }
        kelas = (kelas || '').trim();
        if (!kelas) fail('Isi nama kelas / mata pelajaran.');
        const k = await newCode();
        const u = { uid: au.uid, role: 'guru', nama, email: g.email, foto: g.foto, kelas: k };
        const b = D.batch();
        b.set(D.collection('users').doc(u.uid), u);
        b.set(D.collection('classes').doc(k), { kode: k, nama: kelas, guruUid: u.uid, dibuat: Date.now() });
        await b.commit();
        return pub(u);
      }),
      registerStudent: ({ nama, nis, kode, password }) => wrap(async () => {
        nama = (nama || '').trim(); nis = (nis || '').trim(); kode = (kode || '').trim().toUpperCase();
        if (!nama || !nis || !kode || !password) fail('Lengkapi semua kolom.');
        if (!/^\d{4,20}$/.test(nis)) fail('NIS berisi angka saja (4–20 digit).');
        if (password.length < 6) fail('Kata sandi minimal 6 karakter.');
        if (!(await D.collection('classes').doc(kode).get()).exists) fail('Kode kelas tidak ditemukan. Minta kode ke gurumu.');
        const cred = await A.createUserWithEmailAndPassword(nis + DOM, password);
        const u = { uid: cred.user.uid, role: 'murid', nama, nis, kelas: kode };
        try { await D.collection('users').doc(u.uid).set(u); }
        catch (e) { await cred.user.delete().catch(() => {}); throw e; }
        return pub(u);
      }),
      registerTeacher: ({ nama, email, password, kelas }) => wrap(async () => {
        nama = (nama || '').trim(); email = (email || '').trim().toLowerCase(); kelas = (kelas || '').trim();
        if (!nama || !email || !kelas || !password) fail('Lengkapi semua kolom.');
        if (!/^\S+@\S+\.\S+$/.test(email)) fail('Format email belum benar.');
        if (password.length < 6) fail('Kata sandi minimal 6 karakter.');
        const cred = await A.createUserWithEmailAndPassword(email, password);
        try {
          const kode = await newCode();
          const u = { uid: cred.user.uid, role: 'guru', nama, email, kelas: kode };
          const b = D.batch();
          b.set(D.collection('users').doc(u.uid), u);
          b.set(D.collection('classes').doc(kode), { kode, nama: kelas, guruUid: u.uid, dibuat: Date.now() });
          await b.commit();
          return pub(u);
        } catch (e) { await cred.user.delete().catch(() => {}); throw e; }
      }),
      login: ({ id, password }) => wrap(async () => {
        id = (id || '').trim().toLowerCase();
        if (!id || !password) fail('Isi NIS/email dan kata sandi.');
        const cred = await A.signInWithEmailAndPassword(id.includes('@') ? id : id + DOM, password);
        const p = await profile(cred.user.uid);
        if (!p) { await A.signOut(); fail('Profil akun tidak ditemukan.'); }
        return p;
      }),
      async logout() { await A.signOut(); }
    },
    progress: {
      load: uid => wrap(async () => {
        const s = await D.collection('progress').doc(uid).get();
        const p = s.exists ? s.data() : {};
        return { done: p.done || {}, notes: p.notes || {}, seen: p.seen || {}, sent: p.sent || {} };
      }),
      save: (uid, s) => wrap(async () => {
        const u = await profile(uid);
        if (!u) return;
        await D.collection('progress').doc(uid).set({
          done: s.done, notes: s.notes, seen: s.seen, sent: s.sent || {}, updated: Date.now(),
          nama: u.nama, nis: u.nis || '', kelas: u.kelas
        });
      })
    },
    feedback: {
      /* umpan balik guru untuk satu murid: { "<unit>_<kunci>": {t, at, by} } */
      load: uid => wrap(async () => {
        const s = await D.collection('feedback').doc(uid).get();
        return s.exists ? (s.data().items || {}) : {};
      }),
      save: (uid, key, text, by) => wrap(async () => {
        await D.collection('feedback').doc(uid).set({ items: { [key]: { t: text, at: Date.now(), by: by || '' } } }, { merge: true });
      })
    },
    teacher: {
      classInfo: kode => wrap(async () => {
        const s = await D.collection('classes').doc(kode).get();
        return s.exists ? s.data() : null;
      }),
      roster: kode => wrap(async () => {
        const [us, ps] = await Promise.all([
          D.collection('users').where('kelas', '==', kode).where('role', '==', 'murid').get(),
          D.collection('progress').where('kelas', '==', kode).get()
        ]);
        const P = {}; ps.forEach(d => P[d.id] = d.data());
        return us.docs.map(d => {
          const u = pub(d.data());
          return { user: u, progress: P[u.uid] || { done: {}, notes: {}, seen: {}, updated: 0 } };
        });
      }),
      async seedDemo() {}, async clearDemo() {}   /* hanya untuk mode lokal */
    }
  };
})();
