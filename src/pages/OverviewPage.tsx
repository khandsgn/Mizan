import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Region, TabId } from '../types';

interface OverviewPageProps {
  datasetCount: number;
  isPreprocessed: boolean;
  rocAuc: number | null;
  reportsCount: number;
  onNavigate: (tab: TabId) => void;
  onQuickSimulation: () => void;
  onSimulateRegion: (region: Region) => void;
}

type MacroScenario = 'conservative' | 'baseline' | 'optimistic';

const COMBINED_YEARS = [
  { year: 2026, conservative: 4.0, baseline: 4.0, optimistic: 4.0 },
  { year: 2027, conservative: 5.8, baseline: 7.5, optimistic: 9.5 },
  { year: 2028, conservative: 7.9, baseline: 12.0, optimistic: 16.5 },
  { year: 2029, conservative: 10.1, baseline: 17.5, optimistic: 24.5 },
  { year: 2030, conservative: 12.3, baseline: 22.5, optimistic: 33.0 },
  { year: 2031, conservative: 14.5, baseline: 27.0, optimistic: 41.5 },
];

const SCENARIO_META: Record<
  MacroScenario,
  {
    label: string;
    share2031: string;
    cagr: string;
    banksCount: string;
    fundingTarget: string;
    assumption: string;
  }
> = {
  conservative: {
    label: 'Konservativ ssenariy',
    share2031: '14.5%',
    cagr: '+29.4%',
    banksCount: '1–2 ta',
    fundingTarget: '$350 mln',
    assumption:
      "Murabaha bitimlarida QQS va savdo aylanmasi soliq yuki saqlanib qoladi; shariat auditi faqat yirik MMTlarda joriy etiladi.",
  },
  baseline: {
    label: 'Bazaviy ssenariy (asosiy)',
    share2031: '27.0%',
    cagr: '+46.5%',
    banksCount: '3–5 ta',
    fundingTarget: '$1.0 mlrd',
    assumption:
      "Raqamli Murabaha (BNPL) ommalashadi, tijorat banklari qoshida islomiy darchalar ochiladi va yirik MMTlar islomiy mikromoliya bankiga aylanadi.",
  },
  optimistic: {
    label: 'Optimistik ssenariy',
    share2031: '41.5%',
    cagr: '+59.7%',
    banksCount: '6–8 ta',
    fundingTarget: '$1.8 mlrd',
    assumption:
      "To'liq soliq neytralligi ta'minlanadi hamda ITB (IsDB), ICD va Ko'rfaz fondlaridan uzoq muddatli shariatga mos kredit liniyalari jalb qilinadi.",
  },
};

const LEGAL_LEDGER = [
  {
    date: '2024 · Iyul',
    doc: 'MB №3536 Nizomi',
    title: "MMTlarga islomiy moliyalashtirish huquqi berildi",
    note: "AAOIFI standartlari asosida Murabaha, Ijara, Mudaraba, Musharaka va Salam shartnomalari hamda Shariat kengashi talabi kiritildi.",
  },
  {
    date: '2025 · Fevral',
    doc: "O'RQ-1026 Qonuni",
    title: 'Mikromoliya banki instituti joriy etildi',
    note: "Eng kam ustav kapitali 50 mlrd so'm etib belgilandi va MMT → Mikromoliya banki → Tijorat banki transformatsiya zanjiri ochildi.",
  },
  {
    date: '2026 · Mart–Avgust',
    doc: "O'RQ-1126 Qonuni",
    title: "Islomiy banklar va islomiy mikromoliya banklari",
    note: "2026-yil 29-iyundan to'laqonli islomiy bank faoliyati va bank darchalari kuchga kirdi; avgustda MMTlarning islomiy mikromoliya bankiga aylanish tartibi tasdiqlandi.",
  },
  {
    date: '2026–2031 · Ufq',
    doc: 'Bozor prognozi',
    title: "Konsolidatsiya va raqamli Murabaha ustunligi",
    note: "2030-yilgacha 10 tagacha islomiy bank/darcha tashkil etilishi va mikromoliya portfelining 20–30% qismi shariatga mos mahsulotlarga o'tishi kutilmoqda.",
  },
];

const REGIONAL_TABLE: {
  region: Region;
  demand: number;
  digital: number;
  capitalAvg: number;
  primaryContract: string;
  projected2031: string;
}[] = [
  {
    region: "Farg'ona vodiysi",
    demand: 78,
    digital: 64,
    capitalAvg: 38,
    primaryContract: 'Murabaha / Savdo nasiya',
    projected2031: '34.2%',
  },
  {
    region: 'Toshkent',
    demand: 58,
    digital: 86,
    capitalAvg: 54,
    primaryContract: 'Raqamli BNPL & Ijara',
    projected2031: '31.8%',
  },
  {
    region: 'Samarqand',
    demand: 67,
    digital: 62,
    capitalAvg: 34,
    primaryContract: 'Murabaha & Uskuna Ijarasi',
    projected2031: '26.5%',
  },
  {
    region: 'Buxoro',
    demand: 61,
    digital: 58,
    capitalAvg: 29,
    primaryContract: 'Kichik ishlab chiqarish Ijarasi',
    projected2031: '22.4%',
  },
  {
    region: 'Qashqadaryo',
    demand: 63,
    digital: 51,
    capitalAvg: 26,
    primaryContract: 'Agro-Salam & Murabaha',
    projected2031: '20.1%',
  },
];

export const OverviewPage: React.FC<OverviewPageProps> = ({
  datasetCount,
  isPreprocessed,
  rocAuc,
  reportsCount,
  onNavigate,
  onQuickSimulation,
  onSimulateRegion,
}) => {
  const [scenario, setScenario] = useState<MacroScenario>('baseline');
  const active = SCENARIO_META[scenario];

  return (
    <div className="space-y-6">
      {/* Top Quant Summary Panel */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5">
              Makroiqtisodiy va Sektorial Modellashtirish · 2026–2031
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Islom moliyasining mikromoliyaga kelajakdagi 5 yillik ta&apos;siri
            </h1>
            <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Markaziy bankning 3536-sonli nizomi, O&apos;RQ-1026 va O&apos;RQ-1126 qonunlari asosida
              O&apos;zbekiston mikromoliya tashkilotlarining (MMT) shariatga mos mahsulotlarga o&apos;tish
              ehtimoli va 2031-yilgacha bo&apos;lgan portfel ulushi prognozi.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                onClick={onQuickSimulation}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <span>500 ta MMTda modelni o&apos;qitish va kalkulyatorni ochish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('studio-data')}
                className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                Ma&apos;lumotlar bazasi ({datasetCount})
              </button>
            </div>
          </div>

          {/* 4 Quant Metric Tiles */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                2031 Bazaviy Bozor Ulushi
              </div>
              <div className="mono-num text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                20% – 30%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">2026 boshlang&apos;ich: ~4.0%</div>
            </div>

            <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Islomiy MM Banklar (2031)
              </div>
              <div className="mono-num text-xl font-bold text-slate-900 dark:text-white mt-1">
                3 – 5 ta
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Kapital talabi: ≥50 mlrd</div>
            </div>

            <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Model ROC-AUC
              </div>
              <div className="mono-num text-xl font-bold text-slate-900 dark:text-white mt-1">
                {rocAuc !== null ? rocAuc.toFixed(3) : isPreprocessed ? 'Tayyor' : 'Bazaviy'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Logistik Regressiya (L2)</div>
            </div>

            <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Saqlangan Ssenariylar
              </div>
              <div className="mono-num text-xl font-bold text-slate-900 dark:text-white mt-1">
                {reportsCount} ta
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">CSV eksport tayyor</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Grid: Forecast Chart & Table (8 cols) + Regulatory Timeline (4 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Islomiy mikromoliya portfeli ulushi prognozi (2026–2031)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Umumiy mikromoliya bozoridagi ulush (%, 3 ta ssenariy taqqoslovi)
              </p>
            </div>

            <div className="inline-flex shrink-0 p-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              {(['conservative', 'baseline', 'optimistic'] as MacroScenario[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setScenario(key)}
                  className={`px-3 py-1 rounded-xs font-semibold transition-colors ${
                    scenario === key
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {key === 'conservative'
                    ? 'Konservativ'
                    : key === 'baseline'
                      ? 'Bazaviy'
                      : 'Optimistik'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Active Scenario Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3">
                <div className="text-[11px] text-slate-500">2031-yil ulushi</div>
                <div className="mono-num text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {active.share2031}
                </div>
              </div>
              <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3">
                <div className="text-[11px] text-slate-500">Yillik o&apos;sish (CAGR)</div>
                <div className="mono-num text-lg font-bold mt-0.5">{active.cagr}</div>
              </div>
              <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3">
                <div className="text-[11px] text-slate-500">Islomiy MM banklar</div>
                <div className="mono-num text-lg font-bold mt-0.5">{active.banksCount}</div>
              </div>
              <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3">
                <div className="text-[11px] text-slate-500">Jalb etiladigan fondlash</div>
                <div className="mono-num text-lg font-bold mt-0.5">{active.fundingTarget}</div>
              </div>
            </div>

            <div className="h-[235px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={COMBINED_YEARS} margin={{ top: 8, right: 16, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeOpacity={0.4} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis unit="%" domain={[0, 45]} tick={{ fontSize: 11 }} stroke="#64748B" />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="optimistic"
                    name="Optimistik"
                    stroke="#0284C7"
                    strokeWidth={scenario === 'optimistic' ? 3 : 1.5}
                    strokeDasharray={scenario === 'optimistic' ? undefined : '4 3'}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    name="Bazaviy"
                    stroke="#2563EB"
                    strokeWidth={scenario === 'baseline' ? 3 : 1.8}
                    dot={{ r: 3.5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conservative"
                    name="Konservativ"
                    stroke="#64748B"
                    strokeWidth={scenario === 'conservative' ? 3 : 1.5}
                    strokeDasharray={scenario === 'conservative' ? undefined : '3 3'}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 bg-blue-50/60 dark:bg-blue-950/30 border-l-2 border-blue-600 px-3.5 py-2 rounded-r-md">
              <strong>{active.label}:</strong> {active.assumption}
            </div>

            {/* Scenario Comparison Table */}
            <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800 pt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 font-semibold">Ssenariy</th>
                    {COMBINED_YEARS.map((y) => (
                      <th key={y.year} className="py-2 font-semibold mono-num text-right">
                        {y.year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 mono-num">
                  <tr className={scenario === 'conservative' ? 'bg-slate-50 dark:bg-slate-800/50 font-bold' : ''}>
                    <td className="py-2 font-sans">Konservativ</td>
                    {COMBINED_YEARS.map((y) => (
                      <td key={y.year} className="py-2 text-right">
                        {y.conservative.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className={scenario === 'baseline' ? 'bg-blue-50/50 dark:bg-blue-950/30 font-bold text-blue-600 dark:text-blue-400' : ''}>
                    <td className="py-2 font-sans">Bazaviy (asosiy)</td>
                    {COMBINED_YEARS.map((y) => (
                      <td key={y.year} className="py-2 text-right">
                        {y.baseline.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className={scenario === 'optimistic' ? 'bg-slate-50 dark:bg-slate-800/50 font-bold' : ''}>
                    <td className="py-2 font-sans">Optimistik</td>
                    {COMBINED_YEARS.map((y) => (
                      <td key={y.year} className="py-2 text-right">
                        {y.optimistic.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Regulatory Timeline */}
        <div className="lg:col-span-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
              Me&apos;yoriy-huquqiy baza (2024–2026)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Islomiy mikromoliyani tartibga soluvchi hujjatlar
            </p>
          </div>

          <div className="p-5 divide-y divide-slate-200 dark:divide-slate-800">
            {LEGAL_LEDGER.map((item) => (
              <div key={item.date} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-num text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {item.date}
                  </span>
                  <span className="mono-num text-[11px] px-2 py-0.5 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.doc}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Regional Quantitative Matrix */}
      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Hududlar kesimida islomiy mikromoliya ko&apos;rsatkichlari
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hududiy talab, raqamli infratuzilma va 2031-yilgi prognoz ulushi
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Hudud</th>
                <th className="px-5 py-3 font-semibold">Shariatga mos talab</th>
                <th className="px-5 py-3 font-semibold">Raqamli / BNPL tayyorlik</th>
                <th className="px-5 py-3 font-semibold">O&apos;rtacha MMT kapitali</th>
                <th className="px-5 py-3 font-semibold">Ustuvor shartnoma</th>
                <th className="px-5 py-3 font-semibold">2031 prognoz</th>
                <th className="px-5 py-3 font-semibold text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {REGIONAL_TABLE.map((row) => (
                <tr key={row.region} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {row.region}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="mono-num font-semibold w-9">{row.demand}%</span>
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div style={{ width: `${row.demand}%` }} className="h-full bg-blue-600" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="mono-num w-9">{row.digital}/100</span>
                      <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div style={{ width: `${row.digital}%` }} className="h-full bg-sky-500" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 mono-num">{row.capitalAvg} mlrd so&apos;m</td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {row.primaryContract}
                  </td>
                  <td className="px-5 py-3.5 mono-num font-bold text-blue-600 dark:text-blue-400">
                    {row.projected2031}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onSimulateRegion(row.region)}
                      className="px-2.5 py-1 rounded-xs bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Simulyatsiya</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
