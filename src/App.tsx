import React, { useEffect, useState } from 'react';
import {
  PreprocessedDataset,
  PreprocessingConfig,
  RawRecord,
  Region,
  SavedReport,
  SimulatorInput,
  TabId,
  TrainedModel,
  TrainingHyperparams,
} from './types';
import { generateSyntheticDataset } from './lib/dataset';
import {
  createBaselineModel,
  DEFAULT_HYPERPARAMS,
  DEFAULT_PREPROCESSING,
  DEFAULT_SIMULATOR_INPUT,
  preprocessDataset,
  trainLogisticRegression,
} from './lib/mlEngine';
import { Layout } from './components/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { DataStudioPage } from './pages/DataStudioPage';
import { MlLabPage } from './pages/MlLabPage';
import { SimulatorStudioPage } from './pages/SimulatorStudioPage';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [darkMode, setDarkMode] = useState(false);

  const [records, setRecords] = useState<RawRecord[]>([]);
  const [sourceLabel, setSourceLabel] = useState('Yuklanmagan');

  const [prepConfig, setPrepConfig] = useState<PreprocessingConfig>(DEFAULT_PREPROCESSING);
  const [preprocessed, setPreprocessed] = useState<PreprocessedDataset | null>(null);

  const [hyperparams, setHyperparams] = useState<TrainingHyperparams>(DEFAULT_HYPERPARAMS);
  const [model, setModel] = useState<TrainedModel>(() => createBaselineModel());

  const [simInput, setSimInput] = useState<SimulatorInput>(DEFAULT_SIMULATOR_INPUT);
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  const handleLoadSample = () => {
    const sample = generateSyntheticDataset(500);
    setRecords(sample);
    setSourceLabel("Sintetik O'zbekiston MMT bazasi (500)");
    setPreprocessed(null);
  };

  const handleUploadRecords = (uploaded: RawRecord[], filename: string) => {
    setRecords(uploaded);
    setSourceLabel(`CSV: ${filename}`);
    setPreprocessed(null);
  };

  const handleApplyPreprocessing = () => {
    if (!records.length) return;
    setPreprocessed(preprocessDataset(records, prepConfig));
  };

  const handleTrainModel = () => {
    if (!preprocessed) return;
    setModel(trainLogisticRegression(preprocessed, prepConfig, hyperparams));
  };

  const handleQuickSimulation = () => {
    const sample = records.length ? records : generateSyntheticDataset(500);
    if (!records.length) {
      setRecords(sample);
      setSourceLabel("Sintetik O'zbekiston MMT bazasi (500)");
    }
    const processed = preprocessDataset(sample, prepConfig);
    setPreprocessed(processed);
    setModel(trainLogisticRegression(processed, prepConfig, hyperparams));
    setActiveTab('simulator');
  };

  const handleSimulateRegion = (region: Region) => {
    setSimInput((prev) => ({
      ...prev,
      name: `${region} — 2031 MMT ssenariysi`,
      hudud: region,
      shariatTalabi: region === "Farg'ona vodiysi" ? 78 : region === 'Samarqand' ? 67 : 60,
      raqamlashtirish: region === 'Toshkent' ? 86 : 62,
    }));
    setActiveTab('simulator');
  };

  const handleSaveReport = (
    input: SimulatorInput,
    probability: number,
    impactLevel: 'Yuqori' | "O'rtacha" | 'Past',
    projected2031Share: number
  ) => {
    const newReport: SavedReport = {
      id: `MZN-${String(reports.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      name: input.name || 'Nomsiz ssenariy',
      shariatTalabi: input.shariatTalabi,
      raqamlashtirish: input.raqamlashtirish,
      kapitalHajmi: input.kapitalHajmi,
      soliqYuklamasi: input.soliqYuklamasi,
      hudud: input.hudud,
      mahsulotTuri: input.mahsulotTuri,
      probability,
      impactLevel,
      projected2031Share,
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const handleBulkAddFromTest = () => {
    const highCandidates = model.testPredictions
      .filter((p) => p.prob >= 0.72)
      .slice(0, 8)
      .map((p, idx): SavedReport => ({
        id: `TST-${String(reports.length + idx + 1).padStart(3, '0')}`,
        createdAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        name: `${p.id} (${p.raw.hudud})`,
        shariatTalabi: p.raw.shariatTalabi,
        raqamlashtirish: p.raw.raqamlashtirish,
        kapitalHajmi: p.raw.kapitalHajmi,
        soliqYuklamasi: p.raw.soliqYuklamasi,
        hudud: p.raw.hudud,
        mahsulotTuri: p.raw.mahsulotTuri,
        probability: p.prob,
        impactLevel: 'Yuqori',
        projected2031Share: Number((10 + p.prob * 34).toFixed(1)),
      }));

    if (highCandidates.length > 0) {
      setReports((prev) => [...highCandidates, ...prev]);
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((d) => !d)}
      modelStatus={model.isBaseline ? 'Bazaviy' : "O'qitilgan"}
      datasetCount={records.length}
      reportsCount={reports.length}
    >
      {activeTab === 'overview' && (
        <OverviewPage
          datasetCount={records.length}
          isPreprocessed={preprocessed !== null}
          rocAuc={model.isBaseline ? null : model.rocAuc}
          reportsCount={reports.length}
          onNavigate={setActiveTab}
          onQuickSimulation={handleQuickSimulation}
          onSimulateRegion={handleSimulateRegion}
        />
      )}

      {activeTab === 'studio-data' && (
        <DataStudioPage
          records={records}
          sourceLabel={sourceLabel}
          config={prepConfig}
          appliedDataset={preprocessed}
          onLoadSample={handleLoadSample}
          onUploadRecords={handleUploadRecords}
          onChangeConfig={setPrepConfig}
          onApplyPreprocessing={handleApplyPreprocessing}
          onGoToLab={() => setActiveTab('ml-lab')}
        />
      )}

      {activeTab === 'ml-lab' && (
        <MlLabPage
          preprocessed={preprocessed}
          hyperparams={hyperparams}
          model={model}
          onChangeHyperparams={setHyperparams}
          onTrain={handleTrainModel}
          onGoToDataStudio={() => setActiveTab('studio-data')}
          onGoToSimulator={() => setActiveTab('simulator')}
        />
      )}

      {activeTab === 'simulator' && (
        <SimulatorStudioPage
          input={simInput}
          model={model}
          onChangeInput={setSimInput}
          onSaveReport={handleSaveReport}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsPage
          reports={reports}
          model={model}
          onBulkAddFromTest={handleBulkAddFromTest}
          onDeleteReport={(id) => setReports((prev) => prev.filter((r) => r.id !== id))}
          onClearAll={() => setReports([])}
        />
      )}
    </Layout>
  );
}

export default App;
