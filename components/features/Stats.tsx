
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, ReferenceArea 
} from 'recharts';
import { 
  Activity, Calculator, Hash, TrendingUp, TrendingDown, Minus, 
  ListPlus, ChevronUp, ChevronDown, Filter, Baby 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthRecord, Profile, METRIC_LABELS, ProfileType } from '../../types';
import { formatDate, getAgeInMonths } from '../../utils';
import { Card } from '../UI';
import { 
    WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS, 
    WHO_HEIGHT_BOYS, WHO_HEIGHT_GIRLS,
    WHO_HEAD_BOYS, WHO_HEAD_GIRLS 
} from '../../data/medicalData';

// --- SUB-COMPONENT: REUSABLE CHART ---
const SingleGrowthChart: React.FC<{
    title: string;
    data: any[];
    dataKey: string;
    color: string;
    whoData: any[];
    unit: string;
    onPointClick: (r: HealthRecord) => void;
}> = ({ title, data, dataKey, color, whoData, unit, onPointClick }) => {
    // Process data to include WHO reference points
    const chartData = data.map(r => {
        const base = {
            date: formatDate(r.date).split(',')[1],
            fullDate: formatDate(r.date),
            value: Number(r[dataKey]),
            original: r,
        };

        if (whoData.length > 0) {
            // Calculate age in months for THIS specific record
            const dob = new Date(r.dob_ref); // Passed via pre-processing
            const recordDate = new Date(r.date);
            let ageMonths = (recordDate.getFullYear() - dob.getFullYear()) * 12 + (recordDate.getMonth() - dob.getMonth());
            if (ageMonths < 0) ageMonths = 0;

            const ref = whoData.reduce((prev, curr) => 
                Math.abs(curr.month - ageMonths) < Math.abs(prev.month - ageMonths) ? curr : prev
            );
            return { ...base, p3: ref.p3, p50: ref.p50, p97: ref.p97 };
        }
        return base;
    });

    return (
        <Card className="p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className={color.replace('bg-', 'text-').replace('100', '500')} /> {title}
                </h4>
                {whoData.length > 0 && <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-md">Standar WHO</span>}
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`grad${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color === 'text-emerald-500' ? '#10b981' : color === 'text-blue-500' ? '#3b82f6' : '#8b5cf6'} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={color === 'text-emerald-500' ? '#10b981' : color === 'text-blue-500' ? '#3b82f6' : '#8b5cf6'} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} dy={10} />
                        <YAxis tick={{fontSize: 10, fill: '#9ca3af'}} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                        
                        {/* WHO Lines */}
                        {whoData.length > 0 && (
                            <>
                                <Line type="monotone" dataKey="p50" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Ideal" />
                                <Line type="monotone" dataKey="p3" stroke="#fca5a5" strokeDasharray="3 3" strokeWidth={1} dot={false} name="Batas Bawah" />
                                <Line type="monotone" dataKey="p97" stroke="#fca5a5" strokeDasharray="3 3" strokeWidth={1} dot={false} name="Batas Atas" />
                            </>
                        )}

                        {/* User Data */}
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={color === 'text-emerald-500' ? '#10b981' : color === 'text-blue-500' ? '#3b82f6' : '#8b5cf6'} 
                            fillOpacity={1} 
                            fill={`url(#grad${dataKey})`} 
                            strokeWidth={3} 
                            activeDot={{ r: 6, onClick: (e: any, payload: any) => payload.payload.original && onPointClick(payload.payload.original) }}
                            name={`${title} (${unit})`}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export const StatsView: React.FC<{
  records: HealthRecord[];
  profiles: Profile[];
  activeProfile: Profile;
  onRecordSelect: (r: HealthRecord) => void;
}> = ({ records, profiles, activeProfile, onRecordSelect }) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(activeProfile.id);
  const [metric, setMetric] = useState('weight');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const targetProfile = profiles.find(p => p.id === selectedProfileId) || activeProfile;
  const isBaby = targetProfile.type === ProfileType.BABY || targetProfile.type === ProfileType.CHILD;

  // Filter & Interpolate Data Logic
  const getProcessedData = (metricKey: string) => {
      // 1. Get ALL records for profile first, sorted chronologically
      let data = records
          .filter(r => r.profileId === selectedProfileId)
          .sort((a, b) => a.timestamp - b.timestamp);

      // 2. Apply Interpolation (Carry Forward) on the WHOLE history first
      // This ensures if the first day of the *selected range* is empty, it picks up the previous value.
      let lastValue: number | null = null;
      
      const filledData = data.map(r => {
          let val = (r as any)[metricKey];
          
          if (val !== undefined && val !== null && val !== '') {
              lastValue = Number(val);
          } else if (lastValue !== null) {
              // Missing value, use last known
              val = lastValue;
          }

          return { ...r, [metricKey]: val, dob_ref: targetProfile.dob };
      });

      // 3. Filter by Date Range AFTER interpolation
      let finalData = filledData;
      if (filterDateStart) finalData = finalData.filter(r => new Date(r.date) >= new Date(filterDateStart));
      if (filterDateEnd) finalData = finalData.filter(r => new Date(r.date) <= new Date(filterDateEnd));

      // 4. Remove entries that are STILL null (no previous history)
      return finalData.filter(r => (r as any)[metricKey] !== undefined && (r as any)[metricKey] !== null);
  };

  // Main filtered data for the *selected* metric (Legacy view)
  const mainFilteredData = useMemo(() => getProcessedData(metric), [records, selectedProfileId, metric, filterDateStart, filterDateEnd]);

  // Specific datasets for Baby View (Auto interpolated)
  const babyWeightData = useMemo(() => isBaby ? getProcessedData('weight') : [], [records, selectedProfileId, isBaby]);
  const babyHeightData = useMemo(() => isBaby ? getProcessedData('height') : [], [records, selectedProfileId, isBaby]);
  const babyHeadData = useMemo(() => isBaby ? getProcessedData('headCircumference') : [], [records, selectedProfileId, isBaby]);

  // Stats Logic for Summary Cards
  const stats = useMemo(() => {
      // @ts-ignore
      const values = mainFilteredData.map(r => Number(r[metric])).filter(v => !isNaN(v));
      if (values.length === 0) return null;
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const last = values[values.length - 1];
      const diff = last - values[0];
      return { current: last, avg, min, max, diff, count: values.length };
  }, [mainFilteredData, metric]);

  // Determine WHO Reference Data
  const getWhoData = (type: 'weight' | 'height' | 'head') => {
      if (!isBaby) return [];
      const gender = targetProfile.gender;
      if (type === 'weight') return gender === 'Male' ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
      if (type === 'height') return gender === 'Male' ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
      if (type === 'head') return gender === 'Male' ? WHO_HEAD_BOYS : WHO_HEAD_GIRLS;
      return [];
  };

  return (
    <div className="space-y-6">
      
      {/* Filter Control */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full p-4 flex items-center justify-between font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
             <div className="flex items-center gap-2 text-sm uppercase tracking-wide">
                <Filter size={16} /> Filter & Profil
             </div>
             {isFilterExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <AnimatePresence>
            {isFilterExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                    <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Profil</label>
                            <select 
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm outline-none"
                                value={selectedProfileId}
                                onChange={e => setSelectedProfileId(e.target.value)}
                            >
                                {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        {/* Hide Metric Selector for Baby because we show all charts */}
                        {!isBaby && (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Metrik Data</label>
                                <select 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm outline-none"
                                    value={metric}
                                    onChange={e => setMetric(e.target.value)}
                                >
                                    {Object.entries(METRIC_LABELS).map(([k, v]) => (
                                        <option key={k} value={k}>{v}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Dari Tanggal</label>
                            <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Sampai Tanggal</label>
                            <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 text-sm outline-none" />
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* --- BABY MODE: COMPLETE GROWTH CHARTS --- */}
      {isBaby ? (
          <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                      <Baby size={20} />
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">Grafik Tumbuh Kembang (WHO)</h3>
              </div>

              {babyWeightData.length > 0 ? (
                  <SingleGrowthChart 
                      title="Berat Badan" 
                      data={babyWeightData} 
                      dataKey="weight" 
                      color="text-emerald-500" 
                      whoData={getWhoData('weight')} 
                      unit="kg"
                      onPointClick={onRecordSelect}
                  />
              ) : <div className="p-4 text-center text-gray-400 bg-gray-50 rounded-xl">Belum ada data Berat Badan</div>}

              {babyHeightData.length > 0 ? (
                  <SingleGrowthChart 
                      title="Panjang Badan" 
                      data={babyHeightData} 
                      dataKey="height" 
                      color="text-blue-500" 
                      whoData={getWhoData('height')} 
                      unit="cm"
                      onPointClick={onRecordSelect}
                  />
              ) : <div className="p-4 text-center text-gray-400 bg-gray-50 rounded-xl">Belum ada data Panjang Badan</div>}

              {babyHeadData.length > 0 ? (
                  <SingleGrowthChart 
                      title="Lingkar Kepala" 
                      data={babyHeadData} 
                      dataKey="headCircumference" 
                      color="text-purple-500" 
                      whoData={getWhoData('head')} 
                      unit="cm"
                      onPointClick={onRecordSelect}
                  />
              ) : <div className="p-4 text-center text-gray-400 bg-gray-50 rounded-xl">Belum ada data Lingkar Kepala</div>}
          </div>
      ) : (
          /* --- NORMAL MODE (NON-BABY): SINGLE CHART WITH SUMMARY --- */
          <>
            {stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="flex flex-col justify-between" noDefaultBg>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                            <Activity size={14} className="text-emerald-500" /> Terakhir
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.current} <span className="text-sm font-normal text-gray-500">unit</span>
                        </div>
                    </Card>
                    <Card className="flex flex-col justify-between" noDefaultBg>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                            <Calculator size={14} className="text-blue-500" /> Rata-Rata
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.avg.toFixed(2)}
                        </div>
                    </Card>
                    <Card className="flex flex-col justify-between" noDefaultBg>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                            <Hash size={14} className="text-purple-500" /> Min / Max
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.min}</div>
                            <span className="text-gray-400 text-sm">/</span>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.max}</div>
                        </div>
                    </Card>
                    <Card className={`flex flex-col justify-between border-l-4 ${stats.diff > 0 ? 'border-l-emerald-500' : stats.diff < 0 ? 'border-l-red-500' : 'border-l-gray-300'}`} noDefaultBg>
                        <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                            {stats.diff > 0 ? <TrendingUp size={14} className="text-emerald-500" /> : stats.diff < 0 ? <TrendingDown size={14} className="text-red-500" /> : <Minus size={14} />} Perubahan
                        </div>
                        <div className={`text-2xl font-bold ${stats.diff > 0 ? 'text-emerald-600' : stats.diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {stats.diff > 0 ? '+' : ''}{stats.diff.toFixed(2)}
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500">Tidak ada data untuk metrik ini.</p>
                </div>
            )}

            {mainFilteredData.length > 0 && (
                <SingleGrowthChart 
                    title={METRIC_LABELS[metric] || metric} 
                    data={mainFilteredData} 
                    dataKey={metric} 
                    color="text-emerald-500" 
                    whoData={[]} // No WHO data for adults/seniors usually
                    unit="unit"
                    onPointClick={onRecordSelect}
                />
            )}
          </>
      )}
    </div>
  );
};
