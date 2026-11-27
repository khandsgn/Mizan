import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Search,
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

const PAGE_SIZE = 10;

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
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            MMT ma&apos;lumotlar bazasi va normalizatsiya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            CSV yuklash, bo&apos;sh qiymatlarni to&apos;ldirish (imputatsiya), kodlash va Z-score masshtablash
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV yuklash</span>
          </button>

          <button
            onClick={() => {
              onLoadSample();
              setPage(1);
            }}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            500 ta sintetik MMT bazasini yuklash
          </button>

          {appliedDataset && (
            <button
              onClick={onGoToLab}
              className="px-4 py-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>Logistik modelga o&apos;tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 border border-rose-300 bg-rose-50 text-rose-800 text-xs rounded-md">
          {uploadError}
        </div>
      )}

      {/* 4 Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-[11px] text-slate-500">Tanlama hajmi (N)</div>
          <div className="mono-num text-2xl font-bold mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">{sourceLabel}</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-[11px] text-slate-500">Yuqori ta&apos;sir (y = 1)</div>
          <div className="mono-num text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.highImpact} <span className="text-xs font-normal">({stats.highShare}%)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">2031 ulushi ≥ 25%</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-[11px] text-slate-500">Cheklangan ta&apos;sir (y = 0)</div>
          <div className="mono-num text-2xl font-bold mt-1">{stats.lowImpact}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">An&apos;anaviy portfel ustun</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-[11px] text-slate-500">Bo&apos;sh qiymatlar (NULL)</div>
          <div className="mono-num text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.missing}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Imputatsiya orqali to&apos;ldiriladi</div>
        </div>
      </div>

      {/* Preprocessing Config Panel */}
      {records.length > 0 && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                O&apos;zgaruvchilarni tayyorlash (Preprocessing)
              </h2>
              <p className="text-xs text-slate-500">
                Faol xususiyatlar: <strong className="mono-num">{livePreview?.featureNames.length ?? 0} ta</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onChangeConfig(DEFAULT_PREPROCESSING)}
                className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Standart</span>
              </button>
              <button
                onClick={onApplyPreprocessing}
                className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {appliedDataset
                  ? `Tasdiqlangan (${appliedDataset.appliedAt})`
                  : "Transformatsiyani qo'llash"}
              </button>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span>1. Bo&apos;sh kataklarni to&apos;ldirish ({stats.missing} ta)</span>
                <input
                  type="checkbox"
                  checked={config.imputeEnabled}
                  onChange={(e) => onChangeConfig({ ...config, imputeEnabled: e.target.checked })}
                  className="accent-blue-600"
                />
              </div>
              <select
                disabled={!config.imputeEnabled}
                value={config.imputeStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, imputeStrategy: e.target.value as ImputationStrategy })
                }
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              >
                <option value="median">Mediana bo&apos;yicha</option>
                <option value="mean">O&apos;rtacha arifmetik (Mean)</option>
                <option value="mode">Moda (Mode)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span>2. Kategoriyalarni kodlash</span>
                <input
                  type="checkbox"
                  checked={config.encodeEnabled}
                  onChange={(e) => onChangeConfig({ ...config, encodeEnabled: e.target.checked })}
                  className="accent-blue-600"
                />
              </div>
              <select
                disabled={!config.encodeEnabled}
                value={config.encodeStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, encodeStrategy: e.target.value as EncodingStrategy })
                }
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              >
                <option value="onehot">One-Hot Encoding (13 ustun)</option>
                <option value="label">Tartibli kodlash (Label, 6 ustun)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span>3. Masshtablash</span>
                <input
                  type="checkbox"
                  checked={config.scaleEnabled}
                  onChange={(e) => onChangeConfig({ ...config, scaleEnabled: e.target.checked })}
                  className="accent-blue-600"
                />
              </div>
              <select
                disabled={!config.scaleEnabled}
                value={config.scaleStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, scaleStrategy: e.target.value as ScalingStrategy })
                }
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              >
                <option value="zscore">Z-score (μ = 0, σ = 1)</option>
                <option value="minmax">Min-Max [0, 1]</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {records.length > 0 && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="ID, hudud yoki shartnoma..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>
              <select
                value={targetFilter}
                onChange={(e) => {
                  setTargetFilter(e.target.value as 'all' | '0' | '1');
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              >
                <option value="all">Barcha yozuvlar</option>
                <option value="1">Yuqori ta&apos;sir (y = 1)</option>
                <option value="0">Cheklangan (y = 0)</option>
              </select>
            </div>

            <button
              onClick={() => downloadCsv(recordsToCsv(filtered), 'mizan_mmt_data.csv')}
              className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV eksport</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ID</th>
                  <th className="px-4 py-2.5 font-semibold">Shariat talabi</th>
                  <th className="px-4 py-2.5 font-semibold">Raqamli indeks</th>
                  <th className="px-4 py-2.5 font-semibold">Kapital (mlrd)</th>
                  <th className="px-4 py-2.5 font-semibold">Soliq to&apos;sig&apos;i</th>
                  <th className="px-4 py-2.5 font-semibold">Hudud</th>
                  <th className="px-4 py-2.5 font-semibold">Shartnoma</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Sinf (y)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 mono-num font-semibold">{r.id}</td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.shariatTalabi !== null ? `${r.shariatTalabi}%` : <span className="text-amber-600 font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.raqamlashtirish !== null ? r.raqamlashtirish : <span className="text-amber-600 font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.kapitalHajmi !== null ? r.kapitalHajmi : <span className="text-amber-600 font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.soliqYuklamasi !== null ? r.soliqYuklamasi : <span className="text-amber-600 font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-2.5">{r.hudud}</td>
                    <td className="px-4 py-2.5 font-medium">{r.mahsulotTuri}</td>
                    <td className="px-4 py-2.5 text-right mono-num font-semibold">
                      {r.yuqoriTasir === 1 ? (
                        <span className="text-blue-600 dark:text-blue-400">1 (Yuqori)</span>
                      ) : (
                        <span className="text-slate-500">0 (Past)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="mono-num">Jami: {filtered.length} yozuv</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 border border-slate-300 dark:border-slate-700 rounded-xs disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="mono-num px-2">
                {safePage} / {totalPages}
              </span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 border border-slate-300 dark:border-slate-700 rounded-xs disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
