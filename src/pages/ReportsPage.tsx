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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Saqlangan ssenariylar qaydnoma jadvali
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ssenariylarni taqqoslash va CSV formatida yuklab olish
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!model.isBaseline && model.testPredictions.length > 0 && (
            <button
              onClick={onBulkAddFromTest}
              className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Test tanlamasidan yuqori natijalarni qo&apos;shish</span>
            </button>
          )}

          <button
            disabled={reports.length === 0}
            onClick={() => downloadCsv(reportsToCsv(filtered), 'mizan_hisobotlar.csv')}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV yuklab olish</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-[11px] text-slate-500">Jami qaydlar</div>
          <div className="mono-num text-2xl font-bold mt-1">{summary.total}</div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-[11px] text-slate-500">Yuqori ta&apos;sirli ssenariylar</div>
          <div className="mono-num text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {summary.highCount}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="text-[11px] text-slate-500">O&apos;rtacha 2031-yil ulushi</div>
          <div className="mono-num text-2xl font-bold mt-1">{summary.avgShare.toFixed(1)}%</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) =>
                setLevelFilter(e.target.value as 'all' | 'Yuqori' | "O'rtacha" | 'Past')
              }
              className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
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
              className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:underline inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Saqlangan qaydlar mavjud emas. Ssenariy kalkulyatoridan natijani saqlang.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 border-b border-slate-200 dark:border-slate-800">
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
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 mono-num">
                      <span className="font-semibold">{r.id}</span> · {r.createdAt}
                    </td>
                    <td className="px-4 py-2.5 font-semibold">
                      {r.name} <span className="font-normal text-slate-500">({r.hudud}, {r.mahsulotTuri})</span>
                    </td>
                    <td className="px-4 py-2.5 mono-num text-slate-500">
                      Talab {r.shariatTalabi}% | Raq {r.raqamlashtirish} | Kap {r.kapitalHajmi}mlrd
                    </td>
                    <td className="px-4 py-2.5 mono-num font-bold">{r.projected2031Share.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 mono-num font-bold text-blue-600 dark:text-blue-400">
                      {(r.probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 font-semibold">{r.impactLevel}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => onDeleteReport(r.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
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
