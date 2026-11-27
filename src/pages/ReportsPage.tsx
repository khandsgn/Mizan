import React, { useMemo, useState } from 'react';
import { Download, PlusCircle, Search, Trash2 } from 'lucide-react';
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Saqlangan ssenariylar va Hisobotlar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            2026–2031 prognoz natijalarini solishtiring va CSV formatida yuklab oling
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!model.isBaseline && model.testPredictions.length > 0 && (
            <button
              onClick={onBulkAddFromTest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Testdan top-MMTlarni qo&apos;shish</span>
            </button>
          )}

          <button
            disabled={reports.length === 0}
            onClick={() => downloadCsv(reportsToCsv(filtered), 'mizan_uz_hisobotlar.csv')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F4C5C] hover:bg-[#136074] dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 text-sm font-bold shadow-sm disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>CSV yuklab olish</span>
          </button>
        </div>
      </div>

      {/* 3 Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400">Saqlangan ssenariylar</div>
          <div className="mono-num text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {summary.total} ta
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400">Yuqori ta&apos;sirli MMTlar</div>
          <div className="mono-num text-2xl font-extrabold text-[#0F4C5C] dark:text-teal-400 mt-1">
            {summary.highCount} ta
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400">O&apos;rtacha 2031 ulushi</div>
          <div className="mono-num text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {summary.avgShare.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900 text-xs sm:text-sm"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) =>
                setLevelFilter(e.target.value as 'all' | 'Yuqori' | "O'rtacha" | 'Past')
              }
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900 text-xs sm:text-sm"
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            Hozircha saqlangan ssenariylar yo&apos;q. 5 Yillik Simulyatordan natijani saqlang.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF9F6] dark:bg-slate-900/70 text-slate-500 border-b border-stone-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID / Vaqt</th>
                  <th className="px-4 py-3 font-semibold">Ssenariy</th>
                  <th className="px-4 py-3 font-semibold">Parametrlar</th>
                  <th className="px-4 py-3 font-semibold">2031 ulush</th>
                  <th className="px-4 py-3 font-semibold">Ehtimollik</th>
                  <th className="px-4 py-3 font-semibold">Daraja</th>
                  <th className="px-4 py-3 font-semibold text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/70">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="mono-num font-semibold text-slate-800 dark:text-slate-200">{r.id}</div>
                      <div className="text-[11px] text-slate-400 mono-num">{r.createdAt}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{r.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.hudud} · {r.mahsulotTuri}
                      </div>
                    </td>
                    <td className="px-4 py-3 mono-num text-xs text-slate-600 dark:text-slate-400">
                      Talab {r.shariatTalabi}% · Raq {r.raqamlashtirish} · Kap {r.kapitalHajmi}mlrd
                    </td>
                    <td className="px-4 py-3 mono-num font-bold text-amber-600 dark:text-amber-400">
                      {r.projected2031Share.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 mono-num font-bold text-[#0F4C5C] dark:text-teal-400">
                      {(r.probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.impactLevel === 'Yuqori'
                            ? 'bg-teal-50 dark:bg-teal-500/15 text-[#0F4C5C] dark:text-teal-300'
                            : r.impactLevel === "O'rtacha"
                              ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {r.impactLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDeleteReport(r.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                        aria-label="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
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
