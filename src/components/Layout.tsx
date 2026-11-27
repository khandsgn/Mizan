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

const NAV_ITEMS: { id: TabId; roman: string; label: string; arabic: string }[] = [
  { id: 'overview', roman: 'I', label: 'Makro Prognoz (2026–2031)', arabic: 'نظرة عامة' },
  { id: 'studio-data', roman: 'II', label: "MMT Ma'lumotlar Bazasi", arabic: 'البيانات' },
  { id: 'ml-lab', roman: 'III', label: 'Ekonometrik Model (ROC)', arabic: 'النموذج' },
  { id: 'simulator', roman: 'IV', label: 'Shariat Ssenariy Kalkulyatori', arabic: 'المحاكاة' },
  { id: 'reports', roman: 'V', label: 'Qaydlar Reyestri', arabic: 'التقارير' },
];

/** Authentic Rub el Hizb (8-pointed Islamic geometric star) SVG emblem */
const RubElHizbEmblem: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
    <rect
      x="8"
      y="8"
      width="24"
      height="24"
      stroke="#C5A059"
      strokeWidth="1.4"
    />
    <rect
      x="8"
      y="8"
      width="24"
      height="24"
      transform="rotate(45 20 20)"
      stroke="#C5A059"
      strokeWidth="1.4"
    />
    <circle cx="20" cy="20" r="3.2" fill="#C5A059" />
  </svg>
);

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
    <div className="min-h-screen bg-mizan-canvas flex flex-col text-[#0B1F17] dark:text-[#ECE8DF]">
      {/* Sovereign Deep-Malachite & Brushed-Gold Masthead */}
      <header className="bg-[#071D15] text-[#ECE8DF] border-b-2 border-[#C5A059]">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Sovereign Ribbon */}
          <div className="h-16 flex items-center justify-between gap-4 border-b border-[#C5A059]/25">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => onTabChange('overview')}
                className="flex items-center gap-3 text-left group"
              >
                <RubElHizbEmblem className="w-8 h-8 shrink-0 transition-transform duration-300 group-hover:rotate-45" />
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-display text-2xl font-bold tracking-[0.14em] text-white">
                      MIZAN
                    </span>
                    <span className="font-arabic text-base text-[#D4B36F] leading-none">
                      الميزان
                    </span>
                    <span className="hidden sm:inline-block text-[10px] mono-num uppercase tracking-[0.2em] px-2 py-0.5 border border-[#C5A059]/45 text-[#D4B36F] bg-[#0B291E]">
                      AAOIFI · IFSB
                    </span>
                  </div>
                  <div className="text-[11px] text-[#A3B8AE] tracking-wide mt-0.5">
                    O&apos;zbekiston Islomiy Mikromoliya Tahlil va Prognoz Terminali (2026–2031)
                  </div>
                </div>
              </button>
            </div>

            {/* Right Sovereign Status & Theme Switch */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 mono-num text-[11px] px-3 py-1.5 bg-[#0B291E] border border-[#C5A059]/30">
                <span className="text-[#A3B8AE]">
                  TANLAMA: <strong className="text-white">N={datasetCount}</strong>
                </span>
                <span className="text-[#C5A059]/40">|</span>
                <span className="text-[#A3B8AE]">
                  HOLAT:{' '}
                  <strong className="text-[#D4B36F]">{modelStatus.toUpperCase()}</strong>
                </span>
              </div>

              <button
                onClick={onToggleDarkMode}
                title={darkMode ? 'Kunduzgi' : 'Tungi'}
                className="px-3 py-1.5 bg-[#0B291E] hover:bg-[#11382A] border border-[#C5A059]/40 text-[#D4B36F] flex items-center gap-1.5 text-xs font-medium transition-colors"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{darkMode ? 'Kunduzgi' : 'Tungi'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Architectural Navigation Strip */}
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-4 py-3 text-xs whitespace-nowrap border-b-2 transition-all flex items-center gap-2.5 ${
                    isActive
                      ? 'border-[#C5A059] bg-[#0B291E] text-white font-semibold'
                      : 'border-transparent text-[#A3B8AE] hover:text-white hover:bg-[#0B291E]/50'
                  }`}
                >
                  <span className="font-display text-xs italic text-[#C5A059]">{item.roman}.</span>
                  <span>{item.label}</span>
                  <span className="font-arabic text-xs text-[#C5A059]/75 hidden xl:inline">
                    {item.arabic}
                  </span>
                  {item.id === 'reports' && reportsCount > 0 && (
                    <span className="mono-num text-[10px] px-1.5 py-0.2 bg-[#C5A059] text-[#071D15] font-bold">
                      {reportsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Sub-Header Shariah Contracts Ticker Ribbon */}
      <div className="bg-[#EFECE4] dark:bg-[#091812] border-b border-[#D5CEBF] dark:border-[#163024] text-[11px] text-[#3F5249] dark:text-[#98ADA3]">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap">
            <span className="font-semibold text-[#081C15] dark:text-[#D4B36F]">
              SHARIAT SHARTNOMALARI:
            </span>
            <span>
              <strong className="font-arabic text-xs text-[#9A7428] dark:text-[#D4B36F]">المرابحة</strong>{' '}
              Murabaha (Nasiya savdo)
            </span>
            <span className="text-[#C5A059]">◆</span>
            <span>
              <strong className="font-arabic text-xs text-[#9A7428] dark:text-[#D4B36F]">الإجارة</strong>{' '}
              Ijara (Islomiy lizing)
            </span>
            <span className="text-[#C5A059]">◆</span>
            <span>
              <strong className="font-arabic text-xs text-[#9A7428] dark:text-[#D4B36F]">السلم</strong>{' '}
              Salam (Agrar avans)
            </span>
            <span className="text-[#C5A059]">◆</span>
            <span>
              <strong className="font-arabic text-xs text-[#9A7428] dark:text-[#D4B36F]">المشاركة</strong>{' '}
              Musharaka &amp; Mudaraba (Sheriklik)
            </span>
          </div>
          <div className="mono-num text-[10px] hidden lg:block">
            MB №3536 · O&apos;RQ-1026 · O&apos;RQ-1126
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {children}
      </main>

      {/* Sovereign Footer */}
      <footer className="border-t border-[#D5CEBF] dark:border-[#163024] bg-[#EFECE4] dark:bg-[#071510] py-4 text-xs text-[#3F5249] dark:text-[#8FA69B]">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#C5A059]">◆</span>
            <span>
              <strong className="font-display text-sm tracking-wider text-[#081C15] dark:text-[#D4B36F]">
                MIZAN
              </strong>{' '}
              — Islom Moliyasi va Mikromoliya Ekonometrik Tahlil Markazi (2026–2031)
            </span>
          </div>
          <div className="mono-num text-[11px]">
            AAOIFI / IFSB mezonlari asosida sintetik modellashtirish
          </div>
        </div>
      </footer>
    </div>
  );
};
