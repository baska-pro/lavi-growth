# Release Checklist

## Quality

- [ ] `bun install --frozen-lockfile`
- [ ] `bun run typecheck`
- [ ] `bun run build`
- [ ] Uji tampilan mobile dan desktop
- [ ] Uji export/import backup
- [ ] Uji mode offline/local-only

## Security & privacy

- [ ] Tidak ada secret, token, credential, PIN nyata, atau data kesehatan nyata
- [ ] Backend default bukan endpoint pribadi yang tidak dimaksudkan untuk publik
- [ ] RLS/database policy ditinjau bila backend cloud digunakan
- [ ] Screenshot menggunakan data sintetis

## Repository

- [ ] `CHANGELOG.md` diperbarui
- [ ] Versi di `package.json` benar
- [ ] README sesuai fitur aktual
- [ ] CI hijau
- [ ] Tag mengikuti format `vX.Y.Z`
- [ ] Release notes menjelaskan perubahan dan breaking change
