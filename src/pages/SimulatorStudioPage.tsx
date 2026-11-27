import React, { useMemo, useState } from 'react';
import { ArrowRight, BookmarkPlus, Check, RotateCcw } from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

  const productMix2031 = useMemo(() => {
    const base = { Murabaha: 48, Ijara: 24, Salam: 16, Musharaka: 12 };
    base[input.mahsulotTuri] += 14;
    if (input.raqamlashtirish >= 70) base.Murabaha += 6;
    if (input.hudud === 'Qashqadaryo' || input.hudud === 'Samarqand') base.Salam += 6;
    const sum = base.Murabaha + base.Ijara + base.Salam + base.Musharaka;
    const mPct = Math.round((base.Murabaha / sum) * 100);
    const iPct = Math.round((base.Ijara / sum) * 100);
    const sPct = Math.round((base.Salam / sum) * 100);
    return [
      { name: 'Murabaha (nasiya savdo)', pct: mPct, color: 'bg-blue-600' },
      { name: 'Ijara (islomiy lizing)', pct: iPct, color: 'bg-sky-500' },
      { name: 'Salam (agrar avans)', pct: sPct, color: 'bg-indigo-500' },
      { name: 'Musharaka (sheriklik)', pct: Math.max(4, 100 - mPct - iPct - sPct), color: 'bg-slate-400' },
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
        title: "Islomiy mikromoliya bankiga o'tish (O'RQ-1026)",
        desc: "Kapitalni 58 mlrd so'mga oshirish va raqamli Murabaha indeksini 85 ga yetkazish.",
        next: {
          ...input,
          kapitalHajmi: Math.max(input.kapitalHajmi, 58),
          raqamlashtirish: Math.max(input.raqamlashtirish, 85),
          mahsulotTuri: 'Murabaha',
        },
      },
      {
        title: 'Soliq neytralligi (QQS islohoti)',
        desc: "Murabaha va Ijara bitimlarida ikki karra soliq yukini yechib, to'siq indeksini 2.0 ga tushirish.",
        next: { ...input, soliqYuklamasi: 2.0 },
      },
      {
        title: "Farg'ona vodiysi raqamli BNPL",
        desc: "Yuqori talabli hududda (85%) AAOIFI sertifikatli mobil Murabaha tizimini ishga tushirish.",
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
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            5 yillik ssenariy kalkulyatori (2026–2031)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Individual MMT parametrlarini kiritib, 2031-yilgi islomiy portfel ulushi va logit hissasini hisoblang
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onChangeInput(DEFAULT_SIMULATOR_INPUT)}
            className="px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Dastlabki qiymatlar</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            {savedFeedback ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            <span>{savedFeedback ? 'Qaydlarga saqlandi' : 'Qaydlarga saqlash'}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Inputs (5 cols) + Right Output (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold">Kirish parametrlari (X)</h2>
            <span className="mono-num text-[11px] text-slate-500">
              Model: {model.isBaseline ? 'Bazaviy' : "O'qitilgan"}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Tashkilot / Ssenariy nomi</label>
            <input
              type="text"
              value={input.name}
              onChange={(e) => onChangeInput({ ...input, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
            />
          </div>

          {[
            {
              key: 'shariatTalabi' as const,
              label: '1. Shariatga mos talab ulushi (%)',
              min: 10,
              max: 95,
              step: 1,
              suffix: '%',
            },
            {
              key: 'raqamlashtirish' as const,
              label: '2. Raqamlashtirish va BNPL indeksi',
              min: 0,
              max: 100,
              step: 1,
              suffix: ' / 100',
            },
            {
              key: 'kapitalHajmi' as const,
              label: "3. Ustav kapitali (50 mlrd = Bank chegarasi)",
              min: 5,
              max: 80,
              step: 1,
              suffix: " mlrd so'm",
            },
            {
              key: 'soliqYuklamasi' as const,
              label: "4. Soliq va operatsion to'siq indeksi",
              min: 1,
              max: 10,
              step: 0.5,
              suffix: ' / 10',
            },
          ].map((s) => (
            <div key={s.key} className="pt-2 border-t border-slate-100 dark:border-slate-800/70">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>{s.label}</span>
                <span className="mono-num font-bold text-blue-600 dark:text-blue-400">
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

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold mb-1">Hudud</label>
              <select
                value={input.hudud}
                onChange={(e) => onChangeInput({ ...input, hudud: e.target.value as Region })}
                className="w-full px-2.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Ustuvor shartnoma</label>
              <select
                value={input.mahsulotTuri}
                onChange={(e) =>
                  onChangeInput({ ...input, mahsulotTuri: e.target.value as IslamicProduct })
                }
                className="w-full px-2.5 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
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

        {/* Right Output */}
        <div className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
              <div className="text-[11px] text-slate-500">Transformatsiya ehtimoli P(y=1)</div>
              <div className="mono-num text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {pct.toFixed(1)}%
              </div>
              <div className="mono-num text-[11px] text-slate-400 mt-0.5">
                logit z = {result.z.toFixed(3)} ({result.impactLevel})
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
              <div className="text-[11px] text-slate-500">2031-yil kutilayotgan portfel ulushi</div>
              <div className="mono-num text-2xl font-bold mt-1">{projected2031}%</div>
              <div className="mono-num text-[11px] text-slate-400 mt-0.5">2026 bazasi: 4.0%</div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
              <div className="text-[11px] text-slate-500">O&apos;RQ-1026 Bank litsenziyasi</div>
              <div className="text-xs font-bold mt-1.5">
                {input.kapitalHajmi >= 50 ? (
                  <span className="text-blue-600 dark:text-blue-400">Talab bajarilgan (≥ 50 mlrd)</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Kamomad: -{50 - input.kapitalHajmi} mlrd so&apos;m
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Islomiy mikromoliya banki</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold mb-3">
              2026–2031-yillarda islomiy portfel ulushi dinamikasi (%)
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.yearlyTrajectory} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" strokeOpacity={0.4} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis unit="%" domain={[0, 48]} tick={{ fontSize: 11 }} stroke="#64748B" />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, '']}
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="sharePct" name="Joriy MMT prognozi" stroke="#2563EB" strokeWidth={2.8} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="baselinePct" name="Respublika bazaviy (27%)" stroke="#64748B" strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="optimisticPct" name="Optimistik (41.5%)" stroke="#0284C7" strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>2031-yilda shartnomalar tarkibi (AAOIFI)</span>
                <span className="mono-num text-slate-400 font-normal">Jami: 100%</span>
              </div>
              <div className="h-2.5 w-full flex rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                {productMix2031.map((pm) => (
                  <div key={pm.name} style={{ width: `${pm.pct}%` }} className={pm.color} />
                ))}
              </div>
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {productMix2031.map((pm) => (
                  <div key={pm.name} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-xs shrink-0 ${pm.color}`} />
                    <span className="text-slate-500 truncate">{pm.name.split(' ')[0]}</span>
                    <span className="mono-num font-bold">{pm.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50/60 dark:bg-blue-950/30 border-l-2 border-blue-600 px-3.5 py-2 rounded-r-md text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Tahliliy xulosa: </strong>
              {result.recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: XAI Decomposition Table + Policy Sensitivity Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-bold mb-3">
            Logit dekompozitsiyasi (Omillar hissasi: wᵢ × xᵢ)
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 text-left font-semibold">Omil</th>
                <th className="py-2 text-right font-semibold">Qiymat</th>
                <th className="py-2 text-right font-semibold">Ta&apos;sir (Δz)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {sortedContributions.map((c) => {
                const pos = c.contribution >= 0;
                return (
                  <tr key={c.featureName}>
                    <td className="py-2 font-medium">{c.label}</td>
                    <td className="py-2 text-right mono-num text-slate-500">{c.rawValue}</td>
                    <td
                      className={`py-2 text-right mono-num font-bold ${
                        pos ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {pos ? '+' : ''}
                      {c.contribution.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5">
          <h3 className="text-sm font-bold mb-1">
            Sezgirlik tahlili (What-If islohot ssenariylari)
          </h3>
          <p className="text-xs text-slate-500 mb-3.5">
            Institutsional yoki soliq o&apos;zgarishlarining joriy MMT ehtimoliga ta&apos;siri
          </p>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800">
            {whatIfLevers.map((lv) => (
              <div
                key={lv.title}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold">{lv.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{lv.desc}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right mono-num">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {lv.delta >= 0 ? '+' : ''}
                      {lv.delta.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-slate-400">Yangi: {lv.newProb.toFixed(1)}%</div>
                  </div>
                  <button
                    onClick={() => onChangeInput(lv.next)}
                    className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Qo&apos;llash</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
