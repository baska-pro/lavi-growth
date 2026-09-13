# Database & Sinkronisasi

Lavi Growth dapat berjalan tanpa backend. Backend hanya diperlukan untuk sinkronisasi lintas perangkat atau penyimpanan eksternal.

## Google Apps Script / Spreadsheet

Repository menyertakan `ScriptGAS.gs` sebagai backend yang dapat dideploy pada akun Google milik pengguna.

Prinsip penggunaan:

1. deploy salinan milik sendiri;
2. jangan menaruh credential Google di source code;
3. batasi akses Spreadsheet/Drive;
4. anggap URL web app sebagai endpoint publik, bukan secret;
5. audit validasi PIN, input, dan operasi penghapusan sebelum menggunakan data sensitif.

## Supabase

Repository juga memiliki implementasi Supabase client-side.

### Peringatan keamanan

Skema legacy `services/supabaseSql.ts` membuat kebijakan `anon` full-access agar sinkronisasi langsung dari browser dapat bekerja. Filter berdasarkan PIN di query **bukan** boundary keamanan database. Client anonim tetap berpotensi mengakses data yang tidak seharusnya bila RLS mengizinkan seluruh row.

Jangan gunakan konfigurasi tersebut untuk data kesehatan produksi.

### Pola yang direkomendasikan untuk produksi

Gunakan salah satu desain berikut:

- Supabase Auth + RLS berbasis `auth.uid()`;
- backend/Edge Function yang memverifikasi identitas dan hanya menggunakan service-role di server;
- sistem auth lain yang menghasilkan identitas server-verifiable sebelum query data kesehatan.

`service_role` key tidak boleh berada di browser.

## Local-only

Untuk penggunaan pribadi pada satu perangkat, local-only adalah konfigurasi paling sederhana karena tidak mengekspos database ke internet. Tetap lakukan backup dan lindungi perangkat.
