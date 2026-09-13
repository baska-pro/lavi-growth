# Setup Lavi Growth

## 1. Frontend

Persyaratan minimum:

- Node.js 20+
- npm 10+ atau Bun

```bash
npm install
npm run dev
```

Validasi sebelum deployment:

```bash
npm run typecheck
npm run build
```

## 2. Google Apps Script + Google Sheets

1. Buat Google Spreadsheet baru.
2. Buka **Extensions > Apps Script**.
3. Salin isi `ScriptGAS.gs` ke project Apps Script.
4. Jalankan `initialSetup()` sekali untuk membuat sheet dan folder yang dibutuhkan.
5. Ubah PIN awal sebelum menyimpan data nyata.
6. Deploy sebagai Web App sesuai kebutuhan akun Anda.
7. Masukkan URL Web App pada menu konfigurasi database Lavi Growth.

Jangan membagikan spreadsheet atau project Apps Script dengan akses lebih luas daripada yang diperlukan.

## 3. Supabase

1. Buat project Supabase.
2. Siapkan tabel menggunakan SQL schema yang tersedia melalui modul setup aplikasi.
3. Aktifkan kebijakan akses yang sesuai.
4. Masukkan Project URL dan anon/public key melalui menu konfigurasi database.
5. Jangan gunakan `service_role` key di browser.

## 4. Production

- Jalankan `npm run build`.
- Deploy folder `dist/` menggunakan static hosting pilihan Anda.
- Gunakan HTTPS.
- Uji sinkronisasi, ekspor, upload foto, pengingat, dan pemulihan koneksi sebelum dipakai dengan data nyata.
- Buat backup database secara berkala.

## 5. Catatan keamanan

PIN sederhana tidak boleh dianggap sebagai autentikasi kuat untuk deployment internet berskala besar. Untuk penggunaan publik/multi-user, tambahkan autentikasi dan authorization yang lebih kuat pada backend.
