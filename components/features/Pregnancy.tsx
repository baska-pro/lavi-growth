
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Baby, Scale, Smile, Heart, CheckCircle, Dna, Gift, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { Profile, ProfileType, HealthRecord, MenstrualCycle, Gender } from '../../types';
import { formatDate, getPregnancyWeek } from '../../utils';
import { PREGNANCY_MILESTONES, PREGNANCY_WEIGHT_STD } from '../../data/medicalData';
import { Modal, Card, Button, Input } from '../UI';

// --- HELPER: Calculate HPHT & Week ---
const usePregnancyCalculation = (profile: Profile, cycles: MenstrualCycle[]) => {
    const hphtDate = useMemo(() => {
        // STRICT PRIORITY: If the profile passed is explicitly a PREGNANCY profile (Janin),
        // we MUST use its DOB as the HPHT. This is the source of truth.
        if (profile.type === ProfileType.PREGNANCY) {
            return profile.dob;
        }
        
        // Only if it is NOT a pregnancy profile (e.g. it is the Mom), we try to calculate from cycles.
        if (cycles && cycles.length > 0) {
            const sorted = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            return sorted[0].startDate;
        }
        
        // Fallback: 4 weeks ago
        const d = new Date();
        d.setDate(d.getDate() - 28);
        return d.toISOString().split('T')[0];
    }, [profile, cycles]);

    const currentWeek = getPregnancyWeek(hphtDate);
    const currentMilestone = PREGNANCY_MILESTONES.find(m => m.week === currentWeek) || PREGNANCY_MILESTONES[PREGNANCY_MILESTONES.length - 1];

    return { hphtDate, currentWeek, currentMilestone };
};

// --- COMPONENT: Pregnancy Summary Card (For Dashboard Grid) ---
interface PregnancySummaryCardProps {
    profile: Profile;
    cycles: MenstrualCycle[]; // Needed for Adult pregnancy calculation
    onClick: () => void;
}

export const PregnancySummaryCard: React.FC<PregnancySummaryCardProps> = ({ profile, cycles, onClick }) => {
    const { currentWeek, currentMilestone } = usePregnancyCalculation(profile, cycles);

    return (
        <Card onClick={onClick} className="cursor-pointer hover:shadow-md transition-shadow bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900">
            <div className="flex flex-col items-center text-center gap-1">
                <div className="p-3 rounded-full mb-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                    <Dna size={24} />
                </div>
                <span className="text-xs text-indigo-400 font-bold uppercase">Janin</span>
                <span className="text-lg font-bold text-gray-800 dark:text-white">
                    Minggu {currentWeek}
                </span>
                <span className="text-[10px] text-gray-500">{currentMilestone?.visual} {currentMilestone?.size}</span>
            </div>
        </Card>
    );
};

// --- COMPONENT: Pregnancy Modal (Full Detail) ---
interface PregnancyModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile;
    records: HealthRecord[];
    cycles: MenstrualCycle[];
    onBirth: (profileId: string, name: string, gender: Gender, dob: string) => void;
}

export const PregnancyModal: React.FC<PregnancyModalProps> = ({ isOpen, onClose, profile, records, cycles, onBirth }) => {
    const [activeTab, setActiveTab] = useState<'dev' | 'weight' | 'mom' | 'birth'>('dev');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Birth Form State
    const [babyName, setBabyName] = useState("Bayi Baru");
    const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
    const [babyGender, setBabyGender] = useState<Gender>('Male');

    const { hphtDate, currentWeek, currentMilestone } = usePregnancyCalculation(profile, cycles);

    // Auto-scroll to current week
    useEffect(() => {
        if (isOpen && activeTab === 'dev' && scrollContainerRef.current) {
            setTimeout(() => {
                const activeEl = scrollContainerRef.current?.querySelector('[data-active="true"]');
                if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [isOpen, activeTab]);

    const handleConfirmBirth = () => {
        if (!babyName || !birthDate) return;
        onBirth(profile.id, babyName, babyGender, birthDate);
        onClose();
    };

    // Prepare Weight Data
    const weightChartData = useMemo(() => {
        const hphtTime = new Date(hphtDate).setHours(0,0,0,0);

        const pregnancyRecords = records.filter(r => {
            const rTime = new Date(r.date).setHours(0,0,0,0);
            return r.weight && rTime >= hphtTime;
        });

        const sorted = pregnancyRecords.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (sorted.length === 0) return [];

        const startWeight = sorted[0].weight || 0;

        return sorted.map(r => {
            const recTime = new Date(r.date).setHours(0,0,0,0);
            const diffTime = recTime - hphtTime;
            const week = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
            const gain = (r.weight || 0) - startWeight;
            
            const std = PREGNANCY_WEIGHT_STD.reduce((prev, curr) => 
                Math.abs(curr.week - week) < Math.abs(prev.week - week) ? curr : prev
            );

            return {
                week,
                gain: gain, 
                weight: r.weight,
                min: std.min,
                max: std.max
            };
        }).filter(d => d.week >= 0 && d.week <= 42);
    }, [records, hphtDate]);

    // Only show "Birth" tab if this is a dedicated Pregnancy Profile (Janin), not for Adult mode
    const showBirthTab = profile.type === ProfileType.PREGNANCY;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Kehamilan Minggu ${currentWeek}`}>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-4 overflow-x-auto">
                <button onClick={() => setActiveTab('dev')} className={`flex-1 min-w-[80px] py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'dev' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600' : 'text-gray-500'}`}>
                    <Baby size={16} /> Janin
                </button>
                <button onClick={() => setActiveTab('weight')} className={`flex-1 min-w-[80px] py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'weight' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600' : 'text-gray-500'}`}>
                    <Scale size={16} /> Berat
                </button>
                <button onClick={() => setActiveTab('mom')} className={`flex-1 min-w-[80px] py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'mom' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600' : 'text-gray-500'}`}>
                    <Smile size={16} /> Ibu
                </button>
                {showBirthTab && (
                    <button onClick={() => setActiveTab('birth')} className={`flex-1 min-w-[80px] py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'birth' ? 'bg-emerald-500 shadow-sm text-white' : 'text-emerald-600'}`}>
                        <Gift size={16} /> Lahir
                    </button>
                )}
            </div>

            <div className="min-h-[300px]">
                {activeTab === 'dev' && (
                    <div ref={scrollContainerRef} className="max-h-[60vh] overflow-y-auto pr-2 space-y-3 scroll-smooth">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl flex items-center gap-4 mb-4 border border-indigo-100 dark:border-indigo-800">
                            <div className="text-4xl">{currentMilestone.visual}</div>
                            <div>
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-200">Ukuran: {currentMilestone.size}</h4>
                                <p className="text-xs text-indigo-700 dark:text-indigo-300">Minggu ini janin Anda sebesar {currentMilestone.size}.</p>
                            </div>
                        </div>
                        {PREGNANCY_MILESTONES.map((m) => {
                            const isCurrent = m.week === currentWeek;
                            return (
                                <div 
                                    key={m.week}
                                    data-active={isCurrent}
                                    className={`relative p-4 rounded-xl border transition-all ${isCurrent ? 'bg-white dark:bg-gray-800 border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900 z-10' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-80'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isCurrent ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>Minggu {m.week}</span>
                                        <span className="text-lg">{m.visual}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 dark:text-white">{m.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{m.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'weight' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-sm flex items-center gap-2"><Scale size={16} /> Grafik Kenaikan Berat (Kg)</h4>
                            <div className="h-64 w-full text-xs">
                                {weightChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={weightChartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                            <XAxis dataKey="week" type="number" domain={[0, 40]} tickCount={9} allowDecimals={false} label={{ value: 'Minggu', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                                            <YAxis />
                                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                            <Area type="monotone" dataKey="max" stroke="none" fill="#d1fae5" name="Zona Ideal" />
                                            <Area type="monotone" dataKey="min" stroke="none" fill="#fff" />
                                            <Line type="monotone" dataKey="gain" stroke="#10b981" strokeWidth={3} dot={{r:4}} name="Kenaikan Anda" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                        <Scale size={24} className="opacity-50" />
                                        <p className="text-center">Belum ada data berat badan sejak tanggal HPHT ({formatDate(hphtDate)}).</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-[10px] text-gray-500 text-center">
                                *Area hijau: Estimasi kenaikan ideal BMI normal. Grafik dimulai dari 0 (berat awal saat HPHT).
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'mom' && (
                    <div className="max-h-[60vh] overflow-y-auto space-y-4">
                        <div className="bg-pink-50 dark:bg-pink-900/20 p-5 rounded-2xl border border-pink-100 dark:border-pink-800">
                            <div className="flex items-start gap-4">
                                <div className="bg-white dark:bg-gray-800 p-2 rounded-full text-pink-500 shadow-sm">
                                    <Heart size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-pink-700 dark:text-pink-300 mb-1">Tubuh Ibu Minggu Ini</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {currentMilestone.momTips}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h5 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Checklist Trimester Ini</h5>
                            {[
                                "Konsumsi Vitamin Prenatal / Asam Folat",
                                "Minum 8-10 gelas air sehari",
                                "Olahraga ringan (Jalan kaki / Yoga)"
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                                    <CheckCircle size={18} className="text-gray-300" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'birth' && (
                    <div className="space-y-6 py-4 animate-in slide-in-from-right duration-300">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                <Gift size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Selamat atas Kelahiran Si Kecil!</h3>
                            <p className="text-sm text-gray-500">Lengkapi data berikut untuk mengubah profil ini menjadi profil Bayi.</p>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800 space-y-4">
                            <Input label="Nama Lengkap Bayi" value={babyName} onChange={e => setBabyName(e.target.value)} />
                            <Input label="Tanggal Lahir" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                            
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Jenis Kelamin</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                        <input type="radio" checked={babyGender === 'Male'} onChange={() => setBabyGender('Male')} /> 
                                        <span className="text-sm font-bold text-blue-600">Laki-laki</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                        <input type="radio" checked={babyGender === 'Female'} onChange={() => setBabyGender('Female')} /> 
                                        <span className="text-sm font-bold text-pink-600">Perempuan</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleConfirmBirth} className="w-full py-3 text-lg shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white">
                            Konfirmasi Kelahiran
                        </Button>
                        <p className="text-[10px] text-center text-gray-400">
                            *Profil "Kandungan" akan berubah menjadi "Bayi". Data HPHT akan diganti menjadi Tanggal Lahir.
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};
