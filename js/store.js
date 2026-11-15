/* ============================================================
   STORE — adapter FIREBASE (Auth + Firestore), antarmuka sama
   dengan adapter lokal. UI (auth.js, app.js) tidak perlu diubah.
   Butuh di index.html, SEBELUM store.js:
     firebase-app-compat.js, firebase-auth-compat.js, firebase-firestore-compat.js
   Skema Firestore:
     users/{uid}      {uid, role, nama, nis?, email?, kelas}
     classes/{kode}   {kode, nama, guruUid, dibuat}
     progress/{uid}   {done, notes, seen, updated, nama, nis, kelas}
   NIS murid dipetakan ke email semu "<nis>@murid.jejak.id".
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
  const pub = u => u && { uid: u.uid, role: u.role, nama: u.nama, nis: u.nis, email: u.email, kelas: u.kelas };

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
    'permission-denied': 'Akses ditolak oleh server.',
    'unavailable': 'Server tidak terjangkau. Periksa koneksi.'
  };
  const wrap = async f => {
    try { return await f(); }
    catch (e) { throw new Error(e && e.code ? (PESAN[e.code] || PESAN[e.code.replace('firestore/', '')] || e.message) : (e.message || 'Terjadi kesalahan.')); }
  };

  /* tunggu status login pertama (Firebase memulihkan sesi secara asinkron) */
  const ready = new Promise(res => { const un = A.onAuthStateChanged(u => { un(); res(u); }); });
  const profile = async uid => { const s = await D.collection('users').doc(uid).get(); return s.exists ? pub(s.data()) : null; };
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
      async current() {
        await ready;
        const u = A.currentUser;
        return u ? profile(u.uid) : null;
      },
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
        return { done: p.done || {}, notes: p.notes || {}, seen: p.seen || {} };
      }),
      save: (uid, s) => wrap(async () => {
        const u = await profile(uid);
        if (!u) return;
        await D.collection('progress').doc(uid).set({
          done: s.done, notes: s.notes, seen: s.seen, updated: Date.now(),
          nama: u.nama, nis: u.nis || '', kelas: u.kelas
        });
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
