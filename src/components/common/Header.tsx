import React, { useState } from 'react';
import { CheckCircle2, Download, Moon, Settings, Sun, X } from 'lucide-react';
import { useLifeTrack } from '../../context/LifeTrackContext';
import { formatGregorianDate, t } from '../../utils/i18n';
import { formatHijriDate } from '../../utils/islamicUtils';
import { usePWAInstall } from './usePWAInstall';

export const Header: React.FC = () => {
  const { data, lang, theme, toggleLanguage, setTheme, setIsSettingsOpen } = useLifeTrack();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const now = new Date();
  const hijriAdj = data.profile?.hijriAdjustment ?? -1;
  const gregStr = formatGregorianDate(now, lang);
  const hijriStr = formatHijriDate(now, hijriAdj, lang);

  return (
    <>
      <header className="sticky top-0 z-30 pt-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-3 py-2 flex flex-wrap items-center justify-between gap-2 min-h-[56px]">
          {/* App Brand + Dates (can cleanly wrap on 360px without clipping) */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {t('appName', lang)}
              </span>
            </div>
            <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400 mt-0.5 break-words">
              <span>{gregStr}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{hijriStr}</span>
            </p>
          </div>

          {/* Right Controls: Install (if available), Language Toggle, Theme Toggle, Settings */}
          <div className="flex items-center gap-1 shrink-0">
            {!isInstalled && (isInstallable || isIOS) && (
              <button
                type="button"
                onClick={() => (isInstallable ? install() : setShowIosGuide(true))}
                aria-label={t('installApp', lang)}
                title={t('installApp', lang)}
                className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 flex items-center justify-center transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={toggleLanguage}
              className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors whitespace-nowrap"
            >
              {t('switchLangLabel', lang)}
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? t('themeLight', lang) : t('themeDark', lang)}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label={t('settings', lang)}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('installApp', lang)}</h3>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'সাফারি ব্রাউজারের নিচে শেয়ার বোতামে ট্যাপ করে হোম স্ক্রিনে যোগ করুন অপশনটি বেছে নিন।'
                : 'Tap the Share icon in Safari toolbar and select Add to Home Screen.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
