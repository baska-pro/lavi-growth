# Contributing

Kontribusi berupa bug fix, dokumentasi, peningkatan aksesibilitas, performa, dan refactor dapat diajukan melalui pull request.

## Alur kerja

1. Buat branch dari `main`.
2. Lakukan perubahan sekecil dan sefokus mungkin.
3. Jalankan pemeriksaan lokal:

```bash
bun install
bun run check
```

4. Pastikan tidak ada secret, data pribadi, credential, atau data kesehatan nyata di commit.
5. Perbarui dokumentasi dan `CHANGELOG.md` bila perubahan berdampak ke pengguna.
6. Buat pull request dengan ringkasan dan cara pengujian.

## Gaya perubahan

- Pertahankan TypeScript strictness yang ada.
- Hindari menambahkan dependency bila fungsi dapat dicapai tanpa dependency baru.
- Jangan mengubah format data tersimpan tanpa strategi migrasi/fallback.
- Jangan melemahkan validasi keamanan backend.
- Jangan memperkenalkan konfigurasi yang membuka data kesehatan ke akses anonim.

## Lisensi kontribusi

Dengan mengirim kontribusi, Anda menyatakan memiliki hak untuk mengirimkan perubahan tersebut dan mengizinkan pemilik project mendistribusikannya sebagai bagian dari project di bawah lisensi repository ini.
