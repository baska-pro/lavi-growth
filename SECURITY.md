# Security Policy

## Supported version

| Version | Supported |
| --- | --- |
| 1.0.1+ | Yes |
| 1.0.0 | Upgrade recommended |
| < 1.0 | No |

## Melaporkan kerentanan

Jangan mempublikasikan credential, token, data kesehatan, PIN, URL backend privat, atau bukti eksploitasi sensitif di issue publik.

Gunakan **GitHub Private Vulnerability Reporting / Security Advisory** pada repository ini jika tersedia. Jika fitur tersebut tidak tersedia, hubungi pemilik repository melalui profil GitHub `baska-pro` tanpa menempelkan secret atau data pribadi di ruang publik.

Sertakan versi/commit terdampak, langkah reproduksi minimal, dampak, komponen terdampak, dan mitigasi sementara bila ada.

## Catatan penting tentang data kesehatan

Lavi Growth dapat menyimpan informasi kesehatan dan foto. Perlakukan seluruh data aplikasi sebagai data sensitif.

### Penyimpanan lokal

Sejak v1.0.1, state utama, foto, dan queue sinkronisasi disimpan di **IndexedDB**. localStorage hanya digunakan untuk konfigurasi ringan, cache counter kecil, dan migrasi data versi lama. IndexedDB tetap bukan secure enclave atau password manager; keamanan lokal tetap bergantung pada keamanan perangkat, browser, akun OS, backup, dan akses fisik.

### Google Apps Script

Backend GAS v9.0 menyimpan hash PIN (SHA-256 + salt acak), membuat PIN awal acak, membatasi percobaan PIN, dan mewajibkan PIN baru 6-12 digit. Endpoint Web App tetap merupakan endpoint internet: jangan mengandalkan kerahasiaan URL sebagai mekanisme keamanan.

Setelah menjalankan `initialSetup()`, simpan PIN awal yang muncul di execution log dan segera ganti PIN tersebut dari aplikasi.

### Supabase

Schema v1.0.1 tidak memberikan `SELECT`, `INSERT`, `UPDATE`, atau `DELETE` langsung kepada role `anon` maupun `authenticated` pada tabel data internal. Browser hanya dapat memanggil RPC yang dibatasi:

- `lavi_healthcheck`
- `lavi_check_pin`
- `lavi_pull`
- `lavi_push`
- `lavi_delete`
- `lavi_update_pin`
- `lavi_reset`

PIN disimpan dengan bcrypt (`pgcrypto crypt()`), bukan plaintext. Percobaan PIN yang gagal dibatasi sementara untuk mengurangi brute force. RLS tetap diaktifkan tanpa kebijakan akses tabel langsung.

Anon/public key Supabase boleh berada di frontend; **service_role key tidak boleh pernah berada di frontend atau repository**.

> Pengguna schema Supabase lama v1.0.0 harus menjalankan schema SQL terbaru sebelum memakai backend tersebut dengan data sensitif. Backup data terlebih dahulu sebelum migrasi backend.

## PIN

- PIN baru wajib 6-12 digit.
- Jangan memakai tanggal lahir, nomor telepon, `123456`, atau pola mudah ditebak.
- Jangan memasukkan PIN nyata ke issue, screenshot publik, repository, atau contoh konfigurasi.
- File recovery PIN yang diunduh pengguna berisi PIN dalam bentuk terbaca; simpan file tersebut di lokasi yang terlindungi.

## Secret hygiene

Repository tidak boleh berisi API secret/private key, password atau PIN pengguna nyata, Supabase `service_role` key, access token, credential Google, atau data kesehatan nyata untuk contoh/test.

Gunakan placeholder, fixture sintetis, atau konfigurasi runtime.
