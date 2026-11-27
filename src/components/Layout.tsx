import React, { useState } from 'react';
import {
  Compass,
  Database,
  FileSpreadsheet,
  FlaskConical,
  Menu,
  Moon,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
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

const NAV_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Sharh & 2031', icon: Compass },
  { id: 'studio-data', label: "Ma'lumot studiyasi", icon: Database },
  { id: 'ml-lab', label: 'ML Laboratoriya', icon: FlaskConical },
  { id: 'simulator', label: '5 Yillik Simulyator', icon: SlidersHorizontal },
  { id: 'reports', label: 'Hisobotlar', icon: FileSpreadsheet },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mizan-canvas flex flex-col">
      {/* Original Top Floating Glass Header (No left sidebar clone) */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 dark:border-slate-800/80 bg-[#FAF9F6]/85 dark:bg-[#090E17]/85 backdrop-blur-md">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Lockup: Mizan */}
          <button
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F4C5C] to-[#0D9488] flex items-center justify-center shadow-sm shadow-teal-900/20 ring-1 ring-amber-400/40 group-hover:scale-105 transition-transform">
              <Scale className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-left">
              <div className="font-display text-lg font-bold tracking-tight leading-none text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Mizan</span>
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  UZ
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                Islomiy Mikromoliya Prognozi · 2026–2031
              </div>
            </div>
          </button>

          {/* Center Pill Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-stone-200/60 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-[#0F4C5C] dark:text-teal-300 shadow-sm ring-1 ring-stone-200/80 dark:ring-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-amber-600 dark:text-amber-400' : 'opacity-70'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.id === 'reports' && reportsCount > 0 && (
                    <span className="mono-num text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {reportsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status + Actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  modelStatus === "O'qitilgan" ? 'bg-teal-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-500 dark:text-slate-400">{modelStatus}</span>
              <span className="text-stone-300 dark:text-slate-700">·</span>
              <span className="mono-num font-semibold text-slate-700 dark:text-slate-200">
                {datasetCount} MMT
              </span>
            </div>

            <button
              onClick={onToggleDarkMode}
              title={darkMode ? "Kunduzgi rejim" : "Tungi rejim"}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-amber-400 hover:border-teal-600/40 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onTabChange('simulator')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F4C5C] hover:bg-[#136074] dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-slate-950" />
              <span>Prognoz tuzish</span>
            </button>

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              aria-label="Menyu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-stone-200 dark:border-slate-800 bg-white dark:bg-[#0D1422] px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-500/15 text-[#0F4C5C] dark:text-teal-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'reports' && reportsCount > 0 && (
                    <span className="mono-num text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {reportsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-stone-200/70 dark:border-slate-800/70 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1320px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong className="font-display text-slate-700 dark:text-slate-200">Mizan UZ</strong> —
            O&apos;zbekistonda islom moliyasi va mikromoliya tahlili (2026–2031)
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            MB №3536 (2024) · O&apos;RQ-1026 (2025) · O&apos;RQ-1126 (2026) asosida sintetik modellashtirish
          </span>
        </div>
      </footer>
    </div>
  );
};
