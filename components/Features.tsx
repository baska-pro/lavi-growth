import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';
import { Profile, ProfileType, HealthRecord, METRIC_LABELS } from '../types';
import { Button, Input, Card, Toast, Modal } from './UI';
import { compressImage, formatDate } from '../utils';
import { SYMPTOM_LIST } from '../data/symptoms';
import { 
  Camera, Save, AlertCircle, TrendingUp, TrendingDown, Calendar, User, Activity, Baby, Sparkles, Image as ImageIcon, Trash2, Edit2, Filter, Search, Stethoscope, CheckSquare, ChevronDown, ChevronUp, Maximize2, Minimize2, BookOpen, Heart, Info, Zap, Droplet, Plus, X, ListPlus, CheckCircle, Calculator, Hash, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Icon Mapper ---
export const getProfileIcon = (type: ProfileType) => {
  switch (type) {
    case ProfileType.PREGNANCY: return <Baby className="w-6 h-6" />;
    case ProfileType.BABY: return <Baby className="w-6 h-6" />;
    case ProfileType.CHILD: return <User className="w-6 h-6" />;
    case ProfileType.ADULT: return <User className="w-6 h-6" />;
    case ProfileType.SENIOR: return <User className="w-6 h-6" />;
    default: return <User className="w-6 h-6" />;
  }
};

// --- Profile Card ---
export const ProfileCard: React.FC<{ profile: Profile; isActive: boolean; onClick: () => void }> = ({ profile, isActive, onClick }) => (
  <Card 
    onClick={onClick}
    className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 overflow-hidden'}`}>
        {profile.avatar && profile.avatar.length > 5 ? (
          // Assume long base64 string is an image, short string is emoji
          profile.avatar.startsWith('data:') ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" /> : profile.avatar
        ) : (
          profile.avatar || profile.name[0].toUpperCase()
        )}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white">{profile.name}</h4>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          {profile.type}
        </span>
      </div>
    </div>
  </Card>
);

// --- Articles & Nutrition View ---
// PANDUAN EDIT: Tambahkan atau ubah objek di dalam array ini untuk mengupdate info nutrisi.
const NUTRITION_DATA = [
  // Vitamin Utama
  {
    name: "Vitamin A",
    func: "Kesehatan mata, sistem kekebalan tubuh, pertumbuhan sel.",
    source: "Wortel, ubi jalar, bayam, hati sapi, telur, susu.",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
  },
  {
    name: "Vitamin C",
    func: "Antioksidan kuat, penyembuhan luka, penyerapan zat besi, imun tubuh.",
    source: "Jeruk, stroberi, kiwi, paprika merah, brokoli, tomat, jambu biji.",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
  },
  {
    name: "Vitamin D",
    func: "Penyerapan kalsium, kesehatan tulang & gigi, fungsi otot.",
    source: "Sinar matahari pagi, ikan berlemak (salmon, tuna), kuning telur, jamur.",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
  },
  {
    name: "Vitamin E",
    func: "Antioksidan, melindungi sel dari kerusakan, kesehatan kulit.",
    source: "Kacang almond, biji bunga matahari, alpukat, bayam.",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
  },
  {
    name: "Vitamin K",
    func: "Penting untuk pembekuan darah dan kesehatan tulang.",
    source: "Sayuran hijau (kale, bayam, brokoli), minyak ikan.",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  },

  // Vitamin B Kompleks
  {
    name: "Vitamin B1 (Thiamin)",
    func: "Mengubah makanan menjadi energi, fungsi saraf.",
    source: "Biji-bijian utuh, daging babi, ikan, kacang-kacangan.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },
  {
    name: "Vitamin B2 (Riboflavin)",
    func: "Produksi energi, fungsi sel, kesehatan mata & kulit.",
    source: "Telur, jeroan (hati, ginjal), susu, sayuran hijau.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },
  {
    name: "Vitamin B3 (Niacin)",
    func: "Sistem pencernaan, kulit, dan saraf.",
    source: "Daging, ikan, unggas, biji-bijian, kacang tanah.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },
  {
    name: "Vitamin B6",
    func: "Perkembangan otak, fungsi saraf, metabolisme.",
    source: "Ayam, ikan, kentang, buncis, pisang.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },
  {
    name: "Vitamin B9 (Asam Folat)",
    func: "Penting untuk ibu hamil (mencegah cacat lahir), pembentukan sel darah.",
    source: "Sayuran hijau, kacang polong, jeruk, sereal fortifikasi.",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
  },
  {
    name: "Vitamin B12",
    func: "Kesehatan saraf, pembentukan DNA, sel darah merah.",
    source: "Daging, ikan, produk susu, telur (hanya di produk hewani).",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },

  // Mineral
  {
    name: "Kalsium",
    func: "Pembentukan tulang & gigi kuat, pembekuan darah, fungsi saraf.",
    source: "Susu, keju, yogurt, sayuran hijau (kale), sarden, tahu.",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  },
  {
    name: "Zat Besi",
    func: "Pembentukan hemoglobin (sel darah merah), mencegah anemia.",
    source: "Daging merah, hati, bayam, kacang-kacangan, kerang.",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
  },
  {
    name: "Zinc (Seng)",
    func: "Sistem imun, penyembuhan luka, indra perasa & penciuman.",
    source: "Tiram, daging sapi, biji labu, lentil.",
    color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300"
  },
  {
    name: "Magnesium",
    func: "Fungsi otot & saraf, gula darah, tekanan darah.",
    source: "Almond, bayam, kacang mete, kacang hitam, edamame.",
    color: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300"
  },
  {
    name: "Kalium (Potasium)",
    func: "Keseimbangan cairan, kontraksi otot, sinyal saraf.",
    source: "Pisang, kentang, bayam, jamur, kacang polong.",
    color: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300"
  },
  {
    name: "Yodium",
    func: "Membuat hormon tiroid (metabolisme), perkembangan otak janin.",
    source: "Garam beryodium, ikan laut, rumput laut, udang, telur.",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
  },

  // Lainnya
  {
    name: "Omega-3",
    func: "Kesehatan otak, jantung, mata, perkembangan janin.",
    source: "Ikan salmon, makarel, biji chia, kenari (walnut), minyak ikan.",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
  },
  {
    name: "Protein",
    func: "Membangun dan memperbaiki jaringan tubuh, pembentukan otot.",
    source: "Daging, ayam, ikan, telur, tahu, tempe, kacang-kacangan.",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
  }
];

export const ArticlesView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredNutrition = NUTRITION_DATA.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.func.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
            <BookOpen size={28} />
            </div>
            <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ensiklopedia Nutrisi</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Panduan vitamin dan mineral penting.</p>
            </div>
        </div>
        <div className="w-full md:w-auto relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
                type="text" 
                placeholder="Cari vitamin, fungsi, atau makanan..." 
                className="w-full md:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {filteredNutrition.map((item, idx) => (
            <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.05 }}
               className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
               <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${item.color}`}>
                  {item.name}
               </div>
               <div className="space-y-3">
                  <div>
                     <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        <Zap size={14} className="text-amber-500" /> Fungsi Utama
                     </span>
                     <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.func}</p>
                  </div>
                  <div>
                     <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        <Droplet size={14} className="text-blue-500" /> Sumber Makanan
                     </span>
                     <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.source}</p>
                  </div>
               </div>
            </motion.div>
         ))}
         {filteredNutrition.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-500">
                 Tidak ada data nutrisi yang cocok dengan pencarian "{searchTerm}".
             </div>
         )}
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-6 mt-6">
          <div className="flex items-start gap-3">
             <Info className="text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
             <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p className="font-bold text-lg text-emerald-800 dark:text-emerald-200">Tips Kesehatan Umum</p>
                <ul className="list-disc pl-4 space-y-1">
                   <li>Pastikan minum air putih yang cukup (minimal 8 gelas/hari untuk dewasa).</li>
                   <li>Tidur yang cukup (7-9 jam untuk dewasa, lebih banyak untuk anak-anak) sangat penting untuk regenerasi sel.</li>
                   <li>Olahraga ringan minimal 30 menit sehari dapat meningkatkan mood dan kesehatan jantung.</li>
                   <li>Cuci tangan sebelum makan untuk mencegah infeksi bakteri dan virus.</li>
                   <li>Konsultasikan dengan dokter sebelum mengonsumsi suplemen dosis tinggi.</li>
                </ul>
             </div>
          </div>
      </div>
    </div>
  );
};

// --- Data Table View (Global & Profile Filter) ---
export const DataTableView: React.FC<{ 
  records: HealthRecord[]; 
  profiles: Profile[];
  activeProfileId: string | null;
  onRecordClick: (r: HealthRecord) => void; 
}> = ({ records, profiles, activeProfileId, onRecordClick }) => {
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [filterProfileId, setFilterProfileId] = useState<string>(activeProfileId || 'all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Filter Logic
  const filteredData = records.filter(r => {
    // 1. Profile Filter
    if (filterProfileId !== 'all' && r.profileId !== filterProfileId) return false;

    // 2. Date Filter
    const rDate = new Date(r.date);
    const afterStart = filterDateStart ? rDate >= new Date(filterDateStart) : true;
    const beforeEnd = filterDateEnd ? rDate <= new Date(filterDateEnd) : true;
    
    // 3. Field Filter
    const hasField = filterField === 'all' ? true : (r as any)[filterField] !== undefined && (r as any)[filterField] !== '';

    return afterStart && beforeEnd && hasField;
  }).sort((a,b) => b.timestamp - a.timestamp);

  const getProfileName = (pid: string) => profiles.find(p => p.id === pid)?.name || 'Unknown';

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <button 
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="w-full p-4 flex items-center justify-between font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter size={18} /> Filter Data Global
          </div>
          {isFilterExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
               <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-700 mt-2">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Profil</label>
                        <select 
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 outline-none"
                          value={filterProfileId}
                          onChange={e => setFilterProfileId(e.target.value)}
                        >
                          <option value="all">Semua Profil</option>
                          {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                    </div>
                    <Input label="Dari Tanggal" type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
                    <Input label="Sampai Tanggal" type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Field Tertentu</label>
                        <select 
                          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 outline-none"
                          value={filterField}
                          onChange={e => setFilterField(e.target.value)}
                        >
                          <option value="all">Semua Data</option>
                          {Object.entries(METRIC_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                {filterProfileId === 'all' && <th className="px-4 py-3">Nama</th>}
                <th className="px-4 py-3">Berat</th>
                <th className="px-4 py-3">Catatan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={filterProfileId === 'all' ? 5 : 4} className="px-4 py-8 text-center text-gray-400">Tidak ada data sesuai filter</td>
                </tr>
              ) : (
                filteredData.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(r.date)}</td>
                    {filterProfileId === 'all' && (
                        <td className="px-4 py-3 text-emerald-600 font-medium">{getProfileName(r.profileId)}</td>
                    )}
                    <td className="px-4 py-3">{r.weight ? `${r.weight} kg` : '-'}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-500">{r.notes || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onRecordClick(r)} className="text-emerald-500 hover:text-emerald-600 font-medium">Detail</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Record Form ---
export const RecordForm: React.FC<{
  profile: Profile;
  initialData?: HealthRecord;
  lastRecord?: HealthRecord;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}> = ({ profile, initialData, lastRecord, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    symptoms: [],
    photos: [],
    ...initialData
  });
  
  // State for collapsible symptoms checklist
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  
  // Search & Manual Add State
  const [symptomSearch, setSymptomSearch] = useState('');
  const [manualSymptom, setManualSymptom] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const val = type === 'number' ? parseFloat(value) : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = [...(formData.photos || [])];
      for (let i = 0; i < e.target.files.length; i++) {
        try {
          const base64 = await compressImage(e.target.files[i]);
          newPhotos.push(base64);
        } catch (err) {
          console.error("Fail upload", err);
        }
      }
      setFormData((prev: any) => ({ ...prev, photos: newPhotos }));
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...(formData.photos || [])];
    newPhotos.splice(index, 1);
    setFormData((prev: any) => ({ ...prev, photos: newPhotos }));
  };

  const toggleSymptom = (symptomName: string) => {
    const current = formData.symptoms || [];
    if (current.includes(symptomName)) {
      setFormData((prev: any) => ({ ...prev, symptoms: current.filter((s: string) => s !== symptomName) }));
    } else {
      setFormData((prev: any) => ({ ...prev, symptoms: [...current, symptomName] }));
    }
  };

  const addManualSymptom = () => {
    if (!manualSymptom.trim()) return;
    toggleSymptom(manualSymptom.trim());
    setManualSymptom('');
  };

  const autoFillLast = () => {
    if (lastRecord) {
      const { id, date, timestamp, ...rest } = lastRecord;
      setFormData((prev: any) => ({ ...prev, ...rest, date: prev.date }));
    }
  };

  const handleFormSubmit = () => {
      onSubmit(formData);
  };

  const filteredSymptoms = SYMPTOM_LIST.filter(s => 
    s.name.toLowerCase().includes(symptomSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {!initialData && lastRecord && (
        <button type="button" onClick={autoFillLast} className="text-xs text-emerald-600 hover:text-emerald-700 underline mb-2">
          Isi otomatis dari data terakhir
        </button>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Tanggal" type="date" name="date" value={formData.date} onChange={handleChange} />
        <Input label="Jam (Opsional)" type="time" name="time" value={formData.time || ''} onChange={handleChange} />
      </div>

      {/* Vitals Section */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-1">Tanda Vital</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Input label="Berat Badan (kg)" type="number" step="0.01" name="weight" value={formData.weight || ''} onChange={handleChange} />
          {profile.type !== ProfileType.PREGNANCY && (
            <Input label={profile.type === ProfileType.BABY ? "Panjang Badan (cm)" : "Tinggi Badan (cm)"} type="number" step="0.1" name="height" value={formData.height || ''} onChange={handleChange} />
          )}
          <Input label="Suhu Tubuh (°C)" type="number" step="0.1" name="temperature" value={formData.temperature || ''} onChange={handleChange} />
          <Input label="Detak Jantung (bpm)" type="number" name="heartRate" value={formData.heartRate || ''} onChange={handleChange} />
        </div>
      </div>

      {/* Specific Metrics Based on Profile Type */}
      {(profile.type === ProfileType.PREGNANCY) && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-1">Kehamilan & Janin</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Usia Kandungan (minggu)" type="number" name="gestationalAge" value={formData.gestationalAge || ''} onChange={handleChange} />
            <Input label="Lingkar Perut Ibu (cm)" type="number" name="bellyCircumference" value={formData.bellyCircumference || ''} onChange={handleChange} />
            <Input label="Gerakan Janin (kali)" type="number" name="fetalMovement" value={formData.fetalMovement || ''} onChange={handleChange} />
            <Input label="Gula Darah (mg/dL)" type="number" name="bloodSugar" value={formData.bloodSugar || ''} onChange={handleChange} />
          </div>
          
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
             <h5 className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mb-2">Data USG (Opsional)</h5>
             <div className="grid grid-cols-2 gap-4">
               <Input label="EFW / Berat Janin (g)" type="number" name="usg_efw" value={formData.usg_efw || ''} onChange={handleChange} />
               <Input label="BPD (mm)" type="number" name="usg_bpd" value={formData.usg_bpd || ''} onChange={handleChange} />
               <Input label="AC / Lingkar Perut (mm)" type="number" name="usg_ac" value={formData.usg_ac || ''} onChange={handleChange} />
               <Input label="FL / Panjang Paha (mm)" type="number" name="usg_fl" value={formData.usg_fl || ''} onChange={handleChange} />
             </div>
          </div>
        </div>
      )}

      {(profile.type === ProfileType.BABY || profile.type === ProfileType.CHILD) && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-1">Pertumbuhan Anak</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Lingkar Kepala (cm)" type="number" step="0.1" name="headCircumference" value={formData.headCircumference || ''} onChange={handleChange} />
            <Input label="Lingkar Dada (cm)" type="number" step="0.1" name="chestCircumference" value={formData.chestCircumference || ''} onChange={handleChange} />
            <Input label="Durasi Tidur (jam)" type="number" step="0.5" name="sleepHours" value={formData.sleepHours || ''} onChange={handleChange} />
          </div>
        </div>
      )}

      {(profile.type === ProfileType.ADULT || profile.type === ProfileType.SENIOR) && (
        <div className="space-y-3">
           <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-1">Kesehatan Umum</h4>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Tekanan Darah Sistolik" type="number" name="systolicBP" value={formData.systolicBP || ''} onChange={handleChange} placeholder="120" />
              <Input label="Tekanan Darah Diastolik" type="number" name="diastolicBP" value={formData.diastolicBP || ''} onChange={handleChange} placeholder="80" />
              <Input label="Gula Darah (mg/dL)" type="number" name="bloodSugar" value={formData.bloodSugar || ''} onChange={handleChange} />
           </div>
        </div>
      )}

      {/* Symptoms Button & List Display */}
      <div className="space-y-2">
         <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Keluhan Kesehatan</label>
         <div className="flex flex-col gap-2">
             <Button variant="secondary" onClick={() => setShowSymptomModal(true)} className="justify-start border border-gray-200 dark:border-gray-700 h-12">
                 <ListPlus size={18} /> {formData.symptoms && formData.symptoms.length > 0 ? `${formData.symptoms.length} Gejala Dipilih` : "Pilih Gejala / Keluhan"}
             </Button>

             {/* Selected Symptoms Chips Display */}
             {formData.symptoms && formData.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                    {formData.symptoms.map((s: string) => (
                        <span
                            key={s}
                            className="px-2 py-1 rounded-full text-xs font-medium border bg-red-100 border-red-500 text-red-700 dark:bg-red-900/50 dark:text-red-200 flex items-center gap-1"
                        >
                            {s} <button onClick={() => toggleSymptom(s)}><X size={12} /></button>
                        </span>
                    ))}
                </div>
            )}
         </div>

         {/* Full Modal for Symptoms */}
         <Modal isOpen={showSymptomModal} onClose={() => setShowSymptomModal(false)} title="Pilih Gejala">
            <div className="flex flex-col h-full min-h-[50vh] relative">
                 {/* Search & Manual Add - Sticky Header */}
                <div className="flex flex-col gap-2 sticky top-0 bg-white dark:bg-gray-800 z-20 pb-4 pt-1 border-b border-gray-100 dark:border-gray-700">
                    <Input 
                        label="Cari Gejala" 
                        icon={<Search size={16} />} 
                        value={symptomSearch} 
                        onChange={e => setSymptomSearch(e.target.value)} 
                        placeholder="Ketik untuk mencari..."
                    />
                    
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Input 
                                label="Tambah Manual (Jika tidak ada di daftar)" 
                                value={manualSymptom} 
                                onChange={e => setManualSymptom(e.target.value)} 
                                placeholder="Ketik gejala lain..."
                            />
                        </div>
                        <Button type="button" onClick={addManualSymptom} className="h-[46px] w-[46px] p-0 flex items-center justify-center mb-[1px]">
                            <Plus size={20} />
                        </Button>
                    </div>
                </div>

                <div className="pt-4 flex-1 overflow-y-auto">
                    <p className="text-sm text-gray-500 mb-2 font-medium">Daftar Gejala:</p>
                    <div className="flex flex-wrap gap-2 pb-20">
                        {filteredSymptoms.length === 0 && (
                            <span className="text-xs text-gray-400 italic w-full text-center py-2">Tidak ada gejala yang cocok. Tambahkan manual di atas.</span>
                        )}
                        {filteredSymptoms.map((s) => {
                            const isSelected = (formData.symptoms || []).includes(s.name);
                            return (
                                <button
                                    key={s.name}
                                    type="button"
                                    onClick={() => toggleSymptom(s.name)}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                                        isSelected 
                                        ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/50 dark:text-red-200 shadow-sm' 
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{s.emoji}</span> {s.name}
                                    {isSelected && <CheckCircle size={14} className="ml-1" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 pt-2 pb-1 border-t border-gray-100 dark:border-gray-700 z-20">
                    <Button onClick={() => setShowSymptomModal(false)} className="w-full justify-center shadow-lg">Selesai Memilih</Button>
                </div>
            </div>
         </Modal>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Catatan Tambahan</label>
        <textarea 
          name="notes" 
          rows={3}
          value={formData.notes || ''} 
          onChange={handleChange}
          className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
          placeholder="Keluhan detail, resep obat, atau catatan dokter..."
        />
      </div>

      {/* Photos */}
      <div className="space-y-2">
         <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Dokumentasi Foto</label>
            <label className="cursor-pointer text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
               <Camera size={14} /> Tambah Foto
               <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
         </div>
         <div className="flex gap-2 overflow-x-auto pb-2">
            {formData.photos?.length === 0 && (
               <div className="text-xs text-gray-400 italic p-2">Belum ada foto.</div>
            )}
            {formData.photos?.map((photo: string, idx: number) => (
               <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden group">
                  <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                     type="button"
                     onClick={() => removePhoto(idx)}
                     className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                     <Trash2 size={10} />
                  </button>
               </div>
            ))}
         </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Batal</Button>
        <Button variant="primary" onClick={handleFormSubmit} className="flex-1">Simpan Data</Button>
      </div>
    </div>
  );
};
