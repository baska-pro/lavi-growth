
import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Home, BarChart2, Image as IconImage, Database, 
  Settings, Sun, Moon, Edit, Trash2, Plus, ClipboardList, Download, Cloud, RefreshCw, Check, Bell, Grid, HelpCircle, Book, Chrome, ArrowRight, Share
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile, ProfileType } from '../../types';
import { Button, NavButton, NavIcon, Modal } from '../UI';
import { getRelativeTime, getProfileTheme } from '../../utils';

interface SidebarProps {
  profiles: Profile[];
  activeProfileId: string | null;
  activeTab: string;
  mobileMenuOpen: boolean;
  onSelectProfile: (id: string) => void;
  onEditProfile: (p: Profile) => void;
  onDeleteProfile: (p: Profile) => void;
  onAddProfile: () => void;
  onTabChange: (tab: any) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  profiles,
  activeProfileId,
  activeTab,
  mobileMenuOpen,
  onSelectProfile,
  onEditProfile,
  onDeleteProfile,
  onAddProfile,
  onTabChange,
  setMobileMenuOpen
}) => {
  const activeProfile = profiles.find(p => p.id === activeProfileId);
  const theme = getProfileTheme(activeProfile?.type, activeProfile?.gender);

  return (
    <>
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
            />
        )}

        <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">
                        <span className={`${theme.primary}`}>Lavi</span> <span className="text-emerald-500">Growth</span>
                        <span className="font-signature text-xl text-gray-500 dark:text-gray-400 block -mt-2 capitalize">tracker</span>
                    </h1>
                </div>
                
                {/* Close Button on Mobile Drawer */}
                <button className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400" onClick={() => setMobileMenuOpen(false)}>
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
               <div>
                   <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Anggota Keluarga</div>
                   <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                     {profiles.map((p, idx) => {
                       const pTheme = getProfileTheme(p.type, p.gender);
                       const isActive = p.id === activeProfileId;
                       return (
                       <motion.div
                         key={p.id}
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: idx * 0.05 }}
                         className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all border-l-4 ${
                            isActive
                            ? `${pTheme.bgLight} ${pTheme.border.replace('border-opacity-20', '')} border-l-current` 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
                         }`}
                         style={isActive ? { borderLeftColor: 'currentColor' } : {}}
                       >
                          <div 
                            className={`flex-1 flex items-center gap-3 cursor-pointer min-w-0 ${isActive ? pTheme.primary : ''}`}
                            onClick={() => { onSelectProfile(p.id); setMobileMenuOpen(false); }}
                          >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border flex-shrink-0 ${isActive ? `border-current` : 'bg-gray-100 dark:bg-gray-700 border-transparent'}`}>
                                 {p.avatar && p.avatar.length > 5 ? (
                                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover rounded-full" />
                                 ) : (
                                    p.avatar || p.name[0]
                                 )}
                              </div>
                              <div className="text-left min-w-0">
                                 <div className={`font-semibold text-sm truncate ${isActive ? pTheme.primary : 'text-gray-700 dark:text-gray-300'}`}>
                                    {p.name}
                                 </div>
                                 <div className="text-[10px] opacity-70 uppercase">{p.type}</div>
                              </div>
                          </div>

                          <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEditProfile(p); }} 
                                className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-current hover:bg-white/50' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-100'}`}
                                title="Edit"
                              >
                                 <Edit size={14} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteProfile(p); }} 
                                className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-current hover:bg-white/50' : 'text-gray-400 hover:text-red-500 hover:bg-red-100'}`}
                                title="Hapus"
                              >
                                 <Trash2 size={14} />
                              </button>
                          </div>
                       </motion.div>
                     )})}
                   </div>
                   <Button variant="secondary" onClick={() => { onAddProfile(); setMobileMenuOpen(false); }} className="w-full text-sm py-2 mt-2">
                     <Plus size={16} /> Tambah Anggota
                   </Button>
               </div>

               {/* Mobile-Only Navigation Links inside Drawer */}
               <div className="md:hidden space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                   <NavButton active={activeTab === 'dashboard'} onClick={() => { onTabChange('dashboard'); setMobileMenuOpen(false); }} icon={<Home size={20} />}>Dashboard</NavButton>
                   <NavButton active={activeTab === 'journal'} onClick={() => { onTabChange('journal'); setMobileMenuOpen(false); }} icon={<ClipboardList size={20} />}>Jurnal & Vaksin</NavButton>
                   <NavButton active={activeTab === 'reminders'} onClick={() => { onTabChange('reminders'); setMobileMenuOpen(false); }} icon={<Bell size={20} />}>Pengingat</NavButton>
                   <NavButton active={activeTab === 'stats'} onClick={() => { onTabChange('stats'); setMobileMenuOpen(false); }} icon={<BarChart2 size={20} />}>Statistik & Grafik</NavButton>
                   <NavButton active={activeTab === 'dictionary'} onClick={() => { onTabChange('dictionary'); setMobileMenuOpen(false); }} icon={<Book size={20} />}>Kamus Sehat</NavButton>
                   <NavButton active={activeTab === 'data'} onClick={() => { onTabChange('data'); setMobileMenuOpen(false); }} icon={<Database size={20} />}>Data Filter</NavButton>
                   <NavButton active={activeTab === 'gallery'} onClick={() => { onTabChange('gallery'); setMobileMenuOpen(false); }} icon={<IconImage size={20} />}>Galeri Foto</NavButton>
                   <NavButton active={activeTab === 'help'} onClick={() => { onTabChange('help'); setMobileMenuOpen(false); }} icon={<HelpCircle size={20} />}>Panduan</NavButton>
               </div>
            </div>

            {/* Desktop Navigation Footer */}
            <div className="hidden md:flex flex-col px-4 py-6 space-y-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
               <NavButton active={activeTab === 'dashboard'} onClick={() => onTabChange('dashboard')} icon={<Home size={20} />}>Dashboard</NavButton>
               <NavButton active={activeTab === 'journal'} onClick={() => onTabChange('journal')} icon={<ClipboardList size={20} />}>Jurnal & Vaksin</NavButton>
               <NavButton active={activeTab === 'reminders'} onClick={() => onTabChange('reminders')} icon={<Bell size={20} />}>Pengingat</NavButton>
               <NavButton active={activeTab === 'stats'} onClick={() => onTabChange('stats')} icon={<BarChart2 size={20} />}>Statistik & Grafik</NavButton>
               <NavButton active={activeTab === 'dictionary'} onClick={() => onTabChange('dictionary')} icon={<Book size={20} />}>Kamus Sehat</NavButton>
               <NavButton active={activeTab === 'data'} onClick={() => onTabChange('data')} icon={<Database size={20} />}>Data Filter</NavButton>
               <NavButton active={activeTab === 'gallery'} onClick={() => onTabChange('gallery')} icon={<IconImage size={20} />}>Galeri Foto</NavButton>
               <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                   <NavButton active={activeTab === 'help'} onClick={() => onTabChange('help')} icon={<HelpCircle size={20} />}>Panduan</NavButton>
               </div>
            </div>
        </div>
    </>
  );
};

// --- PWA Custom Install Sheet ---
const PWAInstallSheet: React.FC<{ isOpen: boolean; onClose: () => void; onInstall: () => void }> = ({ isOpen, onClose, onInstall }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
                    <motion.div 
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-[#fff1f0] dark:bg-gray-800 w-full max-w-sm sm:rounded-2xl rounded-t-3xl overflow-hidden p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-medium text-center text-gray-900 dark:text-white mb-6">
                            Tambahkan ke layar beranda
                        </h3>

                        <div className="space-y-3">
                            <button 
                                onClick={() => { onInstall(); onClose(); }}
                                className="w-full bg-[#ffe4e1] dark:bg-gray-700 hover:bg-[#ffdcd9] dark:hover:bg-gray-600 transition-colors p-4 rounded-2xl flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black">
                                        <Download size={20} />
                                    </div>
                                    <span className="font-medium text-lg text-gray-800 dark:text-white">Instal</span>
                                </div>
                                <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white transition-colors" />
                            </button>

                            <button 
                                onClick={() => { onInstall(); onClose(); }}
                                className="w-full bg-[#ffe4e1] dark:bg-gray-700 hover:bg-[#ffdcd9] dark:hover:bg-gray-600 transition-colors p-4 rounded-2xl flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black relative">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {/* Chrome Icon Simulation */}
                                            <div className="w-5 h-5 rounded-full border-2 border-current"></div>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-lg text-gray-800 dark:text-white">Buat pintasan</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Pintasan terbuka di Chrome</div>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white transition-colors" />
                            </button>
                        </div>
                        
                        <div className="mt-6 text-center">
                            <button onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white py-2 px-4">
                                Batal
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

interface HeaderProps {
  activeProfile?: Profile;
  darkMode: boolean;
  currentDateTime: Date;
  toggleTheme: () => void;
  onOpenSettings: () => void;
  onExportPDF: () => void;
  onManualSync: () => void;
  isSyncing?: boolean;
  lastSyncTime?: number;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeProfile, 
  darkMode, 
  currentDateTime, 
  toggleTheme, 
  onOpenSettings,
  onExportPDF,
  onManualSync,
  isSyncing = false,
  lastSyncTime,
  onMenuClick
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const theme = getProfileTheme(activeProfile?.type, activeProfile?.gender);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  return (
    <>
        <PWAInstallSheet 
            isOpen={showInstallSheet} 
            onClose={() => setShowInstallSheet(false)} 
            onInstall={handleInstall} 
        />

        <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 md:px-6 py-3 md:py-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all">
        <div className="flex items-center gap-3">
            {/* Mobile Menu Button - VISIBLE ON MOBILE */}
            <button 
                onClick={onMenuClick}
                className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
                <Menu size={24} />
            </button>

            <div className="flex flex-col">
                <span className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wide">Profil Aktif</span>
                <div className="flex items-center gap-2">
                    {activeProfile && (
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full overflow-hidden flex items-center justify-center border ${theme.bgLight} ${theme.border}`}>
                            {activeProfile.avatar && activeProfile.avatar.length > 5 ? (
                            <img src={activeProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                            <span className="text-xs md:text-sm">{activeProfile.avatar || activeProfile.name[0]}</span>
                            )}
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-base md:text-lg truncate max-w-[120px] md:max-w-none">
                            {activeProfile?.name}
                        </span>
                        {activeProfile && (
                            <span className={`px-1.5 py-[1px] rounded text-[9px] font-bold uppercase border w-fit leading-tight ${theme.bgLight} ${theme.primary} ${theme.border}`}>
                                {activeProfile.type}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
                {/* Sync Indicator Button - NOW VISIBLE ON MOBILE (Flex) */}
                <button 
                    onClick={onManualSync}
                    disabled={isSyncing}
                    title="Klik untuk sinkronisasi manual dengan Server"
                    className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 sm:py-0.5 rounded-lg transition-all border ${
                        isSyncing 
                        ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 cursor-not-allowed' 
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 cursor-pointer active:scale-95'
                    }`}
                >
                    {isSyncing ? (
                        <div className="flex items-center gap-1.5">
                            <RefreshCw size={14} className="animate-spin" /> 
                            <span className="hidden sm:inline">Syncing...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-end leading-none">
                            <div className="flex items-center gap-1">
                                <Cloud size={16} className="sm:w-3 sm:h-3" /> 
                                <span className="hidden sm:inline">Saved</span>
                                {/* Hidden on mobile to save space, visible on desktop */}
                                <RefreshCw size={8} className="opacity-50 hidden sm:block" />
                            </div>
                            {lastSyncTime && (
                                <span className="text-[8px] opacity-70 mt-0.5 font-normal hidden sm:block">
                                    {getRelativeTime(lastSyncTime)}
                                </span>
                            )}
                        </div>
                    )}
                </button>

            {deferredPrompt && (
                <button 
                    onClick={() => setShowInstallSheet(true)} 
                    className="hidden md:flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse hover:bg-blue-200 transition-colors"
                >
                    <Download size={14} /> Install App
                </button>
            )}

            <Button variant="ghost" onClick={onExportPDF} className="hidden md:flex text-xs border border-gray-200" title="Export PDF Laporan Dokter">
                    <Download size={16} /> PDF
            </Button>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            <div className="flex flex-col items-end text-right">
                <div className="text-xs sm:text-xl font-bold text-gray-800 dark:text-white leading-none">
                    {currentDateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {currentDateTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            </div>

            <div className="flex items-center gap-2">
                    {/* Theme & Settings - Always visible now */}
                    <Button variant="secondary" onClick={toggleTheme} className="px-3 py-2 rounded-xl text-sm hidden md:flex">
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </Button>
                    <Button variant="secondary" onClick={onOpenSettings} className="px-3 py-2 rounded-xl text-sm hidden md:flex">
                        <Settings size={18} />
                    </Button>
                    
                    {/* Mobile Icons */}
                    <Button variant="secondary" onClick={toggleTheme} className="p-2 rounded-full h-10 w-10 md:hidden flex items-center justify-center">
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </Button>
                    <Button variant="secondary" onClick={onOpenSettings} className="p-2 rounded-full h-10 w-10 md:hidden flex items-center justify-center">
                        <Settings size={20} />
                    </Button>
            </div>
        </div>
        </header>
    </>
  );
};

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onAddRecord: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, onAddRecord }) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleStart = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
        isLongPress.current = true;
        setShowQuickMenu(true);
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500); 
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
    }
    if (!isLongPress.current) {
        onAddRecord();
    }
  };

  const handleTabClick = (tab: string) => {
      onTabChange(tab);
      setShowQuickMenu(false);
  };

  return (
    <>
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 px-2 pt-2 pb-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-end">
                <NavIcon active={activeTab === 'dashboard'} label="Home" icon={<Home size={22} />} onClick={() => onTabChange('dashboard')} />
                <NavIcon active={activeTab === 'stats'} label="Grafik" icon={<BarChart2 size={22} />} onClick={() => onTabChange('stats')} />
                
                <div className="relative -top-6">
                    <button 
                    onMouseDown={handleStart}
                    onMouseUp={handleEnd}
                    onTouchStart={handleStart}
                    onTouchEnd={handleEnd}
                    onContextMenu={(e) => e.preventDefault()}
                    className="bg-emerald-500 text-white p-4 rounded-full shadow-emerald-200 dark:shadow-none shadow-xl hover:bg-emerald-600 transition-transform active:scale-95 border-4 border-gray-50 dark:border-gray-900 flex items-center justify-center relative z-40"
                    >
                        <Plus size={28} />
                    </button>
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Tahan: Menu
                    </div>
                </div>
                
                <NavIcon active={activeTab === 'journal'} label="Jurnal" icon={<ClipboardList size={22} />} onClick={() => onTabChange('journal')} />
                <NavIcon active={activeTab === 'data'} label="Data" icon={<Database size={22} />} onClick={() => onTabChange('data')} />
            </div>
        </div>

        {/* Quick Menu Overlay */}
        <AnimatePresence>
            {showQuickMenu && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setShowQuickMenu(false)}
                    />
                    <motion.div 
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl z-50 p-6 md:hidden pb-safe-area"
                    >
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Grid size={20} className="text-emerald-500" /> Menu Cepat
                            </h3>
                            <button onClick={() => setShowQuickMenu(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { id: 'dashboard', label: 'Home', icon: <Home size={24} />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
                                { id: 'stats', label: 'Grafik', icon: <BarChart2 size={24} />, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
                                { id: 'journal', label: 'Jurnal', icon: <ClipboardList size={24} />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
                                { id: 'reminders', label: 'Ingat', icon: <Bell size={24} />, color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
                                { id: 'dictionary', label: 'Kamus', icon: <Book size={24} />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
                                { id: 'data', label: 'Data', icon: <Database size={24} />, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
                                { id: 'gallery', label: 'Galeri', icon: <IconImage size={24} />, color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' },
                                { id: 'help', label: 'Panduan', icon: <HelpCircle size={24} />, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
                            ].map((item) => (
                                <button 
                                    key={item.id}
                                    onClick={() => handleTabClick(item.id)}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 shadow-sm ${item.color}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                            <button onClick={() => { onAddRecord(); setShowQuickMenu(false); }} className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-transform flex items-center justify-center gap-2">
                                <Plus size={20} /> Input Data Kesehatan
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    </>
  );
};
