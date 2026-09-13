# Lavi Growth

Aplikasi pemantauan kesehatan dan pertumbuhan keluarga berbasis React + TypeScript. Lavi Growth dirancang untuk pencatatan multi-profil, grafik pertumbuhan, jurnal kesehatan, pengingat, kehamilan, siklus menstruasi, galeri, statistik, serta sinkronisasi data melalui Google Apps Script atau Supabase.

> **Status:** v1.0.0 — siap untuk penggunaan dan pengembangan lebih lanjut.

## Fitur utama

- Multi-profil untuk bayi, anak, dewasa, lansia, dan kehamilan.
- Pencatatan berat, tinggi, suhu, tekanan darah, gula darah, lingkar tubuh, tidur, gejala, catatan, dan foto.
- Dashboard, statistik, target kesehatan, jurnal, pengingat, vaksinasi, dan milestone.
- Mode kehamilan dan pencatatan siklus menstruasi.
- Kamus kesehatan, artikel edukasi, pencarian fasilitas kesehatan, dan data nutrisi publik.
- Ekspor data JSON, spreadsheet, gambar, dan PDF.
- Penyimpanan lokal serta antrean sinkronisasi ketika koneksi tersedia kembali.
- Pilihan backend Google Apps Script/Google Sheets atau Supabase.
- Dukungan mode gelap dan tampilan responsif.

## Teknologi

- React 19
- TypeScript
- Vite
- Supabase JS
- Recharts
- Framer Motion
- jsPDF + AutoTable
- Google Apps Script

## Menjalankan secara lokal

### Persyaratan

- Node.js 20 LTS atau lebih baru
- npm 10+ atau Bun

### Instalasi

```bash
git clone https://github.com/baska-pro/lavi-growth.git
cd lavi-growth
npm install
npm run dev
```

Aplikasi pengembangan akan tersedia pada alamat yang ditampilkan oleh Vite.

## Perintah proyek

```bash
npm run dev       # development server
npm run build     # production build
npm run preview   # preview production build
npm run typecheck # TypeScript validation
npm run lint      # alias untuk typecheck
```

## Konfigurasi database

Lavi Growth mendukung dua backend:

1. **Google Apps Script + Google Sheets** — gunakan `ScriptGAS.gs` sebagai backend spreadsheet.
2. **Supabase** — gunakan SQL yang tersedia pada aplikasi/layanan proyek dan masukkan URL serta anon key melalui menu konfigurasi database.

Untuk deployment publik, jangan menggunakan PIN default. Ubah PIN backend segera setelah instalasi dan batasi akses database sesuai kebutuhan.

Panduan lebih rinci tersedia di [`docs/SETUP.md`](docs/SETUP.md).

## Struktur utama

```text
.
├── components/           # komponen UI dan modul fitur
├── data/                 # data statis aplikasi
├── services/             # integrasi backend dan API eksternal
├── docs/                 # dokumentasi proyek
├── assets/               # aset dokumentasi/repository
├── ScriptGAS.gs          # backend Google Apps Script
├── App.tsx               # aplikasi utama
├── index.tsx             # entry point React
├── index.html            # dokumen HTML utama
├── types.ts              # tipe data TypeScript
└── utils.ts              # utilitas aplikasi
```

## Keamanan dan privasi

Repo ini dapat memproses data kesehatan pribadi. Jangan menyimpan PIN, API key privat, service-role key, isi database, atau data pengguna nyata di repository.

Untuk laporan kerentanan, lihat [`SECURITY.md`](SECURITY.md).

## Batasan medis

Lavi Growth adalah alat pencatatan dan informasi. Aplikasi ini bukan pengganti diagnosis, konsultasi, atau keputusan medis dari tenaga kesehatan profesional.

## Kontribusi

Panduan kontribusi tersedia di [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Lisensi

Proyek ini menggunakan **BASKA-PRO Personal Use License v1.0**. Penggunaan pribadi dan non-komersial diperbolehkan sesuai ketentuan pada [`LICENSE`](LICENSE). Distribusi ulang dan penggunaan komersial memerlukan izin tertulis dari pemegang hak cipta.

## Pemilik

**BASKA-PRO** — https://github.com/baska-pro
