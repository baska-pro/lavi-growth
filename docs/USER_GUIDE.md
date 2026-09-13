# Panduan Pengguna Lavi Growth

## 1. Tujuan aplikasi

Lavi Growth membantu mencatat dan meninjau data kesehatan keluarga dari browser. Aplikasi tidak memberikan diagnosis medis dan tidak menggantikan tenaga kesehatan.

## 2. Profil keluarga

Buat profil sesuai kategori pengguna: bayi, anak, dewasa, lansia, atau kehamilan. Gunakan data nyata hanya pada perangkat dan backend yang Anda kendalikan.

Menghapus profil juga menghapus data lokal terkait seperti catatan kesehatan, vaksin, milestone, target, reminder, dan siklus menstruasi profil tersebut.

## 3. Catatan kesehatan

Catatan dapat memuat tanggal/waktu, berat, tinggi, suhu, denyut jantung, tekanan darah, gula darah, ukuran tubuh tertentu, durasi tidur, gejala, foto, dan catatan tambahan.

State utama dan foto disimpan secara local-first di IndexedDB browser.

## 4. Target, reminder, jurnal, dan statistik

- **Target** membantu membandingkan metrik dengan sasaran pribadi.
- **Reminder** mendukung jadwal berulang maupun satu tanggal tertentu.
- **Reminder browser** menggunakan service worker bila izin notifikasi diberikan. Browser tidak menjamin reminder dapat membangunkan aplikasi setelah seluruh proses browser dihentikan.
- **Jurnal** menyimpan catatan pengguna.
- **Statistik** menampilkan ringkasan dan tren dari data yang tersimpan.

## 5. Backup & restore

Lakukan export JSON secara rutin. Backup v1.0.1 menggunakan format terversi dan tidak menyertakan PIN maupun konfigurasi database, tetapi tetap dapat berisi data kesehatan serta foto.

Saat restore, aplikasi memvalidasi struktur dasar backup dan memulihkan profil, record, vaksin, milestone, target, reminder, serta siklus menstruasi. Simpan file backup di lokasi yang terlindungi dan jangan unggah data nyata ke repository publik.

## 6. Sinkronisasi

Aplikasi dapat berjalan local-only. Sinkronisasi backend bersifat opsional. Baca [DATABASES.md](DATABASES.md) sebelum mengaktifkan Google Apps Script atau Supabase.

Queue sinkronisasi disimpan secara durable. Jika beberapa percobaan gagal, item tidak dibuang; aplikasi menandainya sebagai gagal dan menyediakan tombol **Coba lagi**. Cloud pull ditahan selama masih ada data pending/gagal agar perubahan lokal tidak tertimpa snapshot cloud lama.

## 7. PIN

- Backend baru menggunakan PIN 6-12 digit.
- Instalasi GAS v9 membuat PIN awal acak.
- Supabase v1.0.1 dan GAS v9 menyimpan hash PIN, bukan PIN plaintext.
- Jangan gunakan PIN mudah ditebak.
- File recovery PIN berisi PIN yang dapat dibaca; lindungi file tersebut.

Login masih menerima PIN backend legacy 4 digit agar instalasi lama dapat dimigrasikan, tetapi PIN baru wajib 6-12 digit.

## 8. Reset dan penghapusan

Sebelum reset atau menghapus data, buat backup bila masih dibutuhkan. Hard reset lokal membersihkan state IndexedDB dan sync queue lokal. Penghapusan lokal tidak selalu menghapus salinan yang berada di backup eksternal.

## 9. Privasi

Gunakan PIN unik, kunci perangkat, browser yang diperbarui, dan hindari perangkat publik/bersama untuk data kesehatan nyata. Lihat [PRIVACY.md](PRIVACY.md) dan [../SECURITY.md](../SECURITY.md).
