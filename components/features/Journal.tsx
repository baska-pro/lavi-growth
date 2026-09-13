import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Syringe, Award, CheckCircle, Circle, Calendar, AlertCircle, Share2, Download, X } from 'lucide-react';
import { Profile, ProfileType, VaccineRecord, MilestoneRecord } from '../../types';
import { VACCINE_SCHEDULE, MILESTONES_DATA } from '../../data/medicalData';
import { formatDate, getAgeInMonths, generateId, calculateDetailedAge } from '../../utils';
import { Button, Card, Modal, Input } from '../UI';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';

interface JournalViewProps {
    profile: Profile;
    vaccines: VaccineRecord[];
    milestones: MilestoneRecord[];
    onUpdateVaccine: (vaccine: VaccineRecord) => void;
    onUpdateMilestone: (milestone: MilestoneRecord) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({ 
    profile, vaccines, milestones, onUpdateVaccine, onUpdateMilestone 
}) => {
    const [activeTab, setActiveTab] = useState<'vaccine' | 'milestone'>('vaccine');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    
    // Sharing State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState<any>(null);
    const [cardDownloading, setCardDownloading] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);
    const cardRef = React.useRef<HTMLDivElement>(null);

    // Form State
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
    const [notesInput, setNotesInput] = useState('');

    const currentAgeMonths = getAgeInMonths(profile.dob);

    const handleItemClick = (item: any, type: 'vaccine' | 'milestone') => {
        setSelectedItem({ ...item, type });
        setDateInput(new Date().toISOString().split('T')[0]);
        setNotesInput('');
        setModalOpen(true);
    };

    const handleSave = () => {
        // Trigger Micro-Interaction
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        if (selectedItem.type === 'vaccine') {
            const newRecord: VaccineRecord = {
                id: generateId(),
                profileId: profile.id,
                vaccineName: selectedItem.name,
                dateGiven: dateInput,
                notes: notesInput
            };
            onUpdateVaccine(newRecord);
        } else {
            const newRecord: MilestoneRecord = {
                id: generateId(),
                profileId: profile.id,
                milestoneId: selectedItem.id,
                dateAchieved: dateInput,
                notes: notesInput
            };
            onUpdateMilestone(newRecord);
        }
        setModalOpen(false);
    };

    const openShareModal = (e: React.MouseEvent, type: 'vaccine' | 'milestone', data: any) => {
        e.stopPropagation();
        setShareData({ ...data, type });
        setShareModalOpen(true);
    };

    const handleDownloadCard = async () => {
        if (!cardRef.current) return;
        setCardDownloading(true);
        setCardError(null);
        try {
            const canvas = await html2canvas(cardRef.current, { scale: 2 });
            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.download = `Milestone_${profile.name}_${Date.now()}.png`;
            link.href = image;
            link.click();
        } catch (e) {
            console.error("Gagal membuat gambar milestone:", e);
            setCardError("Gagal membuat gambar kartu.");
        } finally {
            setCardDownloading(false);
        }
    };

    const renderVaccineList = () => {
        return (
            <div className="space-y-4">
                {VACCINE_SCHEDULE.map((schedule, idx) => {
                    const isPassed = currentAgeMonths >= schedule.ageMonth;
                    return (
                        <div key={idx} className={`p-4 rounded-xl border ${isPassed ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-80'}`}>
                            <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                <Calendar size={14} /> Usia {schedule.ageMonth} Bulan
                            </h4>
                            <div className="space-y-2">
                                {schedule.vaccines.map((vName, vIdx) => {
                                    const record = vaccines.find(v => v.vaccineName === vName && v.profileId === profile.id);
                                    return (
                                        <div 
                                            key={vIdx} 
                                            onClick={() => !record && handleItemClick({ name: vName }, 'vaccine')}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${record ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-700'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {record ? <CheckCircle className="text-emerald-500" size={20} /> : <Circle className="text-gray-300" size={20} />}
                                                <span className={`text-sm font-medium ${record ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{vName}</span>
                                            </div>
                                            {record && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">{formatDate(record.dateGiven)}</span>
                                                    <button onClick={(e) => openShareModal(e, 'vaccine', record)} className="p-1 text-gray-400 hover:text-emerald-500">
                                                        <Share2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderMilestoneList = () => {
        // Group milestones by age
        const grouped = MILESTONES_DATA.reduce((acc: any, curr) => {
            if (!acc[curr.ageMonth]) acc[curr.ageMonth] = [];
            acc[curr.ageMonth].push(curr);
            return acc;
        }, {});

        return (
            <div className="space-y-4">
                {Object.keys(grouped).map((ageKey) => {
                    const age = parseInt(ageKey);
                    const items = grouped[ageKey];
                    // Show only relevant milestones (past or near future)
                    if (age > currentAgeMonths + 6) return null; 

                    return (
                        <div key={age} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                                <Award size={16} /> Target Usia {age} Bulan
                            </h4>
                            <div className="space-y-2">
                                {items.map((m: any) => {
                                    const record = milestones.find(r => r.milestoneId === m.id && r.profileId === profile.id);
                                    return (
                                        <div 
                                            key={m.id}
                                            onClick={() => !record && handleItemClick(m, 'milestone')}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer ${record ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-700'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    {record ? <CheckCircle className="text-blue-500 mt-0.5" size={18} /> : <Circle className="text-gray-300 mt-0.5" size={18} />}
                                                    <div>
                                                        <p className={`text-sm font-medium ${record ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{m.text}</p>
                                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mt-1 inline-block">{m.category}</span>
                                                    </div>
                                                </div>
                                                {record && (
                                                    <button onClick={(e) => openShareModal(e, 'milestone', { ...m, ...record })} className="p-1 text-gray-400 hover:text-blue-500">
                                                        <Share2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (profile.type !== ProfileType.BABY && profile.type !== ProfileType.CHILD) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                    <AlertCircle size={32} className="text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Fitur Tidak Tersedia</h3>
                <p className="text-gray-500 text-sm">Fitur Jurnal (Vaksinasi & Milestone) saat ini hanya tersedia untuk profil Bayi dan Anak.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab('vaccine')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'vaccine' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    <Syringe size={16} /> Imunisasi
                </button>
                <button 
                    onClick={() => setActiveTab('milestone')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'milestone' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                    <Award size={16} /> Milestone
                </button>
            </div>

            {activeTab === 'vaccine' ? renderVaccineList() : renderMilestoneList()}

            {/* Modal Input */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedItem?.type === 'vaccine' ? "Catat Vaksinasi" : "Catat Pencapaian"}>
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">{selectedItem?.type === 'vaccine' ? 'Vaksin' : 'Milestone'}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedItem?.type === 'vaccine' ? selectedItem?.name : selectedItem?.text}</p>
                    </div>
                    
                    <Input 
                        label="Tanggal Dilakukan/Tercapai" 
                        type="date" 
                        value={dateInput} 
                        onChange={e => setDateInput(e.target.value)} 
                    />
                    
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Catatan (Opsional)</label>
                        <textarea 
                            rows={3}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-4 outline-none"
                            placeholder="Lokasi suntik, reaksi demam, atau detail kemampuan..."
                            value={notesInput}
                            onChange={e => setNotesInput(e.target.value)}
                        />
                    </div>

                    <Button onClick={handleSave} className="w-full justify-center">Simpan Data</Button>
                </div>
            </Modal>

            {/* Visual Sharing Modal */}
            <AnimatePresence>
                {shareModalOpen && shareData && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden"
                        >
                            <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                                <h3 className="font-bold">Bagikan Pencapaian</h3>
                                <button onClick={() => setShareModalOpen(false)}><X size={20} /></button>
                            </div>
                            
                            <div className="p-6 bg-gray-100 dark:bg-gray-800 flex justify-center">
                                {/* The Card Visual to Screenshot */}
                                <div 
                                    ref={cardRef}
                                    className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-2xl w-full aspect-[4/5] flex flex-col justify-between relative overflow-hidden"
                                >
                                    {/* Decorative Circles */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>

                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                                            {shareData.type === 'vaccine' ? <Syringe size={20} /> : <Award size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Lavi Growth Tracker</p>
                                            <p className="text-xs font-semibold">Jurnal Kesehatan Anak</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 text-center my-4">
                                        <h2 className="text-2xl font-bold mb-2 leading-tight">
                                            {shareData.type === 'vaccine' ? shareData.vaccineName : shareData.text}
                                        </h2>
                                        <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-md border border-white/20">
                                            {shareData.type === 'vaccine' ? 'Telah Divaksinasi' : 'Milestone Tercapai'}
                                        </div>
                                    </div>

                                    <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-white/50">
                                                {profile.avatar && profile.avatar.length > 5 ? (
                                                    <img src={profile.avatar} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-emerald-600 font-bold">{profile.name[0]}</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{profile.name}</p>
                                                <p className="text-[10px] opacity-80">{calculateDetailedAge(profile.dob, profile.type)}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs opacity-90 border-t border-white/20 pt-2 flex justify-between">
                                            <span>Tanggal:</span>
                                            <span className="font-bold">{formatDate(shareData.type === 'vaccine' ? shareData.dateGiven : shareData.dateAchieved)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 space-y-2">
                                {cardError && (
                                    <p className="text-xs text-rose-500 font-medium text-center">{cardError}</p>
                                )}
                                <Button onClick={handleDownloadCard} isLoading={cardDownloading} className="w-full justify-center">
                                    <Download size={18} className="mr-2" /> {cardDownloading ? 'Memproses...' : 'Simpan Gambar'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};