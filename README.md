# Jejak yang Tersembunyi: Peran Etnis Tionghoa dalam Sejarah Indonesia

E-modul suplemen mata pelajaran Sejarah kelas XI (Fase F) berbasis *hidden history*. Tujuh unit
dengan pola tetap: pemantik, kehidupan sehari-hari, kartu tokoh, peristiwa, galeri sumber,
bandingkan sumber, apa kata buku teks, refleksi dan cek pemahaman. Dikembangkan dari analisis
kebutuhan di dua SMA Jakarta (September 2026) dan analisis isi buku teks Sejarah kelas XI edisi revisi 2024.

Situs ini statis: tidak ada server, basis data, maupun pengumpulan data siswa. Catatan refleksi
dan jawaban tersimpan hanya di peramban masing-masing (localStorage).

## Struktur berkas

```
index.html          kerangka halaman (judul, navigasi, footer)
css/style.css       tampilan, termasuk mode gelap dan gaya cetak
js/data.js          SELURUH ISI: tujuh unit, glosarium, nama berkas media
js/app.js           logika tampilan (navigasi hash, penyimpanan catatan, media)
assets/             foto, dokumen, audio, potret tokoh (lihat assets/README.md)
pdf/                versi cetak A4 per unit dan panduan guru
.nojekyll           agar GitHub Pages tidak mengubah berkas
```

Untuk mengubah teks unit, cukup sunting `js/data.js`. Tampilan tidak perlu disentuh.

## Menayangkan di GitHub Pages

1. Buat repositori baru di GitHub (misalnya `jejak-tersembunyi`), unggah seluruh isi folder ini.
2. Buka **Settings → Pages**, pilih *Deploy from a branch*, cabang `main`, folder `/ (root)`, simpan.
3. Dalam 1–2 menit situs tayang di `https://NAMA-AKUN.github.io/jejak-tersembunyi/`.
4. Domain sendiri (opsional): isi *Custom domain* dengan domain Anda dan arahkan DNS ke GitHub;
   HTTPS aktif otomatis. Untuk subdomain kampus, hubungi UPT TIK UNJ dan unggah folder yang sama.

Alternatif tanpa GitHub: seret-lepas folder ini ke https://app.netlify.com/drop.

Tautan per unit untuk dibagikan ke siswa: `.../#unit-1` sampai `.../#unit-7`; glosarium `#glosarium`;
indeks tokoh `#tokoh`; panduan guru `#panduan-guru`.

## Memasukkan media

Semua kotak bergaris di galeri dan pemantik adalah pengganti sementara. Begitu berkas dengan nama
yang sesuai ada di folder `assets/`, halaman otomatis menampilkannya; bila berkas tidak ada,
kotak keterangan sumber tetap tampil. Daftar nama berkas, koleksi asal, dan status izin ada di
`assets/README.md`. Untuk video atau audio daring, ganti nama berkas di `ASET_GALERI`
(`js/data.js`) dengan URL lengkap.

Potret kartu tokoh: `assets/tokoh/<nama-dengan-tanda-hubung>.jpg`, misalnya
`assets/tokoh/sie-kong-liong.jpg`, `assets/tokoh/yo-kim-tjan.jpg`, `assets/tokoh/john-lie.jpg`.
Tanpa berkas, kartu menampilkan inisial.

## Memperbarui PDF

PDF di folder `pdf/` dibuat dari halaman ini dengan gaya cetak (`@media print` di `css/style.css`).
Setelah media dimasukkan atau teks diubah, buat ulang PDF: buka `index.html#unit-1` di Chrome,
*Print → Save as PDF*, ukuran A4, aktifkan *Background graphics*; ulangi untuk unit lain dan
`#panduan-guru`. Simpan dengan nama yang sama agar tautan unduh di situs tetap berlaku.

## Daftar periksa sebelum tayang publik

- [ ] Nama penyusun dan validator diisi di `js/app.js` (bagian beranda) atau di data.
- [ ] Semua media di `assets/` memiliki izin atau lisensi yang tercatat di `assets/README.md`.
- [ ] Foto Rumah Sejarah Rengasdengklok dan wawancara keluarga pengelola: izin tertulis.
- [ ] Cuplikan film *Gie*: hanya trailer resmi atau cuplikan dengan izin Miles Films.
- [ ] Unit 7 dan panduan episode sensitif (L.4) sudah dibaca guru pengguna pertama.
- [ ] Uji di ponsel Android, iPhone, dan proyektor kelas.
- [ ] Kode QR dibuat dari alamat final.

## Lisensi

Teks penyusun: CC BY-SA 4.0. Foto, dokumen, audio, dan video mengikuti lisensi koleksi
masing-masing sebagaimana dicatat di `assets/README.md`.
