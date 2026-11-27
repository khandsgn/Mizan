import React, { useMemo, useState } from 'react';
import { Download, Plus, Search, Trash2 } from 'lucide-react';
import { SavedReport, TrainedModel } from '../types';
import { downloadCsv, reportsToCsv } from '../lib/dataset';

interface ReportsPageProps {
  reports: SavedReport[];
  model: TrainedModel;
  onBulkAddFromTest: () => void;
  onDeleteReport: (id: string) => void;
  onClearAll: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  reports,
  model,
  onBulkAddFromTest,
  onDeleteReport,
  onClearAll,
}) => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'Yuqori' | "O'rtacha" | 'Past'>('all');

  const summary = useMemo(() => {
    const total = reports.length;
    const highCount = reports.filter((r) => r.impactLevel === 'Yuqori').length;
    const avgShare = total
      ? reports.reduce((acc, r) => acc + r.projected2031Share, 0) / total
      : 0;
    return { total, highCount, avgShare };
  }, [reports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (levelFilter !== 'all' && r.impactLevel !== levelFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.hudud.toLowerCase().includes(q) ||
        r.mahsulotTuri.toLowerCase().includes(q)
      );
    });
  }, [reports, search, levelFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D5D3CC] dark:border-[#222630] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="mono-num text-[11px] uppercase tracking-widest text-[#5A6065] dark:text-slate-400">
            05-bo&apos;lim · Reyestr va ma&apos;lumot eksporti
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111315] dark:text-white mt-1">
            Saqlangan ssenariylar qaydnoma jadvali
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!model.isBaseline && model.testPredictions.length > 0 && (
            <button
              onClick={onBulkAddFromTest}
              className="px-3.5 py-2 rounded-[3px] border border-[#C5C2B8] dark:border-[#2C3240] bg-white dark:bg-[#151921] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Test tanlamasidan yuqori natijalarni qo&apos;shish</span>
            </button>
          )}

          <button
            disabled={reports.length === 0}
            onClick={() => downloadCsv(reportsToCsv(filtered), 'mizan_hisobotlar.csv')}
            className="px-4 py-2 rounded-[3px] bg-[#0F5338] hover:bg-[#0B3E2A] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV yuklab olish</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#D5D3CC] dark:bg-[#222630] border border-[#D5D3CC] dark:border-[#222630]">
        <div className="bg-white dark:bg-[#11141A] p-4">
          <div className="text-[11px] text-[#5A6065]">Jami qaydlar</div>
          <div className="mono-num text-2xl font-bold mt-1">{summary.total}</div>
        </div>
        <div className="bg-white dark:bg-[#11141A] p-4">
          <div className="text-[11px] text-[#5A6065]">Yuqori ta&apos;sirli ssenariylar</div>
          <div className="mono-num text-2xl font-bold text-[#0F5338] dark:text-emerald-400 mt-1">
            {summary.highCount}
          </div>
        </div>
        <div className="bg-white dark:bg-[#11141A] p-4">
          <div className="text-[11px] text-[#5A6065]">O&apos;rtacha 2031-yil ulushi</div>
          <div className="mono-num text-2xl font-bold mt-1">{summary.avgShare.toFixed(1)}%</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px]">
        <div className="p-4 border-b border-[#E6E4DD] dark:border-[#1E222B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-[#5A6065] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full pl-8 pr-3 py-1.5 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] bg-[#FAF9F5] dark:bg-[#151921] text-xs"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) =>
                setLevelFilter(e.target.value as 'all' | 'Yuqori' | "O'rtacha" | 'Past')
              }
              className="px-3 py-1.5 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] bg-[#FAF9F5] dark:bg-[#151921] text-xs"
            >
              <option value="all">Barcha darajalar</option>
              <option value="Yuqori">Yuqori</option>
              <option value="O'rtacha">O&apos;rtacha</option>
              <option value="Past">Past</option>
            </select>
          </div>

          {reports.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 text-xs font-medium text-rose-700 hover:underline inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#5A6065]">
            Saqlangan qaydlar mavjud emas. 04-bo&apos;limdan ssenariyni saqlang.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] dark:bg-[#151921] text-[#5A6065] border-b border-[#E6E4DD] dark:border-[#1E222B]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ID / Vaqt</th>
                  <th className="px-4 py-2.5 font-semibold">Nomi</th>
                  <th className="px-4 py-2.5 font-semibold">Parametrlar</th>
                  <th className="px-4 py-2.5 font-semibold">2031 ulush</th>
                  <th className="px-4 py-2.5 font-semibold">P(y=1)</th>
                  <th className="px-4 py-2.5 font-semibold">Daraja</th>
                  <th className="px-4 py-2.5 font-semibold text-right">O&apos;chirish</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD] dark:divide-[#1E222B]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF9F5] dark:hover:bg-[#161A22]">
                    <td className="px-4 py-2.5 mono-num">
                      <span className="font-semibold">{r.id}</span> · {r.createdAt}
                    </td>
                    <td className="px-4 py-2.5 font-semibold">
                      {r.name} <span className="font-normal text-[#5A6065]">({r.hudud}, {r.mahsulotTuri})</span>
                    </td>
                    <td className="px-4 py-2.5 mono-num text-[#5A6065]">
                      Talab {r.shariatTalabi}% | Raq {r.raqamlashtirish} | Kap {r.kapitalHajmi}mlrd
                    </td>
                    <td className="px-4 py-2.5 mono-num font-bold">{r.projected2031Share.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 mono-num font-bold text-[#0F5338] dark:text-emerald-400">
                      {(r.probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 font-semibold">{r.impactLevel}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => onDeleteReport(r.id)}
                        className="p-1 text-[#5A6065] hover:text-rose-700"
                        aria-label="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
