# Contributing to Lavi Growth

Terima kasih atas minat untuk berkontribusi.

## Alur kontribusi

1. Buat branch dari `main`.
2. Gunakan nama branch yang jelas, misalnya `fix/...`, `feat/...`, atau `docs/...`.
3. Jalankan validasi lokal sebelum commit:

```bash
npm install
npm run typecheck
npm run build
```

4. Buat commit dengan pesan singkat dan deskriptif.
5. Buka pull request dan jelaskan perubahan, alasan, serta dampaknya.

## Standar perubahan

- Pertahankan kompatibilitas TypeScript.
- Jangan commit data kesehatan nyata, PIN, token, key privat, atau kredensial.
- Jangan mengubah struktur penyimpanan tanpa menjelaskan migrasi data.
- Perubahan yang memengaruhi kalkulasi kesehatan harus disertai sumber dan batasan yang jelas.
- Hindari dependency baru jika fungsi dapat dicapai dengan dependency yang sudah tersedia.

## Pelaporan bug

Gunakan template bug report dan sertakan langkah reproduksi, lingkungan, hasil yang diharapkan, serta hasil aktual.

## Lisensi kontribusi

Dengan mengirim kontribusi, Anda menyetujui bahwa kontribusi tersebut tunduk pada lisensi repository ini.
