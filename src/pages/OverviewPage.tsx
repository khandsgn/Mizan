import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Landmark,
  MapPin,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
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

const SCENARIO_DATA: Record<
  MacroScenario,
  {
    label: string;
    share2031: string;
    banksCount: string;
    fundingTarget: string;
    driver: string;
    series: { year: number; share: number }[];
  }
> = {
  conservative: {
    label: 'Konservativ',
    share2031: '14.5%',
    banksCount: '1–2 ta',
    fundingTarget: '$350 mln',
    driver: "Soliq/QQS to'siqlari saqlanib qolishi va sekin transformatsiya",
    series: [
      { year: 2026, share: 4.0 },
      { year: 2027, share: 5.8 },
      { year: 2028, share: 7.9 },
      { year: 2029, share: 10.1 },
      { year: 2030, share: 12.3 },
      { year: 2031, share: 14.5 },
    ],
  },
  baseline: {
    label: 'Bazaviy (eng ehtimolli)',
    share2031: '27.0%',
    banksCount: '3–5 ta',
    fundingTarget: '$1.0 mlrd',
    driver: "Raqamli Murabaha/BNPL o'sishi + bank islomiy darchalari",
    series: [
      { year: 2026, share: 4.0 },
      { year: 2027, share: 7.5 },
      { year: 2028, share: 12.0 },
      { year: 2029, share: 17.5 },
      { year: 2030, share: 22.5 },
      { year: 2031, share: 27.0 },
    ],
  },
  optimistic: {
    label: 'Optimistik',
    share2031: '41.5%',
    banksCount: '6–8 ta',
    fundingTarget: '$1.8 mlrd',
    driver: "To'liq soliq neytralligi + ITB/ICD va Ko'rfaz fondlari oqimi",
    series: [
      { year: 2026, share: 4.0 },
      { year: 2027, share: 9.5 },
      { year: 2028, share: 16.5 },
      { year: 2029, share: 24.5 },
      { year: 2030, share: 33.0 },
      { year: 2031, share: 41.5 },
    ],
  },
};

const TIMELINE = [
  {
    year: '2024 · Iyul',
    code: 'MB №3536 nizomi',
    title: 'MMTlar uchun islomiy xizmatlar',
    desc: 'Murabaha, Ijara, Mudaraba, Musharaka va Salam AAOIFI standartlari asosida ruxsat etildi.',
  },
  {
    year: '2025 · Fevral',
    code: "O'RQ-1026 Qonuni",
    title: 'Mikromoliya banki instituti',
    desc: "50 mlrd so'm ustav kapitali bilan MMT → Mikromoliya banki transformatsiyasi ochildi.",
  },
  {
    year: '2026 · Mart–Noyabr',
    code: "O'RQ-1126 Qonuni",
    title: 'Islomiy banklar va darchalar',
    desc: "To'laqonli islomiy bank faoliyati, MMTlarning islomiy mikromoliya bankiga o'tishi va ilk litsenziyalar.",
  },
  {
    year: '2026–2031 · Prognoz',
    code: '5 yillik ufq',
    title: '20–30% bozor ulushi',
    desc: "Raqamli Murabaha (BNPL), qishloq xo'jaligida Salam va 3–5 ta islomiy mikromoliya banki.",
  },
];

const REGIONAL_PROFILES: {
  region: Region;
  demand: number;
  digital: number;
  focus: string;
  tag: string;
}[] = [
  {
    region: "Farg'ona vodiysi",
    demand: 78,
    digital: 64,
    focus: 'Savdo Murabaha & Kichik biznes Ijara',
    tag: 'Eng yuqori talab',
  },
  {
    region: 'Toshkent',
    demand: 58,
    digital: 86,
    focus: 'Raqamli BNPL Murabaha & Bank darchalari',
    tag: 'Fintech yetakchisi',
  },
  {
    region: 'Samarqand',
    demand: 67,
    digital: 62,
    focus: 'Turizm & Hunarmandchilik Ijara/Murabaha',
    tag: "Barqaror o'sish",
  },
  {
    region: 'Buxoro',
    demand: 61,
    digital: 58,
    focus: 'Kichik ishlab chiqarish & Uskuna Ijarasi',
    tag: 'Yuqori potensial',
  },
  {
    region: 'Qashqadaryo',
    demand: 63,
    digital: 51,
    focus: "Agrobiznes Salam & Chorvachilik Murabaha",
    tag: 'Agro-Salam markazi',
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
  const active = SCENARIO_DATA[scenario];

  return (
    <div className="space-y-8">
      {/* Editorial Deep-Teal Hero with Subtle Girih Geometry */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0F4C5C] dark:bg-[#0B2A35] text-white p-7 sm:p-10 shadow-lg shadow-teal-950/15 border border-teal-800/60">
        <div className="absolute inset-0 girih-pattern pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-amber-300/30 text-amber-200 text-xs font-semibold mb-4">
              <Scale className="w-3.5 h-3.5" />
              <span>O&apos;zbekiston Islomiy Mikromoliya Tahlil Markazi · 2026–2031</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight leading-[1.15]">
              Islom moliyasining mikromoliyaga{' '}
              <span className="text-amber-300">kelajakdagi 5 yillik ta&apos;siri</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-teal-100/90 max-w-2xl leading-relaxed">
              Mizan — O&apos;zbekiston mikromoliya tashkilotlarining islomiy moliyalashtirishga
              (Murabaha, Ijara, Salam, Musharaka) o&apos;tish ehtimoli va 2031-yilgacha bo&apos;lgan bozor
              ulushini interaktiv mashinaviy o&apos;rganish (Logistik Regressiya + XAI) orqali
              prognozlovchi mustaqil tahlil platformasi.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onQuickSimulation}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-md shadow-amber-900/20 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>5 yillik simulyatsiyani boshlash</span>
              </button>

              <button
                onClick={() => onNavigate('studio-data')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all"
              >
                <span>Ma&apos;lumot studiyasiga o&apos;tish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Live Workspace Telemetry Box */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-950/35 backdrop-blur-md border border-white/15 p-5 space-y-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tizim holati</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-[11px] text-teal-200/80">MMT bazasi</div>
                <div className="mono-num text-xl font-bold mt-0.5">{datasetCount} ta</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-[11px] text-teal-200/80">ROC-AUC</div>
                <div className="mono-num text-xl font-bold text-amber-300 mt-0.5">
                  {rocAuc !== null ? rocAuc.toFixed(3) : '—'}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-[11px] text-teal-200/80">Tayyorlash</div>
                <div className="text-sm font-bold mt-1 text-teal-200">
                  {isPreprocessed ? 'Tayyor' : 'Kutilmoqda'}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-[11px] text-teal-200/80">Hisobotlar</div>
                <div className="mono-num text-xl font-bold mt-0.5">{reportsCount} ta</div>
              </div>
            </div>
            <p className="text-[11px] text-teal-100/70 leading-snug">
              Barcha 500 ta MMT yozuvi O&apos;zbekiston bozori ko&apos;rsatkichlari asosida sintetik
              modellashtirilgan.
            </p>
          </div>
        </div>
      </section>

      {/* Regulatory & Market Evolution Timeline (Unique to Uzbekistan Islamic Finance) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Huquqiy va institutsional yo&apos;l xaritasi (2024–2031)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              O&apos;zbekistonda islomiy mikromoliyani shakllantirgan asosiy qonunchilik bosqichlari
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIMELINE.map((t, idx) => (
            <div
              key={t.year}
              className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="mono-num text-xs font-bold text-[#0F4C5C] dark:text-teal-300">
                  {t.year}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/25">
                  {t.code}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {t.desc}
              </p>
              <div className="mt-4 h-1 w-full rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${(idx + 1) * 25}%` }}
                  className="h-full bg-gradient-to-r from-[#0F4C5C] to-amber-500"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive 3-Scenario Macro Forecast + Chart */}
      <section className="rounded-3xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0F4C5C] dark:text-teal-400" />
              <span>2026–2031 Makro-ssenariylar prognozi</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Islomiy moliyalashtirishning O&apos;zbekiston umumiy mikromoliya portfelidagi ulushi (%)
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
            {(['conservative', 'baseline', 'optimistic'] as MacroScenario[]).map((key) => (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  scenario === key
                    ? 'bg-[#0F4C5C] dark:bg-teal-500 text-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={active.series} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="mizanTealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F4C5C" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0F4C5C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.2} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#64748B" />
                <YAxis unit="%" domain={[0, 48]} tick={{ fontSize: 11 }} stroke="#64748B" />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, 'Islomiy ulush']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="share"
                  stroke="#0D9488"
                  strokeWidth={3}
                  fill="url(#mizanTealGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-2xl bg-[#FAF9F6] dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">2031-yil portfel ulushi</div>
              <div className="mono-num text-2xl font-extrabold text-[#0F4C5C] dark:text-teal-400 mt-1">
                {active.share2031}
              </div>
            </div>
            <div className="rounded-2xl bg-[#FAF9F6] dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 text-amber-600" />
                <span>Islomiy mikromoliya banki</span>
              </div>
              <div className="mono-num text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {active.banksCount}
              </div>
            </div>
            <div className="rounded-2xl bg-[#FAF9F6] dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Jalb etiladigan resurs</span>
              </div>
              <div className="mono-num text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {active.fundingTarget}
              </div>
            </div>
            <div className="rounded-2xl bg-[#FAF9F6] dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Asosiy drayver</span>
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1.5 leading-snug">
                {active.driver}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Opportunity Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Hududlar kesimida islomiy mikromoliya salohiyati
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Istalgan hududni bosing va uni 5 yillik simulyatorda darhol modellashtiring
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {REGIONAL_PROFILES.map((reg) => (
            <button
              key={reg.region}
              onClick={() => onSimulateRegion(reg.region)}
              className="text-left rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 hover:border-[#0F4C5C] dark:hover:border-teal-400 p-4 shadow-sm transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/15 text-[#0F4C5C] dark:text-teal-300">
                    {reg.tag}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0F4C5C] dark:group-hover:text-teal-300">
                  {reg.region}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {reg.focus}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Shariat talabi</span>
                  <span className="mono-num font-bold text-slate-800 dark:text-slate-200">
                    {reg.demand}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Raqamli tayyorlik</span>
                  <span className="mono-num font-bold text-[#0F4C5C] dark:text-teal-400">
                    {reg.digital} ball
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
