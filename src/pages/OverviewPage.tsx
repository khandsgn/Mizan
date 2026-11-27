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
    doc: 'MB №3536 Nizomi',
    title: "MMTlarga islomiy moliyalashtirish huquqi berildi",
    note: "AAOIFI standartlari asosida Murabaha, Ijara, Mudaraba, Musharaka va Salam shartnomalari hamda Shariat kengashi talabi kiritildi.",
  },
  {
    date: '2025 · FEVRAL',
    doc: "O'RQ-1026 Qonuni",
    title: 'Mikromoliya banki instituti joriy etildi',
    note: "Eng kam ustav kapitali 50 mlrd so'm etib belgilandi va MMT → Mikromoliya banki → Tijorat banki transformatsiya zanjiri ochildi.",
  },
  {
    date: '2026 · MART–AVGUST',
    doc: "O'RQ-1126 Qonuni",
    title: "Islomiy banklar va islomiy mikromoliya banklari",
    note: "2026-yil 29-iyundan to'laqonli islomiy bank faoliyati va bank darchalari kuchga kirdi; avgustda MMTlarning islomiy mikromoliya bankiga aylanish tartibi tasdiqlandi.",
  },
  {
    date: '2026–2031 · UFQ',
    doc: 'Strategik maqsad',
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
  arabicContract: string;
  projected2031: string;
}[] = [
  {
    region: "Farg'ona vodiysi",
    demand: 78,
    digital: 64,
    capitalAvg: 38,
    primaryContract: 'Murabaha / Savdo nasiya',
    arabicContract: 'المرابحة',
    projected2031: '34.2%',
  },
  {
    region: 'Toshkent',
    demand: 58,
    digital: 86,
    capitalAvg: 54,
    primaryContract: 'Raqamli BNPL & Ijara',
    arabicContract: 'الإجارة',
    projected2031: '31.8%',
  },
  {
    region: 'Samarqand',
    demand: 67,
    digital: 62,
    capitalAvg: 34,
    primaryContract: 'Murabaha & Uskuna Ijarasi',
    arabicContract: 'المرابحة',
    projected2031: '26.5%',
  },
  {
    region: 'Buxoro',
    demand: 61,
    digital: 58,
    capitalAvg: 29,
    primaryContract: 'Ishlab chiqarish Ijarasi',
    arabicContract: 'الإجارة',
    projected2031: '22.4%',
  },
  {
    region: 'Qashqadaryo',
    demand: 63,
    digital: 51,
    capitalAvg: 26,
    primaryContract: 'Agro-Salam & Murabaha',
    arabicContract: 'السلم',
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
    <div className="space-y-7">
      {/* Sovereign Deep-Malachite & Dinar-Gold Executive Frame */}
      <section className="bg-[#071D15] text-[#ECE8DF] border border-[#C5A059]/60 gold-rule-top p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#D4B36F] font-semibold mb-2">
              <span>◆</span>
              <span>Islom Moliyasi va Mikromoliya Tadqiqoti · 2026–2031</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-white leading-[1.12]">
              Islom moliyasining mikromoliyaga{' '}
              <span className="text-[#D4B36F] italic">kelajakdagi 5 yillik ta&apos;siri</span>
            </h1>

            <p className="mt-3.5 text-sm text-[#B4C6BC] leading-relaxed">
              Markaziy bankning 3536-sonli nizomi, O&apos;RQ-1026 va O&apos;RQ-1126 qonunlari asosida
              O&apos;zbekiston mikromoliya tashkilotlarining ribosiz (Murabaha, Ijara, Salam, Musharaka)
              moliyalashtirish modeliga o&apos;tish ehtimoli va 2031-yilgacha bo&apos;lgan bozor ulushi prognozi.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onQuickSimulation}
                className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#D4B36F] text-[#071D15] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors"
              >
                <span>5 yillik shariat modelini ishga tushirish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('studio-data')}
                className="px-4 py-2.5 border border-[#C5A059]/45 bg-[#0B291E] hover:bg-[#11382A] text-[#ECE8DF] text-xs font-semibold tracking-wide transition-colors"
              >
                MMT bazasini ko&apos;rish ({datasetCount})
              </button>
            </div>
          </div>

          {/* Right 4 Sovereign Gold-Framed Metrics */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-px bg-[#C5A059]/30 border border-[#C5A059]/45">
            <div className="bg-[#0B261C] p-4">
              <div className="flex items-center justify-between text-[11px] text-[#A3B8AE]">
                <span>2031 Bazaviy Ulush</span>
                <span className="font-arabic text-xs text-[#D4B36F]">الحصة</span>
              </div>
              <div className="mono-num text-2xl font-bold text-[#D4B36F] mt-1">20% – 30%</div>
              <div className="text-[11px] text-[#7E968B] mt-0.5">2026 bazasi: ~4.0%</div>
            </div>

            <div className="bg-[#0B261C] p-4">
              <div className="flex items-center justify-between text-[11px] text-[#A3B8AE]">
                <span>Islomiy MM Banklar</span>
                <span className="font-arabic text-xs text-[#D4B36F]">المصارف</span>
              </div>
              <div className="mono-num text-2xl font-bold text-white mt-1">3 – 5 ta</div>
              <div className="text-[11px] text-[#7E968B] mt-0.5">Ustav kapitali ≥ 50 mlrd</div>
            </div>

            <div className="bg-[#0B261C] p-4">
              <div className="flex items-center justify-between text-[11px] text-[#A3B8AE]">
                <span>Model ROC-AUC</span>
                <span className="font-arabic text-xs text-[#D4B36F]">الدقة</span>
              </div>
              <div className="mono-num text-2xl font-bold text-white mt-1">
                {rocAuc !== null ? rocAuc.toFixed(3) : isPreprocessed ? 'Tayyor' : 'Bazaviy'}
              </div>
              <div className="text-[11px] text-[#7E968B] mt-0.5">Logistik Regressiya</div>
            </div>

            <div className="bg-[#0B261C] p-4">
              <div className="flex items-center justify-between text-[11px] text-[#A3B8AE]">
                <span>Saqlangan Qaydlar</span>
                <span className="font-arabic text-xs text-[#D4B36F]">السجلات</span>
              </div>
              <div className="mono-num text-2xl font-bold text-[#D4B36F] mt-1">
                {reportsCount} ta
              </div>
              <div className="text-[11px] text-[#7E968B] mt-0.5">AAOIFI tahlil reyestri</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Grid: Forecast Chart & Table (8 cols) + Fiqh/Legal Timeline (4 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] gold-rule-top">
          <div className="px-5 py-4 border-b border-[#E5DFD3] dark:border-[#163024] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#081C15] dark:text-white">
                Islomiy mikromoliya portfeli ulushi prognozi (2026–2031)
              </h2>
              <p className="text-xs text-[#52635A] dark:text-[#8FA69B]">
                Ribosiz shartnomalar (Murabaha, Ijara, Salam, Musharaka) ulushi dinamikasi (%)
              </p>
            </div>

            <div className="inline-flex shrink-0 border border-[#C5A059]/50 text-xs">
              {(['conservative', 'baseline', 'optimistic'] as MacroScenario[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setScenario(key)}
                  className={`px-3 py-1.5 font-semibold transition-colors ${
                    scenario === key
                      ? 'bg-[#071D15] dark:bg-[#C5A059] text-[#D4B36F] dark:text-[#071D15]'
                      : 'bg-white dark:bg-[#0A1812] text-[#52635A] dark:text-[#8FA69B] hover:bg-[#F6F3EC] dark:hover:bg-[#11261D]'
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
            {/* Scenario Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#D5CEBF] dark:bg-[#1B382B] border border-[#D5CEBF] dark:border-[#1B382B]">
              <div className="bg-[#FAF8F3] dark:bg-[#0D2118] p-3.5">
                <div className="text-[11px] text-[#52635A] dark:text-[#8FA69B]">2031-yil ulushi</div>
                <div className="mono-num text-xl font-bold text-[#0A3828] dark:text-[#D4B36F] mt-0.5">
                  {active.share2031}
                </div>
              </div>
              <div className="bg-[#FAF8F3] dark:bg-[#0D2118] p-3.5">
                <div className="text-[11px] text-[#52635A] dark:text-[#8FA69B]">Yillik o&apos;sish (CAGR)</div>
                <div className="mono-num text-xl font-bold mt-0.5">{active.cagr}</div>
              </div>
              <div className="bg-[#FAF8F3] dark:bg-[#0D2118] p-3.5">
                <div className="text-[11px] text-[#52635A] dark:text-[#8FA69B]">Islomiy MM banklar</div>
                <div className="mono-num text-xl font-bold mt-0.5">{active.banksCount}</div>
              </div>
              <div className="bg-[#FAF8F3] dark:bg-[#0D2118] p-3.5">
                <div className="text-[11px] text-[#52635A] dark:text-[#8FA69B]">IsDB / ICD va ichki fondlash</div>
                <div className="mono-num text-xl font-bold text-[#9A7428] dark:text-[#D4B36F] mt-0.5">
                  {active.fundingTarget}
                </div>
              </div>
            </div>

            <div className="h-[235px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={COMBINED_YEARS} margin={{ top: 8, right: 16, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#C5A059" strokeOpacity={0.22} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#52635A" />
                  <YAxis unit="%" domain={[0, 45]} tick={{ fontSize: 11 }} stroke="#52635A" />
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(1)}%`, '']}
                    contentStyle={{
                      borderRadius: '0px',
                      border: '1px solid #C5A059',
                      backgroundColor: '#071D15',
                      color: '#ECE8DF',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="optimistic"
                    name="Optimistik"
                    stroke="#C5A059"
                    strokeWidth={scenario === 'optimistic' ? 3 : 1.6}
                    strokeDasharray={scenario === 'optimistic' ? undefined : '4 3'}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    name="Bazaviy"
                    stroke="#0D5C3F"
                    strokeWidth={scenario === 'baseline' ? 3 : 1.8}
                    dot={{ r: 3.5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conservative"
                    name="Konservativ"
                    stroke="#788880"
                    strokeWidth={scenario === 'conservative' ? 3 : 1.5}
                    strokeDasharray={scenario === 'conservative' ? undefined : '3 3'}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="text-xs text-[#2C3E35] dark:text-[#C2D1C9] bg-[#F6F3EC] dark:bg-[#0D2118] border-l-2 border-[#C5A059] px-3.5 py-2">
              <strong>{active.label}:</strong> {active.assumption}
            </div>

            {/* Scenario Comparison Table */}
            <div className="overflow-x-auto border-t border-[#E5DFD3] dark:border-[#163024] pt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#52635A] dark:text-[#8FA69B] border-b border-[#E5DFD3] dark:border-[#163024]">
                    <th className="py-2 font-semibold">Ssenariy</th>
                    {COMBINED_YEARS.map((y) => (
                      <th key={y.year} className="py-2 font-semibold mono-num text-right">
                        {y.year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE4] dark:divide-[#12261D] mono-num">
                  <tr className={scenario === 'conservative' ? 'bg-[#F6F3EC] dark:bg-[#11261D] font-bold' : ''}>
                    <td className="py-2 font-sans">Konservativ</td>
                    {COMBINED_YEARS.map((y) => (
                      <td key={y.year} className="py-2 text-right">
                        {y.conservative.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className={scenario === 'baseline' ? 'bg-[#F6F3EC] dark:bg-[#11261D] font-bold text-[#0A3828] dark:text-[#D4B36F]' : ''}>
                    <td className="py-2 font-sans">Bazaviy (asosiy)</td>
                    {COMBINED_YEARS.map((y) => (
                      <td key={y.year} className="py-2 text-right">
                        {y.baseline.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className={scenario === 'optimistic' ? 'bg-[#F6F3EC] dark:bg-[#11261D] font-bold text-[#9A7428] dark:text-[#D4B36F]' : ''}>
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

        {/* Right 4 Cols: Regulatory & Shariah Governance Ledger */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] gold-rule-top">
          <div className="px-5 py-4 border-b border-[#E5DFD3] dark:border-[#163024] flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-[#081C15] dark:text-white">
                Fiqhiy va Huquqiy Asoslar
              </h2>
              <p className="text-xs text-[#52635A] dark:text-[#8FA69B]">
                O&apos;zbekiston islomiy moliya qonunchiligi
              </p>
            </div>
            <span className="font-arabic text-lg text-[#C5A059]">الشريعة</span>
          </div>

          <div className="p-5 divide-y divide-[#E5DFD3] dark:divide-[#163024]">
            {LEGAL_LEDGER.map((item) => (
              <div key={item.date} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-num text-[11px] font-bold text-[#9A7428] dark:text-[#D4B36F]">
                    {item.date}
                  </span>
                  <span className="mono-num text-[11px] px-2 py-0.5 bg-[#F6F3EC] dark:bg-[#11261D] border border-[#C5A059]/30 text-[#081C15] dark:text-[#D4B36F]">
                    {item.doc}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-[#081C15] dark:text-white mt-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-[#52635A] dark:text-[#8FA69B] mt-1 leading-relaxed">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Regional Quantitative Matrix */}
      <section className="bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] gold-rule-top overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5DFD3] dark:border-[#163024] flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#081C15] dark:text-white">
              Hududlar kesimida shariatga mos mikromoliya salohiyati
            </h2>
            <p className="text-xs text-[#52635A] dark:text-[#8FA69B]">
              Viloyatlar bo&apos;yicha ribosiz mahsulotlarga talab va 2031-yilgi prognoz ulushi
            </p>
          </div>
          <span className="font-arabic text-base text-[#C5A059] hidden sm:inline">
            المناطق الأوزبكية
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F3] dark:bg-[#0D2118] text-[#52635A] dark:text-[#8FA69B] border-b border-[#E5DFD3] dark:border-[#163024]">
              <tr>
                <th className="px-5 py-3 font-semibold">Hudud</th>
                <th className="px-5 py-3 font-semibold">Shariatga mos talab</th>
                <th className="px-5 py-3 font-semibold">Raqamli / BNPL tayyorlik</th>
                <th className="px-5 py-3 font-semibold">O&apos;rtacha MMT kapitali</th>
                <th className="px-5 py-3 font-semibold">Ustuvor shariat shartnomasi</th>
                <th className="px-5 py-3 font-semibold">2031 prognoz</th>
                <th className="px-5 py-3 font-semibold text-right">Simulyatsiya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3] dark:divide-[#163024]">
              {REGIONAL_TABLE.map((row) => (
                <tr key={row.region} className="hover:bg-[#FAF8F3] dark:hover:bg-[#0E241A]">
                  <td className="px-5 py-3.5 font-semibold text-[#081C15] dark:text-white">
                    {row.region}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="mono-num font-semibold w-9">{row.demand}%</span>
                      <div className="w-24 h-1.5 bg-[#E5DFD3] dark:bg-[#163024] overflow-hidden">
                        <div style={{ width: `${row.demand}%` }} className="h-full bg-[#0A3828] dark:bg-[#C5A059]" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="mono-num w-9">{row.digital}/100</span>
                      <div className="w-24 h-1.5 bg-[#E5DFD3] dark:bg-[#163024] overflow-hidden">
                        <div style={{ width: `${row.digital}%` }} className="h-full bg-[#9A7428]" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 mono-num">{row.capitalAvg} mlrd so&apos;m</td>
                  <td className="px-5 py-3.5">
                    <span className="font-arabic text-xs text-[#9A7428] dark:text-[#D4B36F] mr-1.5">
                      {row.arabicContract}
                    </span>
                    <span>{row.primaryContract}</span>
                  </td>
                  <td className="px-5 py-3.5 mono-num font-bold text-[#0A3828] dark:text-[#D4B36F]">
                    {row.projected2031}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onSimulateRegion(row.region)}
                      className="px-3 py-1 border border-[#C5A059]/50 bg-[#FAF8F3] dark:bg-[#11261D] hover:bg-[#071D15] hover:text-[#D4B36F] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Tahlil qilish</span>
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
