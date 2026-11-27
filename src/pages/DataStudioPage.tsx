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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5CEBF] dark:border-[#1B382B] pb-4">
        <div>
          <div className="text-xs font-semibold text-[#9A7428] dark:text-[#D4B36F] uppercase tracking-wider">
            II. Empirik Ma&apos;lumotlar va Normalizatsiya
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#081C15] dark:text-white mt-0.5">
            MMT ma&apos;lumotlar bazasi (Murabaha · Ijara · Salam · Musharaka)
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
            className="px-3.5 py-2 border border-[#C5A059]/50 bg-white dark:bg-[#0A1812] text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>CSV yuklash</span>
          </button>

          <button
            onClick={() => {
              onLoadSample();
              setPage(1);
            }}
            className="px-4 py-2 bg-[#071D15] dark:bg-[#C5A059] text-[#D4B36F] dark:text-[#071D15] text-xs font-bold uppercase tracking-wider"
          >
            500 ta MMT namunasini yuklash
          </button>

          {appliedDataset && (
            <button
              onClick={onGoToLab}
              className="px-4 py-2 bg-[#9A7428] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
            >
              <span>III. Ekonometrik model</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 border border-rose-400 bg-rose-50 text-rose-900 text-xs">
          {uploadError}
        </div>
      )}

      {/* 4 Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#D5CEBF] dark:bg-[#1B382B] border border-[#D5CEBF] dark:border-[#1B382B]">
        <div className="bg-white dark:bg-[#0A1812] p-4">
          <div className="text-[11px] text-[#52635A] dark:text-[#8FA69B]">Tanlama hajmi (N)</div>
          <div className="mono-num text-2xl font-bold mt-1">{stats.total}</div>
          <div className="text-[11px] text-[#7E968B] truncate mt-0.5">{sourceLabel}</div>
        </div>
        <div className="bg-white dark:bg-[#0A1812] p-4">
          <div className="text-[11px] text-[#52635A] dark:text-[#8FA69B]">Yuqori islomiy ta&apos;sir (y = 1)</div>
          <div className="mono-num text-2xl font-bold text-[#0A3828] dark:text-[#D4B36F] mt-1">
            {stats.highImpact} <span className="text-xs font-normal">({stats.highShare}%)</span>
          </div>
          <div className="text-[11px] text-[#7E968B] mt-0.5">2031 ulushi ≥ 25%</div>
        </div>
        <div className="bg-white dark:bg-[#0A1812] p-4">
          <div className="text-[11px] text-[#52635A] dark:text-[#8FA69B]">Cheklangan ta&apos;sir (y = 0)</div>
          <div className="mono-num text-2xl font-bold mt-1">{stats.lowImpact}</div>
          <div className="text-[11px] text-[#7E968B] mt-0.5">An&apos;anaviy portfel ustun</div>
        </div>
        <div className="bg-white dark:bg-[#0A1812] p-4">
          <div className="text-[11px] text-[#52635A] dark:text-[#8FA69B]">Bo&apos;sh qiymatlar (NULL)</div>
          <div className="mono-num text-2xl font-bold text-[#9A7428] dark:text-[#D4B36F] mt-1">
            {stats.missing}
          </div>
          <div className="text-[11px] text-[#7E968B] mt-0.5">Imputatsiya orqali to&apos;ldiriladi</div>
        </div>
      </div>

      {/* Preprocessing Config Panel */}
      {records.length > 0 && (
        <div className="bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] gold-rule-top">
          <div className="px-5 py-3.5 border-b border-[#E5DFD3] dark:border-[#163024] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-[#081C15] dark:text-white">
                O&apos;zgaruvchilarni tayyorlash (Preprocessing)
              </h2>
              <p className="text-xs text-[#52635A] dark:text-[#8FA69B]">
                Faol xususiyatlar: <strong className="mono-num">{livePreview?.featureNames.length ?? 0} ta</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onChangeConfig(DEFAULT_PREPROCESSING)}
                className="px-3 py-1.5 border border-[#D5CEBF] dark:border-[#1B382B] text-xs font-medium inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Standart</span>
              </button>
              <button
                onClick={onApplyPreprocessing}
                className="px-4 py-1.5 bg-[#071D15] dark:bg-[#C5A059] text-[#D4B36F] dark:text-[#071D15] text-xs font-bold uppercase tracking-wider"
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
                  className="accent-[#071D15]"
                />
              </div>
              <select
                disabled={!config.imputeEnabled}
                value={config.imputeStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, imputeStrategy: e.target.value as ImputationStrategy })
                }
                className="w-full px-3 py-2 border border-[#D5CEBF] dark:border-[#1B382B] bg-[#FAF8F3] dark:bg-[#0D2118] text-xs"
              >
                <option value="median">Mediana bo&apos;yicha</option>
                <option value="mean">O&apos;rtacha arifmetik (Mean)</option>
                <option value="mode">Moda (Mode)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span>2. Shartnoma va hududni kodlash</span>
                <input
                  type="checkbox"
                  checked={config.encodeEnabled}
                  onChange={(e) => onChangeConfig({ ...config, encodeEnabled: e.target.checked })}
                  className="accent-[#071D15]"
                />
              </div>
              <select
                disabled={!config.encodeEnabled}
                value={config.encodeStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, encodeStrategy: e.target.value as EncodingStrategy })
                }
                className="w-full px-3 py-2 border border-[#D5CEBF] dark:border-[#1B382B] bg-[#FAF8F3] dark:bg-[#0D2118] text-xs"
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
                  className="accent-[#071D15]"
                />
              </div>
              <select
                disabled={!config.scaleEnabled}
                value={config.scaleStrategy}
                onChange={(e) =>
                  onChangeConfig({ ...config, scaleStrategy: e.target.value as ScalingStrategy })
                }
                className="w-full px-3 py-2 border border-[#D5CEBF] dark:border-[#1B382B] bg-[#FAF8F3] dark:bg-[#0D2118] text-xs"
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
        <div className="bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] gold-rule-top overflow-hidden">
          <div className="p-4 border-b border-[#E5DFD3] dark:border-[#163024] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-[#52635A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="ID, hudud yoki shartnoma..."
                  className="w-full pl-8 pr-3 py-1.5 border border-[#D5CEBF] dark:border-[#1B382B] bg-[#FAF8F3] dark:bg-[#0D2118] text-xs"
                />
              </div>
              <select
                value={targetFilter}
                onChange={(e) => {
                  setTargetFilter(e.target.value as 'all' | '0' | '1');
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-[#D5CEBF] dark:border-[#1B382B] bg-[#FAF8F3] dark:bg-[#0D2118] text-xs"
              >
                <option value="all">Barcha yozuvlar</option>
                <option value="1">Yuqori ta&apos;sir (y = 1)</option>
                <option value="0">Cheklangan (y = 0)</option>
              </select>
            </div>

            <button
              onClick={() => downloadCsv(recordsToCsv(filtered), 'mizan_mmt_data.csv')}
              className="px-3 py-1.5 border border-[#C5A059]/50 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV eksport</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F3] dark:bg-[#0D2118] text-[#52635A] dark:text-[#8FA69B] border-b border-[#E5DFD3] dark:border-[#163024]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ID</th>
                  <th className="px-4 py-2.5 font-semibold">Shariat talabi</th>
                  <th className="px-4 py-2.5 font-semibold">Raqamli indeks</th>
                  <th className="px-4 py-2.5 font-semibold">Kapital (mlrd)</th>
                  <th className="px-4 py-2.5 font-semibold">Soliq to&apos;sig&apos;i</th>
                  <th className="px-4 py-2.5 font-semibold">Hudud</th>
                  <th className="px-4 py-2.5 font-semibold">Shariat shartnomasi</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Sinf (y)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3] dark:divide-[#163024]">
                {pageRows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF8F3] dark:hover:bg-[#0E241A]">
                    <td className="px-4 py-2.5 mono-num font-semibold">{r.id}</td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.shariatTalabi !== null ? `${r.shariatTalabi}%` : <span className="text-[#9A7428] font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.raqamlashtirish !== null ? r.raqamlashtirish : <span className="text-[#9A7428] font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.kapitalHajmi !== null ? r.kapitalHajmi : <span className="text-[#9A7428] font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-2.5 mono-num">
                      {r.soliqYuklamasi !== null ? r.soliqYuklamasi : <span className="text-[#9A7428] font-bold">NULL</span>}
                    </td>
                    <td className="px-4 py-2.5">{r.hudud}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#0A3828] dark:text-[#D4B36F]">
                      {r.mahsulotTuri}
                    </td>
                    <td className="px-4 py-2.5 text-right mono-num font-semibold">
                      {r.yuqoriTasir === 1 ? (
                        <span className="text-[#0A3828] dark:text-[#D4B36F]">1 (Yuqori)</span>
                      ) : (
                        <span className="text-[#52635A]">0 (Past)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-[#E5DFD3] dark:border-[#163024] flex items-center justify-between text-xs text-[#52635A]">
            <span className="mono-num">Jami: {filtered.length} yozuv</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 border border-[#D5CEBF] dark:border-[#1B382B] disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="mono-num px-2">
                {safePage} / {totalPages}
              </span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 border border-[#D5CEBF] dark:border-[#1B382B] disabled:opacity-40"
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
