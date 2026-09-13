
import React, { useState } from 'react';
import { 
  Book, Heart, Activity, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, Calculator, Thermometer, Trash2,
  UserPlus, FilePlus, Calendar, CloudLightning, Smartphone, Baby, MapPin, ScanBarcode, Pill, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccordionItem: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}> = ({ title, icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 mb-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-emerald-500 dark:text-emerald-400">
            {icon}
          </div>
          <span className="font-semibold text-gray-800 dark:text-white text-sm md:text-base text-left">
            {title}
          </span>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30"
          >
            <div className="p-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const HelpGuideView: React.FC = () => {
  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
          <HelpCircle size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Panduan & Bantuan</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Cara kerja dan logika aplikasi Lavi Growth Tracker.</p>
        </div>
      </div>

      {/* --- BAGIAN 1: PANDUAN PENGGUNAAN (NEW) --- */}
      <div>
        <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3 ml-1">Panduan Penggunaan Fitur</h3>

        <AccordionItem title="Manajemen Profil Keluarga" icon={<UserPlus size={20} />}>
          <p>Aplikasi ini mendukung banyak profil (Ayah, Ibu, Anak, Kakek, Nenek) dalam satu aplikasi.</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><b>Membuat Profil Baru:</b> Buka menu samping (Sidebar), gulir ke bawah daftar nama, lalu klik tombol <b>+ Tambah Anggota</b>. Isi Nama, Tanggal Lahir (atau HPHT untuk kehamilan), Gender, dan Foto.</li>
            <li><b>Mengganti Profil Aktif:</b> Klik nama anggota keluarga di menu samping untuk berpindah dashboard.</li>
            <li><b>Mengedit/Menghapus:</b> Di menu samping, klik ikon <i>Pensil</i> untuk mengedit atau ikon <i>Sampah</i> untuk menghapus profil. Hati-hati, menghapus profil akan menghapus seluruh data kesehatannya.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Mencatat Data Kesehatan (Input)" icon={<FilePlus size={20} />}>
          <p>Fitur inti untuk merekam jejak medis harian.</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><b>Cara Input:</b> Tekan tombol <b>+</b> besar di menu bawah (Mobile) atau tombol "Catat Kesehatan" di Dashboard.</li>
            <li><b>Input Suara (Smart Voice):</b> Tekan tombol mikrofon besar di form, lalu ucapkan data Anda. <br/><i>Contoh: "Berat 60 tinggi 170 suhu 36"</i>. Aplikasi akan otomatis mengisi kolom yang sesuai.</li>
            <li><b>Foto:</b> Anda bisa melampirkan foto fisik (misal: ruam kulit, hasil lab, atau foto pertumbuhan anak) di setiap catatan.</li>
            <li><b>Gejala:</b> Pilih gejala dari daftar jika ada keluhan (misal: Demam, Batuk). Ini akan mengubah status di Dashboard menjadi "Sakit".</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Fitur Khusus Wanita (Siklus & Hamil)" icon={<Baby size={20} />}>
          <p>Untuk profil Wanita Dewasa, tersedia fitur pelacak siklus menstruasi dan kehamilan.</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><b>Mencatat Haid:</b> Klik kartu <b>Siklus/Droplet</b> di Dashboard. Klik "Konfirmasi Haid Dimulai" saat hari pertama haid.</li>
            <li><b>Mode Kehamilan:</b> Di menu Siklus, aktifkan "Mode Kehamilan". Anda akan diminta memasukkan tanggal HPHT (Hari Pertama Haid Terakhir).</li>
            <li><b>Memantau Janin:</b> Setelah mode hamil aktif, Dashboard akan menampilkan kartu "Janin". Klik untuk melihat perkembangan mingguan, grafik berat badan ibu, dan tips kesehatan.</li>
            <li><b>Kelahiran:</b> Saat bayi lahir, buka detail Kehamilan, pilih tab "Lahir", dan isi data bayi. Profil "Kandungan" akan otomatis berubah menjadi profil "Bayi" baru.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Jurnal Anak (Vaksin & Milestone)" icon={<Calendar size={20} />}>
          <p>Khusus untuk profil tipe <b>Bayi</b> dan <b>Anak</b>.</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><b>Imunisasi:</b> Buka tab <b>Jurnal</b>. Anda akan melihat jadwal vaksinasi sesuai rekomendasi IDAI (Umur 0-24 bulan). Klik nama vaksin untuk menandainya sudah diberikan.</li>
            <li><b>Milestone (Tumbuh Kembang):</b> Di tab Jurnal, pilih bagian "Milestone". Ceklis kemampuan yang sudah dikuasai anak (misal: "Mengangkat kepala").</li>
            <li><b>Berbagi Momen:</b> Klik ikon <i>Share</i> pada data vaksin/milestone untuk membuat kartu ucapan pencapaian yang bisa dibagikan ke media sosial.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Kamus Sehat (Wikipedia)" icon={<Book size={20} />}>
          <p>Cari informasi medis terpercaya dalam Bahasa Indonesia.</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>Buka menu <b>Kamus Sehat</b> di Sidebar atau Menu Cepat.</li>
            <li>Ketik nama penyakit, obat, atau istilah medis (Misal: "Diabetes", "Parasetamol").</li>
            <li>Klik hasil pencarian untuk membaca ringkasan dari Wikipedia.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Ensiklopedia Nutrisi & Scan Barcode" icon={<ScanBarcode size={20} />}>
          <p>Cek kandungan gizi makanan kemasan atau info vitamin.</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>Buka menu <b>Info Nutrisi</b> di Dashboard.</li>
            <li>Pilih tab <b>Cek Produk</b>.</li>
            <li><b>Scan Barcode:</b> Klik ikon Kamera, arahkan ke barcode makanan kemasan. Data gula, kalori, dan protein akan muncul (via OpenFoodFacts).</li>
            <li><b>Cari Manual:</b> Ketik nama produk jika scan tidak berhasil.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Pengingat Obat Pintar" icon={<Pill size={20} />}>
          <p>Jangan lewatkan jadwal minum obat.</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>Buka menu <b>Pengingat</b>.</li>
            <li>Saat mengetik nama obat, aplikasi akan memberikan saran otomatis (Autocomplete) dari database FDA.</li>
            <li>Klik tombol <b>Info</b> di samping obat yang sudah tersimpan untuk melihat detailnya di Wikipedia.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Faskes Terdekat" icon={<MapPin size={20} />}>
          <p>Cari Rumah Sakit atau Apotek dalam keadaan darurat.</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>Di Dashboard, klik kartu <b>Faskes Terdekat</b>.</li>
            <li>Izinkan akses lokasi (GPS).</li>
            <li>Pilih tipe: RS/Klinik atau Apotek.</li>
            <li>Klik tombol navigasi untuk membuka Google Maps menuju lokasi tersebut.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Sinkronisasi & Multi-Device" icon={<CloudLightning size={20} />}>
          <p>Agar data bisa diakses di HP Ayah dan HP Ibu secara bersamaan (Real-time).</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><b>PIN Keamanan:</b> Masuk ke menu <b>Pengaturan</b> (ikon Gear). Buat PIN baru jika belum ada. PIN ini adalah kunci untuk menghubungkan perangkat.</li>
            <li><b>Login di Perangkat Lain:</b> Di HP kedua, saat pertama kali buka, pilih tombol "Masuk / Sync". Masukkan PIN yang sama.</li>
            <li><b>Indikator Sync:</b> Ikon Awan di pojok kanan atas menunjukkan status. Jika sedang memutar, berarti sedang sinkronisasi. Jika <i>Offline</i>, data disimpan di HP dan akan dikirim saat ada internet.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Opsi Database: Spreadsheet (GAS) atau Supabase" icon={<ShieldCheck size={20} />}>
          <p>Lavi Health Tracker menyediakan 2 pilihan backend database yang dapat Anda pilih di menu <b>Pengaturan &gt; Atur / Ganti Database</b>:</p>
          <div className="space-y-3 mt-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-xs">1. Google Spreadsheet (via Google Apps Script / GAS)</span>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                Data disimpan langsung di akun Google Drive pribadi Anda dalam bentuk baris spreadsheet. 100% gratis, mudah dibuka di Excel/Sheets, dan Anda dapat menyalin kode <b>ScriptGAS.gs</b> langsung dari aplikasi.
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <span className="font-bold text-indigo-800 dark:text-indigo-300 block text-xs">2. Supabase (PostgreSQL Database)</span>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                Pilihan database SQL modern dengan performa tinggi dan latensi rendah. Anda cukup membuat proyek gratis di <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-bold text-indigo-600">supabase.com</a>, menjalankan skrip SQL yang disediakan aplikasi melalui tombol <b>Salin Skrip SQL</b>, lalu memasukkan URL dan Anon Key.
              </p>
            </div>
            <p className="text-xs text-gray-500">
              * Aplikasi juga menyediakan fitur <b>"Simpan & Sinkronkan Data Lokal ke Database Baru"</b> untuk memindahkan seluruh data dari HP Anda ke database yang baru dipilih secara otomatis!
            </p>
          </div>
        </AccordionItem>

        <AccordionItem title="Tips Aplikasi PWA (Install)" icon={<Smartphone size={20} />}>
          <p>Aplikasi ini berbasis web tapi bisa diinstal seperti aplikasi native (tanpa PlayStore).</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><b>Android (Chrome):</b> Buka menu browser (titik tiga) {'>'} Pilih "Tambahkan ke Layar Utama" (Add to Home Screen) atau "Install App".</li>
            <li><b>iOS (Safari):</b> Tekan tombol Share {'>'} Pilih "Add to Home Screen".</li>
            <li>Aplikasi akan muncul di menu HP Anda dan bisa berjalan layar penuh tanpa address bar browser.</li>
          </ul>
        </AccordionItem>
      </div>

      {/* --- BAGIAN 2: LOGIKA SISTEM (EXISTING) --- */}
      <div className="mt-6">
        <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3 ml-1">Logika Sistem & Perhitungan</h3>
        
        <AccordionItem title="Kategori Usia & Fase Pertumbuhan" icon={<Clock size={20} />}>
          <p>Aplikasi secara otomatis mengelompokkan profil berdasarkan tanggal lahir. Berikut adalah rentang usia yang digunakan:</p>
          <div className="space-y-3 mt-3">
              <div className="border-l-2 border-pink-400 pl-3">
                  <span className="font-bold text-gray-800 dark:text-white block">🤰 Kandungan (Janin)</span>
                  <span className="text-xs text-gray-500 font-mono">Usia Kehamilan 0 - 40 Minggu</span>
                  <p className="text-[10px] text-gray-400 mt-1">Dihitung sejak HPHT (Hari Pertama Haid Terakhir) sampai kelahiran.</p>
              </div>
              <div className="border-l-2 border-rose-400 pl-3">
                  <span className="font-bold text-gray-800 dark:text-white block">👶 Bayi (Infant & Toddler)</span>
                  <span className="text-xs text-gray-500 font-mono">Usia 0 - 2 Tahun (0 - 24 Bulan)</span>
                  <p className="text-[10px] text-gray-400 mt-1">Mencakup fase Neonatus (0-28 hari), Bayi (1-12 bulan), dan Batita awal.</p>
              </div>
              <div className="border-l-2 border-teal-400 pl-3">
                  <span className="font-bold text-gray-800 dark:text-white block">👦 Anak (Child & Teen)</span>
                  <span className="text-xs text-gray-500 font-mono">Usia 2 - 18 Tahun</span>
                  <ul className="list-disc pl-3 mt-1 text-[10px] text-gray-400">
                      <li><b>Batita Akhir & Balita:</b> 2 - 5 Tahun</li>
                      <li><b>Usia Sekolah:</b> 6 - 12 Tahun</li>
                      <li><b>Remaja (Adolesen):</b> 12 - 18 Tahun</li>
                  </ul>
              </div>
              <div className="border-l-2 border-indigo-400 pl-3">
                  <span className="font-bold text-gray-800 dark:text-white block">🧑 Dewasa (Adult)</span>
                  <span className="text-xs text-gray-500 font-mono">Usia 18 - 60 Tahun</span>
                  <p className="text-[10px] text-gray-400 mt-1">Usia produktif. Termasuk fase Dewasa Muda (18-40) dan Dewasa Madya (41-60).</p>
              </div>
              <div className="border-l-2 border-amber-400 pl-3">
                  <span className="font-bold text-gray-800 dark:text-white block">👴 Orang Tua (Senior)</span>
                  <span className="text-xs text-gray-500 font-mono">Usia 60 Tahun ke atas</span>
                  <p className="text-[10px] text-gray-400 mt-1">Fase Lanjut Usia (Lansia).</p>
              </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Indikator Kondisi (Sakit vs Sehat)" icon={<Thermometer size={20} />}>
          <p>Status kondisi kesehatan di Dashboard ditentukan secara otomatis berdasarkan data terakhir yang Anda masukkan.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><b className="text-emerald-600">Sehat:</b> Jika pada data input terakhir, Anda tidak memilih gejala (keluhan) apapun.</li>
            <li><b className="text-red-600">Sakit:</b> Jika pada input terakhir terdapat 1 atau lebih gejala yang dipilih (misal: Demam, Batuk).</li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">*Pastikan selalu mengupdate data saat kondisi berubah agar status akurat.</p>
        </AccordionItem>

        <AccordionItem title="Perhitungan BMI (Dewasa)" icon={<Calculator size={20} />}>
          <p>Body Mass Index (BMI) atau Indeks Massa Tubuh (IMT) dihitung untuk profil Dewasa dengan rumus:</p>
          <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded text-center font-mono text-xs my-2">
            Berat (kg) / (Tinggi (m) x Tinggi (m))
          </div>
          <p>Kategori yang digunakan:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
            <li><b>{'< 18.5'}</b>: Kurus (Underweight)</li>
            <li><b>18.5 - 24.9</b>: Normal (Ideal)</li>
            <li><b>25 - 29.9</b>: Berat Berlebih (Overweight)</li>
            <li><b>{'> 30'}</b>: Obesitas</li>
          </ul>
          <p className="mt-2 text-xs italic">*Jika tinggi badan di bawah 100cm, kalkulator tidak akan menghitung BMI untuk mencegah kesalahan data (terutama jika lupa update tinggi badan dari data bayi).</p>
        </AccordionItem>

        <AccordionItem title="Status Pertumbuhan Anak (WHO)" icon={<Activity size={20} />}>
          <p>Untuk Bayi dan Anak (0-5 tahun), aplikasi menggunakan standar <b>WHO Child Growth Standards</b>.</p>
          <p className="mt-2">Sistem membandingkan berat badan anak dengan median berat badan anak seusianya (berdasarkan bulan) dan jenis kelaminnya.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
            <li><b>Gizi Baik:</b> Berat badan berada di rentang wajar (antara persentil ke-3 dan ke-97).</li>
            <li><b>Gizi Kurang:</b> Di bawah persentil ke-3.</li>
            <li><b>Gizi Lebih:</b> Di atas persentil ke-97.</li>
          </ul>
        </AccordionItem>
      </div>

      {/* --- BAGIAN 3: TENTANG APLIKASI (EXISTING) --- */}
      <div className="mt-6">
        <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3 ml-1">Tentang Aplikasi</h3>
        
        <AccordionItem title="Fitur Utama" icon={<Book size={20} />}>
          <ul className="space-y-2">
            <li>📊 <b>Dashboard:</b> Ringkasan cepat kondisi seluruh anggota keluarga.</li>
            <li>📝 <b>Jurnal & Vaksin:</b> Mencatat riwayat imunisasi dan milestone perkembangan anak.</li>
            <li>📈 <b>Statistik:</b> Melihat grafik perkembangan berat badan dan tanda vital lainnya.</li>
            <li>🔔 <b>Pengingat:</b> Alarm untuk minum obat atau jadwal kontrol.</li>
            <li>📷 <b>Galeri:</b> Menyimpan foto perkembangan fisik secara aman.</li>
            <li>🚺 <b>Siklus:</b> Pelacak haid dan mode kehamilan untuk wanita dewasa.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Privasi & Keamanan Data" icon={<ShieldCheck size={20} />}>
          <p>Aplikasi ini didesain dengan prinsip <b>Privacy-First</b>.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Data utama disimpan secara <b>Lokal</b> di memori browser HP Anda.</li>
            <li>Jika Anda memasukkan <b>PIN</b>, data akan di-backup (sinkronisasi) ke Cloud (Google Sheet pribadi developer) agar bisa diakses dari perangkat lain.</li>
            <li>Tanpa PIN, data 100% offline dan hilang jika *cache* browser dihapus.</li>
            <li>Gunakan fitur <b>Backup (JSON)</b> di menu Pengaturan untuk mengamankan data Anda sendiri secara manual.</li>
          </ul>
        </AccordionItem>

        <AccordionItem title="Cara Menghapus Data" icon={<Trash2 size={20} />}>
          <p>Anda memegang kendali penuh atas data Anda.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><b>Hapus per Item:</b> Tekan ikon sampah pada detail record.</li>
            <li><b>Hapus Profil:</b> Tekan ikon sampah pada list anggota di menu samping (Sidebar).</li>
            <li><b>Reset Total:</b> Masuk ke menu Pengaturan, tekan dan tahan bagian "Informasi Aplikasi" selama 3 detik untuk memunculkan menu Reset Admin (Hapus semua data lokal).</li>
          </ul>
        </AccordionItem>
      </div>

      <div className="text-center text-xs text-gray-400 mt-8">
        <p>Lavi Growth Tracker v1.2.0</p>
        <p>Dibuat dengan ❤️ untuk keluarga sehat.</p>
      </div>

    </div>
  );
};
