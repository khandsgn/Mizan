export type TabId =
  | 'overview'
  | 'studio-data'
  | 'ml-lab'
  | 'simulator'
  | 'reports';

export type Region =
  | 'Toshkent'
  | "Farg'ona vodiysi"
  | 'Samarqand'
  | 'Buxoro'
  | 'Qashqadaryo';

export type IslamicProduct = 'Murabaha' | 'Ijara' | 'Salam' | 'Musharaka';

export interface RawRecord {
  id: string;
  /** Shariatga mos xizmat talabi (%) - 10..95 */
  shariatTalabi: number | null;
  /** Raqamlashtirish & BNPL tayyorligi (ball) - 0..100 */
  raqamlashtirish: number | null;
  /** Ustav kapitali (mlrd so'm) - 5..80 (50 mlrd = islomiy mikromoliya banki chegarasi) */
  kapitalHajmi: number | null;
  /** Soliq va operatsion to'siq indeksi (ball) - 1..10 */
  soliqYuklamasi: number | null;
  hudud: Region;
  mahsulotTuri: IslamicProduct;
  /** Target: 1 = Yuqori 5 yillik ta'sir / Islomiy transformatsiya, 0 = Cheklangan ta'sir */
  yuqoriTasir: 0 | 1;
}

export interface CleanRecord {
  id: string;
  shariatTalabi: number;
  raqamlashtirish: number;
  kapitalHajmi: number;
  soliqYuklamasi: number;
  hudud: Region;
  mahsulotTuri: IslamicProduct;
  yuqoriTasir: 0 | 1;
}

export type ImputationStrategy = 'median' | 'mean' | 'mode';
export type EncodingStrategy = 'onehot' | 'label';
export type ScalingStrategy = 'zscore' | 'minmax';

export interface PreprocessingConfig {
  imputeEnabled: boolean;
  imputeStrategy: ImputationStrategy;
  encodeEnabled: boolean;
  encodeStrategy: EncodingStrategy;
  scaleEnabled: boolean;
  scaleStrategy: ScalingStrategy;
}

export interface FeatureStats {
  means: Record<string, number>;
  stds: Record<string, number>;
  mins: Record<string, number>;
  maxs: Record<string, number>;
  medians: Record<string, number>;
}

export interface ProcessedSample {
  id: string;
  raw: CleanRecord;
  features: number[];
  target: 0 | 1;
}

export interface PreprocessedDataset {
  featureNames: string[];
  featureLabels: string[];
  samples: ProcessedSample[];
  stats: FeatureStats;
  imputedCount: number;
  appliedAt: string;
}

export interface TrainingHyperparams {
  trainRatio: number; // 0.6 - 0.9
  learningRate: number; // 0.02, 0.05, 0.12, 0.25
  l2Lambda: number; // 0, 0.01, 0.05, 0.1
  epochs: number; // 100 - 800
}

export interface LossPoint {
  epoch: number;
  trainLoss: number;
  testLoss: number;
}

export interface PredictionRow {
  id: string;
  raw: CleanRecord;
  actual: 0 | 1;
  prob: number;
  z: number;
}

export interface TrainedModel {
  isBaseline: boolean;
  featureNames: string[];
  featureLabels: string[];
  weights: number[];
  bias: number;
  stats: FeatureStats;
  preprocessingConfig: PreprocessingConfig;
  hyperparams: TrainingHyperparams;
  lossHistory: LossPoint[];
  trainCount: number;
  testCount: number;
  initialLoss: number;
  finalTrainLoss: number;
  finalTestLoss: number;
  rocAuc: number;
  testPredictions: PredictionRow[];
  trainedAt: string;
}

export interface SimulatorInput {
  name: string;
  shariatTalabi: number;
  raqamlashtirish: number;
  kapitalHajmi: number;
  soliqYuklamasi: number;
  hudud: Region;
  mahsulotTuri: IslamicProduct;
}

export interface FeatureContribution {
  featureName: string;
  label: string;
  rawValue: string;
  scaledValue: number;
  weight: number;
  contribution: number;
}

export interface PredictionResult {
  probability: number; // 0..1
  z: number;
  impactLevel: 'Yuqori' | "O'rtacha" | 'Past';
  contributions: FeatureContribution[];
  yearlyTrajectory: { year: number; sharePct: number; baselinePct: number; optimisticPct: number }[];
  recommendation: string;
}

export interface SavedReport {
  id: string;
  createdAt: string;
  name: string;
  shariatTalabi: number;
  raqamlashtirish: number;
  kapitalHajmi: number;
  soliqYuklamasi: number;
  hudud: Region;
  mahsulotTuri: IslamicProduct;
  probability: number;
  impactLevel: 'Yuqori' | "O'rtacha" | 'Past';
  projected2031Share: number;
}
