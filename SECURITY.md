# Security Policy

## Supported version

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| < 1.0 | No |

## Melaporkan kerentanan

Jangan mempublikasikan credential, token, data kesehatan, PIN, URL backend privat, atau bukti eksploitasi sensitif di issue publik.

Gunakan **GitHub Private Vulnerability Reporting / Security Advisory** pada repository ini jika tersedia. Jika fitur tersebut tidak tersedia, hubungi pemilik repository melalui profil GitHub `baska-pro` tanpa menempelkan secret atau data pribadi di ruang publik.

Sertakan:

- versi/commit yang terdampak;
- langkah reproduksi minimal;
- dampak yang diamati;
- komponen terdampak;
- mitigasi sementara bila ada.

## Catatan penting tentang data kesehatan

Lavi Growth dapat menyimpan informasi kesehatan dan foto. Perlakukan seluruh data aplikasi sebagai data sensitif.

### Local storage

PIN aplikasi dan state lokal tidak boleh dianggap setara dengan secure enclave atau password manager. Keamanan lokal tetap bergantung pada keamanan perangkat, browser, akun OS, backup, dan akses fisik.

### Google Apps Script

Endpoint GAS yang dipublikasikan ke web harus dianggap sebagai endpoint internet. Jangan mengandalkan kerahasiaan URL sebagai mekanisme autentikasi. Gunakan deployment milik sendiri dan audit validasi input serta akses Spreadsheet/Drive.

### Supabase

Skema Supabase legacy di repository menggunakan role anonim untuk sinkronisasi langsung dari browser. Konfigurasi yang memberikan `anon` akses penuh dengan `USING (true)` / `WITH CHECK (true)` **tidak aman untuk data kesehatan produksi** dan tidak memberikan isolasi keamanan hanya karena query difilter menggunakan PIN.

Sebelum menggunakan Supabase dengan data nyata, ganti model tersebut dengan autentikasi yang terverifikasi dan RLS berbasis identitas (`auth.uid()`), backend/Edge Function yang dipercaya, atau mekanisme lain yang memastikan client anonim tidak dapat membaca seluruh tabel.

Jangan pernah menaruh Supabase `service_role` key di frontend.

## Secret hygiene

Repository tidak boleh berisi:

- API secret atau private key;
- password atau PIN pengguna nyata;
- Supabase `service_role` key;
- access token;
- credential Google;
- data kesehatan nyata untuk contoh/test.

Gunakan placeholder, fixture sintetis, atau konfigurasi runtime.
