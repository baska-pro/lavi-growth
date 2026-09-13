
// Data Referensi Medis (Statis)

// 1. Jadwal Imunisasi (Berdasarkan Rekomendasi IDAI 2023)
export const VACCINE_SCHEDULE = [
    { ageMonth: 0, vaccines: ["Hepatitis B (HB-0)", "Polio Oral 0", "BCG"] },
    { ageMonth: 2, vaccines: ["DTP-HB-Hib 1 (Pentabio)", "Polio Oral 1", "PCV 1", "Rotavirus 1"] },
    { ageMonth: 3, vaccines: ["DTP-HB-Hib 2", "Polio Oral 2", "PCV 2", "Rotavirus 2"] },
    { ageMonth: 4, vaccines: ["DTP-HB-Hib 3", "Polio Oral 3", "Polio Suntik (IPV)", "Rotavirus 3 (Pentavalent)"] },
    { ageMonth: 6, vaccines: ["Influenza (Mulai umur 6 bln, ulang tiap tahun)"] },
    { ageMonth: 9, vaccines: ["Campak-Rubella (MR) / MMR", "JE (Area Endemis)"] },
    { ageMonth: 12, vaccines: ["PCV 3", "Varisela 1", "Hepatitis A 1"] },
    { ageMonth: 18, vaccines: ["DTP-HB-Hib 4 (Booster)", "Campak-Rubella (MR) 2 / MMR 2", "Polio Oral 4", "Hepatitis A 2 (Interval 6-12 bln dari Hep A 1)"] },
    { ageMonth: 24, vaccines: ["Tifoid (Ulang tiap 3 tahun)"] },
];

// 2. Milestone Perkembangan (Expanded 0-60 Months)
export const MILESTONES_DATA = [
    // USIA 1 BULAN
    { id: 101, ageMonth: 1, text: "Menatap wajah orang tua / pengasuh", category: "Sosial" },
    { id: 102, ageMonth: 1, text: "Bereaksi terhadap bunyi lonceng/suara keras", category: "Pendengaran" },
    { id: 103, ageMonth: 1, text: "Menggerakkan tangan dan kaki secara aktif", category: "Motorik Kasar" },

    // USIA 2 BULAN
    { id: 201, ageMonth: 2, text: "Tersenyum sosial (membalas senyuman)", category: "Sosial" },
    { id: 202, ageMonth: 2, text: "Bersuara 'ooh' atau 'aah' (Coos)", category: "Bahasa" },
    { id: 203, ageMonth: 2, text: "Mengangkat kepala sebentar saat tengkurap", category: "Motorik Kasar" },

    // USIA 3 BULAN
    { id: 301, ageMonth: 3, text: "Mengangkat kepala tegak saat tengkurap", category: "Motorik Kasar" },
    { id: 302, ageMonth: 3, text: "Tertawa keras / Berteriak", category: "Bahasa" },
    { id: 303, ageMonth: 3, text: "Memegang mainan yang ditaruh di tangannya", category: "Motorik Halus" },

    // USIA 4 BULAN
    { id: 401, ageMonth: 4, text: "Berguling dari tengkurap ke telentang", category: "Motorik Kasar" },
    { id: 402, ageMonth: 4, text: "Meraih benda yang menarik perhatiannya", category: "Motorik Halus" },
    { id: 403, ageMonth: 4, text: "Menoleh ke sumber suara", category: "Pendengaran" },

    // USIA 6 BULAN
    { id: 601, ageMonth: 6, text: "Duduk dengan bantuan / sanggahan", category: "Motorik Kasar" },
    { id: 602, ageMonth: 6, text: "Memasukkan benda ke mulut", category: "Kognitif" },
    { id: 603, ageMonth: 6, text: "Memindahkan benda dari satu tangan ke tangan lain", category: "Motorik Halus" },
    { id: 604, ageMonth: 6, text: "Mengenali wajah familiar vs orang asing", category: "Sosial" },

    // USIA 9 BULAN
    { id: 901, ageMonth: 9, text: "Duduk sendiri tanpa disangga", category: "Motorik Kasar" },
    { id: 902, ageMonth: 9, text: "Merangkak / Mengesot", category: "Motorik Kasar" },
    { id: 903, ageMonth: 9, text: "Mengambil benda kecil dengan ibu jari & telunjuk (menjimpit)", category: "Motorik Halus" },
    { id: 904, ageMonth: 9, text: "Mengucapkan 'ma-ma', 'da-da' (babling)", category: "Bahasa" },
    { id: 905, ageMonth: 9, text: "Bermain ciluk-ba", category: "Sosial" },

    // USIA 12 BULAN (1 TAHUN)
    { id: 1201, ageMonth: 12, text: "Berdiri sendiri tanpa berpegangan", category: "Motorik Kasar" },
    { id: 1202, ageMonth: 12, text: "Berjalan dititah atau merambat", category: "Motorik Kasar" },
    { id: 1203, ageMonth: 12, text: "Melambaikan tangan (dadah)", category: "Sosial" },
    { id: 1204, ageMonth: 12, text: "Mengerti perintah sederhana 'jangan', 'ayo'", category: "Bahasa" },
    { id: 1205, ageMonth: 12, text: "Memasukkan kubus ke dalam kotak", category: "Motorik Halus" },

    // USIA 15 BULAN
    { id: 1501, ageMonth: 15, text: "Berjalan sendiri dengan lancar", category: "Motorik Kasar" },
    { id: 1502, ageMonth: 15, text: "Minum dari gelas sendiri", category: "Kemandirian" },
    { id: 1503, ageMonth: 15, text: "Mengucapkan 3-5 kata bermakna", category: "Bahasa" },
    { id: 1504, ageMonth: 15, text: "Meniru pekerjaan rumah tangga (menyapu, lap)", category: "Sosial" },

    // USIA 18 BULAN (1.5 TAHUN)
    { id: 1801, ageMonth: 18, text: "Berlari kecil (kaku) / Berjalan mundur", category: "Motorik Kasar" },
    { id: 1802, ageMonth: 18, text: "Menumpuk 4 buah kubus", category: "Motorik Halus" },
    { id: 1803, ageMonth: 18, text: "Makan sendiri dengan sendok (mungkin tumpah)", category: "Kemandirian" },
    { id: 1804, ageMonth: 18, text: "Menunjuk bagian tubuh (mata, hidung)", category: "Kognitif" },

    // USIA 24 BULAN (2 TAHUN)
    { id: 2401, ageMonth: 24, text: "Berbicara 2-3 kata dalam kalimat (Aku mau makan)", category: "Bahasa" },
    { id: 2402, ageMonth: 24, text: "Menendang bola", category: "Motorik Kasar" },
    { id: 2403, ageMonth: 24, text: "Melepas pakaian sendiri", category: "Kemandirian" },
    { id: 2404, ageMonth: 24, text: "Menumpuk 6 buah kubus", category: "Motorik Halus" },
    { id: 2405, ageMonth: 24, text: "Mulai belajar toilet training (memberi tahu pipis)", category: "Kemandirian" },

    // USIA 36 BULAN (3 TAHUN)
    { id: 3601, ageMonth: 36, text: "Mengayuh sepeda roda tiga", category: "Motorik Kasar" },
    { id: 3602, ageMonth: 36, text: "Menyebut nama, umur, dan tempat", category: "Bahasa" },
    { id: 3603, ageMonth: 36, text: "Mengenakan t-shirt / celana sendiri", category: "Kemandirian" },
    { id: 3604, ageMonth: 36, text: "Menggambar lingkaran / garis", category: "Motorik Halus" },
    { id: 3605, ageMonth: 36, text: "Bermain peran dengan teman / boneka", category: "Sosial" },

    // USIA 48 BULAN (4 TAHUN)
    { id: 4801, ageMonth: 48, text: "Melompat dengan satu kaki", category: "Motorik Kasar" },
    { id: 4802, ageMonth: 48, text: "Bercerita (story telling) sederhana", category: "Bahasa" },
    { id: 4803, ageMonth: 48, text: "Menggambar orang dengan 3 bagian tubuh", category: "Motorik Halus" },
    { id: 4804, ageMonth: 48, text: "Mengenal beberapa warna dan angka", category: "Kognitif" },
    { id: 4805, ageMonth: 48, text: "Pergi ke toilet sendiri (mandiri)", category: "Kemandirian" },

    // USIA 60 BULAN (5 TAHUN)
    { id: 6001, ageMonth: 60, text: "Menghitung 1-10", category: "Kognitif" },
    { id: 6002, ageMonth: 60, text: "Berbicara lancar dan jelas dimengerti orang asing", category: "Bahasa" },
    { id: 6003, ageMonth: 60, text: "Mengancingkan baju / mengikat tali sepatu", category: "Motorik Halus" },
    { id: 6004, ageMonth: 60, text: "Menangkap bola yang dilempar", category: "Motorik Kasar" },
    { id: 6005, ageMonth: 60, text: "Menulis beberapa huruf atau nama sendiri", category: "Kognitif" }
];

// 3. WHO Growth Standards (0-5 Years)

// WEIGHT (Kg)
export const WHO_WEIGHT_BOYS = [
    { month: 0, p3: 2.5, p50: 3.3, p97: 4.4 },
    { month: 3, p3: 5.0, p50: 6.4, p97: 8.0 },
    { month: 6, p3: 6.4, p50: 7.9, p97: 9.8 },
    { month: 12, p3: 7.7, p50: 9.6, p97: 12.0 },
    { month: 18, p3: 8.8, p50: 10.9, p97: 13.7 },
    { month: 24, p3: 9.7, p50: 12.2, p97: 15.3 },
    { month: 36, p3: 11.3, p50: 14.3, p97: 18.3 },
    { month: 48, p3: 12.7, p50: 16.3, p97: 21.2 },
    { month: 60, p3: 14.1, p50: 18.3, p97: 24.2 }
];

export const WHO_WEIGHT_GIRLS = [
    { month: 0, p3: 2.4, p50: 3.2, p97: 4.2 },
    { month: 3, p3: 4.5, p50: 5.8, p97: 7.5 },
    { month: 6, p3: 5.7, p50: 7.3, p97: 9.3 },
    { month: 12, p3: 7.0, p50: 8.9, p97: 11.5 },
    { month: 18, p3: 8.1, p50: 10.2, p97: 13.2 },
    { month: 24, p3: 9.0, p50: 11.5, p97: 14.8 },
    { month: 36, p3: 10.8, p50: 13.9, p97: 18.1 },
    { month: 48, p3: 12.3, p50: 16.1, p97: 21.5 },
    { month: 60, p3: 13.7, p50: 18.2, p97: 24.9 }
];

// HEIGHT / LENGTH (Cm) - Simplified 
export const WHO_HEIGHT_BOYS = [
    { month: 0, p3: 46.1, p50: 49.9, p97: 53.7 },
    { month: 3, p3: 57.3, p50: 61.4, p97: 65.5 },
    { month: 6, p3: 63.3, p50: 67.6, p97: 71.9 },
    { month: 12, p3: 71.0, p50: 75.7, p97: 80.5 },
    { month: 24, p3: 81.0, p50: 87.1, p97: 93.2 }, // Standing height starts around here technically
    { month: 36, p3: 88.7, p50: 96.1, p97: 103.5 },
    { month: 48, p3: 94.9, p50: 103.3, p97: 111.7 },
    { month: 60, p3: 100.7, p50: 110.0, p97: 119.2 }
];

export const WHO_HEIGHT_GIRLS = [
    { month: 0, p3: 45.4, p50: 49.1, p97: 52.9 },
    { month: 3, p3: 55.6, p50: 59.8, p97: 64.0 },
    { month: 6, p3: 61.2, p50: 65.7, p97: 70.3 },
    { month: 12, p3: 68.9, p50: 74.0, p97: 79.2 },
    { month: 24, p3: 79.3, p50: 85.7, p97: 92.2 },
    { month: 36, p3: 87.4, p50: 95.1, p97: 102.7 },
    { month: 48, p3: 94.1, p50: 102.7, p97: 111.3 },
    { month: 60, p3: 99.9, p50: 109.4, p97: 118.9 }
];

// HEAD CIRCUMFERENCE (Cm)
export const WHO_HEAD_BOYS = [
    { month: 0, p3: 31.9, p50: 34.5, p97: 37.0 },
    { month: 3, p3: 38.3, p50: 40.5, p97: 42.7 },
    { month: 6, p3: 41.0, p50: 43.3, p97: 45.6 },
    { month: 12, p3: 43.5, p50: 46.0, p97: 48.6 },
    { month: 24, p3: 45.5, p50: 48.2, p97: 51.0 },
    { month: 36, p3: 46.8, p50: 49.5, p97: 52.3 },
    { month: 48, p3: 47.6, p50: 50.4, p97: 53.2 },
    { month: 60, p3: 48.2, p50: 51.0, p97: 53.8 }
];

export const WHO_HEAD_GIRLS = [
    { month: 0, p3: 31.5, p50: 33.9, p97: 36.2 },
    { month: 3, p3: 37.2, p50: 39.5, p97: 41.9 },
    { month: 6, p3: 39.6, p50: 42.2, p97: 44.8 },
    { month: 12, p3: 42.2, p50: 44.9, p97: 47.6 },
    { month: 24, p3: 44.3, p50: 47.2, p97: 50.2 },
    { month: 36, p3: 45.8, p50: 48.7, p97: 51.7 },
    { month: 48, p3: 46.7, p50: 49.7, p97: 52.7 },
    { month: 60, p3: 47.4, p50: 50.4, p97: 53.3 }
];

// 4. Pregnancy Weight Gain Standards (Simplified IOM Guidelines for Normal BMI)
// Min/Max gain in kg per week
export const PREGNANCY_WEIGHT_STD = [
    { week: 0, min: 0, max: 0 },
    { week: 13, min: 1, max: 2.5 }, // Trimester 1 total gain 1-2.5kg
    { week: 20, min: 3.5, max: 5.5 },
    { week: 28, min: 6, max: 9 },
    { week: 32, min: 8, max: 11 },
    { week: 36, min: 10, max: 13.5 },
    { week: 40, min: 11.5, max: 16 }  // Total ideal gain 11.5 - 16kg
];

// 5. Pregnancy Milestones (Week 4 - 40) with Visuals & Mom Tips
export const PREGNANCY_MILESTONES = [
  { week: 4, visual: "🌰", size: "Biji Poppy", title: "Implantasi", desc: "Blastokista menempel pada dinding rahim. Kantung kehamilan terbentuk.", momTips: "Anda mungkin belum merasakan gejala, atau sedikit bercak implantasi." },
  { week: 5, visual: "🐜", size: "Biji Wijen", title: "Pembentukan Awal", desc: "Tabung saraf (otak & tulang belakang) mulai terbentuk.", momTips: "Mual (morning sickness) dan kelelahan mungkin mulai terasa. Konsumsi Asam Folat." },
  { week: 6, visual: "🫛", size: "Kacang Polong", title: "Detak Jantung", desc: "Jantung mulai berdetak (USG Transvaginal). Tunas tangan & kaki muncul.", momTips: "Hindari makanan mentah. Payudara mungkin terasa nyeri dan membesar." },
  { week: 7, visual: "🫐", size: "Blueberry", title: "Wajah Terbentuk", desc: "Mata, hidung, mulut mulai samar. Ginjal terbentuk.", momTips: "Sering buang air kecil karena rahim menekan kandung kemih adalah normal." },
  { week: 8, visual: "🍇", size: "Raspberry", title: "Gerakan Kecil", desc: "Janin mulai bergerak (belum terasa). Jari terbentuk berselaput.", momTips: "Volume darah meningkat. Anda mungkin merasa pusing jika berdiri tiba-tiba." },
  { week: 9, visual: "🫒", size: "Zaitun", title: "Otot Berkembang", desc: "Otot berkembang, siku bisa menekuk.", momTips: "Mood swing (perubahan suasana hati) umum terjadi karena hormon." },
  { week: 10, visual: "🍓", size: "Stroberi", title: "Fase Janin", desc: "Ekor embrio hilang. Tulang mengeras. Gigi terbentuk.", momTips: "Pilih bra yang nyaman dan suportif. Konstipasi mungkin terjadi." },
  { week: 11, visual: "🍋‍🟩", size: "Jeruk Nipis", title: "Kulit Transparan", desc: "Kulit transparan. Jari terpisah.", momTips: "Rambut dan kuku Anda mungkin tumbuh lebih cepat dari biasanya." },
  { week: 12, visual: "🍑", size: "Plum", title: "Refleks", desc: "Sistem saraf merespons. Bisa mengepal.", momTips: "Akhir trimester 1! Mual biasanya mulai berkurang. Libido mungkin kembali." },
  { week: 13, visual: "🍋", size: "Lemon", title: "Sidik Jari", desc: "Sidik jari unik terbentuk. Pita suara berkembang.", momTips: "Perut mulai terlihat membuncit (baby bump) sedikit." },
  { week: 14, visual: "🍊", size: "Jeruk", title: "Ekspresi Wajah", desc: "Bisa menyeringai. Ginjal memproduksi urine.", momTips: "Energi mulai kembali (Trimester 2 = Bulan Madu Kehamilan)." },
  { week: 15, visual: "🍎", size: "Apel", title: "Peka Cahaya", desc: "Mata mendeteksi cahaya terang dari luar.", momTips: "Hidung tersumbat atau mimisan bisa terjadi karena aliran darah meningkat." },
  { week: 16, visual: "🥑", size: "Alpukat", title: "Jenis Kelamin", desc: "Jenis kelamin mungkin terlihat via USG.", momTips: "Mungkin mulai merasakan kedutan halus (quickening) jika ini bukan anak pertama." },
  { week: 17, visual: "🥔", size: "Kentang", title: "Jaringan Lemak", desc: "Lemak tubuh menumpuk untuk suhu.", momTips: "Nyeri ligamen bundar (nyeri tajam di perut bawah) saat bergerak tiba-tiba." },
  { week: 18, visual: "🫑", size: "Paprika", title: "Mendengar Suara", desc: "Telinga sempurna. Bisa dengar suara Ibu.", momTips: "Ajak bayi bicara atau mendengarkan musik. Tekanan darah mungkin turun sedikit." },
  { week: 19, visual: "🥭", size: "Mangga", title: "Vernix Caseosa", desc: "Lapisan lilin putih melindungi kulit.", momTips: "Masker kehamilan (bercak gelap di wajah) atau garis hitam di perut (linea nigra) mungkin muncul." },
  { week: 20, visual: "🍌", size: "Pisang", title: "Separuh Jalan", desc: "Gerakan janin terasa jelas.", momTips: "USG Anomali (detil) biasanya dilakukan di minggu ini. Perut makin besar, pusat keseimbangan berubah." },
  { week: 21, visual: "🥕", size: "Wortel Besar", title: "Pencernaan", desc: "Usus berkembang menyerap gula.", momTips: "Kaki bengkak (edema) mungkin terjadi. Angkat kaki saat istirahat." },
  { week: 22, visual: "🥥", size: "Kelapa Kecil", title: "Indra Peraba", desc: "Mengeksplorasi wajah dengan tangan.", momTips: "Stretch mark mungkin mulai terlihat merah/ungu di perut atau paha." },
  { week: 23, visual: "🍆", size: "Terong", title: "Paru-paru", desc: "Pembuluh darah paru berkembang.", momTips: "Kram kaki di malam hari sering terjadi. Perbanyak kalsium dan magnesium." },
  { week: 24, visual: "🌽", size: "Jagung", title: "Viabilitas", desc: "Viabilitas tercapai (bisa hidup dgn alat medis).", momTips: "Tes glukosa (screening diabetes gestasional) biasanya dilakukan minggu 24-28." },
  { week: 25, visual: "🎃", size: "Labu Air", title: "Rambut Tumbuh", desc: "Warna & tekstur rambut terlihat.", momTips: "Sering mulas (heartburn) karena rahim menekan lambung. Makan porsi kecil tapi sering." },
  { week: 26, visual: "🥒", size: "Zucchini", title: "Mata Terbuka", desc: "Kelopak mata terbuka, belajar berkedip.", momTips: "Sakit punggung makin terasa. Gunakan bantal hamil saat tidur." },
  { week: 27, visual: "🥦", size: "Kembang Kol", title: "Aktivitas Otak", desc: "Gelombang otak merespons suara.", momTips: "Mimpi mungkin terasa sangat nyata dan aneh (vivid dreams)." },
  { week: 28, visual: "🍆", size: "Terong Ungu", title: "Mimpi", desc: "Fase tidur REM (bermimpi) dimulai.", momTips: "Mulai hitung gerakan janin (kick count). Minimal 10 gerakan dalam 2 jam." },
  { week: 29, visual: "🎃", size: "Labu Butternut", title: "Tulang Keras", desc: "Tulang mengeras, tengkorak masih lunak.", momTips: "Varises mungkin muncul. Hindari berdiri terlalu lama." },
  { week: 30, visual: "🥬", size: "Kubis", title: "Sumsum Tulang", desc: "Produksi sel darah merah di sumsum.", momTips: "Sesak napas mungkin terjadi karena rahim menekan diafragma." },
  { week: 31, visual: "🥥", size: "Kelapa", title: "Panca Indra", desc: "Kelima indra berfungsi. Rasa sakit terasa.", momTips: "Kolostrum (cairan payudara pra-susu) mungkin mulai keluar (bocor)." },
  { week: 32, visual: "🥔", size: "Bengkuang", title: "Posisi Kepala", desc: "Mulai berputar ke bawah (siap lahir).", momTips: "Kontraksi palsu (Braxton Hicks) mungkin makin sering terasa." },
  { week: 33, visual: "🍍", size: "Nanas", title: "Antibodi", desc: "Transfer antibodi Ibu ke Bayi.", momTips: "Istirahat menjadi sulit. Coba tidur miring ke kiri untuk aliran darah terbaik." },
  { week: 34, visual: "🍈", size: "Cantaloupe", title: "Sistem Saraf", desc: "Saraf pusat matang.", momTips: "Panggul mungkin terasa nyeri saat bayi mulai turun." },
  { week: 35, visual: "🍈", size: "Melon Honeydew", title: "Lemak ++", desc: "Tubuh berisi, kulit halus.", momTips: "Siapkan tas rumah sakit (Hospital Bag) sekarang." },
  { week: 36, visual: "🥬", size: "Selada Romaine", title: "Dropping", desc: "Kepala masuk panggul.", momTips: "Bernapas mungkin lebih lega (lightening), tapi tekanan di kandung kemih meningkat." },
  { week: 37, visual: "🥬", size: "Sawi Putih", title: "Aterm Awal", desc: "Siap lahir kapan saja.", momTips: "Perhatikan tanda persalinan: lendir darah, ketuban pecah, kontraksi teratur." },
  { week: 38, visual: "🎃", size: "Labu Kuning", title: "Mekonium", desc: "Usus menumpuk mekonium.", momTips: "Bengkak di kaki wajar, tapi jika bengkak tiba-tiba di wajah/tangan + pusing, cek dokter (Preeklampsia)." },
  { week: 39, visual: "🍉", size: "Semangka Kecil", title: "Cukup Bulan", desc: "Perkembangan fisik lengkap.", momTips: "Serviks mulai menipis (effacement) dan membuka (dilatasi)." },
  { week: 40, visual: "🍉", size: "Semangka Besar", title: "HPL", desc: "Hari Perkiraan Lahir.", momTips: "Selamat menanti kelahiran si Kecil! Jangan panik jika lewat HPL, dokter akan memantau." }
];
