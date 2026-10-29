# Our Little Journey ❤️

Aplikasi daftar keinginan pasangan dan album kenangan. Proyek ini menggunakan HTML, CSS, JavaScript, serta Supabase untuk login, database, dan penyimpanan foto.

## Perbaikan pada versi ini
- Form tambah daftar keinginan sekarang meminta nomor, judul, kategori, deskripsi, status, dan tanggal target.
- Nomor daftar keinginan dapat diedit melalui detail.
- Nomor harus bilangan bulat minimal 1 dan tidak boleh sama dengan nomor daftar lain.
- Antarmuka dirapikan untuk layar kecil/HP.
- Teks antarmuka dibuat lebih konsisten dalam bahasa Indonesia.
- Data, login, dan fitur album kenangan tetap menggunakan Supabase seperti sebelumnya.

## File
- `index.html`
- `style.css`
- `app.js`
- `bg.js`

## Konfigurasi Supabase
Buka `app.js`, lalu isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` menggunakan Project URL dan anon/public key dari proyek Supabase kamu. Jangan pernah memasukkan `service_role` key ke frontend.

Tabel, fungsi database, kebijakan RLS, dan bucket Storage harus sudah dibuat di proyek Supabase. File SQL `supabase/schema.sql` tidak termasuk dalam file yang diunggah untuk perbaikan ini; pertahankan file SQL asli dari proyek kamu jika sudah tersedia.

## Menjalankan secara lokal
Gunakan server lokal, jangan membuka `index.html` langsung sebagai `file://`. Jika Python terpasang, jalankan terminal dari folder proyek:

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Catatan nomor
Nomor yang sudah dipakai tidak dapat dipilih untuk daftar lain. Jika ingin menukar dua nomor yang sudah ada, ubah salah satunya ke nomor kosong terlebih dahulu, simpan, lalu ubah nomor berikutnya.
# WHISHLIST
