import React from 'react';
import { BarChart2, Calculator, Database, FileText, Layers, Moon, Sun } from 'lucide-react';
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

const NAV_ITEMS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'overview', label: 'Makro Prognoz (2026–2031)', icon: BarChart2 },
  { id: 'studio-data', label: "Ma'lumotlar & Normalizatsiya", icon: Database },
  { id: 'ml-lab', label: 'Logistik Model & ROC', icon: Layers },
  { id: 'simulator', label: 'Ssenariy Kalkulyatori', icon: Calculator },
  { id: 'reports', label: 'Saqlangan Qaydlar', icon: FileText },
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
    <div className="min-h-screen bg-mizan-canvas flex flex-col text-slate-900 dark:text-slate-100">
      {/* Top Dark Command Bar (Koyfin / FactSet style) */}
      <header className="sticky top-0 z-30 shadow-xs">
        <div className="bg-[#0F172A] text-white border-b border-slate-800">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onTabChange('overview')}
                className="flex items-center gap-2.5 text-left"
              >
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
                <span className="font-display text-sm font-extrabold tracking-wide uppercase text-white">
                  Mizan Analytics
                </span>
                <span className="text-[11px] mono-num px-1.5 py-0.5 rounded-xs bg-slate-800 text-blue-400 border border-slate-700">
                  v2.6
                </span>
              </button>
              <span className="hidden md:inline-block text-slate-600">/</span>
              <span className="hidden md:inline-block text-xs text-slate-400">
                O&apos;zbekiston Mikromoliya Sektorida Islom Moliyasi Ulushi (2026–2031)
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="hidden sm:flex items-center gap-2.5 mono-num text-[11px]">
                <span className="px-2 py-0.5 rounded-xs bg-slate-800/90 border border-slate-700 text-slate-300">
                  Yozuvlar: <strong className="text-white">{datasetCount}</strong>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-xs border ${
                    modelStatus === "O'qitilgan"
                      ? 'bg-blue-950/80 border-blue-700/60 text-blue-300'
                      : 'bg-slate-800/90 border-slate-700 text-amber-300'
                  }`}
                >
                  Holat: <strong>{modelStatus}</strong>
                </span>
              </div>

              <button
                onClick={onToggleDarkMode}
                className="px-2.5 py-1 rounded-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 text-[11px] font-medium transition-colors"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-400" />}
                <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-bar: Crisp Workspace Tabs */}
        <div className="bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto py-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.id === 'reports' && reportsCount > 0 && (
                    <span
                      className={`mono-num text-[10px] px-1.5 py-0.2 rounded-xs ${
                        isActive
                          ? 'bg-blue-800 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {reportsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Minimal Quant Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] py-3.5 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-800 dark:text-slate-200">Mizan Analytics</strong> —
            O&apos;zbekiston mikromoliya bozori ekonometrik prognoz tizimi (2026–2031)
          </div>
          <div className="mono-num text-[11px]">
            Me&apos;yoriy baza: MB №3536 (2024) · O&apos;RQ-1026 (2025) · O&apos;RQ-1126 (2026)
          </div>
        </div>
      </footer>
    </div>
  );
};
