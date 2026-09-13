
import React, { useState } from 'react';
import { 
  Download, FileSpreadsheet, FileText, Lock, Info, 
  ShieldCheck, FileJson, Trash2, Loader2, AlertTriangle, WifiOff,
  Database, Settings2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Modal, Button, Input } from '../UI';
import { getDatabaseConfig } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasPin: boolean; // Prop ini tetap ada untuk kompatibilitas, tapi UI menganggap PIN selalu ada di server
  onUpdatePin: (newPin: string, oldPin: string) => Promise<boolean>;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onTriggerHardReset: () => void;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  isOfflineMode?: boolean; // New Prop
  onToggleOfflineMode?: () => void; // New Prop
  onOpenDatabaseSetup?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, onUpdatePin, 
  onExportBackup, onImportBackup, onExportExcel, onExportPDF, 
  onTriggerHardReset, onShowToast, isOfflineMode, onToggleOfflineMode,
  onOpenDatabaseSetup
}) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHiddenMenu, setShowHiddenMenu] = useState(false);
  const dbConfig = getDatabaseConfig();
  
  // Long Press Logic
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdate = async () => {
    if (!oldPin || !newPin) {
      if(onShowToast) onShowToast("Mohon isi PIN Lama dan PIN Baru", "error");
      return;
    }

    if (!/^\d{6,12}$/.test(newPin)) {
      if(onShowToast) onShowToast("PIN baru harus 6-12 angka", "error");
      return;
    }

    setIsLoading(true);
    
    try {
        const success = await onUpdatePin(newPin, oldPin);
        
        if (success) {
          setOldPin('');
          setNewPin('');
        }
    } catch (e) {
        if(onShowToast) onShowToast("Gagal menghubungi server", "error");
    } finally {
        setIsLoading(false);
    }
  };

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
        setShowHiddenMenu(true); 
        if (onShowToast) onShowToast("Mode Reset (Admin) Terbuka", "warning");
    }, 3000); 
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan">
      <div className="space-y-8">
        
        {/* SECTION 1: KONEKTIVITAS (NEW) */}
        <section className="space-y-3">
            <h4 className="font-medium text-gray-800 dark:text-white text-base">Konektivitas</h4>
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-full text-purple-600">
                        <WifiOff size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Mode Offline (Hemat Data)</p>
                        <p className="text-[10px] text-gray-500">Nonaktifkan sinkronisasi otomatis ke cloud.</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isOfflineMode} onChange={onToggleOfflineMode} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
            </div>
        </section>

        {/* SECTION: DATABASE PROVIDER SETUP */}
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800 dark:text-white text-base">Penyimpanan & Database Cloud</h4>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {dbConfig.provider === 'supabase' ? 'Supabase' : 'Google Sheets'}
                </span>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${dbConfig.provider === 'supabase' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'}`}>
                            {dbConfig.provider === 'supabase' ? <Database size={20} /> : <FileSpreadsheet size={20} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                    {dbConfig.provider === 'supabase' ? 'Supabase (PostgreSQL)' : 'Google Spreadsheet (GAS)'}
                                </p>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full">
                                    Aktif
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                                {dbConfig.provider === 'supabase' 
                                    ? (dbConfig.supabase.url || 'Belum diatur')
                                    : 'Aplikasi Web Apps Script'}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onOpenDatabaseSetup}
                    className="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-600 transition-colors"
                >
                    <Settings2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                    Atur / Ganti Database (GAS atau Supabase)
                </button>
            </div>
        </section>

        {/* SECTION 2: KEAMANAN */}
        <section className="space-y-3">
          <h4 className="font-medium text-gray-800 dark:text-white text-base">
            Keamanan (Cloud Sync)
          </h4>
          
          <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">PIN Lama</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={oldPin} 
                        onChange={e => setOldPin(e.target.value)} 
                        placeholder="PIN lama" inputMode="numeric" autoComplete="current-password"
                        disabled={isLoading || isOfflineMode}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-all font-mono tracking-widest"
                      />
                    </div>
                </div>
              
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">PIN Baru</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={newPin} 
                        onChange={e => setNewPin(e.target.value)} 
                        placeholder="6-12 angka" inputMode="numeric" autoComplete="new-password" maxLength={12}
                        disabled={isLoading || isOfflineMode}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-all font-mono tracking-widest"
                      />
                    </div>
                </div>
            </div>
            
            <Button 
              onClick={handleUpdate} 
              isLoading={isLoading} 
              disabled={isLoading || !newPin || !oldPin || isOfflineMode}
              className={`w-full justify-center rounded-xl py-3 font-semibold text-white transition-all shadow-md ${isLoading ? 'bg-emerald-400 cursor-wait' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {isLoading ? (
                  <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={18} /> Memproses Update...
                  </span>
              ) : (
                  "Update PIN"
              )}
            </Button>

            <p className="text-[11px] text-gray-400 text-center italic leading-relaxed">
              {isOfflineMode ? "Fitur ini tidak tersedia dalam Mode Offline." : "*PIN baru wajib 6-12 angka. Server menyimpan hash PIN, bukan PIN asli."}
            </p>
          </div>
        </section>

        {/* SECTION 3: DATA */}
        <section className="space-y-3">
          <h4 className="font-medium text-gray-800 dark:text-white text-base">Data</h4>

          <div className="grid grid-cols-2 gap-3">
            {/* Backup JSON */}
            <button 
              onClick={onExportBackup}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all h-28"
            >
              <Download size={24} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 text-center leading-tight">Backup File App<br/>(.json)</span>
            </button>

            {/* Export Excel */}
            <button 
              onClick={onExportExcel}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all h-28"
            >
              <FileSpreadsheet size={24} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 text-center leading-tight">Export Excel (.csv)</span>
            </button>

            {/* Export PDF */}
            <button 
              onClick={onExportPDF}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all h-28"
            >
              <FileText size={24} className="text-red-600 dark:text-red-400" />
              <span className="text-xs font-semibold text-red-800 dark:text-red-200 text-center">Export Laporan PDF</span>
            </button>

            {/* Restore JSON */}
            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all h-28 relative">
              <FileJson size={24} className="text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 text-center">Restore Data (JSON)</span>
              <input type="file" onChange={onImportBackup} className="hidden" accept=".json,application/json" />
            </label>
          </div>
          
          <p className="text-[10px] text-gray-400 px-1">
             *Backup data JSON untuk memindahkan data ke HP lain. Export Excel untuk melihat data di komputer.
          </p>
        </section>

        {/* SECTION 4: INFORMASI APLIKASI */}
        <section className="space-y-3">
          <h4 className="font-medium text-gray-800 dark:text-white text-base">Informasi Aplikasi</h4>

          <div 
            className="flex items-start gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 select-none active:scale-[0.98] transition-transform cursor-pointer"
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
          >
             <div className="text-emerald-600 dark:text-emerald-400 mt-1">
                <Info size={24} />
             </div>
             <div>
                <h5 className="font-bold text-gray-900 dark:text-white text-sm">Lavi Growth Tracker</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Versi 1.2.0 (Offline Capable)</p>
                <div className="h-px bg-emerald-200 dark:bg-emerald-800 w-full mb-2" />
                
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Developer:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Lathif Baska</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Bandung, West Java</p>
             </div>
          </div>
        </section>

        {/* HIDDEN MENU (Revealed on Long Press) */}
        {showHiddenMenu && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t-2 border-red-100 dark:border-red-900/30"
            >
                <h4 className="font-bold text-red-600 dark:text-red-400 text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} /> Zona Admin (Reset)
                </h4>
                <Button 
                    variant="danger" 
                    onClick={onTriggerHardReset} 
                    className="w-full justify-center py-3 text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                >
                    <Trash2 size={16} /> Reset Aplikasi (Hapus Data Lokal)
                </Button>
            </motion.div>
        )}

      </div>
    </Modal>
  );
};
