
import React, { useState } from 'react';
import { 
  Trash2, Edit2, ListPlus, Search, Plus, X, Camera, CheckCircle, ChevronDown, ChevronUp, Filter, Mic, Sparkles, User, Calendar, Thermometer, Weight, FileText, AlertCircle, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthRecord, Profile, ProfileType, METRIC_LABELS } from '../../types';
import { formatDate, compressImage, getProfileTheme } from '../../utils';
import { SYMPTOM_LIST } from '../../data/symptoms';
import { Button, Input, Modal, TextArea, useVoiceInput, Toast } from '../UI';

// --- Record Detail Component ---
export const RecordDetail: React.FC<{
  record: HealthRecord;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ record, onEdit, onDelete }) => {
  const displayFields = Object.entries(record).filter(([key, value]) => {
     if (['id', 'profileId', 'timestamp', 'date', 'photos', 'notes', 'symptoms', 'time'].includes(key)) return false;
     return value !== undefined && value !== '' && value !== null;
  });

  return (
      <div className="space-y-6">
          <div className="flex justify-between items-start">
             <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{formatDate(record.date)}</h4>
                {record.time && <p className="text-gray-500 text-sm">Pukul {record.time}</p>}
             </div>
             <div className="flex gap-2">
                 <Button variant="secondary" onClick={onEdit} className="h-10 w-10 p-0 rounded-full flex items-center justify-center">
                    <Edit2 size={16} />
                 </Button>
                 <Button variant="danger" onClick={onDelete} className="h-10 w-10 p-0 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100">
                    <Trash2 size={16} />
                 </Button>
             </div>
          </div>

          {/* Notes & Symptoms */}
          {(record.notes || (record.symptoms && record.symptoms.length > 0)) && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800 space-y-3">
                 {record.symptoms && record.symptoms.length > 0 && (
                     <div>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Gejala</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {record.symptoms.map(s => (
                                <span key={s} className="px-2 py-1 bg-white dark:bg-gray-800 text-amber-800 dark:text-amber-200 text-xs rounded-md shadow-sm border border-amber-100 dark:border-amber-900">
                                    {s}
                                </span>
                            ))}
                        </div>
                     </div>
                 )}
                 {record.notes && (
                     <div>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Catatan</span>
                        <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{record.notes}</p>
                     </div>
                 )}
              </div>
          )}

          {/* Metrics Grid */}
          {displayFields.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                  {displayFields.map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                          <span className="block text-xs text-gray-500 uppercase">{METRIC_LABELS[key] || key}</span>
                          <span className="block text-lg font-bold text-gray-900 dark:text-white mt-1">
                              {value}
                              {key.includes('weight') ? ' kg' : 
                              key.includes('height') || key.includes('Circumference') || key.includes('Width') ? ' cm' :
                              key === 'temperature' ? ' °C' : ''}
                          </span>
                      </div>
                  ))}
              </div>
          ) : (
              <p className="text-center text-gray-400 text-sm italic py-4">Tidak ada data metrik vital.</p>
          )}

          {/* Photos */}
          {record.photos && record.photos.length > 0 && (
              <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto Terlampir</span>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                      {record.photos.map((url, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                              <img src={url} alt="Record" className="w-full h-full object-cover" />
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
  );
};

// --- Record Form Component ---
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
  
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [voiceToast, setVoiceToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [symptomSearch, setSymptomSearch] = useState('');
  const [manualSymptom, setManualSymptom] = useState('');

  const { isListening, toggleListening, isSupported } = useVoiceInput((text) => {
      setFormData((prev: any) => ({ ...prev, notes: prev.notes ? prev.notes + ' ' + text : text }));
      setVoiceToast({ message: "Teks ditambahkan ke catatan.", type: 'info' });
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  const handleVoiceNote = (text: string) => {
      setFormData((prev: any) => ({ ...prev, notes: prev.notes ? prev.notes + ' ' + text : text }));
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

  const isChildOrBaby = profile.type === ProfileType.BABY || profile.type === ProfileType.CHILD;

  return (
    <div className="space-y-6 relative">
      {voiceToast && <Toast message={voiceToast.message} type={voiceToast.type as any} onClose={() => setVoiceToast(null)} />}

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

      {/* --- FORM SECTION LOGIC --- */}
      
      {isChildOrBaby ? (
          // BABY & CHILD LAYOUT
          <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Activity size={16} /> Pertumbuhan Fisik Utama
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                      <Input label="Berat Badan (kg)" type="number" step="0.01" name="weight" value={formData.weight || ''} onChange={handleChange} className="col-span-2 sm:col-span-1" />
                      <Input label={profile.type === ProfileType.BABY ? "Panjang Badan (cm)" : "Tinggi Badan (cm)"} type="number" step="0.1" name="height" value={formData.height || ''} onChange={handleChange} className="col-span-2 sm:col-span-1" />
                      
                      <Input label="Lingkar Kepala (cm)" type="number" step="0.1" name="headCircumference" value={formData.headCircumference || ''} onChange={handleChange} />
                      <Input label="Lingkar Dada (cm)" type="number" step="0.1" name="chestCircumference" value={formData.chestCircumference || ''} onChange={handleChange} />
                      <Input label="Lebar Dada (cm)" type="number" step="0.1" name="chestWidth" value={formData.chestWidth || ''} onChange={handleChange} className="col-span-2" />
                  </div>
              </div>

              <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-1">Data Tambahan (Pelengkap)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Input label="Suhu Tubuh (°C)" type="number" step="0.1" name="temperature" value={formData.temperature || ''} onChange={handleChange} />
                      <Input label="Detak Jantung (bpm)" type="number" name="heartRate" value={formData.heartRate || ''} onChange={handleChange} />
                      <Input label="Durasi Tidur (jam)" type="number" step="0.5" name="sleepHours" value={formData.sleepHours || ''} onChange={handleChange} />
                  </div>
              </div>
          </div>
      ) : (
          // ADULT / PREGNANCY LAYOUT
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-1">Tanda Vital</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Berat Badan (kg)" type="number" step="0.01" name="weight" value={formData.weight || ''} onChange={handleChange} />
              {profile.type !== ProfileType.PREGNANCY && (
                <Input label="Tinggi Badan (cm)" type="number" step="0.1" name="height" value={formData.height || ''} onChange={handleChange} />
              )}
              <Input label="Suhu Tubuh (°C)" type="number" step="0.1" name="temperature" value={formData.temperature || ''} onChange={handleChange} />
              <Input label="Detak Jantung (bpm)" type="number" name="heartRate" value={formData.heartRate || ''} onChange={handleChange} />
            </div>
          </div>
      )}

      {/* Specific Metrics Based on Profile Type (Pregnancy) */}
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

      {(profile.type === ProfileType.ADULT || profile.type === ProfileType.SENIOR) && (
        <div className="space-y-3">
           <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 pb-1">Kesehatan Umum</h4>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Sistolik" type="number" name="systolicBP" value={formData.systolicBP || ''} onChange={handleChange} placeholder="120" />
              <Input label="Diastolik" type="number" name="diastolicBP" value={formData.diastolicBP || ''} onChange={handleChange} placeholder="80" />
              <Input label="Gula Darah" type="number" name="bloodSugar" value={formData.bloodSugar || ''} onChange={handleChange} />
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

             {formData.symptoms && formData.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                    {formData.symptoms.map((s: string) => (
                        <span key={s} className="px-2 py-1 rounded-full text-xs font-medium border bg-red-100 border-red-500 text-red-700 flex items-center gap-1">
                            {s} <button onClick={() => toggleSymptom(s)}><X size={12} /></button>
                        </span>
                    ))}
                </div>
            )}
         </div>

         {/* Full Modal for Symptoms */}
         <Modal isOpen={showSymptomModal} onClose={() => setShowSymptomModal(false)} title="Pilih Gejala">
            <div className="flex flex-col h-full min-h-[50vh] relative">
                <div className="flex flex-col gap-2 sticky top-0 bg-white dark:bg-gray-800 z-20 pb-4 pt-1 border-b border-gray-100 dark:border-gray-700">
                    <Input 
                        label="Cari Gejala" icon={<Search size={16} />} value={symptomSearch} 
                        onChange={e => setSymptomSearch(e.target.value)} placeholder="Ketik untuk mencari..."
                    />
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <Input label="Tambah Manual" value={manualSymptom} onChange={e => setManualSymptom(e.target.value)} placeholder="Ketik gejala lain..." />
                        </div>
                        <Button type="button" onClick={addManualSymptom} className="h-[46px] w-[46px] p-0 flex items-center justify-center mb-[1px]">
                            <Plus size={20} />
                        </Button>
                    </div>
                </div>
                <div className="pt-4 flex-1 overflow-y-auto">
                    <p className="text-sm text-gray-500 mb-2 font-medium">Daftar Gejala:</p>
                    <div className="flex flex-wrap gap-2 pb-20">
                        {filteredSymptoms.map((s) => {
                            const isSelected = (formData.symptoms || []).includes(s.name);
                            return (
                                <button key={s.name} type="button" onClick={() => toggleSymptom(s.name)}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${isSelected ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
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

      <TextArea label="Catatan Tambahan" name="notes" rows={3} value={formData.notes || ''} onChange={handleChange} placeholder="Keluhan detail..." enableVoice={true} onVoiceResult={handleVoiceNote} />

      {/* Photo Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Foto / Dokumen (Opsional)</label>
        <div className="flex flex-wrap gap-2">
          {formData.photos && formData.photos.map((photo: string, idx: number) => (
            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removePhoto(idx)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500">
            <Camera size={20} className="mb-1" />
            <span className="text-[10px] font-medium">Tambah</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Batal</Button>
        <Button variant="primary" onClick={handleFormSubmit} className="flex-1">Simpan Data</Button>
      </div>
    </div>
  );
};

// --- REDESIGNED DATA TABLE VIEW ---
export const DataTableView: React.FC<{ 
  records: HealthRecord[]; 
  profiles: Profile[];
  activeProfileId: string | null;
  onRecordClick: (r: HealthRecord) => void; 
}> = ({ records, profiles, activeProfileId, onRecordClick }) => {
  // Advanced Filter State
  const [filterProfileId, setFilterProfileId] = useState<string>(activeProfileId || 'all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sick' | 'healthy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Filter Logic (Improved)
  const filteredData = records.filter(r => {
    // 1. Profile
    if (filterProfileId !== 'all' && r.profileId !== filterProfileId) return false;
    
    // 2. Date Range (Fix)
    const rDate = new Date(r.date);
    if (filterDateStart && rDate < new Date(filterDateStart)) return false;
    if (filterDateEnd && rDate > new Date(filterDateEnd)) return false;

    // 3. Status (Sakit vs Sehat)
    const isSick = r.symptoms && r.symptoms.length > 0;
    if (filterStatus === 'sick' && !isSick) return false;
    if (filterStatus === 'healthy' && isSick) return false;

    // 4. Field Existence
    if (filterField !== 'all') {
        const val = (r as any)[filterField];
        if (val === undefined || val === null || val === '') return false;
    }

    // 5. Text Search (Notes & Symptoms)
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const noteMatch = r.notes?.toLowerCase().includes(q);
        const symptomMatch = r.symptoms?.some(s => s.toLowerCase().includes(q));
        if (!noteMatch && !symptomMatch) return false;
    }

    return true;
  }).sort((a,b) => b.timestamp - a.timestamp);

  const getProfile = (pid: string) => profiles.find(p => p.id === pid);

  return (
    <div className="space-y-4">
      
      {/* 1. Advanced Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Main Search Row */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex gap-2">
              <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                      type="text" 
                      placeholder="Cari catatan atau gejala (cth: Demam)..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                  />
              </div>
              <button 
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all ${isFilterExpanded ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
              >
                  <Filter size={18} /> Filter
              </button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
              {isFilterExpanded && (
                  <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-gray-50 dark:bg-gray-900/30"
                  >
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Profile Select */}
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Profil</label>
                              <select 
                                  className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                                  value={filterProfileId}
                                  onChange={e => setFilterProfileId(e.target.value)}
                              >
                                  <option value="all">Semua Anggota</option>
                                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                          </div>

                          {/* Status Select */}
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kondisi</label>
                              <select 
                                  className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                                  value={filterStatus}
                                  onChange={e => setFilterStatus(e.target.value as any)}
                              >
                                  <option value="all">Semua Kondisi</option>
                                  <option value="sick">🤒 Sakit (Ada Gejala)</option>
                                  <option value="healthy">😊 Sehat (Tanpa Gejala)</option>
                              </select>
                          </div>

                          {/* Field Select */}
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Data Spesifik</label>
                              <select 
                                  className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                                  value={filterField}
                                  onChange={e => setFilterField(e.target.value)}
                              >
                                  <option value="all">Semua Data</option>
                                  {Object.entries(METRIC_LABELS).map(([k, v]) => (
                                      <option key={k} value={k}>{v}</option>
                                  ))}
                              </select>
                          </div>

                          {/* Date Range */}
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Rentang Waktu</label>
                              <div className="flex gap-2">
                                  <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none" />
                                  <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none" />
                              </div>
                          </div>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      {/* 2. Results Count */}
      <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              {filteredData.length} Data Ditemukan
          </span>
      </div>

      {/* 3. Card List Layout */}
      <div className="space-y-3 pb-20">
          {filteredData.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                      <Search size={24} />
                  </div>
                  <p className="text-gray-500 font-medium">Tidak ada data yang cocok.</p>
                  <p className="text-xs text-gray-400 mt-1">Coba ubah filter atau kata kunci pencarian.</p>
              </div>
          ) : (
              filteredData.map((r, idx) => {
                  const profile = getProfile(r.profileId);
                  const theme = getProfileTheme(profile?.type, profile?.gender);
                  const dateObj = new Date(r.date);
                  const day = dateObj.getDate();
                  const month = dateObj.toLocaleDateString('id-ID', { month: 'short' });
                  const hasSymptoms = r.symptoms && r.symptoms.length > 0;

                  return (
                      <motion.div 
                          key={r.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => onRecordClick(r)}
                          className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-start group relative overflow-hidden"
                      >
                          {/* Left Border Indicator */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasSymptoms ? 'bg-red-500' : theme.bg}`}></div>

                          {/* Date Block */}
                          <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${hasSymptoms ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-gray-50 text-gray-600 dark:bg-gray-700/50'} flex-shrink-0 border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors`}>
                              <span className="text-lg font-bold leading-none">{day}</span>
                              <span className="text-[10px] uppercase font-bold opacity-80">{month}</span>
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                      <h4 className={`font-bold text-sm truncate ${theme.primary}`}>
                                          {profile?.name}
                                      </h4>
                                      {hasSymptoms && <AlertCircle size={14} className="text-red-500" />}
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-mono bg-gray-50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded">
                                      {r.time || '--:--'}
                                  </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                  {r.weight && (
                                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                          <Weight size={12} className="text-emerald-500" /> 
                                          <span className="font-semibold">{r.weight}</span> kg
                                      </div>
                                  )}
                                  {r.temperature && (
                                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-800">
                                          <Thermometer size={12} className="text-orange-500" /> 
                                          <span className="font-semibold">{r.temperature}</span> °C
                                      </div>
                                  )}
                                  {/* Show filtered field value if specific field is selected */}
                                  {filterField !== 'all' && filterField !== 'weight' && filterField !== 'temperature' && (r as any)[filterField] && (
                                       <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                                          <FileText size={12} className="text-blue-500" /> 
                                          <span className="font-semibold">{(r as any)[filterField]}</span>
                                      </div>
                                  )}
                              </div>

                              {/* Symptoms / Notes Preview */}
                              {(hasSymptoms || r.notes) && (
                                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                      {hasSymptoms ? (
                                          <span className="text-red-500 font-medium mr-1">
                                              {r.symptoms?.join(', ')}
                                          </span>
                                      ) : null}
                                      {r.notes && <span>{r.notes}</span>}
                                  </div>
                              )}
                          </div>
                      </motion.div>
                  )
              })
          )}
      </div>
    </div>
  );
};
