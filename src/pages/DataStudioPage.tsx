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
      <div className="border-b border-[#D5D3CC] dark:border-[#222630] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="mono-num text-[11px] uppercase tracking-widest text-[#5A6065] dark:text-slate-400">
            02-bo&apos;lim · Empirik tanlama va normalizatsiya
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111315] dark:text-white mt-1">
            MMT ma&apos;lumotlar bazasi va tayyorlash
          </h1>
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
            className="px-3.5 py-2 rounded-[3px] border border-[#C5C2B8] dark:border-[#2C3240] bg-white dark:bg-[#151921] hover:bg-[#EAE8E1] dark:hover:bg-[#1E2430] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV yuklash</span>
          </button>

          <button
            onClick={() => {
              onLoadSample();
              setPage(1);
            }}
            className="px-4 py-2 rounded-[3px] bg-[#0F5338] hover:bg-[#0B3E2A] text-white text-xs font-semibold"
          >
            500 ta sintetik MMT bazasini yuklash
          </button>

          {appliedDataset && (
            <button
              onClick={onGoToLab}
              className="px-4 py-2 rounded-[3px] bg-[#111315] dark:bg-white text-white dark:text-[#111315] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>Regressiya modeliga o&apos;tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 border border-rose-300 bg-rose-50 text-rose-800 text-xs rounded-[3px]">
          {uploadError}
        </div>
      )}

      {/* Summary Ledger Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#D5D3CC] dark:bg-[#222630] border border-[#D5D3CC] dark:border-[#222630]">
        <div className="bg-white dark:bg-[#11141A] p-4">
          <div className="text-[11px] text-[#5A6065] dark:text-slate-400">Tanlama hajmi (N)</div>
          <div className="mono-num text-2xl font-bold mt-1">{stats.total}</div>
          <div className="text-[11px] text-[#5A6065] truncate mt-0.5">{sourceLabel}</div>
        </div>
        <div className="bg-white dark:bg-[#11141A] p-4">
          <div className="text-[11px] text-[#5A6065] dark:text-slate-400">Yuqori ta&apos;sir (y = 1)</div>
          <div className="mono-num text-2xl font-bold text-[#0F5338] dark:text-emerald-400 mt-1">
            {stats.highImpact} <span className="text-xs font-normal">({stats.highShare}%)</span>
          </div>
          <div className="text-[11px] text-[#5A6065] mt-0.5">2031 ulushi ≥ 25%</div>
        </div>
        <div className="bg-white dark:bg-[#11141A] p-4">
          <div className="text-[11px] text-[#5A6065] dark:text-slate-400">Cheklangan ta&apos;sir (y = 0)</div>
          <div className="mono-num text-2xl font-bold mt-1">{stats.lowImpact}</div>
          <div className="text-[11px] text-[#5A6065] mt-0.5">An&apos;anaviy portfel ustun</div>
        </div>
        <div className="bg-white dark:bg-[#11141A] p-4">
          <div className="text-[11px] text-[#5A6065] dark:text-slate-400">Bo&apos;sh qiymatlar (NULL)</div>
          <div className="mono-num text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
            {stats.missing}
          </div>
          <div className="text-[11px] text-[#5A6065] mt-0.5">Imputatsiya orqali to&apos;ldiriladi</div>
        </div>
      </div>

      {/* Preprocessing Configuration Panel */}
      {records.length > 0 && (
        <div className="bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px]">
          <div className="px-5 py-3.5 border-b border-[#E6E4DD] dark:border-[#1E222B] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#111315] dark:text-white">
                O&apos;zgaruvchilarni oldindan qayta ishlash (Preprocessing)
              </h2>
              <p className="text-xs text-[#5A6065] dark:text-slate-400">
                Faol xususiyatlar: <strong className="mono-num">{livePreview?.featureNames.length ?? 0} ta</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onChangeConfig(DEFAULT_PREPROCESSING)}
                className="px-3 py-1.5 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] text-xs font-medium inline-flex items-center gap-1 hover:bg-[#F4F3EE] dark:hover:bg-[#1A1E26]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Standart</span>
              </button>
              <button
                onClick={onApplyPreprocessing}
                className="px-4 py-1.5 rounded-[3px] bg-[#0F5338] hover:bg-[#0B3E2A] text-white text-xs font-semibold"
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
                  className="accent-[#0F5338]"
                />
              </div>
              <select
                disabled={!config.imputeEnabled}
                value={config.imputeStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, imputeStrategy: e.target.value as ImputationStrategy })
                }
                className="w-full px-3 py-2 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] bg-[#FAF9F5] dark:bg-[#151921] text-xs"
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
                  className="accent-[#0F5338]"
                />
              </div>
              <select
                disabled={!config.encodeEnabled}
                value={config.encodeStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, encodeStrategy: e.target.value as EncodingStrategy })
                }
                className="w-full px-3 py-2 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] bg-[#FAF9F5] dark:bg-[#151921] text-xs"
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
                  className="accent-[#0F5338]"
                />
              </div>
              <select
                disabled={!config.scaleEnabled}
                value={config.scaleStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, scaleStrategy: e.target.value as ScalingStrategy })
                }
                className="w-full px-3 py-2 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] bg-[#FAF9F5] dark:bg-[#151921] text-xs"
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
        <div className="bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px]">
          <div className="p-4 border-b border-[#E6E4DD] dark:border-[#1E222B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-[#5A6065] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="ID, hudud yoki shartnoma..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] bg-[#FAF9F5] dark:bg-[#151921] text-xs"
                />
              </div>
              <select
                value={targetFilter}
                onChange={(e) => {
                  setTargetFilter(e.target.value as 'all' | '0' | '1');
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] bg-[#FAF9F5] dark:bg-[#151921] text-xs"
              >
                <option value="all">Barcha yozuvlar</option>
                <option value="1">Yuqori ta&apos;sir (y = 1)</option>
                <option value="0">Cheklangan (y = 0)</option>
              </select>
            </div>

            <button
              onClick={() => downloadCsv(recordsToCsv(filtered), 'mizan_mmt_data.csv')}
              className="px-3 py-1.5 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#F4F3EE] dark:hover:bg-[#1A1E26]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV eksport</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] dark:bg-[#151921] text-[#5A6065] dark:text-slate-400 border-b border-[#E6E4DD] dark:border-[#1E222B]">
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
              <tbody className="divide-y divide-[#E6E4DD] dark:divide-[#1E222B]">
                {pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF9F5] dark:hover:bg-[#161A22]">
                    <td className="px-4 py-2.5 mono-num font-semibold">{r.id}</td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.shariatTalabi !== null ? `${r.shariatTalabi}%` : <span className="text-amber-700 font-bold">—</span>}
                    </td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.raqamlashtirish !== null ? r.raqamlashtirish : <span className="text-amber-700 font-bold">—</span>}
                    </td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.kapitalHajmi !== null ? r.kapitalHajmi : <span className="text-amber-700 font-bold">—</span>}
                    </td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.soliqYuklamasi !== null ? r.soliqYuklamasi : <span className="text-amber-700 font-bold">—</span>}
                    </td>
                    <td className="px-4 py-2.5">{r.hudud}</td>
                    <td className="px-4 py-2.5 font-medium">{r.mahsulotTuri}</td>
                    <td className="px-4 py-2.5 text-right mono-num font-semibold">
                      {r.yuqoriTasir === 1 ? (
                        <span className="text-[#0F5338] dark:text-emerald-400">1 (Yuqori)</span>
                      ) : (
                        <span className="text-[#5A6065]">0 (Past)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-[#E6E4DD] dark:border-[#1E222B] flex items-center justify-between text-xs text-[#5A6065]">
            <span className="mono-num">Jami: {filtered.length} yozuv</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 border border-[#D5D3CC] dark:border-[#262B36] rounded-[2px] disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="mono-num px-2">
                {safePage} / {totalPages}
              </span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 border border-[#D5D3CC] dark:border-[#262B36] rounded-[2px] disabled:opacity-40"
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
