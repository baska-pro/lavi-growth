
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, BarChart2, BookOpen, Thermometer, Target as TargetIcon, 
  Plus, CheckCircle, Trash2, ChevronLeft, ChevronRight, Edit, Eye, EyeOff, Bell, Droplet, Heart, Baby, Calendar as CalendarIcon, Calculator, Activity, MapPin, Quote
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { HealthRecord, Profile, ProfileType, Target, METRIC_LABELS, Reminder, MenstrualCycle, Gender } from '../../types';
import { calculateDetailedAge, formatDate, calculateCycleStats, getProfileTheme, calculateBMI, calculateGrowthStatus } from '../../utils';
import { Card, Button, Modal } from '../UI';
import { MenstruationModal } from './Menstruation';
import { PregnancyModal, PregnancySummaryCard } from './Pregnancy';
import { getDailyQuote } from '../../services/externalApi';
import { NearbyFacilitiesModal } from './NearbyFacilities';

// --- Calendar Widget (Redesigned) ---
export const CalendarWidget: React.FC<{ 
    records: HealthRecord[]; 
    onSelectRecord: (r: HealthRecord) => void;
    theme: any;
}> = ({ records, onSelectRecord, theme }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const blanks = Array(firstDay).fill(null);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);

    const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const jumpToday = () => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));

    // Calculate monthly stats
    const monthRecords = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    });
    const sickDays = monthRecords.filter(r => r.symptoms && r.symptoms.length > 0).length;

    return (
        <Card className="flex flex-col bg-white dark:bg-gray-800 border-none shadow-sm h-full" noDefaultBg>
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex flex-col">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white capitalize leading-none">
                        {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </h4>
                    <span className="text-[10px] text-gray-400 mt-1 font-medium">
                        {monthRecords.length} Data • {sickDays > 0 ? `${sickDays} Sakit` : 'Sehat'}
                    </span>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md text-gray-500 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                    <button onClick={jumpToday} className={`px-2 text-[10px] font-bold text-gray-500 hover:${theme.primary} transition-colors uppercase`} title="Ke Hari Ini">Hari Ini</button>
                    <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded-md text-gray-500 transition-all shadow-sm"><ChevronRight size={16} /></button>
                </div>
            </div>
            
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                    <div key={i} className={i === 0 ? "text-red-400" : ""}>{d}</div>
                ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 lg:gap-2">
                {blanks.map((_, i) => <div key={`blank-${i}`} className="aspect-square" />)}
                {daysArray.map(day => {
                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const record = records.find(r => r.date === dateStr);
                    const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
                    
                    // Logic Indikator
                    const hasData = !!record;
                    const isSick = record?.symptoms && record.symptoms.length > 0;

                    return (
                        <motion.button 
                            key={day} 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                if (record) onSelectRecord(record);
                            }}
                            className={`
                                relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all border
                                ${isToday 
                                    ? `${theme.bgLight} ${theme.primary} ${theme.border} shadow-sm` 
                                    : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                                }
                                ${hasData ? 'cursor-pointer' : 'cursor-default'}
                            `}
                        >
                            <span className={`z-10 ${isToday ? 'font-bold' : ''}`}>{day}</span>
                            
                            {/* Indicators */}
                            <div className="flex gap-0.5 mt-1 h-1.5">
                                {hasData && (
                                    <div className={`w-1.5 h-1.5 rounded-full ${isSick ? 'bg-rose-500' : 'bg-emerald-400'}`}></div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </Card>
    );
};

// --- CALCULATOR CARD COMPONENT ---
const CalculatorCard: React.FC<{
    profile: Profile;
    latestMetrics: any;
}> = ({ profile, latestMetrics }) => {
    const isAdult = profile.type === ProfileType.ADULT || profile.type === ProfileType.SENIOR;
    const isChild = profile.type === ProfileType.BABY || profile.type === ProfileType.CHILD;
    
    if (!latestMetrics.weight) return null;

    let content = null;

    if (isAdult) {
        if (latestMetrics.height && latestMetrics.height > 100) {
            const bmi = calculateBMI(latestMetrics.weight, latestMetrics.height);
            
            // SPECIAL LOGIC FOR PREGNANT WOMEN
            if (profile.isPregnant) {
                content = (
                    <div className="flex flex-col items-center text-center gap-2 h-full justify-center w-full">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full">
                            <Baby size={22} />
                        </div>
                        <div className="flex flex-col items-center justify-center w-full px-1 gap-1">
                             <span className="text-2xl font-bold text-gray-800 dark:text-white leading-none tracking-tight">
                                {bmi ? bmi.value : '-'}
                             </span>
                             <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-normal leading-tight w-full text-center bg-indigo-100 text-indigo-700">
                                Masa Kehamilan
                             </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">BMI (Diabaikan)</span>
                    </div>
                );
            }
            // STANDARD BMI LOGIC
            else if (bmi) {
                content = (
                    <div className="flex flex-col items-center text-center gap-2 h-full justify-center w-full">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full">
                            <Calculator size={22} />
                        </div>
                        <div className="flex flex-col items-center justify-center w-full px-1 gap-1">
                             <span className="text-2xl font-bold text-gray-800 dark:text-white leading-none tracking-tight">{bmi.value}</span>
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-normal leading-tight w-full text-center ${bmi.color.replace('text-', 'bg-').replace('500', '100')} ${bmi.color}`}>
                                {bmi.status}
                             </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">BMI (IMT)</span>
                    </div>
                );
            }
        } else {
            content = (
                <div className="flex flex-col items-center text-center gap-1 h-full justify-center w-full">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full mb-1">
                        <Calculator size={24} />
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Cek Tinggi Badan</span>
                    <span className="text-[9px] text-gray-400 text-center leading-tight px-1">Data tinggi badan tidak valid untuk BMI.</span>
                </div>
            );
        }
    } else if (isChild) {
        const growth = calculateGrowthStatus(latestMetrics.weight, profile.dob, profile.gender);
        if (growth) {
            content = (
                <div className="flex flex-col items-center text-center gap-1 h-full justify-center w-full">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full mb-1">
                        <Activity size={24} />
                    </div>
                    <span className={`text-sm font-bold leading-tight px-1 line-clamp-2 ${growth.color}`}>
                        {growth.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                        Target: {growth.ideal.toFixed(1)} kg
                    </span>
                </div>
            );
        }
    }

    if (!content) return null;

    return (
        <Card className="cursor-default bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow p-3">
            {content}
        </Card>
    );
};

// --- Dashboard View ---
interface DashboardViewProps {
  activeProfile: Profile;
  profiles?: Profile[]; 
  activeRecords: HealthRecord[];
  activeTargets: Target[];
  activeReminders: Reminder[];
  activeMenstrualCycles?: MenstrualCycle[]; 
  onUpdateCycle?: (cycle: MenstrualCycle) => void; 
  onDeleteCycle?: (id: string) => void; 
  onTogglePregnancy?: (isPregnant: boolean) => void;
  onAddReminder?: (reminder: Reminder) => void;
  onBirth: (profileId: string, name: string, gender: Gender, dob: string) => void; 
  lastRecord?: HealthRecord;
  onTabChange: (tab: any) => void;
  onSelectRecord: (r: HealthRecord) => void;
  onShowTargetModal: () => void;
  onDeleteTarget: (id: string) => void;
  onEditProfile: (p: Profile) => void;
  onEditTarget: (t: Target) => void; 
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeProfile,
  profiles = [],
  activeRecords,
  activeTargets,
  activeReminders,
  activeMenstrualCycles = [],
  onUpdateCycle,
  onDeleteCycle,
  onTogglePregnancy,
  onAddReminder,
  onBirth,
  lastRecord, 
  onTabChange,
  onSelectRecord,
  onShowTargetModal,
  onDeleteTarget,
  onEditProfile,
  onEditTarget
}) => {
    const [showProfileDetails, setShowProfileDetails] = useState(false);
    const [showMenstrualModal, setShowMenstrualModal] = useState(false);
    const [showPregnancyModal, setShowPregnancyModal] = useState(false);
    const [showNearbyModal, setShowNearbyModal] = useState(false);
    const [dailyQuote, setDailyQuote] = useState<{text: string, author: string} | null>(null);
    
    const ageString = calculateDetailedAge(activeProfile.dob, activeProfile.type);
    const theme = getProfileTheme(activeProfile.type, activeProfile.gender);

    useEffect(() => {
        getDailyQuote().then(q => {
            if(q) setDailyQuote(q);
        });
    }, []);

    // --- SORTING & WATERFALL ---
    const { latestMetrics, displayRecord, strictSortedRecords } = useMemo(() => {
        const sorted = [...activeRecords].sort((a, b) => {
             if (b.date !== a.date) return b.date.localeCompare(a.date);
             const tA = a.time && a.time.length >= 4 ? a.time : "00:00";
             const tB = b.time && b.time.length >= 4 ? b.time : "00:00";
             if (tB !== tA) return tB.localeCompare(tA);
             return (b.timestamp || 0) - (a.timestamp || 0);
        });

        const isValid = (val: any) => {
            if (val === undefined || val === null || val === '') return false;
            if (typeof val === 'number' && val <= 0) return false;
            return true;
        };

        const getLatest = (key: keyof HealthRecord) => {
            for (const record of sorted) {
                if (isValid(record[key])) return record[key];
            }
            return undefined;
        };

        const getLatestArray = (key: keyof HealthRecord) => {
             for (const record of sorted) {
                 // @ts-ignore
                 if (record[key] && record[key].length > 0) return record[key];
             }
             return [];
        };

        return {
            strictSortedRecords: sorted,
            displayRecord: sorted[0],
            latestMetrics: {
                weight: getLatest('weight'),
                height: getLatest('height'),
                temp: getLatest('temperature'),
                symptoms: getLatestArray('symptoms'),
                notes: sorted.find(r => r.notes && r.notes.trim() !== '')?.notes || ''
            }
        };
    }, [activeRecords]);

    const displayWeight = latestMetrics.weight;
    const displayHeight = latestMetrics.height;
    const displayTemp = latestMetrics.temp;
    const lastInteractionDate = displayRecord ? formatDate(displayRecord.date) : '-';
    // @ts-ignore
    const hasSymptoms = latestMetrics.symptoms.length > 0;
    const activeReminderCount = activeReminders.filter(r => r.active).length;

    // --- Menstrual Logic ---
    const showMenstrualCard = activeProfile.type === ProfileType.ADULT && activeProfile.gender === 'Female';
    let menstrualStatusText = "Catat Siklus";
    let menstrualIsActive = false;
    let menstrualIsLate = false;
    let isFertileWindow = false;

    if (showMenstrualCard) {
        if (activeProfile.isPregnant) {
            menstrualStatusText = "Mode Hamil";
        } else if (activeMenstrualCycles.length > 0) {
            const sortedCycles = [...activeMenstrualCycles].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            const latest = sortedCycles[0];
            const { avgLength } = calculateCycleStats(activeMenstrualCycles);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const start = new Date(latest.startDate);
            start.setHours(0, 0, 0, 0);
            const daysDiff = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            if (!latest.endDate) {
                menstrualIsActive = true;
                menstrualStatusText = `Haid Hari ke-${daysDiff + 1}`;
            } else {
                const threshold = avgLength + 2; 
                if (daysDiff > threshold) {
                    menstrualIsLate = true;
                    menstrualStatusText = `Telat ${daysDiff - avgLength} Hari?`;
                } else {
                    const daysUntilNext = avgLength - daysDiff;
                    if (daysUntilNext >= 12 && daysUntilNext <= 16) {
                        isFertileWindow = true;
                        menstrualStatusText = "Fase Subur";
                    } else {
                        menstrualStatusText = `Hari ke-${daysDiff + 1} Siklus`;
                    }
                }
            }
        }
    }

    const showPregnancyFeatures = activeProfile.type === ProfileType.PREGNANCY || (activeProfile.type === ProfileType.ADULT && activeProfile.isPregnant);
    const pregnancyProfile = profiles.find(p => p.type === ProfileType.PREGNANCY);
    const effectivePregnancyProfile = pregnancyProfile || activeProfile;

    return (
      <div className="space-y-6">
        {showMenstrualCard && onUpdateCycle && onDeleteCycle && onTogglePregnancy && onAddReminder && (
            <MenstruationModal 
                isOpen={showMenstrualModal} 
                onClose={() => setShowMenstrualModal(false)}
                cycles={activeMenstrualCycles}
                profile={activeProfile}
                onSaveCycle={onUpdateCycle}
                onDeleteCycle={onDeleteCycle}
                onTogglePregnancy={onTogglePregnancy}
                onAddReminder={onAddReminder}
            />
        )}

        {showPregnancyFeatures && (
            <PregnancyModal 
                isOpen={showPregnancyModal}
                onClose={() => setShowPregnancyModal(false)}
                profile={effectivePregnancyProfile} 
                records={activeRecords}
                cycles={activeMenstrualCycles}
                onBirth={onBirth}
            />
        )}

        <NearbyFacilitiesModal isOpen={showNearbyModal} onClose={() => setShowNearbyModal(false)} />

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm relative overflow-hidden group">
             <div className={`absolute top-0 left-0 w-2 h-full ${theme.bg}`}></div>
             <div className="flex flex-row items-start gap-4 sm:gap-6 relative">
                 <div className="relative flex-shrink-0">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl ${theme.bgLight} overflow-hidden border ${theme.border} shadow-md flex items-center justify-center`}>
                        {activeProfile.avatar && activeProfile.avatar.length > 5 ? (
                            <img src={activeProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-4xl">{activeProfile.avatar || "👤"}</div>
                        )}
                    </div>
                 </div>
                 <div className="flex-1 min-w-0 pr-8">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">{activeProfile.name}</h2>
                        <span className={`text-xs font-semibold ${theme.primary} uppercase tracking-wider ${theme.bgLight} px-2 py-0.5 rounded-md mt-1 inline-block`}>
                            {activeProfile.type}
                        </span>
                    </div>
                    
                    <AnimatePresence>
                        {showProfileDetails && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mt-3 border-t border-gray-100 dark:border-gray-700 pt-2">
                                    <div>
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Usia</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{ageString}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Gender</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{activeProfile.gender === 'Male' ? 'Laki-laki' : 'Perempuan'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-3 gap-2 mt-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                        <div className="text-center">
                            <span className="block text-[10px] text-gray-400 uppercase">Berat</span>
                            <span className={`font-bold ${theme.primary} text-sm`}>{displayWeight ? `${displayWeight} kg` : '-'}</span>
                        </div>
                        <div className="text-center border-l border-gray-200 dark:border-gray-700">
                             <span className="block text-[10px] text-gray-400 uppercase">{activeProfile.type === ProfileType.BABY ? 'Pjg' : 'Tinggi'}</span>
                            <span className={`font-bold ${theme.primary} text-sm`}>{displayHeight ? `${displayHeight} cm` : '-'}</span>
                        </div>
                         <div className="text-center border-l border-gray-200 dark:border-gray-700">
                             <span className="block text-[10px] text-gray-400 uppercase">Suhu</span>
                            <span className={`font-bold ${theme.primary} text-sm`}>{displayTemp ? `${displayTemp}°C` : '-'}</span>
                        </div>
                    </div>
                 </div>
             </div>
             
             <div className="absolute top-4 right-4 flex flex-col gap-2">
                 <button onClick={() => onEditProfile(activeProfile)} className={`text-gray-300 hover:${theme.primary} transition-colors p-1`} title="Edit Profil">
                    <Edit size={16} />
                 </button>
                 <button onClick={() => setShowProfileDetails(!showProfileDetails)} className={`text-gray-300 hover:${theme.primary} transition-colors p-1`}>
                    {showProfileDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                 </button>
             </div>
        </div>

        {dailyQuote && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800 flex gap-4 items-start shadow-sm relative overflow-hidden">
                <Quote size={20} className="text-amber-400 flex-shrink-0" fill="currentColor" />
                <div className="relative z-10">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 italic">"{dailyQuote.text}"</p>
                    <p className="text-xs text-gray-500 mt-1 font-bold">— {dailyQuote.author}</p>
                </div>
                <div className="absolute -right-4 -bottom-4 text-amber-200 dark:text-amber-800 opacity-20">
                    <Quote size={80} fill="currentColor" />
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
             <CalculatorCard profile={activeProfile} latestMetrics={latestMetrics} />
             <Card onClick={() => onTabChange('data')} className="cursor-pointer hover:shadow-md transition-shadow p-3">
                <div className="flex flex-col items-center text-center gap-1 h-full justify-center">
                   <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full mb-1"><Database size={24} /></div>
                   <span className="text-2xl font-bold text-gray-800 dark:text-white leading-none">{activeRecords.length}</span>
                   <span className="text-xs text-gray-400 font-medium">Total Data</span>
                </div>
             </Card>
             <Card className="p-3">
                <div className="flex flex-col items-center text-center gap-1 h-full justify-center">
                   <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-full mb-1"><Thermometer size={24} /></div>
                   <span className={`text-lg font-bold leading-tight ${hasSymptoms ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>{hasSymptoms ? 'Sakit' : 'Sehat'}</span>
                   <span className="text-[10px] text-gray-400">{lastInteractionDate}</span>
                </div>
             </Card>
             <Card onClick={() => setShowNearbyModal(true)} className="cursor-pointer hover:shadow-md transition-shadow p-3 bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900">
                <div className="flex flex-col items-center text-center gap-2 h-full justify-center">
                   <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full"><MapPin size={24} /></div>
                   <span className="text-sm font-bold text-red-700 dark:text-red-300">Faskes Terdekat</span>
                </div>
             </Card>
             <Card onClick={() => onTabChange('reminders')} className="cursor-pointer hover:shadow-md transition-shadow p-3">
                <div className="flex flex-col items-center text-center gap-2 h-full justify-center">
                   <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full"><Bell size={24} /></div>
                   <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Pengingat</span>
                   <span className="text-xs text-gray-400 bg-rose-50 dark:bg-rose-900/10 px-2 py-0.5 rounded-full">{activeReminderCount} Aktif</span>
                </div>
             </Card>
             <Card onClick={() => onTabChange('articles')} className="cursor-pointer hover:shadow-md transition-shadow p-3">
                <div className="flex flex-col items-center text-center gap-2 h-full justify-center">
                   <div className="p-2 bg-teal-50 dark:bg-teal-900/20 text-teal-500 rounded-full"><BookOpen size={24} /></div>
                   <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Info Nutrisi</span>
                </div>
             </Card>
             {showMenstrualCard && (
                 <Card onClick={() => setShowMenstrualModal(true)} className="cursor-pointer hover:shadow-md transition-shadow bg-pink-50/50 dark:bg-pink-900/10 border-pink-100 dark:border-pink-900 p-3">
                    <div className="flex flex-col items-center text-center gap-1 h-full justify-center">
                       <div className={`p-2 rounded-full mb-1 ${activeProfile.isPregnant ? 'bg-indigo-100 text-indigo-500' : isFertileWindow ? 'bg-purple-100 text-purple-500' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600'}`}>
                          {activeProfile.isPregnant ? <Baby size={24} /> : isFertileWindow ? <Heart size={24} fill="currentColor" /> : <Droplet size={24} fill={menstrualIsActive ? "currentColor" : "none"} />}
                       </div>
                       <span className="text-xs text-pink-400 font-bold uppercase">{activeProfile.isPregnant ? 'Kehamilan' : 'Siklus'}</span>
                       <span className={`text-lg font-bold leading-tight ${menstrualIsLate ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>{menstrualStatusText}</span>
                    </div>
                 </Card>
             )}
             {showPregnancyFeatures && <PregnancySummaryCard profile={effectivePregnancyProfile} cycles={activeMenstrualCycles} onClick={() => setShowPregnancyModal(true)} />}
        </div>

        <div className="mt-2 h-[350px]">
             <CalendarWidget records={strictSortedRecords} onSelectRecord={onSelectRecord} theme={theme} />
        </div>

        <div className="space-y-3">
           <div className="flex justify-between items-center px-1">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                 <TargetIcon size={20} className="text-red-500" /> Target Kesehatan
              </h3>
              <Button size="sm" variant="ghost" onClick={onShowTargetModal} className="text-xs">
                 <Plus size={14} /> Tambah Target
              </Button>
           </div>
           
           {activeTargets.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                 <p className="text-gray-400 text-sm mb-3">Belum ada target yang diatur.</p>
                 <Button size="sm" variant="secondary" onClick={onShowTargetModal}>Mulai Set Target</Button>
              </div>
           ) : (
              <div className="grid gap-3">
                 {activeTargets.map(target => {
                    // @ts-ignore
                    const targetMetricValue = latestMetrics[target.field === 'weight' ? 'weight' : target.field === 'height' ? 'height' : 'temp'];
                    const currentVal = (targetMetricValue !== undefined && targetMetricValue !== null) ? Number(targetMetricValue) : 0;
                    
                    const progress = Math.min(100, (currentVal / target.targetValue) * 100);
                    const isReached = currentVal >= target.targetValue;
                    
                    return (
                       <div key={target.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 shadow-sm">
                          <div className={`p-3 rounded-full ${isReached ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} dark:bg-gray-700 dark:text-gray-300`}>
                             {isReached ? <CheckCircle size={20} /> : <TargetIcon size={20} />}
                          </div>
                          <div className="flex-1">
                             <div className="flex justify-between mb-1">
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{METRIC_LABELS[target.field] || target.field}</span>
                                <span className="text-xs font-bold text-gray-500">
                                   {currentVal} / {target.targetValue}
                                </span>
                             </div>
                             <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${progress}%` }}
                                   className={`h-full rounded-full ${isReached ? 'bg-green-500' : 'bg-emerald-500'}`}
                                />
                             </div>
                          </div>
                          <div className="flex items-center gap-1">
                              <button onClick={() => onEditTarget(target)} className="text-gray-300 hover:text-blue-500 p-1">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => onDeleteTarget(target.id)} className="text-gray-300 hover:text-red-500 p-1">
                                <Trash2 size={16} />
                              </button>
                          </div>
                       </div>
                    );
                 })}
              </div>
           )}
        </div>
      </div>
    );
};
