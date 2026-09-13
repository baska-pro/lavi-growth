
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, Calendar, Clock, CheckCircle, X, Baby, Heart, 
    Droplet, Cake, AlertTriangle, ChevronRight, ArrowRight 
} from 'lucide-react';
import { Profile, Reminder, MenstrualCycle, ProfileType } from '../../types';
import { calculateDetailedAge, calculateCycleStats, getPregnancyWeek, formatDate } from '../../utils';
import { VACCINE_SCHEDULE } from '../../data/medicalData';
import { Button } from '../UI';

interface DailyBriefingProps {
    isOpen: boolean;
    onClose: () => void;
    profiles: Profile[];
    reminders: Reminder[];
    cycles: MenstrualCycle[];
}

export const DailyBriefingModal: React.FC<DailyBriefingProps> = ({
    isOpen, onClose, profiles, reminders, cycles
}) => {
    const [notifPermission, setNotifPermission] = useState(Notification.permission);
    
    // --- Request Notification ---
    const requestNotif = async () => {
        const res = await Notification.requestPermission();
        setNotifPermission(res);
        if(res === 'granted') {
            new Notification("Lavi Growth Tracker", { body: "Terima kasih! Notifikasi berhasil diaktifkan." });
        }
    };

    // --- Logic Aggregation ---
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday
    const currentDateString = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth() + 1;
    const currentDayDate = today.getDate();

    // 1. Filter Reminders for TODAY (Only future times)
    const sanitizeTime = (t: string) => {
        if (t.includes('T')) return t.split('T')[1].substring(0, 5);
        if (t.length > 5 && t.includes(':')) return t.substring(0, 5);
        return t;
    };

    const todaysReminders = reminders.filter(r => 
        r.active && 
        (r.specificDate === currentDateString || (!r.specificDate && r.days.includes(currentDay)))
    ).map(r => ({
        ...r,
        cleanTime: sanitizeTime(r.time)
    })).filter(r => {
        // FILTER: Hanya tampilkan jika jam pengingat >= jam sekarang
        const rTimeVal = parseInt(r.cleanTime.replace(':', ''), 10);
        const nowTimeVal = parseInt(`${today.getHours()}${String(today.getMinutes()).padStart(2,'0')}`, 10);
        
        return rTimeVal >= nowTimeVal;
    }).sort((a, b) => a.cleanTime.localeCompare(b.cleanTime));

    // 1.5 Filter Upcoming Important Reminders (Non-Medication, 1-3 Days ahead)
    const upcomingEvents = [];
    const DAYS_LABEL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    for (let i = 1; i <= 3; i++) {
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + i);
        const futureDateString = futureDate.toISOString().split('T')[0];
        const futureDayIdx = futureDate.getDay();
        
        // Find reminders active on that day, NOT medication
        const events = reminders.filter(r => 
            r.active && 
            r.type !== 'medication' && 
            (
                // Logic: Either it matches the specific date
                r.specificDate === futureDateString ||
                // OR it's a recurring reminder (no specific date) on that day of week
                (!r.specificDate && r.days.includes(futureDayIdx))
            )
        );

        if (events.length > 0) {
            upcomingEvents.push({
                label: i === 1 ? 'Besok' : DAYS_LABEL[futureDayIdx],
                date: futureDate.getDate(),
                items: events
            });
        }
    }

    // 2. Birthday Check
    const birthdayProfiles = profiles.filter(p => {
        const d = new Date(p.dob);
        return d.getDate() === currentDayDate && (d.getMonth() + 1) === currentMonth;
    });

    // 3. Women's Health (Cycle & Pregnancy)
    const womenStatus = profiles.filter(p => p.gender === 'Female' && (p.type === ProfileType.ADULT || p.type === ProfileType.PREGNANCY)).map(p => {
        if (p.type === ProfileType.PREGNANCY) {
            const week = getPregnancyWeek(p.dob); 
            return { type: 'pregnancy', name: p.name, week, text: `Kehamilan Minggu ke-${week}` };
        } 
        else if (p.isPregnant) {
            const hasDedicatedPregnancyProfile = profiles.some(prof => prof.type === ProfileType.PREGNANCY);
            if (hasDedicatedPregnancyProfile) return null;

            const hphtCycle = cycles
                .filter(c => c.profileId === p.id)
                .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
            
            const hphtDate = hphtCycle ? hphtCycle.startDate : new Date().toISOString(); 
            const week = getPregnancyWeek(hphtDate);
            return { type: 'pregnancy', name: p.name, week, text: `Kehamilan Minggu ke-${week}` };
        } 
        else if (p.type === ProfileType.ADULT) {
            const myCycles = cycles.filter(c => c.profileId === p.id).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            if (myCycles.length > 0) {
                const last = myCycles[0];
                const start = new Date(last.startDate); start.setHours(0,0,0,0);
                const now = new Date(); now.setHours(0,0,0,0);
                const day = Math.ceil((now.getTime() - start.getTime()) / (86400000)) + 1;
                
                const { avgLength } = calculateCycleStats(myCycles);
                const daysUntilNext = avgLength - day;
                const isFertile = daysUntilNext >= 12 && daysUntilNext <= 16;

                return { 
                    type: 'cycle', 
                    name: p.name, 
                    day, 
                    isFertile, 
                    text: isFertile ? `Hari ke-${day} (Masa Subur 🌸)` : `Siklus Hari ke-${day}`
                };
            }
        }
        return null;
    }).filter(Boolean);

    // 4. Baby Vaccine Check
    const vaccineAlerts = profiles.filter(p => p.type === ProfileType.BABY).map(p => {
        const dob = new Date(p.dob);
        const ageMonth = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
        const schedule = VACCINE_SCHEDULE.find(v => v.ageMonth === ageMonth);
        if (schedule && today.getDate() <= 7) { 
            return { name: p.name, age: ageMonth, vaccines: schedule.vaccines };
        }
        return null;
    }).filter(Boolean);

    const hour = today.getHours();
    const greeting = hour < 11 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 pointer-events-none">
                                <Bell size={100} />
                            </div>
                            <div className="relative z-10 pr-8">
                                <h2 className="text-2xl font-bold leading-tight">{greeting}, Keluarga!</h2>
                                <p className="text-emerald-100 text-sm mt-1">{formatDate(currentDateString)}</p>
                            </div>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                                className="absolute top-4 right-4 bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors z-50 cursor-pointer"
                                aria-label="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-5 overflow-y-auto space-y-6 flex-1">
                            
                            {notifPermission !== 'granted' && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
                                        <Bell size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">Aktifkan Notifikasi</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2">Supaya tidak ketinggalan jadwal obat & vaksin.</p>
                                        <Button size="sm" onClick={requestNotif} className="w-full text-xs h-8">Izinkan Sekarang</Button>
                                    </div>
                                </div>
                            )}

                            {birthdayProfiles.length > 0 && (
                                <div className="space-y-2">
                                    {birthdayProfiles.map(p => (
                                        <div key={p.id} className="bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-800 flex items-center gap-3 animate-pulse">
                                            <Cake size={24} className="text-pink-500" />
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white text-sm">Selamat Ulang Tahun, {p.name}! 🎂</p>
                                                <p className="text-xs text-gray-500">Semoga sehat selalu.</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Today's Schedule */}
                            <div>
                                <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                                    <Clock size={14} /> Jadwal Selanjutnya Hari Ini
                                </h3>
                                {todaysReminders.length === 0 ? (
                                    <div className="text-center py-4 text-gray-400 text-sm italic bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        Tidak ada jadwal tersisa hari ini.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {todaysReminders.map(r => {
                                            const pName = profiles.find(p => p.id === r.profileId)?.name || 'Umum';
                                            return (
                                                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white dark:bg-gray-800 border-emerald-100 dark:border-emerald-900 shadow-sm">
                                                    <div className="text-xs font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-600">
                                                        {r.cleanTime}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{r.title}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{pName} • {r.type}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Upcoming Important Events (Non-Drug) */}
                            {upcomingEvents.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                                        <Calendar size={14} /> Akan Datang (Penting)
                                    </h3>
                                    <div className="space-y-3">
                                        {upcomingEvents.map((group, idx) => (
                                            <div key={idx} className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800 p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded">
                                                        {group.label} ({group.date})
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {group.items.map((item: any) => {
                                                        const pName = profiles.find(p => p.id === item.profileId)?.name || 'Umum';
                                                        return (
                                                            <div key={item.id} className="flex items-start gap-2 text-sm">
                                                                <ArrowRight size={14} className="text-blue-400 mt-0.5" />
                                                                <div>
                                                                    <p className="font-semibold text-gray-800 dark:text-white leading-tight">{item.title}</p>
                                                                    <p className="text-[10px] text-gray-500">{item.time} • {pName}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Women's & Pregnancy Insights */}
                            {womenStatus.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3 flex items-center gap-2">
                                        <Heart size={14} /> Info Kesehatan
                                    </h3>
                                    <div className="space-y-2">
                                        {womenStatus.map((ws: any, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800">
                                                <div className="p-2 bg-white dark:bg-gray-800 rounded-full text-purple-500">
                                                    {ws.type === 'pregnancy' ? <Baby size={16} /> : <Droplet size={16} />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-gray-800 dark:text-white">{ws.name}</p>
                                                    <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">{ws.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Vaccine Alerts */}
                            {vaccineAlerts.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                                    <h4 className="font-bold text-sm text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                                        <AlertTriangle size={16} /> Jadwal Imunisasi Bulan Ini
                                    </h4>
                                    {vaccineAlerts.map((va, idx) => (
                                        <div key={idx} className="text-xs text-amber-700 dark:text-amber-300 mb-2 last:mb-0">
                                            <b>{va?.name} (Usia {va?.age} Bulan):</b> {va?.vaccines.join(', ')}
                                        </div>
                                    ))}
                                    <Button size="sm" variant="ghost" onClick={onClose} className="w-full text-xs text-amber-600 mt-2 border border-amber-200">
                                        Cek Menu Jurnal
                                    </Button>
                                </div>
                            )}

                        </div>

                        {/* Footer Action */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <Button onClick={onClose} className="w-full justify-center shadow-lg">
                                Mengerti, Tutup
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
