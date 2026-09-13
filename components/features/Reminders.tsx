
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Plus, Trash2, Clock, Calendar, Pill, Stethoscope, CheckCircle, Circle, AlertCircle, Loader2, Search, Info, Edit, Repeat } from 'lucide-react';
import { Reminder, Profile } from '../../types';
import { Button, Card, Modal, Input, Toast } from '../UI';
import { generateId, getProfileTheme, formatDate } from '../../utils';
import { searchDrugOpenFDA, searchWikipedia, getWikipediaDetail } from '../../services/externalApi';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface RemindersViewProps {
    reminders: Reminder[];
    profiles: Profile[];
    onUpdateReminders: (reminders: Reminder[]) => void;
    onDeleteReminder?: (id: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ reminders, profiles, onUpdateReminders, onDeleteReminder }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState(Notification.permission);
    const [showToast, setShowToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('08:00');
    const [selectedDays, setSelectedDays] = useState<number[]>([0,1,2,3,4,5,6]); // Default everyday
    const [type, setType] = useState<'medication' | 'vaccine' | 'checkup' | 'other'>('medication');
    const [targetProfileId, setTargetProfileId] = useState<string>('');
    
    // New: Specific Date State
    const [scheduleMode, setScheduleMode] = useState<'recurring' | 'specific'>('recurring');
    const [specificDate, setSpecificDate] = useState('');

    // Drug Search State
    const [drugSuggestions, setDrugSuggestions] = useState<any[]>([]);
    const [isSearchingDrug, setIsSearchingDrug] = useState(false);
    const [showDrugDropdown, setShowDrugDropdown] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Ref for dropdown close on outside click
    const dropdownWrapperRef = useRef<HTMLDivElement>(null);

    // Wikipedia Info Modal State
    const [wikiInfo, setWikiInfo] = useState<{title: string, content: string} | null>(null);
    const [loadingWiki, setLoadingWiki] = useState(false);

    // Handle Outside Click for Dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownWrapperRef.current && !dropdownWrapperRef.current.contains(event.target as Node)) {
                setShowDrugDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownWrapperRef]);

    // Debounce Search for Drug API
    useEffect(() => {
        if (type === 'medication' && title.length >= 3 && showDrugDropdown) {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            
            setIsSearchingDrug(true);
            searchTimeoutRef.current = setTimeout(async () => {
                const results = await searchDrugOpenFDA(title);
                setDrugSuggestions(results);
                setIsSearchingDrug(false);
            }, 500);
        } else {
            if(title.length < 3) setDrugSuggestions([]);
            setIsSearchingDrug(false);
        }
    }, [title, type, showDrugDropdown]);

    const handleLookupWiki = async (drugName: string) => {
        setLoadingWiki(true);
        const searchRes = await searchWikipedia(drugName);
        if (searchRes.length > 0) {
            const detail = await getWikipediaDetail(searchRes[0].id);
            setWikiInfo({
                title: searchRes[0].title,
                content: detail || "Detail tidak tersedia."
            });
        } else {
            setShowToast({ msg: "Info obat tidak ditemukan di Wikipedia.", type: 'error' });
        }
        setLoadingWiki(false);
    };

    const requestPermission = async () => {
        const result = await Notification.requestPermission();
        setPermissionStatus(result);
        if (result === 'granted') {
            new Notification("Lavi Growth Tracker", { body: "Notifikasi aktif! Kami akan mengingatkan jadwal obat Anda." });
        }
    };

    const toggleDay = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            setSelectedDays(prev => prev.filter(d => d !== dayIndex));
        } else {
            setSelectedDays(prev => [...prev, dayIndex].sort());
        }
    };

    const handleEdit = (r: Reminder) => {
        setEditingId(r.id);
        setTitle(r.title);
        setTime(r.time);
        setType(r.type);
        setTargetProfileId(r.profileId || '');
        
        if (r.specificDate) {
            setScheduleMode('specific');
            setSpecificDate(r.specificDate);
            setSelectedDays([]); // Reset
        } else {
            setScheduleMode('recurring');
            setSpecificDate('');
            setSelectedDays(r.days);
        }
        
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!title) return;
        
        // Logic for specific date vs recurring
        let finalDays = selectedDays;
        let finalSpecificDate = undefined;

        if (scheduleMode === 'specific') {
            if (!specificDate) {
                setShowToast({ msg: "Pilih tanggal terlebih dahulu", type: 'error' });
                return;
            }
            finalSpecificDate = specificDate;
            finalDays = []; // Specific dates don't rely on day index
        } else {
            if (selectedDays.length === 0) {
                setShowToast({ msg: "Pilih minimal 1 hari", type: 'error' });
                return;
            }
        }
        
        const newReminder: Reminder = {
            id: editingId || generateId(),
            profileId: targetProfileId,
            title,
            time,
            days: finalDays,
            specificDate: finalSpecificDate,
            active: true, // WAJIB TRUE SAAT BUAT BARU
            type
        };

        let updatedList;
        if (editingId) {
            updatedList = reminders.map(r => r.id === editingId ? newReminder : r);
            setShowToast({ msg: "Pengingat diperbarui", type: 'success' });
        } else {
            updatedList = [...reminders, newReminder];
            setShowToast({ msg: "Pengingat berhasil dibuat", type: 'success' });
        }

        onUpdateReminders(updatedList);
        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (onDeleteReminder) {
            onDeleteReminder(id);
        } else {
            onUpdateReminders(reminders.filter(r => r.id !== id));
        }
    };

    const toggleActive = (id: string) => {
        const target = reminders.find(r => r.id === id);
        if(!target) return;

        const newState = !target.active;
        const updatedList = reminders.map(r => r.id === id ? { ...r, active: newState } : r);
        
        onUpdateReminders(updatedList);
        setShowToast({ msg: newState ? "Jadwal Diaktifkan" : "Jadwal Dinonaktifkan", type: 'info' });
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setTime('08:00');
        setSelectedDays([0,1,2,3,4,5,6]);
        setType('medication');
        setTargetProfileId('');
        setDrugSuggestions([]);
        setScheduleMode('recurring');
        setSpecificDate('');
    };

    // Helper Warna: HAPUS LOGIKA GREYSCALE. Selalu warna cerah.
    const getTypeColor = (t: string) => {
        switch(t) {
            case 'medication': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'vaccine': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'checkup': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
        }
    };

    const getTypeIcon = (t: string) => {
        switch(t) {
            case 'medication': return <Pill size={24} />;
            case 'vaccine': return <AlertCircle size={24} />;
            case 'checkup': return <Stethoscope size={24} />;
            default: return <Bell size={24} />;
        }
    };

    const getProfileData = (id: string) => profiles.find(p => p.id === id);

    return (
        <div className="space-y-6">
            {showToast && <Toast message={showToast.msg} type={showToast.type} onClose={() => setShowToast(null)} />}
            
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Jadwal & Pengingat</h2>
                    <p className="text-gray-500 text-sm">Obat, Imunisasi, dan Kontrol Dokter</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2">
                    <Plus size={18} /> Tambah
                </Button>
            </div>

            {permissionStatus !== 'granted' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <span className="font-bold">Izin Notifikasi Diperlukan.</span> Aktifkan agar kami bisa mengirim pengingat.
                    </div>
                    <Button size="sm" variant="secondary" onClick={requestPermission}>Aktifkan</Button>
                </div>
            )}

            <div className="space-y-3">
                {reminders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Belum ada pengingat yang dibuat.</div>
                ) : (
                    reminders.map(r => {
                        const profile = getProfileData(r.profileId);
                        const profileTheme = profile ? getProfileTheme(profile.type, profile.gender) : null;

                        return (
                        <Card 
                            key={r.id} 
                            // Card Container: Hapus logic opacity/grayscale. Selalu terlihat aktif.
                            className="relative flex items-start gap-4 p-4 bg-white dark:bg-gray-800 hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all"
                        >
                            {/* Icon Container with Profile Name Below */}
                            <div className="flex flex-col items-center gap-2 flex-shrink-0 w-16">
                                <div className={`p-3 rounded-2xl ${getTypeColor(r.type)}`}>
                                    {getTypeIcon(r.type)}
                                </div>
                                {profile && profileTheme && (
                                    <span className={`text-[9px] font-bold text-center leading-tight break-words w-full px-1 py-0.5 rounded-md border ${profileTheme.bgLight} ${profileTheme.primary} ${profileTheme.border}`}>
                                        {profile.name}
                                    </span>
                                )}
                                {!profile && (
                                    <span className="text-[9px] font-bold text-center text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Umum</span>
                                )}
                            </div>
                            
                            {/* Content Middle */}
                            <div className="flex-1 min-w-0 pr-8"> {/* Tambah padding right agar teks tidak ketabrak tombol Info */}
                                <div className="flex flex-col mb-1">
                                    <h4 className={`font-bold text-base leading-tight break-words ${!r.active ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                        {r.title}
                                    </h4>
                                </div>
                                
                                {/* INFO BADGE: POSISI ABSOLUTE DI POJOK KANAN ATAS */}
                                {r.type === 'medication' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleLookupWiki(r.title); }} 
                                        className="absolute top-4 right-4 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-blue-100 transition-colors z-10 border border-blue-100"
                                    >
                                        {loadingWiki ? <Loader2 size={10} className="animate-spin"/> : <Info size={12} />} Info
                                    </button>
                                )}
                                
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="flex items-center gap-1 font-mono font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded">
                                        <Clock size={12} /> {r.time}
                                    </span>
                                </div>
                                
                                <p className="text-[10px] text-gray-400 mt-2 truncate flex items-center gap-1">
                                    {r.specificDate ? (
                                        <>
                                            <Calendar size={10} /> {formatDate(r.specificDate)} (Sekali)
                                        </>
                                    ) : (
                                        <>
                                            <Repeat size={10} />
                                            {r.days.length === 7 ? 'Setiap Hari' : r.days.map(d => DAYS[d]).join(', ')}
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Actions - Bottom Aligned */}
                            <div className="flex flex-col justify-end items-end gap-2 flex-shrink-0 mt-auto self-end h-full">
                                <div className="flex-1"></div> {/* Spacer */}
                                <div className="flex items-center gap-2">
                                    {/* TOMBOL CEKLIST: Hijau jika aktif, Lingkaran Abu jika mati */}
                                    <button 
                                        onClick={() => toggleActive(r.id)} 
                                        className={`p-1.5 rounded-full transition-all ${r.active ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-gray-100 hover:bg-gray-200'}`}
                                        title={r.active ? "Nonaktifkan" : "Aktifkan"}
                                    >
                                        {r.active ? 
                                            <CheckCircle size={22} className="text-emerald-500 fill-emerald-100" /> : 
                                            <Circle size={22} className="text-gray-300" />
                                        }
                                    </button>
                                    <button onClick={() => handleEdit(r)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                        )
                    })
                )}
            </div>

            {/* Wikipedia Info Modal */}
            <Modal isOpen={!!wikiInfo} onClose={() => setWikiInfo(null)} title={wikiInfo?.title || 'Info Obat'}>
                {wikiInfo && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                            {wikiInfo.content}
                        </p>
                        <div className="text-[10px] text-gray-400 italic">Sumber: Wikipedia Bahasa Indonesia</div>
                        <Button onClick={() => setWikiInfo(null)} className="w-full">Tutup</Button>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Pengingat" : "Buat Pengingat"}>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Kategori</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                            {['medication', 'vaccine', 'checkup', 'other'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => { setType(t as any); if(!editingId) setTitle(''); setDrugSuggestions([]); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${type === t ? 'bg-white dark:bg-gray-600 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}
                                >
                                    {t === 'medication' ? 'Obat' : t === 'vaccine' ? 'Vaksin' : t === 'checkup' ? 'Kontrol' : 'Lainnya'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative" ref={dropdownWrapperRef}>
                        <Input 
                            label="Judul Pengingat" 
                            value={title} 
                            onChange={e => { setTitle(e.target.value); setShowDrugDropdown(true); }} 
                            placeholder={type === 'medication' ? "Ketik nama obat (Cth: Paracetamol)" : "Contoh: Imunisasi BCG"} 
                            onFocus={() => setShowDrugDropdown(true)}
                        />
                        
                        {/* Autocomplete Dropdown */}
                        {type === 'medication' && showDrugDropdown && (isSearchingDrug || drugSuggestions.length > 0) && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                {isSearchingDrug && (
                                    <div className="p-3 text-xs text-gray-500 flex items-center justify-center gap-2">
                                        <Loader2 size={14} className="animate-spin" /> Mencari di OpenFDA...
                                    </div>
                                )}
                                {!isSearchingDrug && drugSuggestions.map((drug, idx) => (
                                    <button
                                        key={`${drug.id}-${idx}`}
                                        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        onClick={() => {
                                            setTitle(drug.brand_name.toLowerCase()); // Normalize case
                                            setDrugSuggestions([]);
                                            setShowDrugDropdown(false);
                                        }}
                                    >
                                        <p className="text-sm font-bold text-gray-800 dark:text-white capitalize">{drug.brand_name.toLowerCase()}</p>
                                        {drug.generic_name && <p className="text-[10px] text-gray-500 truncate">{drug.generic_name}</p>}
                                    </button>
                                ))}
                            </div>
                        )}
                        {type === 'medication' && title.length > 0 && !isSearchingDrug && drugSuggestions.length === 0 && showDrugDropdown && (
                             <div className="absolute z-50 right-0 top-0 mt-8 mr-2 pointer-events-none">
                                 <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">Manual</span>
                             </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Untuk Siapa?</label>
                        <select 
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-4 outline-none"
                            value={targetProfileId}
                            onChange={e => setTargetProfileId(e.target.value)}
                        >
                            <option value="">Semua / Umum</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <Input label="Jam" type="time" value={time} onChange={e => setTime(e.target.value)} />

                    {/* NEW: Specific Date vs Recurring */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Frekuensi Jadwal</label>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            <button 
                                onClick={() => setScheduleMode('recurring')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${scheduleMode === 'recurring' ? 'bg-white dark:bg-gray-700 shadow text-emerald-600' : 'text-gray-500'}`}
                            >
                                <Repeat size={14} className="inline mr-1" /> Berulang
                            </button>
                            <button 
                                onClick={() => setScheduleMode('specific')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${scheduleMode === 'specific' ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-500'}`}
                            >
                                <Calendar size={14} className="inline mr-1" /> Tanggal Tertentu
                            </button>
                        </div>

                        {scheduleMode === 'recurring' ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs text-gray-500 ml-1">Ulangi Hari</label>
                                <div className="flex justify-between gap-1">
                                    {DAYS.map((d, i) => (
                                        <button
                                            key={i}
                                            onClick={() => toggleDay(i)}
                                            className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${selectedDays.includes(i) ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs text-gray-500 ml-1">Pilih Tanggal</label>
                                <Input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)} />
                            </div>
                        )}
                    </div>

                    <Button onClick={handleSave} className="w-full mt-2">Simpan Pengingat</Button>
                </div>
            </Modal>
        </div>
    );
};
