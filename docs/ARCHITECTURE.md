# Architecture

## Ringkasan

Lavi Growth adalah aplikasi web React/TypeScript dengan pola local-first. State utama disimpan pada browser dan dapat disinkronkan ke backend yang dipilih pengguna.

## Lapisan utama

```text
React UI
  ├─ App.tsx
  ├─ components/features/*
  └─ components/layout/*
        │
        ▼
Utilities & local state
  ├─ utils.ts
  └─ types.ts
        │
        ▼
Service layer
  ├─ services/api.ts
  ├─ services/supabaseService.ts
  └─ services/externalApi.ts
        │
        ├─ Google Apps Script / Google Sheets
        ├─ Supabase
        └─ Public data APIs
```

## Sinkronisasi

`services/api.ts` mengelola pemilihan backend, queue offline, pull/push, penghapusan, dan upload. Queue lokal mencegah operasi jaringan yang gagal langsung menghilangkan perubahan lokal.

## Backend GAS

`ScriptGAS.gs` menyediakan endpoint POST untuk sinkronisasi, penghapusan, upload foto, verifikasi PIN, perubahan PIN, dan reset data. Data utama disimpan di beberapa sheet terpisah.

## Backend Supabase

`services/supabaseService.ts` menggunakan Supabase JS dan memetakan model aplikasi ke tabel database.

## API eksternal

`services/externalApi.ts` memanfaatkan sumber publik untuk pencarian makanan, fasilitas kesehatan, informasi obat, dan Wikipedia. Kegagalan API eksternal dibuat non-fatal agar aplikasi tetap dapat digunakan.
