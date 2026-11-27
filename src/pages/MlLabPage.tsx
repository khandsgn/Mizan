import React, { useMemo, useState } from 'react';
import { ArrowRight, FlaskConical, Play, RotateCcw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PreprocessedDataset, TrainedModel, TrainingHyperparams } from '../types';
import {
  computeMetricsAtThreshold,
  computeProbabilityDistribution,
  computeRocCurve,
  DEFAULT_HYPERPARAMS,
} from '../lib/mlEngine';

interface MlLabPageProps {
  preprocessed: PreprocessedDataset | null;
  hyperparams: TrainingHyperparams;
  model: TrainedModel;
  onChangeHyperparams: (hp: TrainingHyperparams) => void;
  onTrain: () => void;
  onGoToDataStudio: () => void;
  onGoToSimulator: () => void;
}

export const MlLabPage: React.FC<MlLabPageProps> = ({
  preprocessed,
  hyperparams,
  model,
  onChangeHyperparams,
  onTrain,
  onGoToDataStudio,
  onGoToSimulator,
}) => {
  const [threshold, setThreshold] = useState(0.5);

  const metrics = useMemo(
    () => computeMetricsAtThreshold(model.testPredictions, threshold),
    [model.testPredictions, threshold]
  );
  const roc = useMemo(() => computeRocCurve(model.testPredictions), [model.testPredictions]);
  const distribution = useMemo(
    () => computeProbabilityDistribution(model.testPredictions),
    [model.testPredictions]
  );

  if (!preprocessed) {
    return (
      <div className="rounded-3xl bg-white dark:bg-[#111827] border border-stone-200 dark:border-slate-800 p-10 text-center">
        <FlaskConical className="w-9 h-9 text-[#0F4C5C] dark:text-teal-400 mx-auto mb-3" />
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Avval Ma&apos;lumot studiyasida tayyorlashni tasdiqlang
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Logistik Regressiya modelini o&apos;qitish uchun tayyorlangan MMT ma&apos;lumotlari zarur.
        </p>
        <button
          onClick={onGoToDataStudio}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C5C] hover:bg-[#136074] text-white text-sm font-semibold"
        >
          <span>Ma&apos;lumot studiyasiga o&apos;tish</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            ML Laboratoriya: O&apos;qitish va Sifat nazorati
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gradient Descent orqali modelni o&apos;qiting, ROC-AUC va qaror chegarasini bir joyda tekshiring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onChangeHyperparams(DEFAULT_HYPERPARAMS)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tiklash</span>
          </button>

          <button
            onClick={onTrain}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F4C5C] hover:bg-[#136074] dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 text-sm font-bold shadow-sm"
          >
            <Play className="w-4 h-4 fill-current text-amber-300 dark:text-slate-950" />
            <span>Modelni O&apos;qitish</span>
          </button>

          {!model.isBaseline && (
            <button
              onClick={onGoToSimulator}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold"
            >
              <span>Simulyatorga o&apos;tish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Hyperparameters Control Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-600 dark:text-slate-300">Train / Test</span>
            <span className="mono-num text-[#0F4C5C] dark:text-teal-400">
              {Math.round(hyperparams.trainRatio * 100)}% / {Math.round((1 - hyperparams.trainRatio) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={60}
            max={90}
            step={5}
            value={Math.round(hyperparams.trainRatio * 100)}
            onChange={(e) =>
              onChangeHyperparams({ ...hyperparams, trainRatio: Number(e.target.value) / 100 })
            }
            className="w-full mizan-slider"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            Learning Rate (α)
          </label>
          <select
            value={hyperparams.learningRate}
            onChange={(e) =>
              onChangeHyperparams({ ...hyperparams, learningRate: Number(e.target.value) })
            }
            className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900 text-xs mono-num"
          >
            <option value={0.02}>0.02 (sekin)</option>
            <option value={0.05}>0.05 (o&apos;rtacha)</option>
            <option value={0.12}>0.12 (optimal)</option>
            <option value={0.25}>0.25 (tezkor)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            L2 Regulyarizatsiya (λ)
          </label>
          <select
            value={hyperparams.l2Lambda}
            onChange={(e) =>
              onChangeHyperparams({ ...hyperparams, l2Lambda: Number(e.target.value) })
            }
            className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900 text-xs mono-num"
          >
            <option value={0}>0.00</option>
            <option value={0.01}>0.01 (optimal)</option>
            <option value={0.05}>0.05</option>
            <option value={0.1}>0.10</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-600 dark:text-slate-300">Epoxalar</span>
            <span className="mono-num text-[#0F4C5C] dark:text-teal-400">{hyperparams.epochs}</span>
          </div>
          <input
            type="range"
            min={100}
            max={800}
            step={50}
            value={hyperparams.epochs}
            onChange={(e) => onChangeHyperparams({ ...hyperparams, epochs: Number(e.target.value) })}
            className="w-full mizan-slider"
          />
        </div>
      </div>

      {/* Metrics & Threshold Ribbon (once trained) */}
      {!model.isBaseline && model.testPredictions.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Test to&apos;plami diagnostikasi ({model.testCount} ta MMT) · Oxirgi o&apos;qitish: {model.trainedAt}
            </div>
            <div className="flex items-center gap-3 min-w-[240px]">
              <span className="text-xs font-semibold text-slate-500">Chegara:</span>
              <input
                type="range"
                min={15}
                max={85}
                value={Math.round(threshold * 100)}
                onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                className="flex-1 mizan-slider"
              />
              <span className="mono-num text-xs font-extrabold text-[#0F4C5C] dark:text-teal-400 w-9 text-right">
                {Math.round(threshold * 100)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Accuracy', val: `${(metrics.accuracy * 100).toFixed(1)}%` },
              { label: 'Precision', val: `${(metrics.precision * 100).toFixed(1)}%` },
              { label: 'Recall', val: `${(metrics.recall * 100).toFixed(1)}%` },
              { label: 'F1-Score', val: `${(metrics.f1 * 100).toFixed(1)}%` },
              { label: 'ROC-AUC', val: roc.auc.toFixed(3), accent: true },
            ].map((m) => (
              <div
                key={m.label}
                className={`rounded-xl p-3.5 border ${
                  m.accent
                    ? 'bg-teal-50/80 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/30'
                    : 'bg-[#FAF9F6] dark:bg-slate-900/70 border-stone-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.label}</div>
                <div
                  className={`mono-num text-xl font-extrabold mt-0.5 ${
                    m.accent
                      ? 'text-[#0F4C5C] dark:text-teal-300'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {m.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid: Log-Loss + ROC Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Log-Loss konvergentsiyasi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Train: <span className="mono-num font-bold">{model.finalTrainLoss.toFixed(4)}</span> · Test:{' '}
                <span className="mono-num font-bold">{model.finalTestLoss.toFixed(4)}</span>
              </p>
            </div>
          </div>

          <div className="h-[240px]">
            {model.lossHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={model.lossHistory} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.2} />
                  <XAxis dataKey="epoch" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="trainLoss" name="Train Loss" stroke="#0D9488" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="testLoss" name="Test Loss" stroke="#D97706" strokeWidth={2.5} strokeDasharray="5 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-xl border border-dashed border-stone-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-500">
                Grafik uchun &ldquo;Modelni O&apos;qitish&rdquo; tugmasini bosing
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">ROC egri chizig&apos;i</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">TPR vs FPR (test to&apos;plami)</p>
            </div>
            {!model.isBaseline && (
              <span className="mono-num text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25">
                AUC = {roc.auc.toFixed(3)}
              </span>
            )}
          </div>

          <div className="h-[240px]">
            {!model.isBaseline ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roc.points} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.2} />
                  <XAxis dataKey="fpr" type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis dataKey="tpr" type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, 'TPR']}
                    labelFormatter={(l) => `FPR: ${l}%`}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#94A3B8" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="tpr" stroke="#0F4C5C" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-xl border border-dashed border-stone-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-500">
                Model o&apos;qitilgandan so&apos;ng ROC egri chizig&apos;i chiqadi
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confusion Matrix + Probability Distribution */}
      {!model.isBaseline && model.testPredictions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Adashish matritsasi
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/25 p-4">
                <div className="text-[11px] font-bold text-[#0F4C5C] dark:text-teal-300">TN (0→0)</div>
                <div className="mono-num text-2xl font-extrabold text-[#0F4C5C] dark:text-teal-300 mt-1">
                  {metrics.tn}
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 p-4">
                <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300">FP (0→1)</div>
                <div className="mono-num text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
                  {metrics.fp}
                </div>
              </div>
              <div className="rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 p-4">
                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">FN (1→0)</div>
                <div className="mono-num text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
                  {metrics.fn}
                </div>
              </div>
              <div className="rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/25 p-4">
                <div className="text-[11px] font-bold text-[#0F4C5C] dark:text-teal-300">TP (1→1)</div>
                <div className="mono-num text-2xl font-extrabold text-[#0F4C5C] dark:text-teal-300 mt-1">
                  {metrics.tp}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#111827] border border-stone-200/90 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Ehtimolliklar taqsimoti
            </h2>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.2} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="#64748B" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#64748B" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      backgroundColor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="class0" name="Cheklangan (0)" fill="#94A3B8" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="class1" name="Yuqori ta'sir (1)" fill="#0D9488" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
