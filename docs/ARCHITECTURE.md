# Arsitektur

## Ringkasan

Lavi Growth adalah single-page application React/TypeScript dengan pendekatan local-first dan adapter sinkronisasi opsional.

```text
Browser
├── React UI
├── IndexedDB
│   ├── state aplikasi + foto
│   └── durable sync queue
├── Web Storage
│   └── konfigurasi ringan / cache counter / migrasi legacy
├── Service Worker
│   ├── offline app shell
│   └── browser notification delivery
├── Export / import backup
└── Service adapters
    ├── Google Apps Script v9
    ├── Supabase secure RPC
    └── Public reference APIs
```

## Frontend

- `index.tsx` melakukan hydration state IndexedDB sebelum React dirender dan mendaftarkan service worker.
- `App.tsx` mengorkestrasi state, navigasi, reminder, backup/restore, dan siklus sinkronisasi.
- `components/` memuat layout, komponen reusable, dan feature views.
- `types.ts` memuat kontrak data TypeScript.
- `utils.ts` memuat helper persistence, export, perhitungan, dan transformasi data.

## Penyimpanan lokal

`services/localDb.ts` menyediakan IndexedDB stores untuk state dan sync queue. Instalasi lama dengan state/queue di localStorage dimigrasikan saat aplikasi dijalankan.

Queue mempertahankan item yang gagal sebagai `failed` dan menyediakan retry manual. Cloud pull tidak dijalankan ketika masih ada operasi pending/failed sehingga local write yang belum terkirim tidak tertimpa oleh snapshot cloud lama.

## Service layer

- `services/api.ts` memilih backend aktif dan mengelola durable sync queue.
- `services/supabaseService.ts` hanya memanggil RPC Supabase yang terproteksi.
- `services/supabaseSql.ts` mendefinisikan schema, PIN hash, RLS, revoke direct table access, dan RPC server-side.
- `services/externalApi.ts` mengakses layanan referensi publik.
- `ScriptGAS.gs` menyediakan implementasi Google Apps Script/Spreadsheet dengan hashed PIN dan rate limit.

## Reminder & PWA

Reminder tanggal tertentu dan berulang diperiksa oleh aplikasi dengan deduplikasi per menit. Service worker digunakan untuk cache app shell dan delivery browser notification. Browser tidak menjamin aplikasi web dapat dibangunkan pada waktu arbitrer setelah seluruh proses browser dihentikan; reminder yang wajib tetap berjalan saat aplikasi benar-benar tertutup memerlukan layanan push/server-side terpisah.

## Data referensi

`data/` memuat data statis yang digunakan aplikasi seperti referensi medis, kutipan, dan daftar gejala. Konten referensi harus diperlakukan sebagai informasi umum, bukan diagnosis.

## Prinsip pengembangan

- Local-first dan graceful degradation.
- Tidak menyimpan secret di source code.
- Backend dapat diganti tanpa mengubah komponen UI utama.
- Perubahan format data harus menjaga kompatibilitas atau menyediakan migrasi.
- Fitur yang menyentuh data kesehatan harus dinilai dari sisi privacy, integritas data, dan threat model.
