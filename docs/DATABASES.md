# Database & Sinkronisasi

Lavi Growth dapat berjalan sepenuhnya secara lokal. Backend hanya diperlukan untuk sinkronisasi lintas perangkat atau penyimpanan eksternal.

## Google Apps Script / Spreadsheet

Repository menyertakan `ScriptGAS.gs` backend **v9.0**.

### Model keamanan

- PIN tidak disimpan sebagai teks biasa di Script Properties.
- Server menyimpan hash SHA-256 yang diberi salt acak.
- Instalasi baru menghasilkan PIN awal 6 digit secara acak.
- Lima percobaan PIN gagal berturut-turut memicu lock sementara selama 5 menit.
- PIN baru wajib 6-12 digit.
- URL Web App bukan secret dan tidak boleh dianggap sebagai autentikasi.

### Setup

1. Buat Spreadsheet milik sendiri.
2. Buka **Extensions → Apps Script**.
3. Salin isi `ScriptGAS.gs`.
4. Jalankan `initialSetup()` satu kali dan izinkan permission yang diperlukan.
5. Buka execution log dan simpan PIN awal yang dihasilkan.
6. Deploy sebagai Web App sesuai kebutuhan akun Anda.
7. Masukkan URL Web App ke menu pengaturan database Lavi Growth.
8. Login menggunakan PIN awal, lalu ganti PIN dari menu Pengaturan.

Instalasi GAS lama yang masih memiliki `APP_PIN` plaintext akan dimigrasikan otomatis menjadi hash saat backend v9.0 pertama kali dijalankan. Tetap disarankan mengganti PIN lama sesudah upgrade.

## Supabase

Sejak v1.0.1, integrasi Supabase tidak melakukan CRUD tabel langsung dari browser.

### Model keamanan v1.0.1

Schema dalam `services/supabaseSql.ts`:

- mengaktifkan `pgcrypto`;
- menyimpan PIN sebagai bcrypt hash menggunakan `crypt()`;
- menyimpan data keluarga pada internal `lavi_family_store`;
- mengaktifkan RLS;
- mencabut akses tabel langsung dari `PUBLIC`, `anon`, dan `authenticated`;
- hanya memberikan hak `EXECUTE` untuk RPC yang diperlukan aplikasi;
- membatasi percobaan PIN gagal sementara untuk mengurangi brute force.

RPC browser yang tersedia:

- `lavi_healthcheck()`
- `lavi_check_pin(p_pin)`
- `lavi_pull(p_pin)`
- `lavi_push(p_pin, p_payload)`
- `lavi_delete(p_pin, p_type, p_id)`
- `lavi_update_pin(p_old_pin, p_new_pin)`
- `lavi_reset(p_pin)`

### Setup Supabase

1. Buat project Supabase milik sendiri.
2. Buka **SQL Editor**.
3. Salin dan jalankan seluruh `SUPABASE_SQL_SCHEMA` dari `services/supabaseSql.ts`.
4. Di Lavi Growth, masukkan Project URL dan anon/public key.
5. Jalankan tes koneksi dari aplikasi.
6. Tentukan PIN 6-12 digit ketika pairing pertama dilakukan.

`service_role` key **tidak boleh** berada di browser, source code frontend, repository, atau file backup.

### Upgrade dari schema v1.0.0

Schema v1.0.1 menggunakan model penyimpanan aman yang berbeda dan **tidak otomatis mengimpor row dari tabel legacy**. Sebelum mengganti schema/backend:

1. export backup JSON dari aplikasi lama;
2. pastikan file backup dapat dibaca;
3. pasang schema v1.0.1;
4. hubungkan aplikasi ke backend baru;
5. import backup JSON kembali melalui aplikasi.

Jangan menghapus backend lama sebelum backup dan restore berhasil diverifikasi.

## Queue sinkronisasi

Queue sinkronisasi disimpan di IndexedDB. Item gagal tidak lagi dibuang setelah retry maksimum. Item berubah menjadi status `failed` dan dapat dicoba ulang dari UI. Cloud pull ditahan selama masih ada queue pending/failed agar data lokal yang belum tersinkron tidak tertimpa.

Fallback sync periodik berjalan setiap 3 menit. Sinkronisasi juga dipicu ketika koneksi kembali online, window kembali fokus, atau ada perubahan data.

## Local-only

Untuk penggunaan pribadi pada satu perangkat, local-only adalah konfigurasi paling sederhana. State utama dan foto disimpan di IndexedDB. Tetap lakukan backup JSON secara berkala dan lindungi perangkat/browser Anda.
