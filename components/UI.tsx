
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X, Camera, Upload, Mic, MicOff } from 'lucide-react';
import { compressImage } from '../utils';

// --- Helper: Voice Input Logic ---
export const useVoiceInput = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);

  // Keep callback fresh without re-triggering effect
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after one sentence/phrase
      recognition.interimResults = false;
      recognition.lang = 'id-ID'; // Set Indonesian

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (onResultRef.current) {
            onResultRef.current(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
            console.warn("Mikrofon tidak diizinkan.");
        } else if (event.error === 'network') {
            console.warn("Gagal terhubung ke layanan pengenalan suara.");
        } else if (event.error === 'no-speech') {
            // Ignore no-speech error, just stop listening
        } else {
            // console.log("Voice error:", event.error);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
    };
  }, []); // Empty dependency array ensures single initialization

  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.warn("Browser tidak mendukung fitur dikte suara.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition", e);
        // If already started, stop first then maybe retry, or just ignore
        recognitionRef.current.stop();
      }
    }
  };

  return { isListening, toggleListening, isSupported: !!recognitionRef.current };
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; noDefaultBg?: boolean }> = ({ children, className = '', onClick, noDefaultBg = false }) => (
  <motion.div 
    whileHover={onClick ? { scale: 1.02 } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    onClick={onClick}
    className={`${!noDefaultBg ? 'bg-white dark:bg-gray-800' : ''} rounded-2xl shadow-sm border border-emerald-100 dark:border-gray-700 p-5 ${className}`}
  >
    {children}
  </motion.div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', isLoading, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none shadow-lg",
    secondary: "bg-emerald-50 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-gray-600",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : children}
    </motion.button>
  );
};

// --- Input (Updated with Voice) ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  enableVoice?: boolean;
  onVoiceResult?: (val: string) => void;
}

export const Input: React.FC<InputProps> = ({ label, icon, enableVoice, onVoiceResult, className = '', ...props }) => {
  const { isListening, toggleListening, isSupported } = useVoiceInput((text) => {
    if (onVoiceResult) onVoiceResult(text);
  });

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500">
            {icon}
          </div>
        )}
        <input 
          className={`w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl py-2.5 ${icon ? 'pl-10' : 'pl-4'} ${enableVoice ? 'pr-10' : 'pr-4'} focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none`}
          {...props}
        />
        {enableVoice && isSupported && (
          <button 
            type="button"
            onClick={toggleListening}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-emerald-500'}`}
            title="Klik untuk bicara"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

// --- TextArea (New Component with Voice) ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  enableVoice?: boolean;
  onVoiceResult?: (val: string) => void;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, enableVoice, onVoiceResult, className = '', ...props }) => {
  const { isListening, toggleListening, isSupported } = useVoiceInput((text) => {
    // Append text to existing value logic usually handled by parent, 
    // but here we just pass the captured snippet
    if (onVoiceResult) onVoiceResult(text);
  });

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex justify-between items-center ml-1">
           <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
           {enableVoice && isSupported && (
             <button 
               type="button" 
               onClick={toggleListening}
               className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-emerald-500'}`}
             >
               {isListening ? <><MicOff size={12} /> Mendengarkan...</> : <><Mic size={12} /> Dikte Suara</>}
             </button>
           )}
        </div>
      )}
      <textarea 
        className={`w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none ${isListening ? 'ring-2 ring-red-500/20 border-red-400' : ''}`}
        {...props}
      />
    </div>
  );
};

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-emerald-50/50 dark:bg-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
            ✕
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- Confirmation Modal ---
export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  type?: 'danger' | 'warning' | 'info';
  title: string;
  message: React.ReactNode; 
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, type = 'info', title, message, confirmText = "Konfirmasi", cancelText = "Batal", onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center"
      >
        <h3 className={`text-lg font-bold mb-2 ${type === 'danger' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
        <div className="text-gray-600 dark:text-gray-300 mb-6 text-sm">{message}</div>
        <div className="flex gap-3">
            <Button variant="secondary" onClick={onCancel} className="flex-1">{cancelText}</Button>
            <Button variant={type === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} className="flex-1">{confirmText}</Button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Loading Overlay ---
export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => (
  <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
      <p className="font-medium animate-pulse">{message || "Loading..."}</p>
  </div>
);

// --- Minimalist Toast Notification ---
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures it only runs once on mount

  const colors = {
    success: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
    warning: 'bg-amber-500 text-white'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-2.5 rounded-full shadow-xl ${colors[type]}`}
    >
      <span className="font-medium text-sm">{message}</span>
    </motion.div>
  );
};

// --- Avatar Selector with Photo Upload ---
const AVATAR_OPTIONS = [
  "👨", "👩", "👴", "👵", "👶", "🤰", "🤱", "🧑", "👧", "👦", "👼", 
  "🦸", "🦸‍♀️", "🧸", "🦄", "🐼", "🦁", "🐰", "🐱", "🐶"
];

export const AvatarSelector: React.FC<{ selected: string; onSelect: (avatar: string) => void }> = ({ selected, onSelect }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setErrorMsg(null);
      try {
        const base64 = await compressImage(e.target.files[0]);
        onSelect(base64);
      } catch (err) {
        setErrorMsg("Gagal memproses foto. Silakan coba file gambar lain.");
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Foto Profil / Avatar</label>
      
      {/* Preview Section */}
      <div className="flex items-center gap-4 mb-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden border-2 border-emerald-500">
          {selected && selected.length > 10 ? (
             <img src={selected} alt="Profile" className="w-full h-full object-cover" />
          ) : (
             <span className="text-3xl">{selected || "?"}</span>
          )}
        </div>
        <label className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Camera size={16} /> Upload Foto
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {errorMsg && <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>}

      <div className="grid grid-cols-5 gap-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
        {AVATAR_OPTIONS.map((av) => (
          <button
            key={av}
            type="button"
            onClick={() => onSelect(av)}
            className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg transition-all ${selected === av ? 'bg-emerald-100 border-2 border-emerald-500 scale-110' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {av}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Navigation Components ---
export const NavButton: React.FC<{ active: boolean; children: React.ReactNode; icon: React.ReactNode; onClick: () => void }> = ({ active, children, icon, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm w-full text-left ${
      active 
      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`}
  >
    {icon} {children}
  </button>
);

export const NavIcon: React.FC<{ active: boolean; label: string; icon: React.ReactNode; onClick: () => void }> = ({ active, label, icon, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-emerald-500' : 'text-gray-400'}`}>
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);
