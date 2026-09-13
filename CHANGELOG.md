# Changelog

Semua perubahan penting pada project ini didokumentasikan di file ini.

Format mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) dan versi menggunakan Semantic Versioning.

## [1.0.1] - 2026-09-13

### Security

- Supabase tidak lagi memberikan akses tabel langsung kepada role `anon`/browser.
- Akses Supabase dipindahkan ke RPC `SECURITY DEFINER` dengan PIN yang disimpan sebagai bcrypt hash.
- Ditambahkan rate limit percobaan PIN Supabase dan Google Apps Script.
- Google Apps Script v9.0 tidak lagi memiliki PIN default tetap; PIN awal dibuat acak dan server menyimpan hash PIN.
- PIN baru wajib berupa 6-12 digit dan bypass reset `0000` dihapus.

### Fixed

- Queue sinkronisasi tidak lagi membuang item setelah retry gagal; item dipertahankan sebagai failed queue dan dapat dicoba ulang.
- Cloud pull tidak lagi menimpa data lokal selama masih ada queue pending/failed.
- Reminder dengan tanggal tertentu sekarang benar-benar dipicu pada tanggal yang dipilih.
- Kebocoran interval reminder yang dapat menyebabkan notifikasi ganda diperbaiki.
- Restore backup cloud sekarang menyertakan target, reminder, dan siklus menstruasi.
- Hapus profil sekarang membersihkan record, vaksin, milestone, target, reminder, dan siklus terkait di state lokal.
- Edit reminder tidak lagi otomatis mengaktifkan kembali reminder yang sebelumnya nonaktif.

### Changed

- State utama, foto, dan queue sync dipindahkan dari localStorage ke IndexedDB.
- Backup JSON memakai format terversi (`lavi-growth-backup`, version 2) dan tidak menyertakan PIN atau konfigurasi database.
- Interval fallback auto-sync diubah dari 10 detik menjadi 3 menit; event online/focus dan perubahan data tetap memicu sync segera.
- ID generator menggunakan `crypto.randomUUID()` bila tersedia.

### Added

- Service worker untuk cache PWA/offline shell dan notifikasi reminder.
- Status queue gagal dan aksi retry dari UI.
- Migrasi otomatis state/queue lama dari localStorage ke IndexedDB.

## [1.0.0] - 2026-09-13

### Added

- Struktur repository siap publikasi.
- CI untuk TypeScript type-check dan production build.
- Dokumentasi arsitektur, deployment, database, privasi, dan penggunaan.
- Template issue, pull request, CODEOWNERS, dan konfigurasi Dependabot.
- Banner repository, favicon, web manifest, dan robots.txt.
- Security policy dan panduan kontribusi.

### Changed

- Identitas package distandarkan menjadi `lavi-growth`.
- Metadata HTML dan SEO dibersihkan dan disesuaikan dengan fungsi aplikasi.
- Dokumentasi lama dipindahkan ke struktur `docs/`.
- `.gitignore` diperketat untuk environment file, cache, deployment state, dan file temporer.
- Backend Google Apps Script tidak lagi menggunakan endpoint deployment yang tertanam di source; URL sinkronisasi harus dikonfigurasi oleh pengguna.
- Operasi sinkronisasi GAS sekarang berhenti dengan aman ketika endpoint belum dikonfigurasi.

### Removed

- Metadata dan dokumentasi bootstrap yang tidak terkait dengan fungsi inti aplikasi.
- URL backend Google Apps Script aktif dari source publik.

## [0.1.0] - 2026-09-13

### Added

- Initial repository import.
