import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookmarkPlus,
  Check,
  Lightbulb,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IslamicProduct, Region, SimulatorInput, TrainedModel } from '../types';
import { PRODUCTS, REGIONS } from '../lib/dataset';
import { DEFAULT_SIMULATOR_INPUT, predictScenario } from '../lib/mlEngine';

interface SimulatorStudioPageProps {
  input: SimulatorInput;
  model: TrainedModel;
  onChangeInput: (next: SimulatorInput) => void;
  onSaveReport: (
    input: SimulatorInput,
    probability: number,
    impactLevel: 'Yuqori' | "O'rtacha" | 'Past',
    projected2031Share: number
  ) => void;
}

export const SimulatorStudioPage: React.FC<SimulatorStudioPageProps> = ({
  input,
  model,
  onChangeInput,
  onSaveReport,
}) => {
  const [savedFeedback, setSavedFeedback] = useState(false);

  const result = useMemo(() => predictScenario(input, model), [input, model]);
  const pct = Math.round(result.probability * 1000) / 10;
  const projected2031 = result.yearlyTrajectory[result.yearlyTrajectory.length - 1]?.sharePct ?? 25;

  // Dynamic 2031 Islamic Product Mix estimate based on user's selected primary product & digitalization
  const productMix2031 = useMemo(() => {
    const base = { Murabaha: 48, Ijara: 24, Salam: 16, Musharaka: 12 };
    base[input.mahsulotTuri] += 14;
    if (input.raqamlashtirish >= 70) base.Murabaha += 6;
    if (input.hudud === 'Qashqadaryo' || input.hudud === 'Samarqand') base.Salam += 6;
    const sum = base.Murabaha + base.Ijara + base.Salam + base.Musharaka;
    return [
      { name: 'Murabaha', pct: Math.round((base.Murabaha / sum) * 100), color: 'bg-[#0F4C5C] dark:bg-teal-500' },
      { name: 'Ijara', pct: Math.round((base.Ijara / sum) * 100), color: 'bg-teal-500 dark:bg-teal-300' },
      { name: 'Salam', pct: Math.round((base.Salam / sum) * 100), color: 'bg-amber-500' },
      { name: 'Musharaka', pct: Math.max(5, 100 - Math.round((base.Murabaha / sum) * 100) - Math.round((base.Ijara / sum) * 100) - Math.round((base.Salam / sum) * 100)), color: 'bg-amber-300' },
    ];
  }, [input.mahsulotTuri, input.raqamlashtirish, input.hudud]);

  const sortedContributions = useMemo(() => {
    return [...result.contributions]
      .filter((c) => Math.abs(c.contribution) > 0.005)
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 6);
  }, [result.contributions]);

  const whatIfLevers = useMemo(() => {
    const list: { title: string; desc: string; next: SimulatorInput }[] = [
      {
        title: "Islomiy mikromoliya bankiga o'tish",
        desc: "Kapitalni 58 mlrd so'mga oshirish (O'RQ-1026) va raqamli Murabaha ulushini 85 ballga yetkazish.",
        next: {
          ...input,
          kapitalHajmi: Math.max(input.kapitalHajmi, 58),
          raqamlashtirish: Math.max(input.raqamlashtirish, 85),
          mahsulotTuri: 'Murabaha',
        },
      },
      {
        title: 'Soliq & QQS neytralligi islohoti',
        desc: "Murabaha va Ijara bitimlarida ikki karra soliq yukini yechib, to'siq indeksini 2.0 ga tushirish.",
        next: { ...input, soliqYuklamasi: 2.0 },
      },
      {
        title: "Farg'ona vodiysi raqamli BNPL",
        desc: "Yuqori talabli hududda (85%) AAOIFI sertifikatli mobil Murabaha platformasini ishga tushirish.",
        next: {
          ...input,
          hudud: "Farg'ona vodiysi",
          shariatTalabi: 85,
          raqamlashtirish: 90,
          mahsulotTuri: 'Murabaha',
        },
      },
    ];
    return list.map((item) => {
      const pred = predictScenario(item.next, model);
      return {
        ...item,
        newProb: pred.probability * 100,
        delta: (pred.probability - result.probability) * 100,
      };
    });
  }, [input, model, result.probability]);

  const handleSave = () => {
    onSaveReport(input, result.probability, result.impactLevel, projected2031);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            5 Yillik Simulyator va XAI Tahlil
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Parametrlarni boshqaring, 2026–2031 trajektoriyasini, mahsulotlar tarkibini va omillar hissasini real vaqtda ko&apos;ring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onChangeInput(DEFAULT_SIMULATOR_INPUT)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tiklash</span>
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F4C5C] hover:bg-[#136074] dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 text-sm font-bold shadow-sm"
          >
            {savedFeedback ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            <span>{savedFeedback ? 'Hisobotga saqlandi!' : 'Ssenariyni saqlash'}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Controls (5 cols) + Forecast Canvas (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">MMT Parametrlari</h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25">
              {model.isBaseline ? 'Bazaviy model' : "O'qitilgan model"}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Ssenariy / MMT nomi
            </label>
            <input
              type="text"
              value={input.name}
              onChange={(e) => onChangeInput({ ...input, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900 text-sm"
            />
          </div>

          {/* 4 Sliders */}
          {[
            {
              key: 'shariatTalabi' as const,
              label: 'Shariatga mos talab (%)',
              min: 10,
              max: 95,
              step: 1,
              suffix: '%',
            },
            {
              key: 'raqamlashtirish' as const,
              label: 'Raqamlashtirish & BNPL (ball)',
              min: 0,
              max: 100,
              step: 1,
              suffix: ' ball',
            },
            {
              key: 'kapitalHajmi' as const,
              label: "Ustav kapitali (50 mlrd = Bank)",
              min: 5,
              max: 80,
              step: 1,
              suffix: ' mlrd',
            },
            {
              key: 'soliqYuklamasi' as const,
              label: "Soliq va operatsion to'siq (1–10)",
              min: 1,
              max: 10,
              step: 0.5,
              suffix: ' / 10',
            },
          ].map((s) => (
            <div
              key={s.key}
              className="rounded-xl bg-[#FAF9F6] dark:bg-slate-900/70 border border-stone-200 dark:border-slate-800 p-3.5"
            >
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">{s.label}</span>
                <span className="mono-num font-bold text-[#0F4C5C] dark:text-teal-400">
                  {input[s.key]}
                  {s.suffix}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={input[s.key]}
                onChange={(e) => onChangeInput({ ...input, [s.key]: Number(e.target.value) })}
                className="w-full mizan-slider"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Hudud
              </label>
              <select
                value={input.hudud}
                onChange={(e) => onChangeInput({ ...input, hudud: e.target.value as Region })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900 text-xs sm:text-sm"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Asosiy mahsulot
              </label>
              <select
                value={input.mahsulotTuri}
                onChange={(e) =>
                  onChangeInput({ ...input, mahsulotTuri: e.target.value as IslamicProduct })
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900 text-xs sm:text-sm"
              >
                {PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Executive Forecast Canvas */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top KPI Verdict Banner */}
          <div className="rounded-2xl bg-[#0F4C5C] dark:bg-[#0B2A35] text-white p-6 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 girih-pattern pointer-events-none" />
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <div className="text-xs text-teal-200">5 yillik transformatsiya ehtimoli</div>
                <div className="mono-num text-4xl font-extrabold text-amber-300 mt-1">
                  {pct.toFixed(1)}%
                </div>
                <div className="mono-num text-[11px] text-teal-200/80 mt-1">
                  z = {result.z.toFixed(2)} · {result.impactLevel} ta&apos;sir
                </div>
              </div>

              <div className="sm:border-l sm:border-white/15 sm:pl-4">
                <div className="text-xs text-teal-200">2031-yil kutilayotgan portfel ulushi</div>
                <div className="mono-num text-3xl font-extrabold text-white mt-1">
                  {projected2031}%
                </div>
                <div className="text-[11px] text-teal-200/80 mt-1">2026 bazasi: 4.0%</div>
              </div>

              <div className="sm:border-l sm:border-white/15 sm:pl-4">
                <div className="text-xs text-teal-200">Bank maqomi (O&apos;RQ-1026)</div>
                <div className="text-sm font-bold text-amber-300 mt-1.5">
                  {input.kapitalHajmi >= 50
                    ? 'Islomiy mikromoliya bankiga tayyor'
                    : `Yana ${50 - input.kapitalHajmi} mlrd so'm kerak`}
                </div>
              </div>
            </div>
          </div>

          {/* 5-Year Trajectory Chart */}
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#0F4C5C] dark:text-teal-400" />
                <span>2026–2031 Islomiy mikromoliya ulushi trajektoriyasi</span>
              </h3>
            </div>
            <div className="h-[205px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.yearlyTrajectory} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.2} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis unit="%" domain={[0, 48]} tick={{ fontSize: 11 }} stroke="#64748B" />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="sharePct" name="Joriy ssenariy" stroke="#0D9488" strokeWidth={3} fill="url(#simGrad)" />
                  <Area type="monotone" dataKey="baselinePct" name="Bazaviy (27%)" stroke="#94A3B8" strokeDasharray="4 4" fill="none" />
                  <Area type="monotone" dataKey="optimisticPct" name="Optimistik (41.5%)" stroke="#D97706" strokeDasharray="3 3" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2031 Product Mix Evolution Bar + Recommendation */}
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                <span>2031-yil kutilayotgan islomiy mahsulotlar tarkibi</span>
                <span className="text-slate-400 font-normal">AAOIFI standartlari</span>
              </div>
              <div className="h-3.5 w-full rounded-full overflow-hidden flex gap-0.5">
                {productMix2031.map((pm) => (
                  <div key={pm.name} style={{ width: `${pm.pct}%` }} className={pm.color} title={`${pm.name}: ${pm.pct}%`} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                {productMix2031.map((pm) => (
                  <div key={pm.name} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm ${pm.color}`} />
                    <span className="text-slate-600 dark:text-slate-300">{pm.name}</span>
                    <span className="mono-num font-bold text-slate-900 dark:text-white">{pm.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/25 p-3.5 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Strategik xulosa</span>
              </div>
              {result.recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Integrated XAI & Policy Levers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Omillar hissasi (XAI · w × x)
            </h3>
          </div>
          <div className="space-y-2">
            {sortedContributions.map((c) => {
              const pos = c.contribution >= 0;
              return (
                <div
                  key={c.featureName}
                  className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#FAF9F6] dark:bg-slate-900/70 border border-stone-200/70 dark:border-slate-800"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {c.label} <span className="mono-num text-slate-400">({c.rawValue})</span>
                  </span>
                  <span
                    className={`mono-num font-bold ${
                      pos ? 'text-[#0F4C5C] dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {pos ? '+' : ''}
                    {c.contribution.toFixed(3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            &ldquo;Nima bo&apos;ladi agar...&rdquo; — Islohot va strategiya sinovlari
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Bir tugma bilan ssenariyni qo&apos;llab, 2031-yilgi natija qanchaga o&apos;zgarishini ko&apos;ring
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {whatIfLevers.map((lv) => (
              <div
                key={lv.title}
                className="rounded-xl bg-[#FAF9F6] dark:bg-slate-900/70 border border-stone-200 dark:border-slate-800 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`mono-num text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        lv.delta >= 0
                          ? 'bg-teal-100 dark:bg-teal-500/20 text-[#0F4C5C] dark:text-teal-300'
                          : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {lv.delta >= 0 ? '+' : ''}
                      {lv.delta.toFixed(1)}%
                    </span>
                    <span className="mono-num text-xs font-bold text-slate-700 dark:text-slate-200">
                      {lv.newProb.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{lv.title}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {lv.desc}
                  </p>
                </div>

                <button
                  onClick={() => onChangeInput(lv.next)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#0F4C5C] hover:text-white dark:hover:bg-teal-500 dark:hover:text-slate-950 border border-stone-200 dark:border-slate-700 text-xs font-semibold transition-colors"
                >
                  <span>Qo&apos;llash</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
