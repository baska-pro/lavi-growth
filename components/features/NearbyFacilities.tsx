
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, Hospital, Stethoscope, AlertTriangle, Share2, Search, Crosshair, Check } from 'lucide-react';
import { Modal, Button, Input } from '../UI';
import { findNearbyFacilities, searchFacilitiesManual } from '../../services/externalApi';

interface NearbyFacilitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NearbyFacilitiesModal: React.FC<NearbyFacilitiesModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [type, setType] = useState<'hospital' | 'pharmacy'>('hospital');
    const [mode, setMode] = useState<'gps' | 'manual'>('gps'); // Search Mode
    const [manualQuery, setManualQuery] = useState('');

    const searchFacilities = async () => {
        setLoading(true);
        setError(null);
        setFacilities([]);

        if (mode === 'gps') {
            if (!navigator.geolocation) {
                setError("Browser tidak mendukung Geolocation.");
                setLoading(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const results = await findNearbyFacilities(latitude, longitude, type);
                    setFacilities(results);
                    setLoading(false);
                },
                (err) => {
                    setError("Gagal mendapatkan lokasi. Pastikan GPS aktif atau gunakan pencarian manual.");
                    setLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            // Manual Mode
            if (!manualQuery.trim()) {
                setError("Silakan ketik nama kota atau daerah.");
                setLoading(false);
                return;
            }
            const results = await searchFacilitiesManual(manualQuery, type);
            if (results.length === 0) setError("Tidak ditemukan fasilitas di lokasi tersebut.");
            setFacilities(results);
            setLoading(false);
        }
    };

    // Trigger on open if GPS mode and empty list
    useEffect(() => {
        if (isOpen && mode === 'gps' && facilities.length === 0) {
            searchFacilities();
        }
    }, [isOpen]);

    // Re-trigger when type changes (only if results exist to keep context)
    useEffect(() => {
        if (isOpen && facilities.length > 0) {
            searchFacilities();
        }
    }, [type]);

    const openMap = (lat: string, lon: string) => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
    };

    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleShare = async (f: any) => {
        const text = `Faskes: ${f.name}\nAlamat: ${f.address}\n\nLokasi: https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lon}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: f.name,
                    text: text
                });
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            // Fallback copy
            try {
                await navigator.clipboard.writeText(text);
                setCopiedId(f.id);
                setTimeout(() => setCopiedId(null), 2500);
            } catch (e) {
                console.warn('Clipboard copy error', e);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Faskes Terdekat">
            <div className="space-y-4 min-h-[400px] flex flex-col">
                {/* Search Mode Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button 
                        onClick={() => { setMode('gps'); setFacilities([]); setError(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'gps' ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        <Crosshair size={16} /> GPS Otomatis
                    </button>
                    <button 
                        onClick={() => { setMode('manual'); setFacilities([]); setError(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-500'}`}
                    >
                        <Search size={16} /> Cari Manual
                    </button>
                </div>

                {/* Facility Type Filter */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setType('hospital')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${type === 'hospital' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'}`}
                    >
                        <Hospital size={16} /> RS / Klinik
                    </button>
                    <button 
                        onClick={() => setType('pharmacy')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 ${type === 'pharmacy' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'}`}
                    >
                        <Stethoscope size={16} /> Apotek
                    </button>
                </div>

                {/* Manual Input Field */}
                {mode === 'manual' && (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input 
                                placeholder="Ketik nama Kota / Daerah..." 
                                value={manualQuery} 
                                onChange={(e) => setManualQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchFacilities()}
                            />
                        </div>
                        <Button onClick={searchFacilities} disabled={loading} className="px-4">
                            <Search size={18} />
                        </Button>
                    </div>
                )}

                {/* GPS Trigger Button (if in GPS mode but empty/error) */}
                {mode === 'gps' && !loading && facilities.length === 0 && (
                    <div className="text-center py-4">
                        <Button onClick={searchFacilities} variant="secondary" className="mx-auto">
                            <Crosshair size={16} /> Deteksi Lokasi Saya
                        </Button>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto pr-1 relative min-h-[200px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <p className="text-xs">Mencari fasilitas...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 px-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                            <AlertTriangle size={32} className="mx-auto text-red-500 mb-2" />
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                        </div>
                    ) : facilities.length === 0 && mode === 'manual' && manualQuery ? (
                         <div className="text-center py-10 text-gray-400">
                            <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Tidak ditemukan hasil.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {facilities.map((f) => (
                                <div key={f.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg shrink-0 ${f.type === 'hospital' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {f.type === 'hospital' ? <Hospital size={20} /> : <Stethoscope size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-2">{f.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{f.address}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <button 
                                            onClick={() => openMap(f.lat, f.lon)}
                                            className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold flex items-center justify-center gap-2"
                                        >
                                            <Navigation size={14} /> Navigasi
                                        </button>
                                        <button 
                                            onClick={() => handleShare(f)}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-xs font-bold flex items-center gap-1"
                                            title="Bagikan atau Salin Info"
                                        >
                                            {copiedId === f.id ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                                            {copiedId === f.id && <span className="text-[10px] text-emerald-500">Tersalin</span>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100 dark:border-gray-800">
                    Data OpenStreetMap (Nominatim).
                </div>
            </div>
        </Modal>
    );
};
