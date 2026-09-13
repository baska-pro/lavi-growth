
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Droplet, Calendar as CalendarIcon, Trash2, Heart, Baby, Bell, X, 
    ChevronLeft, ChevronRight, Flower2, Sparkles, History, Plus, Save, 
    Activity, Info, AlertCircle 
} from 'lucide-react';
import { MenstrualCycle, MenstrualFlow, Profile, Reminder } from '../../types';
import { Button, Modal, Input, Toast } from '../UI';
import { formatDate, generateId, calculateCycleStats } from '../../utils';

interface MenstruationModalProps {
    isOpen: boolean;
    onClose: () => void;
    cycles: MenstrualCycle[];
    profile: Profile;
    onSaveCycle: (cycle: MenstrualCycle) => void;
    onDeleteCycle: (id: string) => void;
    onTogglePregnancy: (isPregnant: boolean) => void;
    onAddReminder: (reminder: Reminder) => void;
}

const MENSTRUAL_SYMPTOMS = [
    "Kram Perut", "Sakit Kepala", "Nyeri Payudara", "Jerawat", "Lelah", 
    "Mood Swing", "Sakit Punggung", "Kembung", "Mual", "Insomnia", "Nafsu Makan Naik"
];

export const MenstruationModal: React.FC<MenstruationModalProps> = ({
    isOpen, onClose, cycles, profile, onSaveCycle, onDeleteCycle, onTogglePregnancy, onAddReminder
}) => {
    // --- State ---
    const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'history'>('input');
    const [showToast, setShowToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);

    // Current Status Logic
    const sortedCycles = useMemo(() => [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()), [cycles]);
    const latestCycle = sortedCycles[0];
    const isCurrentlyMenstruating = latestCycle && !latestCycle.endDate;

    // --- Input State ---
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
    const [selectedFlow, setSelectedFlow] = useState<MenstrualFlow | undefined>(undefined);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    
    // --- History Modal State ---
    const [isAddingHistory, setIsAddingHistory] = useState(false);
    const [historyStart, setHistoryStart] = useState('');
    const [historyEnd, setHistoryEnd] = useState('');
    
    // --- Pregnancy Setup State ---
    const [isSettingPregnancy, setIsSettingPregnancy] = useState(false);
    const [hphtDate, setHphtDate] = useState(new Date().toISOString().split('T')[0]);

    // --- Calendar View State ---
    const [viewDate, setViewDate] = useState(new Date());

    // --- Initialization ---
    useEffect(() => {
        if (isOpen) {
            if (isCurrentlyMenstruating && latestCycle) {
                setDateInput(latestCycle.startDate);
                setSelectedFlow(latestCycle.flow);
                setSelectedSymptoms(latestCycle.symptoms || []);
            } else {
                setDateInput(new Date().toISOString().split('T')[0]);
                setSelectedFlow(undefined);
                setSelectedSymptoms([]);
            }
            
            if (profile.isPregnant) {
                setActiveTab('analysis');
            } else {
                setActiveTab('input');
            }
            
            setIsAddingHistory(false);
            setIsSettingPregnancy(false);
            
            if (latestCycle) {
                setHphtDate(latestCycle.startDate);
            }
        }
    }, [isOpen]); 

    // Watch for Pregnancy Status Change
    useEffect(() => {
        if (profile.isPregnant) {
            setIsSettingPregnancy(false);
            setActiveTab('analysis');
        }
    }, [profile.isPregnant]);
    
    // --- Stats & Prediction ---
    const { avgLength, avgDuration } = calculateCycleStats(cycles);
    
    const normalizeDate = (d: Date) => {
        const newD = new Date(d);
        newD.setHours(0,0,0,0);
        return newD;
    };

    const nextPeriod = useMemo(() => {
        if (!latestCycle) return null;
        const lastStart = new Date(latestCycle.startDate);
        const nextDate = new Date(lastStart);
        nextDate.setDate(lastStart.getDate() + avgLength);
        return nextDate;
    }, [latestCycle, avgLength]);

    const ovulationDate = useMemo(() => {
        return nextPeriod ? new Date(new Date(nextPeriod).getTime() - (14 * 24 * 60 * 60 * 1000)) : null;
    }, [nextPeriod]);
    
    const today = normalizeDate(new Date());

    const currentCycleDay = useMemo(() => {
        if (!latestCycle) return 0;
        const start = normalizeDate(new Date(latestCycle.startDate));
        return Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, [latestCycle, today]);

    // --- Handlers ---

    const handleStartPeriod = () => {
        const newCycle: MenstrualCycle = {
            id: generateId(),
            profileId: profile.id,
            startDate: dateInput,
            flow: selectedFlow || 'Medium',
            symptoms: selectedSymptoms
        };
        onSaveCycle(newCycle);
        setShowToast({ msg: "Siklus baru dimulai", type: 'success' });
    };

    const handleUpdateCurrent = () => {
        if (!latestCycle) return;
        const updated: MenstrualCycle = {
            ...latestCycle,
            startDate: dateInput,
            flow: selectedFlow,
            symptoms: selectedSymptoms
        };
        onSaveCycle(updated);
        setShowToast({ msg: "Data hari ini diperbarui", type: 'success' });
    };

    const handleEndPeriod = () => {
        if (latestCycle) {
            const endDate = new Date().toISOString().split('T')[0];
            const updatedCycle: MenstrualCycle = {
                ...latestCycle,
                endDate: endDate, 
                flow: selectedFlow,
                symptoms: selectedSymptoms
            };
            onSaveCycle(updatedCycle);
            onClose(); // Optional: Close modal after ending
        }
    };

    const handleSaveHistory = () => {
        if (!historyStart || !historyEnd) {
            setShowToast({ msg: "Tanggal wajib diisi lengkap", type: 'error' });
            return;
        }
        if (new Date(historyStart) > new Date(historyEnd)) {
            setShowToast({ msg: "Tanggal selesai sebelum mulai?", type: 'error' });
            return;
        }

        const newCycle: MenstrualCycle = {
            id: generateId(),
            profileId: profile.id,
            startDate: historyStart,
            endDate: historyEnd,
            flow: 'Medium',
            symptoms: []
        };
        onSaveCycle(newCycle);
        setShowToast({ msg: "Riwayat berhasil disimpan", type: 'success' });
        setIsAddingHistory(false);
        setHistoryStart('');
        setHistoryEnd('');
    };

    const toggleSymptom = (s: string) => {
        if (selectedSymptoms.includes(s)) {
            setSelectedSymptoms(prev => prev.filter(item => item !== s));
        } else {
            setSelectedSymptoms(prev => [...prev, s]);
        }
    };

    // --- Pregnancy Handlers ---
    
    const handlePregnancyToggleChange = (checked: boolean) => {
        if (checked) {
            setIsSettingPregnancy(true);
            if (latestCycle) setHphtDate(latestCycle.startDate);
        } else {
            onTogglePregnancy(false);
            setIsSettingPregnancy(false);
            setShowToast({ msg: "Mode Kehamilan Nonaktif", type: 'info' });
        }
    };

    const confirmPregnancy = () => {
        // Save HPHT as a marker cycle
        const newCycle: MenstrualCycle = {
            id: generateId(),
            profileId: profile.id,
            startDate: hphtDate,
            flow: 'Spotting', 
            notes: "HPHT (Mulai Kehamilan)"
        };
        onSaveCycle(newCycle);
        onTogglePregnancy(true);
        setShowToast({ msg: "Selamat! Mode Hamil Aktif.", type: 'success' });
    };

    const createSmartReminders = () => {
        if (!nextPeriod || !ovulationDate) return;
        const pDate = new Date(nextPeriod); pDate.setDate(pDate.getDate() - 2);
        const oDate = new Date(ovulationDate); oDate.setDate(oDate.getDate() - 1);

        onAddReminder({
            id: generateId(), profileId: profile.id,
            title: "Siapkan Kebutuhan Bulanan (H-2)", time: "08:00",
            days: [pDate.getDay()], active: true, type: 'other'
        });
        onAddReminder({
            id: generateId(), profileId: profile.id,
            title: "Puncak Masa Subur Besok", time: "19:00",
            days: [oDate.getDay()], active: true, type: 'checkup'
        });
        setShowToast({ msg: "Pengingat siklus dibuat", type: 'success' });
    };

    // --- Renderers ---

    const renderFlowSelector = () => (
        <div className="grid grid-cols-4 gap-2">
            {['Light', 'Medium', 'Heavy', 'Spotting'].map(f => {
                const isSelected = selectedFlow === f;
                let colorClass = "";
                switch(f) {
                    case 'Light': colorClass = isSelected ? 'bg-cyan-100 text-cyan-700 border-cyan-300' : 'hover:bg-cyan-50'; break;
                    case 'Medium': colorClass = isSelected ? 'bg-pink-100 text-pink-700 border-pink-300' : 'hover:bg-pink-50'; break;
                    case 'Heavy': colorClass = isSelected ? 'bg-red-100 text-red-700 border-red-300' : 'hover:bg-red-50'; break;
                    case 'Spotting': colorClass = isSelected ? 'bg-amber-100 text-amber-700 border-amber-300' : 'hover:bg-amber-50'; break;
                }
                return (
                    <button 
                        key={f} 
                        onClick={() => setSelectedFlow(f as MenstrualFlow)}
                        className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${isSelected ? `border-2 ${colorClass}` : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}`}
                    >
                        <span className="text-lg">
                            {f === 'Light' ? '💧' : f === 'Medium' ? '💧💧' : f === 'Heavy' ? '🩸' : '✨'}
                        </span>
                        {f}
                    </button>
                )
            })}
        </div>
    );

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ChevronLeft size={20}/></button>
                    <h4 className="font-bold text-gray-800 dark:text-white">
                        {viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ChevronRight size={20}/></button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
                        <div key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                    {days.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} />;
                        
                        const normDate = normalizeDate(date);
                        
                        let isPeriod = false;
                        let isPredicted = false;
                        let isOvulation = false;
                        let isFertile = false;

                        cycles.forEach(c => {
                            const start = normalizeDate(new Date(c.startDate));
                            let end;
                            if (c.endDate) {
                                end = normalizeDate(new Date(c.endDate));
                            } else {
                                if (isCurrentlyMenstruating && c.id === latestCycle?.id) {
                                    end = today; 
                                } else {
                                    end = new Date(start);
                                    end.setDate(start.getDate() + (avgDuration - 1));
                                }
                            }
                            if (normDate >= start && normDate <= end) isPeriod = true;
                        });

                        if (!isPeriod && !profile.isPregnant && latestCycle) {
                             const latestStart = normalizeDate(new Date(latestCycle.startDate));
                             if (normDate > latestStart) {
                                 const daysSince = Math.floor((normDate.getTime() - latestStart.getTime()) / (1000 * 60 * 60 * 24));
                                 const dayInCycle = daysSince % avgLength;
                                 
                                 if (Math.floor(daysSince / avgLength) > 0 && dayInCycle < avgDuration) isPredicted = true;
                                 
                                 const ovDay = avgLength - 14;
                                 if (dayInCycle === ovDay) isOvulation = true;
                                 if (dayInCycle >= ovDay - 5 && dayInCycle <= ovDay + 1) isFertile = true;
                             }
                        }

                        const isToday = normDate.getTime() === today.getTime();
                        let bgClass = "bg-transparent text-gray-700 dark:text-gray-300";
                        
                        if (isPeriod) bgClass = "bg-pink-500 text-white shadow-md shadow-pink-200 dark:shadow-none";
                        else if (isPredicted) bgClass = "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300 border-dashed border border-pink-300";
                        else if (isOvulation) bgClass = "bg-yellow-100 text-yellow-700 border-2 border-yellow-400";
                        else if (isFertile) bgClass = "bg-emerald-50 text-emerald-600";

                        return (
                            <div key={idx} className={`relative h-9 w-9 flex items-center justify-center rounded-full text-xs font-medium transition-all mx-auto ${bgClass} ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''}`}>
                                {isOvulation ? <Flower2 size={16} /> : date.getDate()}
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 mt-4 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div> Haid</div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-500"></div> Ovulasi</div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-100 text-emerald-600"></div> Subur</div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-pink-100 border border-dashed border-pink-400"></div> Prediksi</div>
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Siklus & Kesehatan Wanita">
            {showToast && <Toast message={showToast.msg} type={showToast.type} onClose={() => setShowToast(null)} />}
            
            {/* Custom Tab Navigation */}
            <div className="grid grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl mb-6">
                {[
                    { id: 'input', label: 'Input Harian', icon: <Plus size={14} /> },
                    { id: 'analysis', label: 'Analisis', icon: <Activity size={14} /> },
                    { id: 'history', label: 'Riwayat', icon: <History size={14} /> }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white dark:bg-gray-700 text-pink-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB CONTENT: INPUT */}
            {activeTab === 'input' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Status Banner */}
                    <div className={`relative overflow-hidden p-6 rounded-3xl text-center border transition-all ${
                        profile.isPregnant 
                        ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 text-indigo-800' 
                        : isCurrentlyMenstruating 
                            ? 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 text-pink-800' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                        {profile.isPregnant ? (
                            <>
                                <Baby className="mx-auto text-indigo-500 mb-2" size={32} />
                                <h3 className="font-bold text-lg">Mode Kehamilan</h3>
                                <p className="text-xs opacity-80">Pantau janin di menu Dashboard.</p>
                            </>
                        ) : (
                            <>
                                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2 ${isCurrentlyMenstruating ? 'bg-pink-200 text-pink-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                    <Droplet size={28} fill={isCurrentlyMenstruating ? "currentColor" : "none"} />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                    {isCurrentlyMenstruating ? "Sedang Menstruasi" : "Tidak Sedang Haid"}
                                </h3>
                                {isCurrentlyMenstruating && latestCycle && (
                                    <span className="inline-block mt-1 px-3 py-1 bg-white/50 rounded-full text-xs font-bold border border-pink-200">
                                        Hari ke-{currentCycleDay}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {!profile.isPregnant && (
                        <div className="space-y-5">
                            {/* Date & Flow Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tanggal & Intensitas</label>
                                    <span className="text-xs text-gray-400">{dateInput}</span>
                                </div>
                                <Input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} />
                                {renderFlowSelector()}
                            </div>

                            {/* Symptoms Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 px-1">Gejala yang dirasakan</label>
                                <div className="flex flex-wrap gap-2">
                                    {MENSTRUAL_SYMPTOMS.map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => toggleSymptom(s)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                selectedSymptoms.includes(s) 
                                                ? 'bg-purple-100 border-purple-400 text-purple-700 shadow-sm' 
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-4">
                                {isCurrentlyMenstruating ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="secondary" onClick={handleUpdateCurrent}>Update Data</Button>
                                        <Button onClick={handleEndPeriod} className="bg-gray-800 hover:bg-gray-900 text-white">Selesai Haid</Button>
                                    </div>
                                ) : (
                                    <Button onClick={handleStartPeriod} className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 shadow-pink-200 shadow-lg border-none">
                                        <Droplet size={18} /> Konfirmasi Haid Dimulai
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: ANALYSIS */}
            {activeTab === 'analysis' && (
                <div className="space-y-5 animate-in fade-in duration-300">
                    
                    {profile.isPregnant ? (
                        <div className="text-center py-10 px-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                            <Baby size={56} className="mx-auto text-indigo-400 mb-4" />
                            <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">Mode Kehamilan Aktif</h3>
                            <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-6 leading-relaxed">
                                Prediksi siklus dinonaktifkan. Fokus pada nutrisi dan perkembangan janin Anda.
                            </p>
                            
                            <div className="flex justify-center">
                                <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Matikan Mode Hamil</span>
                                    <div className="relative inline-flex items-center">
                                        <input type="checkbox" className="sr-only peer" checked={profile.isPregnant} onChange={(e) => handlePregnancyToggleChange(e.target.checked)} />
                                        <div className="w-9 h-5 bg-indigo-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-300"></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    ) : isSettingPregnancy ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800 shadow-lg text-center space-y-5">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                                <Heart size={32} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Konfigurasi Awal</h3>
                                <p className="text-sm text-gray-500 mt-1">Masukkan Hari Pertama Haid Terakhir (HPHT) untuk menghitung usia kandungan.</p>
                            </div>
                            
                            <Input label="Tanggal HPHT" type="date" value={hphtDate} onChange={e => setHphtDate(e.target.value)} className="text-center font-bold" />
                            
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button variant="secondary" onClick={() => setIsSettingPregnancy(false)}>Batal</Button>
                                <Button onClick={confirmPregnancy} className="bg-indigo-600 hover:bg-indigo-700 text-white">Simpan & Aktifkan</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {renderCalendar()}

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-800 flex items-center gap-3">
                                    <div className="bg-white dark:bg-gray-800 p-2.5 rounded-full text-yellow-500 shadow-sm">
                                        <Flower2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-yellow-700 dark:text-yellow-500 tracking-wide">Estimasi Ovulasi</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">{ovulationDate ? formatDate(ovulationDate.toISOString()) : '-'}</p>
                                    </div>
                                </div>

                                <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-2xl border border-pink-100 dark:border-pink-800 flex items-center gap-3">
                                    <div className="bg-white dark:bg-gray-800 p-2.5 rounded-full text-pink-500 shadow-sm">
                                        <CalendarIcon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-pink-700 dark:text-pink-500 tracking-wide">Haid Berikutnya</p>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">{nextPeriod ? formatDate(nextPeriod.toISOString()) : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pregnancy Toggle Strip */}
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg text-indigo-600 dark:text-indigo-300">
                                        <Baby size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800 dark:text-white">Mode Kehamilan</p>
                                        <p className="text-[10px] text-gray-500">Aktifkan jika positif hamil</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={profile.isPregnant || false} onChange={(e) => handlePregnancyToggleChange(e.target.checked)} />
                                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <Button variant="ghost" onClick={createSmartReminders} className="w-full text-xs text-gray-500 border border-dashed border-gray-300 hover:bg-gray-50">
                                <Bell size={14} /> Buat Pengingat Otomatis
                            </Button>
                        </>
                    )}
                </div>
            )}
            
            {/* TAB CONTENT: HISTORY */}
            {activeTab === 'history' && (
                 <div className="space-y-4 animate-in fade-in duration-300">
                     {!isAddingHistory ? (
                         <>
                             <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                                 <div>
                                     <h3 className="font-bold text-gray-900 dark:text-white text-sm">Riwayat Siklus</h3>
                                     <p className="text-[10px] text-gray-500 mt-0.5">Rata-rata siklus: <b>{avgLength} hari</b></p>
                                 </div>
                                 <Button size="sm" onClick={() => setIsAddingHistory(true)} className="gap-1 text-xs px-3 h-8">
                                     <Plus size={14} /> Manual
                                 </Button>
                             </div>
                             
                             <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                                 {sortedCycles.length === 0 ? (
                                     <div className="text-center py-10 text-gray-400 text-sm italic">Belum ada riwayat tercatat.</div>
                                 ) : (
                                     sortedCycles.map((c, idx) => {
                                         const start = new Date(c.startDate);
                                         const end = c.endDate ? new Date(c.endDate) : null;
                                         const duration = end 
                                             ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1 
                                             : null;
                                         
                                         return (
                                             <div key={c.id} className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 pb-4 last:pb-0">
                                                 <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-pink-400 border-2 border-white dark:border-gray-900"></div>
                                                 <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center">
                                                     <div>
                                                         <p className="font-bold text-gray-800 dark:text-white text-xs">
                                                             {formatDate(c.startDate)}
                                                         </p>
                                                         <p className="text-[10px] text-gray-500 mt-0.5">
                                                             {end ? `Selesai: ${formatDate(c.endDate!)}` : <span className="text-pink-500 font-bold animate-pulse">Sedang Berlangsung</span>}
                                                         </p>
                                                         {c.notes && <p className="text-[10px] text-gray-400 mt-1 italic">"{c.notes}"</p>}
                                                     </div>
                                                     <div className="text-right">
                                                         {duration && <span className="inline-block text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded mb-1">{duration} Hari</span>}
                                                         <button onClick={() => onDeleteCycle(c.id)} className="block ml-auto text-gray-300 hover:text-red-500 p-1">
                                                             <Trash2 size={14} />
                                                         </button>
                                                     </div>
                                                 </div>
                                             </div>
                                         );
                                     })
                                 )}
                             </div>
                         </>
                     ) : (
                         <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4 animate-in slide-in-from-right duration-200">
                             <div className="flex justify-between items-center mb-1">
                                 <h3 className="font-bold text-gray-900 dark:text-white text-sm">Tambah Manual</h3>
                                 <button onClick={() => setIsAddingHistory(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                             </div>
                             
                             <Input label="Tanggal Mulai" type="date" value={historyStart} onChange={e => setHistoryStart(e.target.value)} />
                             <Input label="Tanggal Selesai" type="date" value={historyEnd} onChange={e => setHistoryEnd(e.target.value)} />
                             
                             <div className="flex gap-2 pt-2">
                                 <Button variant="secondary" onClick={() => setIsAddingHistory(false)} className="flex-1 text-xs">Batal</Button>
                                 <Button onClick={handleSaveHistory} className="flex-1 text-xs">Simpan</Button>
                             </div>
                         </div>
                     )}
                 </div>
            )}
        </Modal>
    );
};
