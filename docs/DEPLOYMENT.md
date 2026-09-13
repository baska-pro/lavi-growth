# Deployment

## Build

```bash
bun install
bun run check
```

Folder produksi: `dist/`.

## Vercel

Untuk project Vite standar:

- Framework preset: **Vite**
- Install command: `bun install`
- Build command: `bun run build`
- Output directory: `dist`

Repository tidak memerlukan secret untuk build frontend standar.

## Netlify

- Build command: `bun run build`
- Publish directory: `dist`

## Static hosting lain

Upload isi `dist/` ke hosting statis yang mendukung HTTPS.

## Checklist sebelum produksi

- CI hijau.
- Tidak ada secret/kredensial/data kesehatan nyata di repository.
- Backend milik sendiri sudah diuji.
- HTTPS aktif.
- Kebijakan akses database sudah diaudit.
- Backup dan restore sudah diuji.
- Link privacy/security tersedia bagi pengguna yang relevan.

## Backend

Frontend dapat digunakan tanpa backend. Bila sinkronisasi diaktifkan, ikuti [DATABASES.md](DATABASES.md) dan [../SECURITY.md](../SECURITY.md).
