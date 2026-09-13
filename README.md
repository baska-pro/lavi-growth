<div align="center">
  <img src="assets/banner.svg" alt="Lavi Growth" width="100%" />

  # Lavi Growth

  **Family health tracker yang local-first, responsif, dan dapat disinkronkan ke backend milik sendiri.**

  [![Version](https://img.shields.io/badge/version-1.0.0-059669?style=flat-square)](CHANGELOG.md)
  [![CI](https://img.shields.io/github/actions/workflow/status/baska-pro/lavi-growth/ci.yml?branch=main&style=flat-square&label=CI)](../../actions/workflows/ci.yml)
  [![License](https://img.shields.io/badge/license-BASKA--PRO%20Personal%20Use-334155?style=flat-square)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111827)](https://react.dev/)
</div>

## Tentang

Lavi Growth adalah aplikasi web untuk membantu pencatatan kesehatan keluarga dalam satu antarmuka. Aplikasi mendukung profil bayi, anak, dewasa, lansia, dan kehamilan; pencatatan metrik kesehatan; pengingat; jurnal; galeri; statistik; data menstruasi; serta backup dan sinkronisasi opsional.

Aplikasi dirancang **local-first**: data dapat digunakan dari browser tanpa akun. Sinkronisasi cloud bersifat opsional dan dikendalikan oleh konfigurasi backend pengguna.

> **Penting:** Lavi Growth bukan alat diagnosis dan bukan pengganti konsultasi dokter, bidan, apoteker, atau tenaga kesehatan profesional.

## Fitur utama

- Multi-profile keluarga: bayi, anak, dewasa, lansia, dan kehamilan.
- Catatan berat, tinggi, suhu, denyut jantung, tekanan darah, gula darah, lingkar tubuh, tidur, gejala, catatan, serta foto.
- Statistik, target kesehatan, galeri, jurnal, pengingat, imunisasi, milestone tumbuh-kembang, dan siklus menstruasi.
- Daily briefing dan notifikasi browser.
- Export/import backup JSON, export Excel, dan PDF.
- Mode gelap, tampilan mobile, dan dukungan offline-first queue.
- Backend default berbasis Google Apps Script/Spreadsheet yang dapat diganti pengguna.
- Integrasi Supabase tersedia untuk lingkungan yang dikontrol sendiri, dengan catatan keamanan pada [SECURITY.md](SECURITY.md).
- Referensi eksternal non-diagnostik melalui Open Food Facts, OpenStreetMap/Nominatim, OpenFDA, dan Wikipedia.

## Stack

| Area | Teknologi |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| UI | Tailwind CSS CDN, Framer Motion, Lucide React |
| Chart | Recharts |
| Export | jsPDF, jsPDF-AutoTable, html2canvas |
| Backend opsional | Google Apps Script / Supabase |
| Storage lokal | Web Storage / browser APIs |

## Menjalankan lokal

### Prasyarat

- Node.js 22+ **atau** Bun terbaru.
- Browser modern berbasis Chromium, Firefox, atau Safari.

### Bun

```bash
bun install
bun run dev
```

### npm

```bash
npm install
npm run dev
```

Buka URL lokal yang ditampilkan Vite.

## Pemeriksaan sebelum build

```bash
bun run check
```

Perintah tersebut menjalankan TypeScript type-check lalu production build. CI menjalankan pemeriksaan yang sama untuk push dan pull request.

## Build produksi

```bash
bun run build
```

Output produksi berada di folder `dist/`.

Panduan deployment tersedia di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Struktur repository

```text
.
├── .github/                 # CI, template issue/PR, CODEOWNERS, Dependabot
├── assets/                  # Banner dan aset dokumentasi
├── components/              # Komponen UI dan fitur
├── data/                    # Data referensi aplikasi
├── docs/                    # Panduan pengguna, arsitektur, deployment, keamanan backend
├── public/                  # Favicon, manifest, robots
├── services/                # Adapter backend dan external API
├── App.tsx                  # Orkestrasi aplikasi
├── ScriptGAS.gs             # Backend Google Apps Script
├── index.html               # Entry HTML
├── index.tsx                # React bootstrap
├── types.ts                 # Type definitions
├── utils.ts                 # Utility aplikasi
└── package.json             # Scripts, dependency, version
```

## Konfigurasi database

Lavi Growth dapat berjalan secara lokal tanpa backend. Untuk sinkronisasi lintas perangkat, gunakan backend milik sendiri dan baca [docs/DATABASES.md](docs/DATABASES.md) terlebih dahulu.

**Jangan menaruh secret, service-role key, password, token, atau kredensial pribadi ke repository.** Anon/public key Supabase bukan service-role key, tetapi skema keamanan tetap harus dikonfigurasi dengan benar.

## Privasi & keamanan

Data kesehatan dapat bersifat sangat sensitif. Sebelum menggunakan aplikasi dengan data nyata:

1. pahami penyimpanan browser yang digunakan;
2. gunakan perangkat dan browser yang terlindungi;
3. backup secara berkala;
4. jangan menggunakan konfigurasi database publik yang memberi akses anonim penuh;
5. tinjau [SECURITY.md](SECURITY.md) dan [docs/PRIVACY.md](docs/PRIVACY.md).

## Dokumentasi

- [Panduan pengguna](docs/USER_GUIDE.md)
- [Arsitektur](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Database & sinkronisasi](docs/DATABASES.md)
- [Privasi](docs/PRIVACY.md)
- [Security policy](SECURITY.md)
- [Panduan kontribusi](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Lisensi

Project ini menggunakan **BASKA-PRO Personal Use License v1.0**. Lihat [LICENSE](LICENSE) untuk ketentuan lengkap.

Copyright © 2026 Lathif Baska. All Rights Reserved.
