# Panduan Pengguna Lavi Growth

## 1. Tujuan aplikasi

Lavi Growth membantu mencatat dan meninjau data kesehatan keluarga dari browser. Aplikasi tidak memberikan diagnosis medis dan tidak menggantikan tenaga kesehatan.

## 2. Profil keluarga

Buat profil sesuai kategori pengguna: bayi, anak, dewasa, lansia, atau kehamilan. Gunakan data yang benar hanya pada perangkat dan backend yang Anda kendalikan.

## 3. Catatan kesehatan

Catatan dapat memuat tanggal/waktu, berat, tinggi, suhu, denyut jantung, tekanan darah, gula darah, ukuran tubuh tertentu, durasi tidur, gejala, foto, dan catatan tambahan.

## 4. Target, reminder, jurnal, dan statistik

- **Target** membantu membandingkan metrik dengan sasaran pribadi.
- **Reminder** menggunakan notifikasi browser bila izin diberikan.
- **Jurnal** menyimpan catatan pengguna.
- **Statistik** menampilkan ringkasan dan tren dari data yang tersimpan.

## 5. Backup

Lakukan export JSON secara rutin. Simpan file backup di lokasi yang terlindungi. Jangan unggah backup berisi data kesehatan ke repository publik.

## 6. Database

Aplikasi dapat berjalan local-only. Sinkronisasi backend bersifat opsional. Baca [DATABASES.md](DATABASES.md) sebelum mengaktifkan backend.

## 7. Reset dan penghapusan

Sebelum reset atau menghapus data, buat backup bila masih dibutuhkan. Penghapusan pada browser tidak selalu menghapus salinan yang sudah berada di backend atau backup eksternal.

## 8. Privasi

Gunakan PIN unik, kunci perangkat, browser yang diperbarui, dan hindari perangkat publik/bersama untuk data kesehatan nyata. Lihat [PRIVACY.md](PRIVACY.md) dan [../SECURITY.md](../SECURITY.md).
