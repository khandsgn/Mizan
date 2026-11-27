import {
  CleanRecord,
  FeatureContribution,
  FeatureStats,
  PredictionResult,
  PredictionRow,
  PreprocessedDataset,
  PreprocessingConfig,
  RawRecord,
  SimulatorInput,
  TrainedModel,
  TrainingHyperparams,
} from '../types';
import { PRODUCTS, REGIONS } from './dataset';

export const DEFAULT_PREPROCESSING: PreprocessingConfig = {
  imputeEnabled: true,
  imputeStrategy: 'median',
  encodeEnabled: true,
  encodeStrategy: 'onehot',
  scaleEnabled: true,
  scaleStrategy: 'zscore',
};

export const DEFAULT_HYPERPARAMS: TrainingHyperparams = {
  trainRatio: 0.8,
  learningRate: 0.12,
  l2Lambda: 0.01,
  epochs: 350,
};

export const DEFAULT_SIMULATOR_INPUT: SimulatorInput = {
  name: "Farg'ona Islomiy MMT #01",
  shariatTalabi: 72,
  raqamlashtirish: 68,
  kapitalHajmi: 52,
  soliqYuklamasi: 4.5,
  hudud: "Farg'ona vodiysi",
  mahsulotTuri: 'Murabaha',
};

const NUMERIC_KEYS = [
  'shariatTalabi',
  'raqamlashtirish',
  'kapitalHajmi',
  'soliqYuklamasi',
] as const;

const NUMERIC_LABELS: Record<(typeof NUMERIC_KEYS)[number], string> = {
  shariatTalabi: 'Shariatga mos talab (%)',
  raqamlashtirish: 'Raqamlashtirish & BNPL',
  kapitalHajmi: 'Ustav kapitali (mlrd)',
  soliqYuklamasi: "Soliq va operatsion to'siq",
};

export function sigmoid(z: number): number {
  if (z > 35) return 1 - 1e-15;
  if (z < -35) return 1e-15;
  return 1 / (1 + Math.exp(-z));
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function mode(values: number[]): number {
  if (!values.length) return 0;
  const freq = new Map<number, number>();
  let bestVal = values[0];
  let bestCount = 0;
  for (const v of values) {
    const key = Math.round(v);
    const c = (freq.get(key) ?? 0) + 1;
    freq.set(key, c);
    if (c > bestCount) {
      bestCount = c;
      bestVal = key;
    }
  }
  return bestVal;
}

function getFeatureMetadata(config: PreprocessingConfig): {
  featureNames: string[];
  featureLabels: string[];
} {
  const featureNames: string[] = [...NUMERIC_KEYS];
  const featureLabels: string[] = NUMERIC_KEYS.map((k) => NUMERIC_LABELS[k]);

  if (config.encodeEnabled) {
    if (config.encodeStrategy === 'onehot') {
      for (const reg of REGIONS) {
        featureNames.push(`hudud_${reg}`);
        featureLabels.push(`Hudud: ${reg}`);
      }
      for (const prod of PRODUCTS) {
        featureNames.push(`mahsulot_${prod}`);
        featureLabels.push(`Mahsulot: ${prod}`);
      }
    } else {
      featureNames.push('hudud_code', 'mahsulot_code');
      featureLabels.push('Hudud (kodlangan)', 'Mahsulot turi (kodlangan)');
    }
  }

  return { featureNames, featureLabels };
}

function encodeRecord(
  r: CleanRecord,
  config: PreprocessingConfig,
  stats: FeatureStats
): number[] {
  const scaleNum = (key: string, val: number): number => {
    if (!config.scaleEnabled) return val;
    if (config.scaleStrategy === 'zscore') {
      const sd = stats.stds[key] || 1;
      return (val - (stats.means[key] ?? 0)) / sd;
    } else {
      const min = stats.mins[key] ?? 0;
      const max = stats.maxs[key] ?? 1;
      return max === min ? 0 : (val - min) / (max - min);
    }
  };

  const vec: number[] = [
    scaleNum('shariatTalabi', r.shariatTalabi),
    scaleNum('raqamlashtirish', r.raqamlashtirish),
    scaleNum('kapitalHajmi', r.kapitalHajmi),
    scaleNum('soliqYuklamasi', r.soliqYuklamasi),
  ];

  if (config.encodeEnabled) {
    if (config.encodeStrategy === 'onehot') {
      for (const reg of REGIONS) {
        vec.push(r.hudud === reg ? 1 : 0);
      }
      for (const prod of PRODUCTS) {
        vec.push(r.mahsulotTuri === prod ? 1 : 0);
      }
    } else {
      const rCode = REGIONS.indexOf(r.hudud);
      const pCode = PRODUCTS.indexOf(r.mahsulotTuri);
      vec.push(
        config.scaleEnabled ? rCode / (REGIONS.length - 1) : rCode,
        config.scaleEnabled ? pCode / (PRODUCTS.length - 1) : pCode
      );
    }
  }

  return vec;
}

export function preprocessDataset(
  rawRecords: RawRecord[],
  config: PreprocessingConfig
): PreprocessedDataset {
  const colValues: Record<string, number[]> = {};
  for (const k of NUMERIC_KEYS) {
    colValues[k] = rawRecords
      .map((r) => r[k])
      .filter((v): v is number => v !== null && Number.isFinite(v));
  }

  const fillValues: Record<string, number> = {};
  for (const k of NUMERIC_KEYS) {
    fillValues[k] =
      config.imputeStrategy === 'mean'
        ? mean(colValues[k])
        : config.imputeStrategy === 'mode'
          ? mode(colValues[k])
          : median(colValues[k]);
  }

  let imputedCount = 0;
  const cleanRecords: CleanRecord[] = [];

  for (const r of rawRecords) {
    const hasMissing =
      r.shariatTalabi === null ||
      r.raqamlashtirish === null ||
      r.kapitalHajmi === null ||
      r.soliqYuklamasi === null;

    if (hasMissing && !config.imputeEnabled) {
      continue;
    }

    if (r.shariatTalabi === null) imputedCount++;
    if (r.raqamlashtirish === null) imputedCount++;
    if (r.kapitalHajmi === null) imputedCount++;
    if (r.soliqYuklamasi === null) imputedCount++;

    cleanRecords.push({
      id: r.id,
      shariatTalabi: Number((r.shariatTalabi ?? fillValues.shariatTalabi).toFixed(1)),
      raqamlashtirish: Number((r.raqamlashtirish ?? fillValues.raqamlashtirish).toFixed(1)),
      kapitalHajmi: Number((r.kapitalHajmi ?? fillValues.kapitalHajmi).toFixed(1)),
      soliqYuklamasi: Number((r.soliqYuklamasi ?? fillValues.soliqYuklamasi).toFixed(1)),
      hudud: r.hudud,
      mahsulotTuri: r.mahsulotTuri,
      yuqoriTasir: r.yuqoriTasir,
    });
  }

  const stats: FeatureStats = {
    means: {},
    stds: {},
    mins: {},
    maxs: {},
    medians: {},
  };

  for (const k of NUMERIC_KEYS) {
    const vals = cleanRecords.map((r) => r[k]);
    const m = mean(vals);
    const variance = vals.length
      ? vals.reduce((acc, v) => acc + (v - m) ** 2, 0) / vals.length
      : 1;
    stats.means[k] = m;
    stats.stds[k] = Math.sqrt(variance) || 1;
    stats.mins[k] = vals.length ? Math.min(...vals) : 0;
    stats.maxs[k] = vals.length ? Math.max(...vals) : 1;
    stats.medians[k] = median(vals);
  }

  const { featureNames, featureLabels } = getFeatureMetadata(config);
  const samples = cleanRecords.map((raw) => ({
    id: raw.id,
    raw,
    features: encodeRecord(raw, config, stats),
    target: raw.yuqoriTasir,
  }));

  return {
    featureNames,
    featureLabels,
    samples,
    stats,
    imputedCount,
    appliedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
  };
}

function computeLogLoss(
  samples: { features: number[]; target: 0 | 1 }[],
  weights: number[],
  bias: number
): number {
  if (!samples.length) return 0;
  let total = 0;
  for (const s of samples) {
    let z = bias;
    for (let j = 0; j < weights.length; j++) z += weights[j] * s.features[j];
    const p = sigmoid(z);
    total += -(s.target * Math.log(p) + (1 - s.target) * Math.log(1 - p));
  }
  return total / samples.length;
}

export function computeRocCurve(predictions: PredictionRow[]): {
  points: { fpr: number; tpr: number; threshold: number }[];
  auc: number;
} {
  const positives = predictions.filter((p) => p.actual === 1).length;
  const negatives = predictions.length - positives;
  if (positives === 0 || negatives === 0) {
    return {
      points: [
        { fpr: 0, tpr: 0, threshold: 1 },
        { fpr: 1, tpr: 1, threshold: 0 },
      ],
      auc: 0.5,
    };
  }

  const thresholds: number[] = [];
  for (let t = 100; t >= 0; t -= 4) thresholds.push(t / 100);

  const points = thresholds.map((th) => {
    let tp = 0;
    let fp = 0;
    for (const row of predictions) {
      if (row.prob >= th) {
        if (row.actual === 1) tp++;
        else fp++;
      }
    }
    return {
      fpr: Number(((fp / negatives) * 100).toFixed(1)),
      tpr: Number(((tp / positives) * 100).toFixed(1)),
      threshold: th,
    };
  });

  // Sort by FPR ascending for accurate trapezoidal AUC
  const sorted = [...points].sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
  let auc = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dx = (sorted[i].fpr - sorted[i - 1].fpr) / 100;
    const avgY = (sorted[i].tpr + sorted[i - 1].tpr) / 200;
    auc += dx * avgY;
  }

  return { points: sorted, auc: Number(Math.max(0, Math.min(1, auc)).toFixed(3)) };
}

export function computeMetricsAtThreshold(predictions: PredictionRow[], threshold: number) {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (const row of predictions) {
    const pred = row.prob >= threshold ? 1 : 0;
    if (pred === 1 && row.actual === 1) tp++;
    else if (pred === 0 && row.actual === 0) tn++;
    else if (pred === 1 && row.actual === 0) fp++;
    else fn++;
  }

  const total = predictions.length || 1;
  const accuracy = (tp + tn) / total;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return { tp, tn, fp, fn, accuracy, precision, recall, f1 };
}

export function computeProbabilityDistribution(predictions: PredictionRow[]) {
  const bins = [
    { range: '0–20%', min: 0, max: 0.2, class0: 0, class1: 0 },
    { range: '20–40%', min: 0.2, max: 0.4, class0: 0, class1: 0 },
    { range: '40–60%', min: 0.4, max: 0.6, class0: 0, class1: 0 },
    { range: '60–80%', min: 0.6, max: 0.8, class0: 0, class1: 0 },
    { range: '80–100%', min: 0.8, max: 1.01, class0: 0, class1: 0 },
  ];

  for (const row of predictions) {
    const b = bins.find((bin) => row.prob >= bin.min && row.prob < bin.max) ?? bins[4];
    if (row.actual === 1) b.class1++;
    else b.class0++;
  }

  return bins.map(({ range, class0, class1 }) => ({ range, class0, class1 }));
}

export function trainLogisticRegression(
  preprocessed: PreprocessedDataset,
  config: PreprocessingConfig,
  hyperparams: TrainingHyperparams
): TrainedModel {
  // Deterministic shuffle using simple index permutation
  const indexed = preprocessed.samples.map((s, idx) => ({
    s,
    key: ((idx * 2654435761) >>> 0) % 100000,
  }));
  indexed.sort((a, b) => a.key - b.key);
  const shuffled = indexed.map((x) => x.s);

  const splitIdx = Math.max(
    10,
    Math.min(shuffled.length - 5, Math.round(shuffled.length * hyperparams.trainRatio))
  );
  const trainSet = shuffled.slice(0, splitIdx);
  const testSet = shuffled.slice(splitIdx);

  const d = preprocessed.featureNames.length;
  const weights = new Array<number>(d).fill(0);
  let bias = 0;

  const lossHistory: { epoch: number; trainLoss: number; testLoss: number }[] = [];
  const step = Math.max(1, Math.floor(hyperparams.epochs / 25));

  const initialTrainLoss = computeLogLoss(trainSet, weights, bias);
  const initialTestLoss = computeLogLoss(testSet, weights, bias);
  lossHistory.push({
    epoch: 0,
    trainLoss: Number(initialTrainLoss.toFixed(4)),
    testLoss: Number(initialTestLoss.toFixed(4)),
  });

  const n = trainSet.length;
  for (let epoch = 1; epoch <= hyperparams.epochs; epoch++) {
    const gradW = new Array<number>(d).fill(0);
    let gradB = 0;

    for (let i = 0; i < n; i++) {
      const sample = trainSet[i];
      let z = bias;
      for (let j = 0; j < d; j++) z += weights[j] * sample.features[j];
      const err = sigmoid(z) - sample.target;
      gradB += err;
      for (let j = 0; j < d; j++) {
        gradW[j] += err * sample.features[j];
      }
    }

    bias -= hyperparams.learningRate * (gradB / n);
    for (let j = 0; j < d; j++) {
      const regTerm = hyperparams.l2Lambda * weights[j];
      weights[j] -= hyperparams.learningRate * (gradW[j] / n + regTerm);
    }

    if (epoch % step === 0 || epoch === hyperparams.epochs) {
      lossHistory.push({
        epoch,
        trainLoss: Number(computeLogLoss(trainSet, weights, bias).toFixed(4)),
        testLoss: Number(computeLogLoss(testSet, weights, bias).toFixed(4)),
      });
    }
  }

  const testPredictions: PredictionRow[] = testSet.map((s) => {
    let z = bias;
    for (let j = 0; j < d; j++) z += weights[j] * s.features[j];
    return {
      id: s.id,
      raw: s.raw,
      actual: s.target,
      z,
      prob: sigmoid(z),
    };
  });

  const { auc } = computeRocCurve(testPredictions);
  const lastLoss = lossHistory[lossHistory.length - 1];

  return {
    isBaseline: false,
    featureNames: preprocessed.featureNames,
    featureLabels: preprocessed.featureLabels,
    weights,
    bias,
    stats: preprocessed.stats,
    preprocessingConfig: config,
    hyperparams,
    lossHistory,
    trainCount: trainSet.length,
    testCount: testSet.length,
    initialLoss: Number(initialTrainLoss.toFixed(4)),
    finalTrainLoss: lastLoss.trainLoss,
    finalTestLoss: lastLoss.testLoss,
    rocAuc: auc,
    testPredictions,
    trainedAt: new Date().toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

export function createBaselineModel(): TrainedModel {
  const stats: FeatureStats = {
    means: {
      shariatTalabi: 58,
      raqamlashtirish: 56,
      kapitalHajmi: 34,
      soliqYuklamasi: 5.2,
    },
    stds: {
      shariatTalabi: 16,
      raqamlashtirish: 19,
      kapitalHajmi: 18,
      soliqYuklamasi: 2.1,
    },
    mins: { shariatTalabi: 15, raqamlashtirish: 8, kapitalHajmi: 5, soliqYuklamasi: 1 },
    maxs: { shariatTalabi: 95, raqamlashtirish: 98, kapitalHajmi: 80, soliqYuklamasi: 10 },
    medians: { shariatTalabi: 58, raqamlashtirish: 56, kapitalHajmi: 34, soliqYuklamasi: 5.2 },
  };

  const { featureNames, featureLabels } = getFeatureMetadata(DEFAULT_PREPROCESSING);
  const weights = [
    0.82, // shariatTalabi
    0.66, // raqamlashtirish
    0.58, // kapitalHajmi
    -0.88, // soliqYuklamasi
    0.34, // Toshkent
    0.46, // Farg'ona vodiysi
    0.16, // Samarqand
    0.04, // Buxoro
    -0.12, // Qashqadaryo
    0.54, // Murabaha
    0.26, // Ijara
    -0.14, // Salam
    -0.36, // Musharaka
  ];

  return {
    isBaseline: true,
    featureNames,
    featureLabels,
    weights,
    bias: -0.35,
    stats,
    preprocessingConfig: DEFAULT_PREPROCESSING,
    hyperparams: DEFAULT_HYPERPARAMS,
    lossHistory: [],
    trainCount: 0,
    testCount: 0,
    initialLoss: 0.6931,
    finalTrainLoss: 0.482,
    finalTestLoss: 0.511,
    rocAuc: 0,
    testPredictions: [],
    trainedAt: 'Bazaviy (oldindan sozlangan)',
  };
}

export function predictScenario(
  input: SimulatorInput,
  model: TrainedModel
): PredictionResult {
  const clean: CleanRecord = {
    id: 'SIM',
    shariatTalabi: input.shariatTalabi,
    raqamlashtirish: input.raqamlashtirish,
    kapitalHajmi: input.kapitalHajmi,
    soliqYuklamasi: input.soliqYuklamasi,
    hudud: input.hudud,
    mahsulotTuri: input.mahsulotTuri,
    yuqoriTasir: 0,
  };

  const vec = encodeRecord(clean, model.preprocessingConfig, model.stats);
  let z = model.bias;
  const contributions: FeatureContribution[] = [];

  for (let i = 0; i < model.featureNames.length; i++) {
    const fname = model.featureNames[i];
    const label = model.featureLabels[i];
    const scaledValue = vec[i] ?? 0;
    const weight = model.weights[i] ?? 0;
    const contribution = weight * scaledValue;
    z += contribution;

    let rawValue = '';
    if (fname === 'shariatTalabi') rawValue = `${input.shariatTalabi}%`;
    else if (fname === 'raqamlashtirish') rawValue = `${input.raqamlashtirish} ball`;
    else if (fname === 'kapitalHajmi') rawValue = `${input.kapitalHajmi} mlrd`;
    else if (fname === 'soliqYuklamasi') rawValue = `${input.soliqYuklamasi} / 10`;
    else if (fname.startsWith('hudud_')) rawValue = scaledValue === 1 ? 'Ha' : "Yo'q";
    else if (fname.startsWith('mahsulot_')) rawValue = scaledValue === 1 ? 'Ha' : "Yo'q";
    else if (fname === 'hudud_code') rawValue = input.hudud;
    else if (fname === 'mahsulot_code') rawValue = input.mahsulotTuri;

    contributions.push({
      featureName: fname,
      label,
      rawValue,
      scaledValue,
      weight,
      contribution,
    });
  }

  const probability = sigmoid(z);
  const impactLevel: 'Yuqori' | "O'rtacha" | 'Past' =
    probability >= 0.65 ? 'Yuqori' : probability >= 0.4 ? "O'rtacha" : 'Past';

  // Project 5-year (2026-2031) Islamic microfinance portfolio share (%)
  // Anchored to Uzbekistan's 2026 baseline (~4%) scaling up to 12%-44% by 2031
  const target2031 = 10 + probability * 34; // 10% to 44%
  const years = [2026, 2027, 2028, 2029, 2030, 2031];
  const baselineCurve = [4.0, 7.5, 12.0, 17.5, 22.5, 27.0];
  const optimisticCurve = [4.0, 9.5, 16.5, 24.5, 33.0, 41.5];

  const yearlyTrajectory = years.map((year, idx) => {
    const progress = idx / 5;
    // Slight S-curve adoption acceleration
    const eased = progress === 0 ? 0 : Math.pow(progress, 1.15);
    const sharePct = Number((4.0 + (target2031 - 4.0) * eased).toFixed(1));
    return {
      year,
      sharePct,
      baselinePct: baselineCurve[idx],
      optimisticPct: optimisticCurve[idx],
    };
  });

  // Tailored strategic recommendation in Uzbek
  let recommendation = '';
  if (impactLevel === 'Yuqori') {
    recommendation =
      input.kapitalHajmi >= 50
        ? "Ustav kapitali 50 mlrd so'mdan yuqori va talab kuchli — O'RQ-1026 va 2026-yilgi nizom asosida Islomiy mikromoliya bankiga transformatsiya qilish, raqamli Murabaha/Ijara hamda mudaraba depozitlarini ishga tushirish tavsiya etiladi."
        : "Islomiy mahsulotlarga o'tish salohiyati juda yuqori. Yaqin 2 yilda raqamli Murabaha (BNPL) portfelini kengaytirish va ustav kapitalini 50 mlrd so'mga yetkazish orqali Islomiy mikromoliya banki litsenziyasiga tayyorlanish maqsadga muvofiq.";
  } else if (impactLevel === "O'rtacha") {
    recommendation =
      input.soliqYuklamasi >= 6
        ? "O'sish salohiyati mavjud, biroq soliq va operatsion to'siqlar marjaga bosim o'tkazmoqda. Dastlab kam xarajatli raqamli Murabaha va autsorsing Shariat kengashi modeli orqali bosqichma-bosqich kirish tavsiya etiladi."
        : "O'rtacha ta'sir ssenariysi: raqamlashtirish va BNPL hamkorliklarini kuchaytirish (70+ ballga) hamda Hududdagi kichik biznes uchun Ijara/Murabaha paketlarini joriy etish orqali ulushni 25%+ darajaga olib chiqish mumkin.";
  } else {
    recommendation =
      "Joriy parametrlar bilan islom moliyasining 5 yillik ta'siri cheklangan qoladi. Avvalo operatsion/soliq to'siqlarini kamaytirish, AAOIFI standartlariga mos kadrlar tayyorlash va yuqori talabli mahsulot (Murabaha) bilan pilot loyiha boshlash lozim.";
  }

  return {
    probability,
    z,
    impactLevel,
    contributions,
    yearlyTrajectory,
    recommendation,
  };
}
