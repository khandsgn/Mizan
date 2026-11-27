import { IslamicProduct, RawRecord, Region, SavedReport } from '../types';

export const REGIONS: Region[] = [
  'Toshkent',
  "Farg'ona vodiysi",
  'Samarqand',
  'Buxoro',
  'Qashqadaryo',
];

export const PRODUCTS: IslamicProduct[] = ['Murabaha', 'Ijara', 'Salam', 'Musharaka'];

// Deterministic Mulberry32 PRNG so synthetic dataset & splits are reproducible
function createRng(seed: number) {
  let a = seed;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

export function generateSyntheticDataset(count = 500): RawRecord[] {
  const rand = createRng(20261127);
  const records: RawRecord[] = [];

  for (let i = 0; i < count; i++) {
    const rRoll = rand();
    const hudud: Region =
      rRoll < 0.28
        ? 'Toshkent'
        : rRoll < 0.56
          ? "Farg'ona vodiysi"
          : rRoll < 0.74
            ? 'Samarqand'
            : rRoll < 0.87
              ? 'Buxoro'
              : 'Qashqadaryo';

    const pRoll = rand();
    const mahsulotTuri: IslamicProduct =
      pRoll < 0.46
        ? 'Murabaha'
        : pRoll < 0.72
          ? 'Ijara'
          : pRoll < 0.88
            ? 'Salam'
            : 'Musharaka';

    // Realistic regional tendencies in Uzbekistan
    const baseDemand =
      hudud === "Farg'ona vodiysi"
        ? 68
        : hudud === 'Samarqand'
          ? 60
          : hudud === 'Qashqadaryo'
            ? 56
            : hudud === 'Buxoro'
              ? 54
              : 52;
    const shariatTalabi = Math.round(clamp(baseDemand + (rand() - 0.5) * 44, 15, 95));

    const baseDigital =
      hudud === 'Toshkent' ? 74 : hudud === 'Samarqand' ? 58 : hudud === 'Buxoro' ? 54 : 48;
    const raqamlashtirish = Math.round(clamp(baseDigital + (rand() - 0.5) * 56, 8, 98));

    const baseCapital = hudud === 'Toshkent' ? 46 : 28;
    const kapitalHajmi = Math.round(clamp(baseCapital + (rand() - 0.42) * 56, 5, 80));

    const soliqYuklamasi = Number(clamp(2 + rand() * 7.5, 1, 10).toFixed(1));

    // Ground-truth latent logit for 5-year High Adoption / Transformation (2026-2031)
    const regionBonus =
      hudud === "Farg'ona vodiysi"
        ? 0.55
        : hudud === 'Toshkent'
          ? 0.45
          : hudud === 'Samarqand'
            ? 0.2
            : hudud === 'Buxoro'
              ? 0.05
              : -0.1;

    const productBonus =
      mahsulotTuri === 'Murabaha'
        ? 0.65
        : mahsulotTuri === 'Ijara'
          ? 0.3
          : mahsulotTuri === 'Salam'
            ? -0.15
            : -0.45;

    const z =
      -3.15 +
      0.048 * (shariatTalabi - 48) +
      0.036 * (raqamlashtirish - 50) +
      0.032 * (kapitalHajmi - 32) -
      0.46 * (soliqYuklamasi - 5.2) +
      regionBonus +
      productBonus +
      (rand() - 0.5) * 1.45;

    const prob = sigmoid(z);
    const yuqoriTasir: 0 | 1 = rand() < prob ? 1 : 0;

    records.push({
      id: `MMT-${1001 + i}`,
      shariatTalabi,
      raqamlashtirish,
      kapitalHajmi,
      soliqYuklamasi,
      hudud,
      mahsulotTuri,
      yuqoriTasir,
    });
  }

  // Inject ~24 realistic missing values across numeric columns for the Preprocessing demo
  const missingCols: Array<'shariatTalabi' | 'raqamlashtirish' | 'kapitalHajmi' | 'soliqYuklamasi'> = [
    'shariatTalabi',
    'raqamlashtirish',
    'kapitalHajmi',
    'soliqYuklamasi',
  ];
  for (let m = 0; m < 24; m++) {
    const idx = Math.floor(rand() * count);
    const col = missingCols[m % missingCols.length];
    records[idx][col] = null;
  }

  return records;
}

export function countMissingCells(records: RawRecord[]): number {
  let missing = 0;
  for (const r of records) {
    if (r.shariatTalabi === null) missing++;
    if (r.raqamlashtirish === null) missing++;
    if (r.kapitalHajmi === null) missing++;
    if (r.soliqYuklamasi === null) missing++;
  }
  return missing;
}

export function parseCsvToRecords(csvText: string): RawRecord[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const records: RawRecord[] = [];

  const getCol = (cols: string[], names: string[], fallbackIdx: number) => {
    for (const n of names) {
      const idx = headers.indexOf(n);
      if (idx !== -1 && cols[idx] !== undefined) return cols[idx].trim();
    }
    return cols[fallbackIdx]?.trim() ?? '';
  };

  const toNumOrNull = (val: string) => {
    if (!val || val === 'null' || val === 'NaN' || val === '-') return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 6) continue;

    const id = getCol(cols, ['id', 'mmt_id'], 0) || `CSV-${1000 + i}`;
    const shariatTalabi = toNumOrNull(
      getCol(cols, ['shariattalabi', 'shariat_talabi', 'talab'], 1)
    );
    const raqamlashtirish = toNumOrNull(
      getCol(cols, ['raqamlashtirish', 'digital', 'bnpl'], 2)
    );
    const kapitalHajmi = toNumOrNull(
      getCol(cols, ['kapitalhajmi', 'kapital_hajmi', 'kapital'], 3)
    );
    const soliqYuklamasi = toNumOrNull(
      getCol(cols, ['soliqyuklamasi', 'soliq_yuklamasi', 'tosiq'], 4)
    );

    const rawRegion = getCol(cols, ['hudud', 'region'], 5);
    const hudud: Region = REGIONS.includes(rawRegion as Region)
      ? (rawRegion as Region)
      : 'Toshkent';

    const rawProd = getCol(cols, ['mahsulotturi', 'mahsulot_turi', 'mahsulot'], 6);
    const mahsulotTuri: IslamicProduct = PRODUCTS.includes(rawProd as IslamicProduct)
      ? (rawProd as IslamicProduct)
      : 'Murabaha';

    const targetRaw = getCol(cols, ['yuqoritasir', 'yuqori_tasir', 'target'], 7);
    const yuqoriTasir: 0 | 1 = targetRaw === '1' || targetRaw.toLowerCase() === 'true' ? 1 : 0;

    records.push({
      id,
      shariatTalabi,
      raqamlashtirish,
      kapitalHajmi,
      soliqYuklamasi,
      hudud,
      mahsulotTuri,
      yuqoriTasir,
    });
  }

  return records;
}

export function recordsToCsv(records: RawRecord[]): string {
  const header =
    'id,shariat_talabi,raqamlashtirish,kapital_hajmi,soliq_yuklamasi,hudud,mahsulot_turi,yuqori_tasir';
  const rows = records.map((r) =>
    [
      r.id,
      r.shariatTalabi ?? '',
      r.raqamlashtirish ?? '',
      r.kapitalHajmi ?? '',
      r.soliqYuklamasi ?? '',
      r.hudud,
      r.mahsulotTuri,
      r.yuqoriTasir,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export function reportsToCsv(reports: SavedReport[]): string {
  const header =
    'id,vaqt,nomi,shariat_talabi_pct,raqamlashtirish,kapital_mlrd,soliq_tosiq,hudud,mahsulot,ehtimollik_pct,daraja,prognoz_2031_ulush_pct';
  const rows = reports.map((r) =>
    [
      r.id,
      `"${r.createdAt}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      r.shariatTalabi,
      r.raqamlashtirish,
      r.kapitalHajmi,
      r.soliqYuklamasi,
      `"${r.hudud}"`,
      r.mahsulotTuri,
      (r.probability * 100).toFixed(1),
      r.impactLevel,
      r.projected2031Share.toFixed(1),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
