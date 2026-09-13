import React, { useState } from 'react';
import { Image as ImageIcon, X, ZoomIn, ZoomOut, Download, Share2, Maximize2, Calendar, Weight, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthRecord, Profile } from '../../types';
import { formatDate, calculateDetailedAge } from '../../utils';
import { Button } from '../UI';

export const GalleryView: React.FC<{
  records: HealthRecord[];
  profiles: Profile[];
  activeProfileId: string | null;
  onImageClick: (url: string, record: HealthRecord) => void;
}> = ({ records, profiles, activeProfileId, onImageClick }) => {
  // State for Full Screen Viewer
  const [viewImage, setViewImage] = useState<{ url: string; record: HealthRecord } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const photos = records
    .filter(r => activeProfileId ? r.profileId === activeProfileId : true)
    .flatMap(r => (r.photos || []).map(url => ({ url, record: r })))
    .sort((a, b) => b.record.timestamp - a.record.timestamp);

  // Helper to convert base64 to blob for sharing
  const dataURItoBlob = (dataURI: string) => {
    try {
        const splitData = dataURI.split(',');
        if (splitData.length < 2) return null;
        
        const byteString = atob(splitData[1]);
        const mimeString = splitData[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], {type: mimeString});
    } catch (e) {
        console.error("Error converting Data URI to Blob", e);
        return null;
    }
  };

  const handleDownload = () => {
      if (!viewImage) return;
      const link = document.createElement("a");
      link.href = viewImage.url;
      link.download = `LaviPhoto_${viewImage.record.date}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleShare = async () => {
      if (!viewImage) return;
      try {
          let blob: Blob | null = null;

          if (viewImage.url.startsWith('data:')) {
              blob = dataURItoBlob(viewImage.url);
          } else {
              // Handle remote URLs (e.g., from Google Drive Sync)
              try {
                  const response = await fetch(viewImage.url);
                  blob = await response.blob();
              } catch (fetchError) {
                  console.error("Failed to fetch remote image for sharing", fetchError);
                  showFeedback("Gagal mengunduh gambar dari server untuk dibagikan.");
                  return;
              }
          }

          if (!blob) {
              showFeedback("Gagal memproses gambar (Format tidak didukung).");
              return;
          }

          const file = new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });
          
          if (navigator.share) {
              await navigator.share({
                  title: 'Lavi Growth Tracker Photo',
                  text: `Foto perkembangan pada tanggal ${formatDate(viewImage.record.date)}. Berat: ${viewImage.record.weight || '-'} kg.`,
                  files: [file]
              });
          } else {
              showFeedback("Browser ini tidak mendukung fitur Share langsung. Silakan gunakan tombol Download.");
          }
      } catch (error: any) {
          // Ignore AbortError (User cancelled share)
          if (error.name === 'AbortError' || error.message?.toLowerCase().includes('cancel') || error.message?.toLowerCase().includes('share canceled')) {
              return;
          }
          console.error("Error sharing:", error);
          showFeedback("Terjadi kesalahan saat membagikan foto.");
      }
  };

  const openViewer = (url: string, record: HealthRecord) => {
      setViewImage({ url, record });
      setZoomLevel(1);
  };

  const closeViewer = () => {
      setViewImage(null);
      setZoomLevel(1);
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  if (photos.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ImageIcon size={48} className="mb-2 opacity-50" />
              <p>Belum ada foto yang tersimpan.</p>
          </div>
      );
  }

  return (
    <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((item, idx) => (
            <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative shadow-sm hover:shadow-md bg-gray-100 dark:bg-gray-800"
                onClick={() => openViewer(item.url, item.record)}
            >
                <img src={item.url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <span className="text-white text-xs font-medium">{formatDate(item.record.date)}</span>
                    {item.record.weight && <span className="text-white/80 text-[10px]">{item.record.weight} kg</span>}
                    <div className="absolute top-2 right-2 text-white opacity-80">
                        <Maximize2 size={16} />
                    </div>
                </div>
            </motion.div>
        ))}
        </div>

        {/* Full Screen Viewer Modal */}
        <AnimatePresence>
            {viewImage && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
                >
                    {/* Toolbar */}
                    <div className="flex justify-between items-center p-4 text-white z-10 bg-gradient-to-b from-black/50 to-transparent">
                        <button onClick={closeViewer} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                        <div className="flex gap-4">
                            <button onClick={() => setZoomLevel(z => Math.max(1, z - 0.5))} className="p-2 hover:bg-white/10 rounded-full">
                                <ZoomOut size={24} />
                            </button>
                            <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.5))} className="p-2 hover:bg-white/10 rounded-full">
                                <ZoomIn size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Image Area */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden relative">
                        <motion.div 
                            className="w-full h-full flex items-center justify-center"
                            animate={{ scale: zoomLevel }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <img 
                                src={viewImage.url} 
                                alt="Full View" 
                                className="max-w-full max-h-full object-contain"
                            />
                        </motion.div>
                    </div>

                    {/* Detail Info Sheet */}
                    <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 z-10 shadow-[0_-5px_30px_rgba(0,0,0,0.3)]">
                        <div className="max-w-md mx-auto space-y-4">
                            {/* Actions Header */}
                            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Detail Foto</h3>
                                    <p className="text-xs text-gray-500">{formatDate(viewImage.record.date)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={handleShare} className="h-10 w-10 p-0 rounded-full flex items-center justify-center">
                                        <Share2 size={18} />
                                    </Button>
                                    <Button onClick={handleDownload} className="h-10 w-10 p-0 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-emerald-200">
                                        <Download size={18} />
                                    </Button>
                                </div>
                            </div>

                            {feedbackMsg && (
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs rounded-xl text-center">
                                    {feedbackMsg}
                                </div>
                            )}

                            {/* Data Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex items-center gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Usia Saat Ini</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {activeProfile ? calculateDetailedAge(activeProfile.dob, activeProfile.type) : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex items-center gap-3">
                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full text-emerald-600">
                                        <Weight size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Berat</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {viewImage.record.weight ? `${viewImage.record.weight} kg` : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl flex items-center gap-3">
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full text-purple-600">
                                        <Ruler size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Tinggi/Panjang</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {viewImage.record.height ? `${viewImage.record.height} cm` : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {viewImage.record.notes && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                                    <span className="font-bold text-amber-700 dark:text-amber-500 block mb-1 text-xs uppercase">Catatan:</span>
                                    {viewImage.record.notes}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
};