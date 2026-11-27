import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  EncodingStrategy,
  ImputationStrategy,
  PreprocessedDataset,
  PreprocessingConfig,
  RawRecord,
  ScalingStrategy,
} from '../types';
import { countMissingCells, downloadCsv, parseCsvToRecords, recordsToCsv } from '../lib/dataset';
import { DEFAULT_PREPROCESSING, preprocessDataset } from '../lib/mlEngine';

interface DataStudioPageProps {
  records: RawRecord[];
  sourceLabel: string;
  config: PreprocessingConfig;
  appliedDataset: PreprocessedDataset | null;
  onLoadSample: () => void;
  onUploadRecords: (records: RawRecord[], filename: string) => void;
  onChangeConfig: (cfg: PreprocessingConfig) => void;
  onApplyPreprocessing: () => void;
  onGoToLab: () => void;
}

const PAGE_SIZE = 8;

export const DataStudioPage: React.FC<DataStudioPageProps> = ({
  records,
  sourceLabel,
  config,
  appliedDataset,
  onLoadSample,
  onUploadRecords,
  onChangeConfig,
  onApplyPreprocessing,
  onGoToLab,
}) => {
  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState<'all' | '0' | '1'>('all');
  const [page, setPage] = useState(1);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const total = records.length;
    const highImpact = records.filter((r) => r.yuqoriTasir === 1).length;
    const lowImpact = total - highImpact;
    const missing = countMissingCells(records);
    const highShare = total ? ((highImpact / total) * 100).toFixed(1) : '0.0';
    return { total, highImpact, lowImpact, missing, highShare };
  }, [records]);

  const livePreview = useMemo(() => {
    if (!records.length) return null;
    return preprocessDataset(records, config);
  }, [records, config]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (targetFilter === '0' && r.yuqoriTasir !== 0) return false;
      if (targetFilter === '1' && r.yuqoriTasir !== 1) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.hudud.toLowerCase().includes(q) ||
        r.mahsulotTuri.toLowerCase().includes(q)
      );
    });
  }, [records, search, targetFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleFile = (file: File) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCsvToRecords(String(reader.result ?? ''));
      if (parsed.length < 10) {
        setUploadError("CSV faylda kamida 10 ta to'g'ri yozuv bo'lishi kerak.");
        return;
      }
      onUploadRecords(parsed, file.name);
      setPage(1);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Ma&apos;lumot va Tayyorlash studiyasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            MMT ma&apos;lumotlarini yuklash, tekshirish, bo&apos;sh kataklarni to&apos;ldirish va masshtablash — yagona oynada
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              onLoadSample();
              setPage(1);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F4C5C] hover:bg-[#136074] dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 text-sm font-semibold shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300 dark:text-slate-950" />
            <span>500 ta MMT namunasini yuklash</span>
          </button>

          {appliedDataset && (
            <button
              onClick={onGoToLab}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-sm"
            >
              <span>ML Laboratoriyaga o&apos;tish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Upload + Summary Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className="lg:col-span-5 rounded-2xl border-2 border-dashed border-stone-300 dark:border-slate-700 bg-white/80 dark:bg-[#111827] p-5 flex flex-col justify-center items-center text-center hover:border-[#0F4C5C] dark:hover:border-teal-400 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Upload className="w-6 h-6 text-[#0F4C5C] dark:text-teal-400 mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            O&apos;z CSV faylingizni yuklang
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Ustunlar: <code className="mono-num">id, shariat_talabi, raqamlashtirish, kapital_hajmi, soliq_yuklamasi, hudud, mahsulot_turi, yuqori_tasir</code>
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            Fayl tanlash (.csv)
          </button>
          {uploadError && <p className="text-xs text-rose-600 mt-2">{uploadError}</p>}
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Jami MMT</span>
            <span className="mono-num text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {stats.total}
            </span>
            <span className="text-[11px] text-[#0F4C5C] dark:text-teal-400 truncate mt-1">
              {sourceLabel}
            </span>
          </div>
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Yuqori ta&apos;sir (1)</span>
            <span className="mono-num text-2xl font-extrabold text-[#0F4C5C] dark:text-teal-400 mt-2">
              {stats.highImpact}
            </span>
            <span className="mono-num text-[11px] text-slate-500 mt-1">{stats.highShare}% ulush</span>
          </div>
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Cheklangan (0)</span>
            <span className="mono-num text-2xl font-extrabold text-slate-700 dark:text-slate-200 mt-2">
              {stats.lowImpact}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">An&apos;anaviy ustun</span>
          </div>
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Bo&apos;sh kataklar</span>
            <span className="mono-num text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
              {stats.missing}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Imputatsiya kerak</span>
          </div>
        </div>
      </div>

      {/* Unified Preprocessing Control Bar (Only when records loaded) */}
      {records.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Jonli tayyorlash konveyeri (Preprocessing)
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/15 text-[#0F4C5C] dark:text-teal-300 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                Data Leakage himoyasi
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onChangeConfig(DEFAULT_PREPROCESSING)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tiklash</span>
              </button>
              <button
                onClick={onApplyPreprocessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F4C5C] hover:bg-[#136074] dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 text-xs font-bold shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {appliedDataset ? `Tasdiqlangan (${appliedDataset.appliedAt})` : "Tayyorlashni qo'llash"}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#FAF9F6] dark:bg-slate-900/70 border border-stone-200 dark:border-slate-800 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  1. Imputatsiya ({stats.missing} ta null)
                </span>
                <input
                  type="checkbox"
                  checked={config.imputeEnabled}
                  onChange={(e) => onChangeConfig({ ...config, imputeEnabled: e.target.checked })}
                  className="accent-[#0F4C5C] w-4 h-4"
                />
              </div>
              <select
                disabled={!config.imputeEnabled}
                value={config.imputeStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, imputeStrategy: e.target.value as ImputationStrategy })
                }
                className="w-full px-2.5 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              >
                <option value="median">Mediana (tavsiya etilgan)</option>
                <option value="mean">O&apos;rtacha (Mean)</option>
                <option value="mode">Moda (Mode)</option>
              </select>
            </div>

            <div className="rounded-xl bg-[#FAF9F6] dark:bg-slate-900/70 border border-stone-200 dark:border-slate-800 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  2. Kodlash ({livePreview?.featureNames.length ?? 0} ustun)
                </span>
                <input
                  type="checkbox"
                  checked={config.encodeEnabled}
                  onChange={(e) => onChangeConfig({ ...config, encodeEnabled: e.target.checked })}
                  className="accent-[#0F4C5C] w-4 h-4"
                />
              </div>
              <select
                disabled={!config.encodeEnabled}
                value={config.encodeStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, encodeStrategy: e.target.value as EncodingStrategy })
                }
                className="w-full px-2.5 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              >
                <option value="onehot">One-Hot Encoding (Hudud &amp; Mahsulot)</option>
                <option value="label">Label Encoding</option>
              </select>
            </div>

            <div className="rounded-xl bg-[#FAF9F6] dark:bg-slate-900/70 border border-stone-200 dark:border-slate-800 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  3. Masshtablash
                </span>
                <input
                  type="checkbox"
                  checked={config.scaleEnabled}
                  onChange={(e) => onChangeConfig({ ...config, scaleEnabled: e.target.checked })}
                  className="accent-[#0F4C5C] w-4 h-4"
                />
              </div>
              <select
                disabled={!config.scaleEnabled}
                value={config.scaleStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, scaleStrategy: e.target.value as ScalingStrategy })
                }
                className="w-full px-2.5 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              >
                <option value="zscore">Z-score standartlashtirish (μ=0, σ=1)</option>
                <option value="minmax">Min-Max [0, 1]</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Table */}
      {records.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="ID, hudud yoki mahsulot..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900 text-xs sm:text-sm"
                />
              </div>
              <select
                value={targetFilter}
                onChange={(e) => {
                  setTargetFilter(e.target.value as 'all' | '0' | '1');
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900 text-xs sm:text-sm"
              >
                <option value="all">Barcha holatlar</option>
                <option value="1">Yuqori ta&apos;sir (1)</option>
                <option value="0">Cheklangan (0)</option>
              </select>
            </div>

            <button
              onClick={() => downloadCsv(recordsToCsv(filtered), 'mizan_uz_mmt_dataset.csv')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV eksport</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF9F6] dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">MMT ID</th>
                  <th className="px-4 py-3 font-semibold">Shariat talabi</th>
                  <th className="px-4 py-3 font-semibold">Raqamli ball</th>
                  <th className="px-4 py-3 font-semibold">Kapital</th>
                  <th className="px-4 py-3 font-semibold">Soliq to&apos;sig&apos;i</th>
                  <th className="px-4 py-3 font-semibold">Hudud</th>
                  <th className="px-4 py-3 font-semibold">Mahsulot</th>
                  <th className="px-4 py-3 font-semibold text-right">2031 Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/70">
                {pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 mono-num font-semibold text-slate-800 dark:text-slate-200">
                      {r.id}
                    </td>
                    <td className="px-4 py-3 mono-num">
                      {r.shariatTalabi !== null ? `${r.shariatTalabi}%` : <span className="text-amber-600 font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-3 mono-num">
                      {r.raqamlashtirish !== null ? r.raqamlashtirish : <span className="text-amber-600 font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-3 mono-num">
                      {r.kapitalHajmi !== null ? `${r.kapitalHajmi} mlrd` : <span className="text-amber-600 font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-3 mono-num">
                      {r.soliqYuklamasi !== null ? r.soliqYuklamasi : <span className="text-amber-600 font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-3">{r.hudud}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-xs font-medium">
                        {r.mahsulotTuri}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.yuqoriTasir === 1 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/15 text-[#0F4C5C] dark:text-teal-300 border border-teal-200 dark:border-teal-500/25">
                          Yuqori (1)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Cheklangan (0)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Jami <strong className="mono-num text-slate-800 dark:text-slate-200">{filtered.length}</strong> yozuv
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="mono-num px-2 font-semibold text-slate-800 dark:text-slate-200">
                {safePage} / {totalPages}
              </span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
