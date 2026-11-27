import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { TabId } from '../types';

interface LayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  modelStatus: 'Bazaviy' | "O'qitilgan";
  datasetCount: number;
  reportsCount: number;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: TabId; num: string; label: string }[] = [
  { id: 'overview', num: '01', label: 'Makro sharh (2026–2031)' },
  { id: 'studio-data', num: '02', label: "Ma'lumotlar bazasi" },
  { id: 'ml-lab', num: '03', label: 'Regressiya modeli' },
  { id: 'simulator', num: '04', label: 'Ssenariy kalkulyatori' },
  { id: 'reports', num: '05', label: 'Qaydlar va Eksport' },
];

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
  modelStatus,
  datasetCount,
  reportsCount,
  children,
}) => {
  return (
    <div className="min-h-screen bg-mizan-canvas flex flex-col text-[#111315] dark:text-[#EAECEF]">
      {/* Institutional Masthead */}
      <header className="border-b border-[#D5D3CC] dark:border-[#222630] bg-white dark:bg-[#11141A]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar: Wordmark + Telemetry Readout */}
          <div className="h-14 flex items-center justify-between gap-4 border-b border-[#E6E4DD] dark:border-[#1C2029]">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => onTabChange('overview')}
                className="text-left flex items-baseline gap-2.5 group"
              >
                <span className="font-display text-xl font-bold tracking-tight text-[#111315] dark:text-white">
                  MIZAN
                </span>
                <span className="text-xs mono-num uppercase tracking-widest text-[#0F5338] dark:text-emerald-400 font-semibold">
                  Tahlil · UZ
                </span>
              </button>
              <span className="hidden md:inline-block h-4 w-[1px] bg-[#D5D3CC] dark:bg-[#262B36]" />
              <span className="hidden md:inline-block text-xs text-[#5A6065] dark:text-slate-400">
                O&apos;zbekiston mikromoliya bozorida islom moliyasi ulushi prognozi
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="hidden sm:flex items-center gap-4 mono-num text-[11px] text-[#5A6065] dark:text-slate-400">
                <span>
                  TANLAMA: <strong className="text-[#111315] dark:text-white">N={datasetCount}</strong>
                </span>
                <span>
                  MODEL:{' '}
                  <strong
                    className={
                      modelStatus === "O'qitilgan"
                        ? 'text-[#0F5338] dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }
                  >
                    {modelStatus.toUpperCase()}
                  </strong>
                </span>
              </div>

              <button
                onClick={onToggleDarkMode}
                title={darkMode ? 'Yorug‘ rejim' : 'Qoramtir rejim'}
                className="px-2.5 py-1.5 rounded-[3px] border border-[#D5D3CC] dark:border-[#262B36] hover:bg-[#F4F3EE] dark:hover:bg-[#1A1E26] flex items-center gap-1.5 text-[11px] font-medium transition-colors"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{darkMode ? 'Yorug‘' : 'Qoramtir'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Tab Strip: Crisp Underline Navigation */}
          <nav className="flex items-center gap-1 overflow-x-auto -mb-[1px]">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3.5 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'border-[#0F5338] dark:border-emerald-400 text-[#111315] dark:text-white font-semibold'
                      : 'border-transparent text-[#5A6065] dark:text-slate-400 hover:text-[#111315] dark:hover:text-slate-200'
                  }`}
                >
                  <span className="mono-num text-[11px] text-[#8C9196] dark:text-slate-500">
                    {item.num}
                  </span>
                  <span>{item.label}</span>
                  {item.id === 'reports' && reportsCount > 0 && (
                    <span className="mono-num text-[10px] px-1.5 py-0.2 bg-[#E6E4DD] dark:bg-slate-800 text-[#111315] dark:text-slate-200 rounded-[2px]">
                      {reportsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#D5D3CC] dark:border-[#222630] bg-white dark:bg-[#11141A] py-4 text-xs text-[#5A6065] dark:text-slate-400">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-[#111315] dark:text-slate-200">MIZAN</span> ·
            Tadqiqot va ssenariylar platformasi (2026–2031)
          </div>
          <div className="mono-num text-[11px]">
            Manba asoslari: MB №3536 (2024) | O&apos;RQ-1026 (2025) | O&apos;RQ-1126 (2026)
          </div>
        </div>
      </footer>
    </div>
  );
};
