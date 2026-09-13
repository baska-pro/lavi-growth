# Privasi

## Data yang dapat diproses

Bergantung pada fitur yang digunakan, Lavi Growth dapat menyimpan nama profil, tanggal lahir, jenis profil, pengukuran kesehatan, gejala, catatan, foto, reminder, data menstruasi/kehamilan, dan metadata terkait.

## Penyimpanan lokal

Sejak v1.0.1, state utama, foto, dan queue sinkronisasi disimpan di IndexedDB browser. Web Storage hanya digunakan untuk konfigurasi ringan, status kecil, dan migrasi versi lama.

Menghapus site data/browser storage dapat menghapus data lokal. Gunakan export backup JSON secara berkala sebelum membersihkan data browser, berpindah perangkat, atau mengganti backend.

Backup JSON tidak menyertakan PIN maupun konfigurasi database, tetapi tetap dapat berisi data kesehatan dan foto. Perlakukan file backup sebagai data sensitif.

## Sinkronisasi eksternal

Jika backend diaktifkan, data dikirim ke Google Apps Script/Spreadsheet atau Supabase yang dikonfigurasi pengguna. Pengguna bertanggung jawab atas project backend, akses akun, retention, backup, region, dan kebijakan keamanan masing-masing layanan.

- GAS v9 menyimpan hash PIN dengan salt dan menerapkan pembatasan percobaan PIN.
- Supabase v1.0.1 menggunakan RPC terproteksi; role browser tidak diberi akses tabel langsung dan PIN disimpan sebagai bcrypt hash.
- Supabase `service_role` key tidak boleh berada di frontend.

PIN membantu membatasi akses backend aplikasi, tetapi tidak menggantikan keamanan perangkat, akun Google/Supabase, maupun kontrol akses penyedia cloud.

## API referensi publik

Beberapa fitur dapat menghubungi Open Food Facts, OpenStreetMap/Nominatim, OpenFDA, atau Wikipedia. Hindari mengirim informasi pribadi/medis yang tidak diperlukan sebagai query.

## Prinsip penggunaan

- gunakan data minimum yang diperlukan;
- jangan memasukkan data nyata ke repository publik atau screenshot dokumentasi;
- backup data secara terenkripsi bila memungkinkan;
- hapus data yang tidak lagi diperlukan;
- gunakan PIN yang sulit ditebak dan lindungi file recovery PIN;
- sebelum migrasi backend, backup dan verifikasi hasil restore terlebih dahulu.
