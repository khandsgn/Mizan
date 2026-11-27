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
    date: '2024 · IYUL',
    doc: 'MB №3536-sonli Nizom',
    title: "MMTlarga islomiy moliyalashtirish huquqi berildi",
    note: "AAOIFI standartlari asosida Murabaha, Ijara, Mudaraba, Musharaka va Salam shartnomalari hamda Shariat kengashi talabi kiritildi.",
  },
  {
    date: '2025 · FEVRAL',
    doc: "O'RQ-1026-sonli Qonun",
    title: 'Mikromoliya banki instituti joriy etildi',
    note: "Eng kam ustav kapitali 50 mlrd so'm etib belgilandi va MMT → Mikromoliya banki → Tijorat banki transformatsiya zanjiri ochildi.",
  },
  {
    date: '2026 · MART–AVGUST',
    doc: "O'RQ-1126-sonli Qonun",
    title: "Islomiy banklar va islomiy mikromoliya banklari",
    note: "2026-yil 29-iyundan to'laqonli islomiy bank faoliyati va bank darchalari kuchga kirdi; avgustda MMTlarning islomiy mikromoliya bankiga aylanish tartibi tasdiqlandi.",
  },
  {
    date: '2026–2031 · PROGNOZ',
    doc: 'Strategik ufq',
    title: "Bozor konsolidatsiyasi va raqamli Murabaha",
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
    <div className="space-y-8">
      {/* Editorial Briefing Header (Replaces the AI-style marketing hero box) */}
      <section className="border-b border-[#D5D3CC] dark:border-[#222630] pb-7">
        <div className="mono-num text-[11px] uppercase tracking-widest text-[#0F5338] dark:text-emerald-400 font-semibold mb-2">
          Tahliliy ma&apos;lumotnoma · O&apos;zbekiston mikromoliya sektori (2026–2031)
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111315] dark:text-white leading-[1.15]">
              Islom moliyasining mikromoliyaga kelajakdagi 5 yillik ta&apos;siri
            </h1>
            <p className="mt-3.5 text-sm sm:text-[15px] text-[#454A4F] dark:text-slate-300 leading-relaxed max-w-3xl">
              2024–2026-yillarda qabul qilingan Markaziy bankning 3536-sonli nizomi, O&apos;RQ-1026 va
              O&apos;RQ-1126 qonunlari O&apos;zbekistonda shariatga mos mikromoliyalashtirish uchun
              institutsional zamin yaratdi. Ushbu model 500 ta MMT ko&apos;rsatkichlari asosida
              2031-yilgacha bo&apos;lgan tarkibiy o&apos;zgarishlarni baholaydi.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={onQuickSimulation}
                className="px-4 py-2.5 rounded-[3px] bg-[#0F5338] hover:bg-[#0B3E2A] text-white text-xs font-semibold tracking-wide transition-colors inline-flex items-center gap-2"
              >
                <span>Modelni ishga tushirish va kalkulyatorga o&apos;tish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('studio-data')}
                className="px-4 py-2.5 rounded-[3px] border border-[#C5C2B8] dark:border-[#2C3240] bg-white dark:bg-[#151921] hover:bg-[#EAE8E1] dark:hover:bg-[#1E2430] text-xs font-semibold transition-colors"
              >
                Ma&apos;lumotlar jadvalini ko&apos;rish ({datasetCount})
              </button>
            </div>
          </div>

          {/* Right: Structured Hairline Ledger Box */}
          <div className="lg:col-span-4 bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px]">
            <div className="px-4 py-2.5 border-b border-[#E6E4DD] dark:border-[#1E222B] flex items-center justify-between">
              <span className="mono-num text-[11px] font-semibold uppercase tracking-wider text-[#5A6065] dark:text-slate-400">
                Asosiy ko&apos;rsatkichlar
              </span>
              <span className="mono-num text-[11px] text-[#0F5338] dark:text-emerald-400">
                2026 → 2031
              </span>
            </div>
            <div className="divide-y divide-[#E6E4DD] dark:divide-[#1E222B] text-xs">
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-[#5A6065] dark:text-slate-400">Bazaviy 2031 ulushi</span>
                <span className="mono-num font-bold text-sm">20.0% – 30.0%</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-[#5A6065] dark:text-slate-400">Islomiy mikromoliya banklari</span>
                <span className="mono-num font-bold">3 – 5 ta</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-[#5A6065] dark:text-slate-400">Ustav kapital talabi</span>
                <span className="mono-num font-bold">50.0 mlrd so&apos;m</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-[#5A6065] dark:text-slate-400">Joriy model ROC-AUC</span>
                <span className="mono-num font-bold text-[#0F5338] dark:text-emerald-400">
                  {rocAuc !== null ? rocAuc.toFixed(3) : isPreprocessed ? 'Tayyor' : 'Bazaviy'}
                </span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-[#5A6065] dark:text-slate-400">Saqlangan qaydlar</span>
                <span className="mono-num font-bold">{reportsCount} ta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Research Grid: Forecast Chart & Table (8 cols) + Legal Ledger (4 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: 3-Scenario Trajectory & Year-by-Year Table */}
        <div className="lg:col-span-8 bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px]">
          <div className="p-5 border-b border-[#E6E4DD] dark:border-[#1E222B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111315] dark:text-white">
                1-rasm. Islomiy mikromoliya portfeli ulushi prognozi (2026–2031)
              </h2>
              <p className="text-xs text-[#5A6065] dark:text-slate-400 mt-0.5">
                Umumiy mikromoliya bozoridagi ulush (%, yillik dinamika)
              </p>
            </div>

            {/* Segmented Control */}
            <div className="inline-flex border border-[#D5D3CC] dark:border-[#262B36] rounded-[3px] overflow-hidden text-xs">
              {(['conservative', 'baseline', 'optimistic'] as MacroScenario[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setScenario(key)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    scenario === key
                      ? 'bg-[#111315] dark:bg-white text-white dark:text-[#111315] font-semibold'
                      : 'bg-white dark:bg-[#11141A] text-[#5A6065] dark:text-slate-400 hover:bg-[#F4F3EE] dark:hover:bg-[#1A1E26]'
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
            {/* Selected Scenario Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E6E4DD] dark:bg-[#1E222B] border border-[#E6E4DD] dark:border-[#1E222B]">
              <div className="bg-[#FAF9F5] dark:bg-[#151921] p-3">
                <div className="text-[11px] text-[#5A6065] dark:text-slate-400">2031-yil ulushi</div>
                <div className="mono-num text-xl font-bold text-[#0F5338] dark:text-emerald-400 mt-0.5">
                  {active.share2031}
                </div>
              </div>
              <div className="bg-[#FAF9F5] dark:bg-[#151921] p-3">
                <div className="text-[11px] text-[#5A6065] dark:text-slate-400">Yillik o&apos;sish (CAGR)</div>
                <div className="mono-num text-xl font-bold mt-0.5">{active.cagr}</div>
              </div>
              <div className="bg-[#FAF9F5] dark:bg-[#151921] p-3">
                <div className="text-[11px] text-[#5A6065] dark:text-slate-400">Islomiy MM banklar</div>
                <div className="mono-num text-xl font-bold mt-0.5">{active.banksCount}</div>
              </div>
              <div className="bg-[#FAF9F5] dark:bg-[#151921] p-3">
                <div className="text-[11px] text-[#5A6065] dark:text-slate-400">Tashqi va ichki fondlash</div>
                <div className="mono-num text-xl font-bold mt-0.5">{active.fundingTarget}</div>
              </div>
            </div>

            {/* Multi-line Chart */}
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={COMBINED_YEARS} margin={{ top: 8, right: 16, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#D5D3CC" strokeOpacity={0.5} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#5A6065" />
                  <YAxis unit="%" domain={[0, 45]} tick={{ fontSize: 11 }} stroke="#5A6065" />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
                    contentStyle={{
                      borderRadius: '2px',
                      border: '1px solid #262B36',
                      backgroundColor: '#11141A',
                      color: '#EAECEF',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="optimistic"
                    name="Optimistik"
                    stroke="#B45309"
                    strokeWidth={scenario === 'optimistic' ? 2.8 : 1.5}
                    strokeDasharray={scenario === 'optimistic' ? undefined : '4 3'}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    name="Bazaviy"
                    stroke="#0F5338"
                    strokeWidth={scenario === 'baseline' ? 3 : 1.8}
                    dot={{ r: 3.5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conservative"
                    name="Konservativ"
                    stroke="#64748B"
                    strokeWidth={scenario === 'conservative' ? 2.8 : 1.5}
                    strokeDasharray={scenario === 'conservative' ? undefined : '3 3'}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-xs text-[#454A4F] dark:text-slate-300 border-l-2 border-[#0F5338] pl-3 py-0.5">
              <strong>{active.label} sharti:</strong> {active.assumption}
            </div>

            {/* Year-by-year tabular readout */}
            <div className="overflow-x-auto border-t border-[#E6E4DD] dark:border-[#1E222B] pt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#5A6065] dark:text-slate-400 border-b border-[#E6E4DD] dark:border-[#1E222B]">
                    <th className="py-2 font-semibold">Ssenariy</th>
                    {COMBINED_YEARS.map((y) => (
                      <th key={y.year} className="py-2 font-semibold mono-num text-right">
                        {y.year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EFEA] dark:divide-[#1A1E26] mono-num">
                  <tr className={scenario === 'conservative' ? 'bg-[#F4F3EE] dark:bg-slate-800/50 font-bold' : ''}>
                    <td className="py-2 font-sans">Konservativ</td>
                    {COMBINED_YEARS.map((y) => (
                      <td key={y.year} className="py-2 text-right">
                        {y.conservative.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className={scenario === 'baseline' ? 'bg-[#F4F3EE] dark:bg-slate-800/50 font-bold text-[#0F5338] dark:text-emerald-400' : ''}>
                    <td className="py-2 font-sans">Bazaviy (asosiy)</td>
                    {COMBINED_YEARS.map((y) => (
                      <td key={y.year} className="py-2 text-right">
                        {y.baseline.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className={scenario === 'optimistic' ? 'bg-[#F4F3EE] dark:bg-slate-800/50 font-bold' : ''}>
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

        {/* Right 4 Cols: Vertical Archival Legal Ledger (No fake progress bars!) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px]">
          <div className="p-5 border-b border-[#E6E4DD] dark:border-[#1E222B]">
            <h2 className="font-display text-lg font-bold text-[#111315] dark:text-white">
              Me&apos;yoriy-huquqiy xronologiya
            </h2>
            <p className="text-xs text-[#5A6065] dark:text-slate-400 mt-0.5">
              2024–2026-yilgi islohotlar va 2031-yilgi maqsad
            </p>
          </div>

          <div className="p-5 divide-y divide-[#E6E4DD] dark:divide-[#1E222B]">
            {LEGAL_LEDGER.map((item) => (
              <div key={item.date} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-num text-[11px] font-bold text-[#0F5338] dark:text-emerald-400">
                    {item.date}
                  </span>
                  <span className="mono-num text-[11px] text-[#5A6065] dark:text-slate-400">
                    {item.doc}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#111315] dark:text-white mt-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#5A6065] dark:text-slate-400 mt-1 leading-relaxed">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Comparative Regional Table (Replaces the 5 repetitive cards) */}
      <section className="bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px]">
        <div className="p-5 border-b border-[#E6E4DD] dark:border-[#1E222B] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#111315] dark:text-white">
              1-jadval. Hududlar kesimida islomiy mikromoliya indeksi
            </h2>
            <p className="text-xs text-[#5A6065] dark:text-slate-400 mt-0.5">
              Hududiy talab, raqamli infratuzilma va ustuvor shariat shartnomalari
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F5] dark:bg-[#151921] text-[#5A6065] dark:text-slate-400 border-b border-[#E6E4DD] dark:border-[#1E222B]">
              <tr>
                <th className="px-5 py-3 font-semibold">Hudud</th>
                <th className="px-5 py-3 font-semibold">Shariatga mos talab</th>
                <th className="px-5 py-3 font-semibold">Raqamli / BNPL tayyorlik</th>
                <th className="px-5 py-3 font-semibold">O&apos;rtacha MMT kapitali</th>
                <th className="px-5 py-3 font-semibold">Asosiy mahsulot</th>
                <th className="px-5 py-3 font-semibold">2031 prognoz</th>
                <th className="px-5 py-3 font-semibold text-right">Simulyatsiya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E4DD] dark:divide-[#1E222B]">
              {REGIONAL_TABLE.map((row) => (
                <tr
                  key={row.region}
                  className="hover:bg-[#FAF9F5] dark:hover:bg-[#161A22] transition-colors"
                >
                  <td className="px-5 py-3.5 font-semibold text-[#111315] dark:text-white">
                    {row.region}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="mono-num font-semibold w-9">{row.demand}%</span>
                      <div className="w-24 h-1.5 bg-[#E6E4DD] dark:bg-slate-800 rounded-[1px] overflow-hidden">
                        <div
                          style={{ width: `${row.demand}%` }}
                          className="h-full bg-[#0F5338] dark:bg-emerald-500"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="mono-num w-9">{row.digital}/100</span>
                      <div className="w-24 h-1.5 bg-[#E6E4DD] dark:bg-slate-800 rounded-[1px] overflow-hidden">
                        <div
                          style={{ width: `${row.digital}%` }}
                          className="h-full bg-slate-600 dark:bg-slate-400"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 mono-num">{row.capitalAvg} mlrd so&apos;m</td>
                  <td className="px-5 py-3.5 text-[#454A4F] dark:text-slate-300">
                    {row.primaryContract}
                  </td>
                  <td className="px-5 py-3.5 mono-num font-bold text-[#0F5338] dark:text-emerald-400">
                    {row.projected2031}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onSimulateRegion(row.region)}
                      className="text-xs font-semibold text-[#0F5338] dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Kalkulyatorda ochish</span>
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
