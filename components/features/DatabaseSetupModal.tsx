import React, { useState, useEffect } from 'react';
import { 
  Database, FileSpreadsheet, CheckCircle2, AlertCircle, Copy, Check, 
  ExternalLink, Download, RefreshCw, Server, ShieldCheck, Key, Globe, 
  ChevronDown, ChevronUp, Sparkles, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button } from '../UI';
import { DatabaseConfig, DatabaseProvider } from '../../types';
import { 
  getDatabaseConfig, 
  saveDatabaseConfig, 
  testDatabaseConnection, 
  DEFAULT_GAS_URL,
  DEFAULT_DATABASE_CONFIG 
} from '../../services/api';
import { SUPABASE_SQL_SCHEMA } from '../../services/supabaseSql';
import { GAS_SCRIPT_TEMPLATE } from '../../services/gasScriptContent';

interface DatabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (config: DatabaseConfig) => void;
  onMigrateData?: () => Promise<void>;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DatabaseSetupModal: React.FC<DatabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onMigrateData,
  onShowToast
}) => {
  const [currentConfig, setCurrentConfig] = useState<DatabaseConfig>(getDatabaseConfig());
  const [selectedProvider, setSelectedProvider] = useState<DatabaseProvider>('gas');
  
  // Form states
  const [gasUrl, setGasUrl] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  // Testing states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tablesReady?: boolean;
  } | null>(null);

  // Guide accordion
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [showGasGuide, setShowGasGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedGas, setCopiedGas] = useState(false);

  // Sync / Migrate state
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getDatabaseConfig();
      setCurrentConfig(cfg);
      setSelectedProvider(cfg.provider);
      setGasUrl(cfg.gas.webAppUrl || DEFAULT_GAS_URL);
      setSupabaseUrl(cfg.supabase.url || '');
      setSupabaseKey(cfg.supabase.anonKey || '');
      setTestResult(null);
    }
  }, [isOpen]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    if (onShowToast) onShowToast("Skrip SQL Supabase berhasil disalin!", "success");
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lavi_supabase_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast("File lavi_supabase_schema.sql berhasil diunduh!", "success");
  };

  const handleCopyGasScript = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_TEMPLATE);
    setCopiedGas(true);
    if (onShowToast) onShowToast("Kode Google Apps Script berhasil disalin!", "success");
    setTimeout(() => setCopiedGas(false), 2500);
  };

  const handleDownloadGasScript = () => {
    const blob = new Blob([GAS_SCRIPT_TEMPLATE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ScriptGAS.gs';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast("File ScriptGAS.gs berhasil diunduh!", "success");
  };

  const getFormConfig = (): DatabaseConfig => ({
    provider: selectedProvider,
    gas: {
      webAppUrl: gasUrl.trim() || DEFAULT_GAS_URL
    },
    supabase: {
      url: supabaseUrl.trim(),
      anonKey: supabaseKey.trim()
    }
  });

  const handleTestConnection = async () => {
    const targetConfig = getFormConfig();
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testDatabaseConnection(targetConfig);
      setTestResult(res);
      if (res.success) {
        if (onShowToast) onShowToast(res.message, "success");
      } else {
        if (onShowToast) onShowToast(res.message, "error");
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Gagal menguji koneksi" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async (syncNow = false) => {
    const newConfig = getFormConfig();

    if (newConfig.provider === 'supabase') {
      if (!newConfig.supabase.url || !newConfig.supabase.anonKey) {
        if (onShowToast) onShowToast("Mohon isi URL dan Anon Key Supabase terlebih dahulu", "warning");
        return;
      }
    }

    saveDatabaseConfig(newConfig);
    setCurrentConfig(newConfig);

    if (onShowToast) {
      onShowToast(
        `Database berhasil diubah ke ${newConfig.provider === 'supabase' ? 'Supabase' : 'Google Spreadsheet'}!`,
        "success"
      );
    }

    if (onSuccess) {
      onSuccess(newConfig);
    }

    if (syncNow && onMigrateData) {
      setIsMigrating(true);
      try {
        await onMigrateData();
        if (onShowToast) onShowToast("Data lokal berhasil disinkronkan ke database baru!", "success");
      } catch {
        if (onShowToast) onShowToast("Gagal menyinkronkan data ke database baru", "error");
      } finally {
        setIsMigrating(false);
      }
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Setup Database & Cloud Sync">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1 pr-2">
        {/* Intro */}
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          Pilih backend database untuk sinkronisasi otomatis data kesehatan keluarga Anda. Anda dapat beralih kapan saja antara <b>Google Spreadsheet (GAS)</b> atau <b>Supabase (PostgreSQL)</b>.
        </p>

        {/* Provider Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Option 1: GAS */}
          <button
            type="button"
            onClick={() => {
              setSelectedProvider('gas');
              setTestResult(null);
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
              selectedProvider === 'gas'
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <FileSpreadsheet size={22} />
                </div>
                {currentConfig.provider === 'gas' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-full">
                    Aktif
                  </span>
                )}
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Google Spreadsheet</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Via Google Apps Script (Gratis, tanpa server, data di Google Drive Anda).
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {selectedProvider === 'gas' ? 'Terpilih' : 'Pilih opsi ini'}
            </div>
          </button>

          {/* Option 2: Supabase */}
          <button
            type="button"
            onClick={() => {
              setSelectedProvider('supabase');
              setTestResult(null);
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
              selectedProvider === 'supabase'
                ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Database size={22} />
                </div>
                {currentConfig.provider === 'supabase' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full">
                    Aktif
                  </span>
                )}
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Supabase (PostgreSQL)</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Database SQL relasional performa tinggi, waktu sinkronisasi milidetik.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {selectedProvider === 'supabase' ? 'Terpilih' : 'Pilih opsi ini'}
            </div>
          </button>
        </div>

        {/* PROVIDER 1 FORM: GOOGLE SPREADSHEET (GAS) */}
        {selectedProvider === 'gas' && (
          <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                <Globe size={14} className="text-emerald-500" /> Konfigurasi Google Apps Script
              </span>
              <button
                type="button"
                onClick={() => setGasUrl(DEFAULT_GAS_URL)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Gunakan URL Default
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                Web App Deployment URL
              </label>
              <input
                type="url"
                value={gasUrl}
                onChange={(e) => setGasUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                URL Aplikasi Web Apps Script yang telah dideploy dengan akses "Anyone / Siapa saja".
              </p>
            </div>

            {/* Accordion Setup GAS */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setShowGasGuide(!showGasGuide)}
                className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle size={15} className="text-emerald-500" />
                  Cara Setup Spreadsheet Sendiri & Salin ScriptGAS.gs
                </span>
                {showGasGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showGasGuide && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-xs space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
                  <ol className="list-decimal pl-4 space-y-1.5 text-gray-600 dark:text-gray-300">
                    <li>Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">Google Sheets Baru</a>.</li>
                    <li>Klik menu <b>Ekstensi &gt; Apps Script</b>.</li>
                    <li>Hapus kode bawaan, lalu tempel kode dari tombol <b>Salin Kode ScriptGAS.gs</b> di bawah.</li>
                    <li>Klik <b>Terapkan (Deploy) &gt; Deployment baru</b>.</li>
                    <li>Pilih jenis <b>Aplikasi Web</b>. Atur:
                      <ul className="list-disc pl-4 mt-1 font-mono text-[11px] text-gray-500">
                        <li>Jalankan sebagai: <b>Saya (email Anda)</b></li>
                        <li>Siapa yang memiliki akses: <b>Siapa saja (Anyone)</b></li>
                      </ul>
                    </li>
                    <li>Salin <b>URL Aplikasi Web</b> yang didapat, lalu tempel di kolom URL di atas.</li>
                  </ol>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyGasScript}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 text-xs shadow-sm"
                    >
                      {copiedGas ? <Check size={14} /> : <Copy size={14} />}
                      {copiedGas ? 'Kode Tersalin!' : 'Salin Kode ScriptGAS.gs'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadGasScript}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Download size={14} /> Unduh ScriptGAS.gs
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROVIDER 2 FORM: SUPABASE */}
        {selectedProvider === 'supabase' && (
          <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
              <Key size={14} className="text-indigo-500" /> Kredensial Supabase
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  Supabase Anon / Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Ditemukan pada Dashboard Supabase Anda di menu <b>Project Settings &gt; API &gt; Project API keys &gt; anon/public</b>.
                </p>
              </div>
            </div>

            {/* Accordion SQL Supabase */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setShowSqlGuide(!showSqlGuide)}
                className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <span className="flex items-center gap-2">
                  <Database size={15} className="text-indigo-500" />
                  Skrip SQL Supabase & Panduan Buat Tabel
                </span>
                {showSqlGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showSqlGuide && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-xs space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
                  <ol className="list-decimal pl-4 space-y-1 text-gray-600 dark:text-gray-300">
                    <li>Buka dashboard Supabase proyek Anda (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">supabase.com</a>).</li>
                    <li>Buka menu <b>SQL Editor</b> di sidebar kiri.</li>
                    <li>Klik <b>New Query</b>, tempel skrip SQL di bawah, lalu klik <b>Run</b>.</li>
                    <li>Tabel (profiles, health_records, vaccines, dll.) dan kebijakan RLS langsung dibuat otomatis!</li>
                  </ol>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 text-xs shadow-sm"
                    >
                      {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                      {copiedSql ? 'Skrip SQL Tersalin!' : 'Salin Skrip SQL'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSql}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Download size={14} /> Unduh File .sql
                    </button>
                  </div>

                  <div className="relative mt-2">
                    <pre className="p-3 bg-gray-900 text-gray-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-44 border border-gray-800 leading-relaxed">
                      {SUPABASE_SQL_SCHEMA}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              testResult.success
                ? testResult.tablesReady === false
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
            )}
            <div className="text-xs leading-relaxed">
              <p className="font-semibold">{testResult.message}</p>
              {testResult.tablesReady === false && (
                <button
                  type="button"
                  onClick={() => setShowSqlGuide(true)}
                  className="text-[11px] font-bold underline mt-1 block"
                >
                  Buka Skrip SQL untuk membuat tabel sekarang &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex-1 py-2.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-gray-200 dark:border-gray-700"
            >
              <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
              {isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi Database'}
            </button>

            <Button
              onClick={() => handleSaveConfig(false)}
              className="flex-1 justify-center py-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
            >
              Simpan Konfigurasi
            </Button>
          </div>

          {onMigrateData && (
            <button
              type="button"
              onClick={() => handleSaveConfig(true)}
              disabled={isMigrating}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Server size={14} className={isMigrating ? 'animate-spin' : ''} />
              {isMigrating ? 'Menyinkronkan...' : 'Simpan & Sinkronkan Data Lokal ke Database Ini'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
