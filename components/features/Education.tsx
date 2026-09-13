
import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Search, Zap, Droplet, Info, ScanBarcode, Loader2, Utensils, Camera, X, Aperture } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Button } from '../UI';
import { searchFoodProduct, getProductByBarcode } from '../../services/externalApi';

// PANDUAN EDIT: Tambahkan atau ubah objek di dalam array ini untuk mengupdate info nutrisi.
const NUTRITION_DATA = [
  // Vitamin Utama
  {
    name: "Vitamin A",
    func: "Kesehatan mata, sistem kekebalan tubuh, pertumbuhan sel.",
    source: "Wortel, ubi jalar, bayam, hati sapi, telur, susu.",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
  },
  {
    name: "Vitamin C",
    func: "Antioksidan kuat, penyembuhan luka, penyerapan zat besi, imun tubuh.",
    source: "Jeruk, stroberi, kiwi, paprika merah, brokoli, tomat, jambu biji.",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
  },
  {
    name: "Vitamin D",
    func: "Penyerapan kalsium, kesehatan tulang & gigi, fungsi otot.",
    source: "Sinar matahari pagi, ikan berlemak (salmon, tuna), kuning telur, jamur.",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
  },
  {
    name: "Vitamin E",
    func: "Antioksidan, melindungi sel dari kerusakan, kesehatan kulit.",
    source: "Kacang almond, biji bunga matahari, alpukat, bayam.",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
  },
  {
    name: "Vitamin K",
    func: "Penting untuk pembekuan darah dan kesehatan tulang.",
    source: "Sayuran hijau (kale, bayam, brokoli), minyak ikan.",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  },

  // Vitamin B Kompleks
  {
    name: "Vitamin B1 (Thiamin)",
    func: "Mengubah makanan menjadi energi, fungsi saraf.",
    source: "Biji-bijian utuh, daging babi, ikan, kacang-kacangan.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },
  {
    name: "Vitamin B2 (Riboflavin)",
    func: "Produksi energi, fungsi sel, kesehatan mata & kulit.",
    source: "Telur, jeroan (hati, ginjal), susu, sayuran hijau.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },
  {
    name: "Vitamin B3 (Niacin)",
    func: "Sistem pencernaan, kulit, dan saraf.",
    source: "Daging, ikan, unggas, biji-bijian, kacang tanah.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },
  {
    name: "Vitamin B6",
    func: "Perkembangan otak, fungsi saraf, metabolisme.",
    source: "Ayam, ikan, kentang, buncis, pisang.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },
  {
    name: "Vitamin B9 (Asam Folat)",
    func: "Penting untuk ibu hamil (mencegah cacat lahir), pembentukan sel darah.",
    source: "Sayuran hijau, kacang polong, jeruk, sereal fortifikasi.",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
  },
  {
    name: "Vitamin B12",
    func: "Kesehatan saraf, pembentukan DNA, sel darah merah.",
    source: "Daging, ikan, produk susu, telur (hanya di produk hewani).",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
  },

  // Mineral
  {
    name: "Kalsium",
    func: "Pembentukan tulang & gigi kuat, pembekuan darah, fungsi saraf.",
    source: "Susu, keju, yogurt, sayuran hijau (kale), sarden, tahu.",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  },
  {
    name: "Zat Besi",
    func: "Pembentukan hemoglobin (sel darah merah), mencegah anemia.",
    source: "Daging merah, hati, bayam, kacang-kacangan, kerang.",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
  },
  {
    name: "Zinc (Seng)",
    func: "Sistem imun, penyembuhan luka, indra perasa & penciuman.",
    source: "Tiram, daging sapi, biji labu, lentil.",
    color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300"
  },
  {
    name: "Magnesium",
    func: "Fungsi otot & saraf, gula darah, tekanan darah.",
    source: "Almond, bayam, kacang mete, kacang hitam, edamame.",
    color: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300"
  },
  {
    name: "Kalium (Potasium)",
    func: "Keseimbangan cairan, kontraksi otot, sinyal saraf.",
    source: "Pisang, kentang, bayam, jamur, kacang polong.",
    color: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300"
  },
  {
    name: "Yodium",
    func: "Membuat hormon tiroid (metabolisme), perkembangan otak janin.",
    source: "Garam beryodium, ikan laut, rumput laut, udang, telur.",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
  },

  // Lainnya
  {
    name: "Omega-3",
    func: "Kesehatan otak, jantung, mata, perkembangan janin.",
    source: "Ikan salmon, makarel, biji chia, kenari (walnut), minyak ikan.",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
  },
  {
    name: "Protein",
    func: "Membangun dan memperbaiki jaringan tubuh, pembentukan otot.",
    source: "Daging, ayam, ikan, telur, tahu, tempe, kacang-kacangan.",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
  }
];

export const ArticlesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'search'>('info');
  const [searchTerm, setSearchTerm] = useState("");
  
  // OpenFoodFacts State
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Barcode Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleProductSearch = async () => {
      if (!productQuery) return;
      setIsSearching(true);
      setHasSearched(true);
      setScanError(null);
      
      // Check if query is likely a barcode (numeric)
      if (/^\d{8,13}$/.test(productQuery)) {
          const product = await getProductByBarcode(productQuery);
          setProductResults(product ? [product] : []);
      } else {
          const results = await searchFoodProduct(productQuery);
          setProductResults(results);
      }
      setIsSearching(false);
  };

  const startScanner = async () => {
      setScanError(null);
      setIsScanning(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  videoRef.current.play();
                  detectBarcode();
              }
          } catch (err) {
              setScanError("Gagal mengakses kamera. Izin ditolak atau kamera tidak tersedia.");
              setIsScanning(false);
          }
      } else {
          setScanError("Browser Anda tidak mendukung akses kamera.");
          setIsScanning(false);
      }
  };

  const stopScanner = () => {
      setIsScanning(false);
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
  };

  const detectBarcode = async (manualTrigger = false) => {
      if (!videoRef.current || !isScanning) return;
      
      // Use standard BarcodeDetector API if available (Supported in Chrome Android/macOS)
      if ('BarcodeDetector' in window) {
          try {
              // @ts-ignore
              const barcodeDetector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
              const barcodes = await barcodeDetector.detect(videoRef.current);
              
              if (barcodes.length > 0) {
                  const code = barcodes[0].rawValue;
                  stopScanner();
                  setProductQuery(code);
                  // Auto search
                  setIsSearching(true);
                  setHasSearched(true);
                  const product = await getProductByBarcode(code);
                  setProductResults(product ? [product] : []);
                  setIsSearching(false);
                  return;
              } else if (manualTrigger) {
                  setScanError("Tidak ada barcode terdeteksi pada gambar. Coba posisikan barcode di tengah.");
              }
          } catch (e: any) {
              if (manualTrigger) setScanError("Deteksi barcode gagal: " + (e?.message || String(e)));
          }
      } else {
          if(!manualTrigger) {
              setScanError("Browser ini tidak mendukung deteksi otomatis. Gunakan tombol 'Ambil Gambar' atau input manual.");
              return; 
          } else {
              // Fallback manual trigger message
              setScanError("Browser Anda belum mendukung pemindaian barcode langsung. Silakan masukkan nomor barcode secara manual.");
          }
      }

      if (isScanning && !manualTrigger) {
          requestAnimationFrame(() => detectBarcode(false));
      }
  };

  const manualSnap = () => {
      // Force trigger detection once
      detectBarcode(true);
  };

  const filteredNutrition = NUTRITION_DATA.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.func.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
            <BookOpen size={28} />
            </div>
            <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ensiklopedia Nutrisi</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Panduan gizi dan pencarian produk makanan.</p>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4">
          <button 
            onClick={() => { setActiveTab('info'); stopScanner(); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'info' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500'}`}
          >
             <Info size={16} /> Info Vitamin
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'search' ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' : 'text-gray-500'}`}
          >
             <ScanBarcode size={16} /> Cek Produk
          </button>
      </div>

      {activeTab === 'info' ? (
          <>
            <div className="w-full relative mb-4">
                <Input 
                    icon={<Search size={18} />} 
                    placeholder="Cari vitamin, fungsi, atau makanan..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    enableVoice={true}
                    onVoiceResult={(val) => setSearchTerm(val)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredNutrition.map((item, idx) => (
                    <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${item.color}`}>
                        {item.name}
                    </div>
                    <div className="space-y-3">
                        <div>
                            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                <Zap size={14} className="text-amber-500" /> Fungsi Utama
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.func}</p>
                        </div>
                        <div>
                            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                <Droplet size={14} className="text-blue-500" /> Sumber Makanan
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.source}</p>
                        </div>
                    </div>
                    </motion.div>
                ))}
                {filteredNutrition.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        Tidak ada data nutrisi yang cocok dengan pencarian "{searchTerm}".
                    </div>
                )}
            </div>
          </>
      ) : (
          <div className="space-y-4">
              
              {/* SCANNER UI */}
              <AnimatePresence>
                  {isScanning && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-4 shadow-lg border border-gray-800"
                      >
                          <video ref={videoRef} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 border-2 border-orange-500 opacity-50 m-8 rounded-xl animate-pulse pointer-events-none"></div>
                          
                          <button onClick={stopScanner} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full z-10"><X size={20}/></button>
                          
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10 gap-3">
                              <button onClick={manualSnap} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
                                  <Aperture size={16} /> Foto / Deteksi Manual
                              </button>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>

              {scanError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                      <Info size={16} /> {scanError}
                  </div>
              )}

              <div className="flex gap-2">
                  <div className="flex-1">
                    <Input 
                        placeholder="Nama produk atau Scan Barcode"
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        enableVoice={true}
                        onVoiceResult={(val) => setProductQuery(val)}
                    />
                  </div>
                  <Button onClick={startScanner} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-none">
                      <Camera size={20} />
                  </Button>
                  <Button onClick={handleProductSearch} disabled={!productQuery || isSearching} className="bg-orange-500 hover:bg-orange-600 border-none text-white">
                      {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                  </Button>
              </div>

              {isSearching ? (
                  <div className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto text-orange-500" size={32} />
                      <p className="text-sm text-gray-500 mt-2">Mencari di OpenFoodFacts...</p>
                  </div>
              ) : productResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {productResults.map((p) => (
                          <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex gap-4">
                              <div className="w-20 h-20 bg-white rounded-lg flex-shrink-0 border p-1">
                                  {p.image ? (
                                      <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils /></div>
                                  )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{p.name}</h4>
                                  <p className="text-xs text-gray-500 mb-2">{p.brand}</p>
                                  
                                  <div className="flex gap-3 text-xs">
                                      <div>
                                          <span className="block font-bold text-gray-700 dark:text-gray-300">{Math.round(p.calories)}</span>
                                          <span className="text-[10px] text-gray-400">kcal</span>
                                      </div>
                                      <div>
                                          <span className="block font-bold text-gray-700 dark:text-gray-300">{Math.round(p.sugar)}g</span>
                                          <span className="text-[10px] text-gray-400">Gula</span>
                                      </div>
                                      <div>
                                          <span className="block font-bold text-gray-700 dark:text-gray-300">{Math.round(p.protein)}g</span>
                                          <span className="text-[10px] text-gray-400">Protein</span>
                                      </div>
                                      {p.nutriscore && p.nutriscore !== '?' && (
                                          <div className={`ml-auto px-2 py-1 rounded font-bold text-white ${
                                              p.nutriscore === 'A' ? 'bg-green-600' :
                                              p.nutriscore === 'B' ? 'bg-green-400' :
                                              p.nutriscore === 'C' ? 'bg-yellow-400' :
                                              p.nutriscore === 'D' ? 'bg-orange-400' : 'bg-red-500'
                                          }`}>
                                              {p.nutriscore}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      {hasSearched ? (
                          <>
                            <p className="text-gray-500 text-sm">Tidak ditemukan produk dengan kata kunci "{productQuery}".</p>
                            <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau scan barcode produk.</p>
                          </>
                      ) : (
                          <>
                            <p className="text-gray-500 text-sm">Cari produk makanan atau scan barcode untuk melihat nutrisi.</p>
                            <p className="text-[10px] text-gray-400 mt-1">Powered by Open Food Facts API</p>
                          </>
                      )}
                  </div>
              )}
          </div>
      )}

      {/* General Tips (Always Visible) */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-6 mt-6">
          <div className="flex items-start gap-3">
             <Info className="text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
             <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p className="font-bold text-lg text-emerald-800 dark:text-emerald-200">Tips Kesehatan Umum</p>
                <ul className="list-disc pl-4 space-y-1">
                   <li>Pastikan minum air putih yang cukup (minimal 8 gelas/hari untuk dewasa).</li>
                   <li>Tidur yang cukup (7-9 jam untuk dewasa, lebih banyak untuk anak-anak).</li>
                   <li>Olahraga ringan minimal 30 menit sehari dapat meningkatkan mood.</li>
                   <li>Cuci tangan sebelum makan untuk mencegah infeksi.</li>
                </ul>
             </div>
          </div>
      </div>
    </div>
  );
};
