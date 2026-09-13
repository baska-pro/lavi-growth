# Arsitektur

## Ringkasan

Lavi Growth adalah single-page application React/TypeScript dengan pendekatan local-first dan adapter sinkronisasi opsional.

```text
Browser
├── React UI
├── Local state / browser storage
├── Offline sync queue
├── Export / import
└── Service adapters
    ├── Google Apps Script
    ├── Supabase (opsional; perlu hardening untuk produksi)
    └── Public reference APIs
```

## Frontend

- `App.tsx` mengorkestrasi state aplikasi dan navigasi utama.
- `components/` memuat layout, komponen reusable, dan feature views.
- `types.ts` memuat kontrak data TypeScript.
- `utils.ts` memuat helper penyimpanan, export, perhitungan, dan transformasi data.

## Data referensi

`data/` memuat data statis yang digunakan aplikasi seperti referensi medis, kutipan, dan daftar gejala. Konten referensi harus diperlakukan sebagai informasi umum, bukan diagnosis.

## Service layer

- `services/api.ts` memilih backend aktif dan mengelola queue sinkronisasi.
- `services/supabaseService.ts` mengakses Supabase.
- `services/externalApi.ts` mengakses layanan referensi publik.
- `ScriptGAS.gs` menyediakan implementasi Google Apps Script/Spreadsheet.

## Prinsip pengembangan

- Local-first dan graceful degradation.
- Tidak menyimpan secret di source code.
- Backend dapat diganti tanpa mengubah komponen UI utama.
- Perubahan format data harus menjaga kompatibilitas atau menyediakan migrasi.
- Fitur yang menyentuh data kesehatan harus dinilai dari sisi privacy dan threat model.
