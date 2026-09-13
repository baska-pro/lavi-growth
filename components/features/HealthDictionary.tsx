
import React, { useState, useCallback } from 'react';
import { Search, Book, ArrowRight, Loader2, X, ExternalLink } from 'lucide-react';
import { Input, Button, Modal, Card } from '../UI';
import { searchWikipedia, getWikipediaDetail } from '../../services/externalApi';
import { motion, AnimatePresence } from 'framer-motion';

export const HealthDictionaryView: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{title: string, extract: string, id: number} | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Debounce manual implementation
    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        const data = await searchWikipedia(query);
        setResults(data);
        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const openDetail = async (item: any) => {
        setLoadingDetail(true);
        const detail = await getWikipediaDetail(item.id);
        setSelectedItem({
            title: item.title,
            id: item.id,
            extract: detail || "Maaf, detail tidak tersedia."
        });
        setLoadingDetail(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                    <Book size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kamus Sehat</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Cari informasi penyakit, obat, dan istilah medis (Sumber: Wikipedia ID).</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <Input 
                        placeholder="Cari (cth: Demam Berdarah, Parasetamol)..." 
                        value={query} 
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        enableVoice={true}
                        onVoiceResult={(val) => setQuery(val)}
                        icon={<Search size={18} />}
                    />
                </div>
                <Button onClick={handleSearch} disabled={loading || !query} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                    {loading ? <Loader2 className="animate-spin" /> : 'Cari'}
                </Button>
            </div>

            {/* Results Grid */}
            {results.length > 0 ? (
                <div className="grid gap-3">
                    {results.map((item) => (
                        <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => openDetail(item)}
                            className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer shadow-sm group transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                        {item.snippet}...
                                    </p>
                                </div>
                                <ArrowRight className="text-gray-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" size={20} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <Book size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Mulai pencarian untuk menemukan informasi kesehatan terpercaya.</p>
                </div>
            )}

            {/* Global Loading Overlay for Detail */}
            {loadingDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-xl">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={selectedItem?.title || 'Detail'}>
                {selectedItem && (
                    <div className="space-y-4">
                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                {selectedItem.extract}
                            </p>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                            <a 
                                href={`https://id.wikipedia.org/?curid=${selectedItem.id}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex-1"
                            >
                                <Button variant="secondary" className="w-full text-indigo-600">
                                    <ExternalLink size={16} /> Buka di Wikipedia
                                </Button>
                            </a>
                            <Button onClick={() => setSelectedItem(null)} className="flex-1">Tutup</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
