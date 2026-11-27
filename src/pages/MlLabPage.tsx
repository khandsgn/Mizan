import React, { useMemo, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
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
      <div className="bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px] p-8">
        <div className="mono-num text-xs text-[#5A6065] uppercase">03-bo&apos;lim · Ekonometrik baholash</div>
        <h2 className="font-display text-xl font-bold mt-1">
          Ma&apos;lumotlar hali tayyorlanmagan
        </h2>
        <p className="text-xs text-[#5A6065] dark:text-slate-400 mt-1">
          Logistik regressiya parametrlarini baholashdan oldin 02-bo&apos;limda ma&apos;lumotlarni yuklab, transformatsiyani tasdiqlang.
        </p>
        <button
          onClick={onGoToDataStudio}
          className="mt-4 px-4 py-2 rounded-[3px] bg-[#0F5338] text-white text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <span>02. Ma&apos;lumotlar bazasiga o&apos;tish</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D5D3CC] dark:border-[#222630] pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="mono-num text-[11px] uppercase tracking-widest text-[#5A6065] dark:text-slate-400">
            03-bo&apos;lim · Logistik Regressiya (L2 Regulyarizatsiya)
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111315] dark:text-white mt-1">
            Modelni o&apos;qitish va diagnostika
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onChangeHyperparams(DEFAULT_HYPERPARAMS)}
            className="px-3.5 py-2 rounded-[3px] border border-[#C5C2B8] dark:border-[#2C3240] bg-white dark:bg-[#151921] text-xs font-medium inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Standart</span>
          </button>

          <button
            onClick={onTrain}
            className="px-4 py-2 rounded-[3px] bg-[#0F5338] hover:bg-[#0B3E2A] text-white text-xs font-semibold"
          >
            Gradient Descentni ishga tushirish
          </button>

          {!model.isBaseline && (
            <button
              onClick={onGoToSimulator}
              className="px-4 py-2 rounded-[3px] bg-[#111315] dark:bg-white text-white dark:text-[#111315] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>04. Ssenariy kalkulyatori</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hyperparameter Strip */}
      <div className="bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px] p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span>Train / Test taqsimoti</span>
            <span className="mono-num">
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
          <label className="block text-xs font-semibold mb-1.5">Qadam tezligi (α)</label>
          <select
            value={hyperparams.learningRate}
            onChange={(e) =>
              onChangeHyperparams({ ...hyperparams, learningRate: Number(e.target.value) })
            }
            className="w-full px-3 py-1.5 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] bg-[#FAF9F5] dark:bg-[#151921] text-xs mono-num"
          >
            <option value={0.02}>0.02</option>
            <option value={0.05}>0.05</option>
            <option value={0.12}>0.12 (standart)</option>
            <option value={0.25}>0.25</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">L2 jarima koeffitsiyenti (λ)</label>
          <select
            value={hyperparams.l2Lambda}
            onChange={(e) =>
              onChangeHyperparams({ ...hyperparams, l2Lambda: Number(e.target.value) })
            }
            className="w-full px-3 py-1.5 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] bg-[#FAF9F5] dark:bg-[#151921] text-xs mono-num"
          >
            <option value={0}>0.00</option>
            <option value={0.01}>0.01 (standart)</option>
            <option value={0.05}>0.05</option>
            <option value={0.1}>0.10</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span>Iteratsiyalar (Epoxa)</span>
            <span className="mono-num">{hyperparams.epochs}</span>
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

      {/* Diagnostic Readout Strip */}
      {!model.isBaseline && model.testPredictions.length > 0 && (
        <div className="bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px]">
          <div className="px-5 py-3 border-b border-[#E6E4DD] dark:border-[#1E222B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold">
              Test tanlamasi (n = {model.testCount}) · Klassifikatsiya chegarasi (Threshold):
            </span>
            <div className="flex items-center gap-3 min-w-[240px]">
              <input
                type="range"
                min={15}
                max={85}
                value={Math.round(threshold * 100)}
                onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                className="flex-1 mizan-slider"
              />
              <span className="mono-num text-xs font-bold w-10 text-right">
                {Math.round(threshold * 100)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E6E4DD] dark:divide-[#1E222B]">
            {[
              { label: 'Accuracy', val: `${(metrics.accuracy * 100).toFixed(1)}%` },
              { label: 'Precision', val: `${(metrics.precision * 100).toFixed(1)}%` },
              { label: 'Recall', val: `${(metrics.recall * 100).toFixed(1)}%` },
              { label: 'F1-Score', val: `${(metrics.f1 * 100).toFixed(1)}%` },
              { label: 'ROC-AUC', val: roc.auc.toFixed(3), highlight: true },
            ].map((m) => (
              <div key={m.label} className="p-4">
                <div className="text-[11px] text-[#5A6065] dark:text-slate-400">{m.label}</div>
                <div
                  className={`mono-num text-xl font-bold mt-1 ${
                    m.highlight ? 'text-[#0F5338] dark:text-emerald-400' : ''
                  }`}
                >
                  {m.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts: Log-Loss + ROC */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold">Log-Loss konvergentsiyasi</h2>
              <p className="text-xs text-[#5A6065] mono-num mt-0.5">
                Train: {model.finalTrainLoss.toFixed(4)} | Test: {model.finalTestLoss.toFixed(4)}
              </p>
            </div>
          </div>
          <div className="h-[230px]">
            {model.lossHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={model.lossHistory} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#D5D3CC" strokeOpacity={0.5} />
                  <XAxis dataKey="epoch" tick={{ fontSize: 11 }} stroke="#5A6065" />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#5A6065" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '2px',
                      border: '1px solid #262B36',
                      backgroundColor: '#11141A',
                      color: '#EAECEF',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="trainLoss" name="Train Loss" stroke="#0F5338" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="testLoss" name="Test Loss" stroke="#B45309" strokeWidth={2} strokeDasharray="4 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full border border-dashed border-[#D5D3CC] dark:border-[#262B36] flex items-center justify-center text-xs text-[#5A6065]">
                &ldquo;Gradient Descentni ishga tushirish&rdquo; tugmasini bosing
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold">ROC egri chizig&apos;i</h2>
              <p className="text-xs text-[#5A6065] mt-0.5">Sezgirlik (TPR) va yolg&apos;on musbat (FPR)</p>
            </div>
            {!model.isBaseline && (
              <span className="mono-num text-xs font-bold text-[#0F5338] dark:text-emerald-400">
                AUC = {roc.auc.toFixed(3)}
              </span>
            )}
          </div>
          <div className="h-[230px]">
            {!model.isBaseline ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roc.points} margin={{ top: 6, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#D5D3CC" strokeOpacity={0.5} />
                  <XAxis dataKey="fpr" type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="#5A6065" />
                  <YAxis dataKey="tpr" type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} stroke="#5A6065" />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, 'TPR']}
                    labelFormatter={(l) => `FPR: ${l}%`}
                    contentStyle={{
                      borderRadius: '2px',
                      border: '1px solid #262B36',
                      backgroundColor: '#11141A',
                      color: '#EAECEF',
                      fontSize: '12px',
                    }}
                  />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#94A3B8" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="tpr" stroke="#0F5338" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full border border-dashed border-[#D5D3CC] dark:border-[#262B36] flex items-center justify-center text-xs text-[#5A6065]">
                Model o&apos;qitilgandan so&apos;ng hisoblanadi
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confusion Matrix Table + Distribution */}
      {!model.isBaseline && model.testPredictions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px] p-5">
            <h2 className="text-sm font-bold mb-3">Adashish matritsasi (Confusion Matrix)</h2>
            <table className="w-full text-xs border border-[#E6E4DD] dark:border-[#1E222B]">
              <thead>
                <tr className="bg-[#FAF9F5] dark:bg-[#151921] border-b border-[#E6E4DD] dark:border-[#1E222B]">
                  <th className="p-2.5 text-left">Haqiqiy \ Bashorat</th>
                  <th className="p-2.5 text-right mono-num">ŷ = 0</th>
                  <th className="p-2.5 text-right mono-num">ŷ = 1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD] dark:divide-[#1E222B] mono-num">
                <tr>
                  <td className="p-3 font-sans font-semibold">y = 0 (Cheklangan)</td>
                  <td className="p-3 text-right font-bold text-[#0F5338] dark:text-emerald-400">
                    TN = {metrics.tn}
                  </td>
                  <td className="p-3 text-right text-amber-700 dark:text-amber-400">
                    FP = {metrics.fp}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-sans font-semibold">y = 1 (Yuqori)</td>
                  <td className="p-3 text-right text-rose-700 dark:text-rose-400">
                    FN = {metrics.fn}
                  </td>
                  <td className="p-3 text-right font-bold text-[#0F5338] dark:text-emerald-400">
                    TP = {metrics.tp}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-[#11141A] border border-[#D5D3CC] dark:border-[#222630] rounded-[3px] p-5">
            <h2 className="text-sm font-bold mb-3">Ehtimolliklar guruhi bo&apos;yicha taqsimot</h2>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 4, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#D5D3CC" strokeOpacity={0.5} />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="#5A6065" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#5A6065" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '2px',
                      border: '1px solid #262B36',
                      backgroundColor: '#11141A',
                      color: '#EAECEF',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="class0" name="y = 0" fill="#94A3B8" />
                  <Bar dataKey="class1" name="y = 1" fill="#0F5338" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
