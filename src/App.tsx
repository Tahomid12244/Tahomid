/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode, Suspense, lazy } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { AuthOnboardingFlow } from './components/auth/AuthOnboardingFlow';
import { BottomNavAndQuickAdd } from './components/common/BottomNavAndQuickAdd';
import { Header } from './components/common/Header';
import { SettingsModal } from './components/settings/SettingsModal';
import { LifeTrackProvider, useLifeTrack } from './context/LifeTrackContext';
import { Language } from './types';

const HomeDashboard = lazy(() =>
  import('./components/modules/home/HomeDashboard').then((m) => ({ default: m.HomeDashboard }))
);
const StudyModule = lazy(() =>
  import('./components/modules/study/StudyModule').then((m) => ({ default: m.StudyModule }))
);
const DailyModule = lazy(() =>
  import('./components/modules/daily/DailyModule').then((m) => ({ default: m.DailyModule }))
);
const IslamicModule = lazy(() =>
  import('./components/modules/islamic/IslamicModule').then((m) => ({ default: m.IslamicModule }))
);
const MoneyModule = lazy(() =>
  import('./components/modules/money/MoneyModule').then((m) => ({ default: m.MoneyModule }))
);

const ScreenSkeleton: React.FC<{ lang: Language }> = ({ lang }) => (
  <div className="max-w-3xl mx-auto px-3.5 pt-4 pb-24 space-y-4" aria-busy="true">
    <div className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-24 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
      <div className="h-24 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
    </div>
    <div className="h-40 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
      {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
    </p>
  </div>
);

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application Error Boundary caught:', error, info);
  }

  public render() {
    if (this.state.hasError) {
      const savedLang =
        typeof localStorage !== 'undefined' && localStorage.getItem('lifetrack_lang') === 'en'
          ? 'en'
          : 'bn';
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-base font-bold">
              {savedLang === 'bn'
                ? 'সাময়িক একটি সমস্যা হয়েছে'
                : 'Something went wrong'}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {savedLang === 'bn'
                ? 'আপনার সংরক্ষিত তথ্য নিরাপদ আছে। অনুগ্রহ করে পৃষ্ঠাটি পুনরায় লোড করুন।'
                : 'Your saved data is safe. Please reload the screen to continue.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{savedLang === 'bn' ? 'পুনরায় লোড করুন' : 'Reload App'}</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LifeTrackShell: React.FC = () => {
  const { authStep, isLoadingAuth, mainTab, isSettingsOpen, lang } = useLifeTrack();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-8">
        <ScreenSkeleton lang={lang} />
      </div>
    );
  }

  if (authStep !== 'unlocked') {
    return <AuthOnboardingFlow />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 w-full">
        <Suspense fallback={<ScreenSkeleton lang={lang} />}>
          {mainTab === 'home' && <HomeDashboard />}
          {mainTab === 'study' && <StudyModule />}
          {mainTab === 'daily' && <DailyModule />}
          {mainTab === 'islamic' && <IslamicModule />}
          {mainTab === 'money' && <MoneyModule />}
        </Suspense>
      </main>

      {isSettingsOpen && <SettingsModal />}
      <BottomNavAndQuickAdd />
    </div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <LifeTrackProvider>
        <LifeTrackShell />
      </LifeTrackProvider>
    </AppErrorBoundary>
  );
}
