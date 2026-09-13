# Privasi

## Data yang dapat diproses

Bergantung pada fitur yang digunakan, Lavi Growth dapat menyimpan nama profil, tanggal lahir, jenis profil, pengukuran kesehatan, gejala, catatan, foto, reminder, data menstruasi/kehamilan, dan metadata terkait.

## Penyimpanan lokal

Mode local-first menyimpan state pada browser/perangkat. Menghapus cache/site data browser dapat menghapus data lokal yang belum dibackup.

## Sinkronisasi eksternal

Jika backend diaktifkan, data dapat dikirim ke Google Apps Script/Spreadsheet atau Supabase yang dikonfigurasi pengguna. Pengguna bertanggung jawab atas project backend, akses akun, retention, backup, dan kebijakan keamanan masing-masing layanan.

## API referensi publik

Beberapa fitur dapat menghubungi Open Food Facts, OpenStreetMap/Nominatim, OpenFDA, atau Wikipedia. Hindari mengirim informasi pribadi/medis yang tidak diperlukan sebagai query.

## Prinsip penggunaan

- gunakan data minimum yang diperlukan;
- jangan memasukkan data nyata ke repository publik atau screenshot dokumentasi;
- backup data secara terenkripsi bila memungkinkan;
- hapus data yang tidak lagi diperlukan;
- pahami bahwa PIN aplikasi bukan pengganti keamanan perangkat atau autentikasi backend.
