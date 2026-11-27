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
      { name: 'Murabaha', arabic: 'المرابحة', pct: mPct, color: 'bg-[#0D5C3F]' },
      { name: 'Ijara', arabic: 'الإجارة', pct: iPct, color: 'bg-[#C5A059]' },
      { name: 'Salam', arabic: 'السلم', pct: sPct, color: 'bg-[#8A6B2F]' },
      { name: 'Musharaka', arabic: 'المشاركة', pct: Math.max(4, 100 - mPct - iPct - sPct), color: 'bg-[#6E7F76]' },
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
        title: "Open Bank / Ipak Yo'li / Orient Finans bilan ulgurji Wakala-Mudaraba",
        desc: "2026-yil noyabrda ruxsatnoma olgan banklarning (Ipak Yo'li, Asia Alliance, Orient Finans, Hayot Bank) islomiy darchalari orqali fondlash jalb etib, kapitalni 60 mlrdga chiqarish.",
        next: {
          ...input,
          kapitalHajmi: Math.max(input.kapitalHajmi, 60),
          raqamlashtirish: Math.max(input.raqamlashtirish, 82),
          soliqYuklamasi: Math.min(input.soliqYuklamasi, 3.5),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5CEBF] dark:border-[#1B382B] pb-4">
        <div>
          <div className="text-xs font-semibold text-[#9A7428] dark:text-[#D4B36F] uppercase tracking-wider">
            IV. Shariat Ssenariy Kalkulyatori va Omillar Dekompozitsiyasi
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#081C15] dark:text-white mt-0.5">
            5 yillik islomiy mikromoliya prognozi (2026–2031)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onChangeInput(DEFAULT_SIMULATOR_INPUT)}
            className="px-3.5 py-2 border border-[#C5A059]/50 bg-white dark:bg-[#0A1812] text-xs font-medium inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Dastlabki qiymatlar</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#071D15] dark:bg-[#C5A059] text-[#D4B36F] dark:text-[#071D15] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            {savedFeedback ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            <span>{savedFeedback ? 'Qaydlarga saqlandi' : 'Qaydlarga saqlash'}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Inputs (5 cols) + Right Output (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] gold-rule-top p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DFD3] dark:border-[#163024] pb-3">
            <h2 className="font-display text-lg font-bold">MMT Kirish Parametrlari</h2>
            <span className="mono-num text-[11px] text-[#9A7428] dark:text-[#D4B36F]">
              Model: {model.isBaseline ? 'Bazaviy' : "O'qitilgan"}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Tashkilot / Ssenariy nomi</label>
            <input
              type="text"
              value={input.name}
              onChange={(e) => onChangeInput({ ...input, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#D5CEBF] dark:border-[#1B382B] bg-[#FAF8F3] dark:bg-[#0D2118] text-xs"
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
            <div key={s.key} className="pt-2 border-t border-[#EFECE4] dark:border-[#12261D]">
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span>{s.label}</span>
                <span className="mono-num font-bold text-[#0A3828] dark:text-[#D4B36F]">
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

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5DFD3] dark:border-[#163024]">
            <div>
              <label className="block text-xs font-semibold mb-1">Hudud</label>
              <select
                value={input.hudud}
                onChange={(e) => onChangeInput({ ...input, hudud: e.target.value as Region })}
                className="w-full px-2.5 py-2 border border-[#D5CEBF] dark:border-[#1B382B] bg-[#FAF8F3] dark:bg-[#0D2118] text-xs"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Ustuvor shariat shartnomasi</label>
              <select
                value={input.mahsulotTuri}
                onChange={(e) =>
                  onChangeInput({ ...input, mahsulotTuri: e.target.value as IslamicProduct })
                }
                className="w-full px-2.5 py-2 border border-[#D5CEBF] dark:border-[#1B382B] bg-[#FAF8F3] dark:bg-[#0D2118] text-xs"
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
          {/* Sovereign Verdict Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#C5A059]/40 border border-[#C5A059]/60">
            <div className="bg-[#071D15] text-white p-4">
              <div className="text-[11px] text-[#A3B8AE]">Transformatsiya ehtimoli P(y=1)</div>
              <div className="mono-num text-2xl font-bold text-[#D4B36F] mt-1">
                {pct.toFixed(1)}%
              </div>
              <div className="mono-num text-[11px] text-[#7E968B] mt-0.5">
                logit z = {result.z.toFixed(3)} ({result.impactLevel})
              </div>
            </div>

            <div className="bg-[#071D15] text-white p-4">
              <div className="text-[11px] text-[#A3B8AE]">2031-yil kutilayotgan portfel ulushi</div>
              <div className="mono-num text-2xl font-bold text-white mt-1">{projected2031}%</div>
              <div className="mono-num text-[11px] text-[#7E968B] mt-0.5">2026 bazasi: 4.0%</div>
            </div>

            <div className="bg-[#071D15] text-white p-4">
              <div className="text-[11px] text-[#A3B8AE]">O&apos;RQ-1026 Bank Maqomi</div>
              <div className="text-xs font-bold mt-1.5 text-[#D4B36F]">
                {input.kapitalHajmi >= 50
                  ? 'Islomiy MM bankiga tayyor (≥50 mlrd)'
                  : `Kamomad: -${50 - input.kapitalHajmi} mlrd so'm`}
              </div>
              <div className="text-[11px] text-[#7E968B] mt-0.5">Mudaraba depozit huquqi</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] gold-rule-top p-5">
            <h3 className="font-display text-lg font-bold mb-3">
              2026–2031-yillarda islomiy portfel ulushi dinamikasi (%)
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.yearlyTrajectory} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#C5A059" strokeOpacity={0.22} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#52635A" />
                  <YAxis unit="%" domain={[0, 48]} tick={{ fontSize: 11 }} stroke="#52635A" />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, '']}
                    contentStyle={{
                      borderRadius: '0px',
                      border: '1px solid #C5A059',
                      backgroundColor: '#071D15',
                      color: '#ECE8DF',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="sharePct" name="Joriy MMT prognozi" stroke="#0D5C3F" strokeWidth={2.8} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="baselinePct" name="Respublika bazaviy (27%)" stroke="#788880" strokeDasharray="4 3" dot={false} />
                  <Line type="monotone" dataKey="optimisticPct" name="Optimistik (41.5%)" stroke="#C5A059" strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>2031-yilda shariat shartnomalari tarkibi (AAOIFI)</span>
                <span className="font-arabic text-sm text-[#C5A059]">العقود الشرعية</span>
              </div>
              <div className="h-3 w-full flex overflow-hidden bg-[#E5DFD3] dark:bg-[#163024]">
                {productMix2031.map((pm) => (
                  <div key={pm.name} style={{ width: `${pm.pct}%` }} className={pm.color} />
                ))}
              </div>
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {productMix2031.map((pm) => (
                  <div key={pm.name} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 shrink-0 ${pm.color}`} />
                    <span className="font-arabic text-xs text-[#9A7428] dark:text-[#D4B36F]">{pm.arabic}</span>
                    <span className="text-[#52635A] dark:text-[#8FA69B] truncate">{pm.name}</span>
                    <span className="mono-num font-bold">{pm.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#F6F3EC] dark:bg-[#0D2118] border-l-2 border-[#C5A059] px-3.5 py-2 text-xs text-[#2C3E35] dark:text-[#C2D1C9] leading-relaxed">
              <strong className="text-[#081C15] dark:text-[#D4B36F]">Shariat va strategik tavsiya: </strong>
              {result.recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: XAI Decomposition Table + Policy Sensitivity Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] gold-rule-top p-5">
          <h3 className="font-display text-lg font-bold mb-3">
            Logit dekompozitsiyasi (Omillar hissasi: wᵢ × xᵢ)
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E5DFD3] dark:border-[#163024] text-[#52635A]">
                <th className="py-2 text-left font-semibold">Omil</th>
                <th className="py-2 text-right font-semibold">Qiymat</th>
                <th className="py-2 text-right font-semibold">Ta&apos;sir (Δz)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE4] dark:divide-[#12261D]">
              {sortedContributions.map((c) => {
                const pos = c.contribution >= 0;
                return (
                  <tr key={c.featureName}>
                    <td className="py-2 font-medium">{c.label}</td>
                    <td className="py-2 text-right mono-num text-[#52635A]">{c.rawValue}</td>
                    <td
                      className={`py-2 text-right mono-num font-bold ${
                        pos ? 'text-[#0A3828] dark:text-[#D4B36F]' : 'text-rose-700'
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

        <div className="lg:col-span-7 bg-white dark:bg-[#0A1812] border border-[#D5CEBF] dark:border-[#1B382B] gold-rule-top p-5">
          <h3 className="font-display text-lg font-bold mb-1">
            Sezgirlik tahlili (What-If islohot ssenariylari)
          </h3>
          <p className="text-xs text-[#52635A] mb-3.5">
            Institutsional yoki soliq o&apos;zgarishlarining joriy MMT ehtimoliga ta&apos;siri
          </p>

          <div className="divide-y divide-[#E5DFD3] dark:divide-[#163024] border-t border-[#E5DFD3] dark:border-[#163024]">
            {whatIfLevers.map((lv) => (
              <div
                key={lv.title}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold">{lv.title}</div>
                  <div className="text-xs text-[#52635A] dark:text-[#8FA69B] mt-0.5">{lv.desc}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right mono-num">
                    <div className="text-xs font-bold text-[#0A3828] dark:text-[#D4B36F]">
                      {lv.delta >= 0 ? '+' : ''}
                      {lv.delta.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-[#52635A]">Yangi: {lv.newProb.toFixed(1)}%</div>
                  </div>
                  <button
                    onClick={() => onChangeInput(lv.next)}
                    className="px-3 py-1.5 border border-[#C5A059]/60 hover:bg-[#071D15] hover:text-[#D4B36F] text-xs font-semibold inline-flex items-center gap-1 transition-colors"
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
