import React, { useState } from 'react';
import {
  BookOpen,
  BookPlus,
  CheckSquare,
  Clock,
  Dumbbell,
  Home,
  Languages,
  MoonStar,
  Plus,
  Sparkles,
  Wallet,
  WifiOff,
  X,
} from 'lucide-react';
import { useLifeTrack } from '../../context/LifeTrackContext';
import { MainTab } from '../../types';
import { t } from '../../utils/i18n';
import { DEFAULT_MONEY_CATEGORIES, EXERCISE_LIBRARY } from '../../utils/starterData';

type QuickModalType = 'task' | 'study' | 'expense' | 'workout' | 'word' | 'reading' | null;

export const BottomNavAndQuickAdd: React.FC = () => {
  const {
    data,
    lang,
    mainTab,
    navigateTo,
    isOnline,
    toasts,
    timerFlashActive,
    dismissTimerFlash,
    saveTask,
    addStudySession,
    saveExpense,
    addWorkoutLog,
    saveWord,
    addReadingLog,
  } = useLifeTrack();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [quickModal, setQuickModal] = useState<QuickModalType>(null);

  // Quick-add form states
  const today = new Date().toISOString().slice(0, 10);
  const [taskTitle, setTaskTitle] = useState('');
  const [studySubj, setStudySubj] = useState('none');
  const [studyTopic, setStudyTopic] = useState('');
  const [studyMins, setStudyMins] = useState('30');
  const [expAmount, setExpAmount] = useState('');
  const [expCat, setExpCat] = useState('Food');
  const [expNote, setExpNote] = useState('');
  const [woKey, setWoKey] = useState('pushups');
  const [woMins, setWoMins] = useState('15');
  const [wordEn, setWordEn] = useState('');
  const [wordBn, setWordBn] = useState('');
  const [wordDef, setWordDef] = useState('');
  const [readBookId, setReadBookId] = useState('');
  const [readPages, setReadPages] = useState('10');
  const [readMins, setReadMins] = useState('15');

  const navItems: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: t('navHome', lang), icon: Home },
    { id: 'study', label: t('navStudy', lang), icon: BookOpen },
    { id: 'daily', label: t('navDaily', lang), icon: Sparkles },
    { id: 'islamic', label: t('navIslamic', lang), icon: MoonStar },
    { id: 'money', label: t('navMoney', lang), icon: Wallet },
  ];

  const activeSubjects = data.subjects.filter((s) => !s.archived && !s.hidden);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickModal === 'task') {
      if (!taskTitle.trim()) return;
      saveTask({
        id: `task_${Date.now()}`,
        title: taskTitle.trim(),
        category: 'study',
        date: today,
        time: '18:00',
        priority: 'medium',
        repeat: 'none',
        reminderTime: '',
        done: false,
        subtasks: [],
      });
      setTaskTitle('');
    } else if (quickModal === 'study') {
      const mins = Math.max(1, Number(studyMins) || 0);
      addStudySession({
        subjectId: studySubj,
        topic: studyTopic.trim() || (lang === 'bn' ? 'স্বাভাবিক পড়াশোনা' : 'Study Session'),
        durationMinutes: mins,
        date: today,
        startedAt: new Date().toISOString(),
        source: 'manual',
      });
      setStudyTopic('');
    } else if (quickModal === 'expense') {
      const amt = Number(expAmount);
      if (!amt || amt <= 0) return;
      saveExpense({
        id: `exp_${Date.now()}`,
        txType: 'expense',
        amount: amt,
        category: expCat,
        date: today,
        note: expNote.trim(),
        paymentMethod: 'cash',
        recurring: false,
      });
      setExpAmount('');
      setExpNote('');
    } else if (quickModal === 'workout') {
      const mins = Math.max(1, Number(woMins) || 10);
      addWorkoutLog({
        exerciseKey: woKey,
        mode: 'duration',
        sets: 1,
        reps: 0,
        durationMinutes: mins,
        distanceKm: 0,
        calories: Math.round(mins * 5.5),
        date: today,
      });
    } else if (quickModal === 'word') {
      if (!wordEn.trim() || !wordBn.trim()) return;
      saveWord({
        id: `word_${Date.now()}`,
        word: wordEn.trim(),
        bnMeaning: wordBn.trim(),
        enMeaning: wordDef.trim() || wordEn.trim(),
        partOfSpeech: 'noun',
        example: '',
        tag: 'HSC',
        difficulty: 'medium',
        reviewed: false,
        intervalDays: 0,
        nextReviewDate: today,
      });
      setWordEn('');
      setWordBn('');
      setWordDef('');
    } else if (quickModal === 'reading') {
      const targetBook = readBookId || data.books[0]?.id || 'general';
      addReadingLog({
        bookId: targetBook,
        pages: Math.max(1, Number(readPages) || 5),
        minutes: Math.max(1, Number(readMins) || 10),
        date: today,
      });
    }
    setQuickModal(null);
  };

  return (
    <>
      {/* Visible Timer Complete Flash */}
      {timerFlashActive && (
        <div className="fixed inset-x-3 top-18 z-50 max-w-md mx-auto rounded-2xl bg-emerald-600 text-white p-4 shadow-2xl border-2 border-amber-300 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-300 shrink-0" />
            <span className="text-sm font-bold">
              {lang === 'bn' ? 'টাইমার সম্পন্ন হয়েছে!' : 'Timer Completed!'}
            </span>
          </div>
          <button
            type="button"
            onClick={dismissTimerFlash}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/15"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed bottom-20 left-3 right-18 z-30 max-w-md rounded-xl bg-amber-600 text-white px-3 py-2 text-xs font-medium shadow-lg flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t('offlineBanner', lang)}</span>
        </div>
      )}

      {/* Toast Stack with Undo */}
      {toasts.length > 0 && (
        <div className="fixed bottom-22 left-3 right-18 z-40 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map((item) => (
            <div
              key={item.id}
              className="pointer-events-auto rounded-xl bg-slate-900 dark:bg-slate-800 text-white px-3.5 py-2.5 text-xs font-medium shadow-xl border border-slate-700 flex items-center justify-between gap-3"
            >
              <span>{item.message}</span>
              {item.onUndo && (
                <button
                  type="button"
                  onClick={item.onUndo}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold shrink-0"
                >
                  {item.undoLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating "+" Quick-Add Button sitting cleanly above Bottom Nav */}
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        aria-label={t('quickAddTitle', lang)}
        className="fixed right-4 bottom-[76px] z-30 w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-900/30 border-2 border-amber-400/70 flex items-center justify-center transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick-Add Sheet */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('quickAddTitle', lang)}</h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigateTo('study', 'timer');
                }}
                className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-2.5 text-left"
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>{t('qaStartTimer', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setQuickModal('task');
                }}
                className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2.5 text-left"
              >
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('qaAddTask', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setQuickModal('study');
                }}
                className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2.5 text-left"
              >
                <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{t('qaLogStudy', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setQuickModal('expense');
                }}
                className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2.5 text-left"
              >
                <Wallet className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t('qaAddExpense', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setQuickModal('workout');
                }}
                className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2.5 text-left"
              >
                <Dumbbell className="w-4 h-4 text-teal-500 shrink-0" />
                <span>{t('qaLogWorkout', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setQuickModal('word');
                }}
                className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2.5 text-left"
              >
                <Languages className="w-4 h-4 text-purple-500 shrink-0" />
                <span>{t('qaAddWord', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setQuickModal('reading');
                }}
                className="col-span-2 min-h-[48px] px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2.5 text-left"
              >
                <BookPlus className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{t('qaLogReading', lang)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick-Add Inline Modal */}
      {quickModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setQuickModal(null)}
        >
          <form
            onSubmit={handleQuickSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {quickModal === 'task' && t('qaAddTask', lang)}
                {quickModal === 'study' && t('qaLogStudy', lang)}
                {quickModal === 'expense' && t('qaAddExpense', lang)}
                {quickModal === 'workout' && t('qaLogWorkout', lang)}
                {quickModal === 'word' && t('qaAddWord', lang)}
                {quickModal === 'reading' && t('qaLogReading', lang)}
              </h3>
              <button
                type="button"
                onClick={() => setQuickModal(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickModal === 'task' && (
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder={lang === 'bn' ? 'কাজের শিরোনাম লিখুন' : 'Task title'}
                className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            )}

            {quickModal === 'study' && (
              <>
                <select
                  value={studySubj}
                  onChange={(e) => setStudySubj(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  <option value="none">{t('noSubjectOption', lang)}</option>
                  {activeSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {lang === 'bn' ? s.bn : s.en}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={studyTopic}
                  onChange={(e) => setStudyTopic(e.target.value)}
                  placeholder={t('topicGoalPlaceholder', lang)}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={720}
                  required
                  value={studyMins}
                  onChange={(e) => setStudyMins(e.target.value)}
                  placeholder={lang === 'bn' ? 'সময় (মিনিট)' : 'Duration (minutes)'}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </>
            )}

            {quickModal === 'expense' && (
              <>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder={lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
                <select
                  value={expCat}
                  onChange={(e) => setExpCat(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  {DEFAULT_MONEY_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'bn' ? c.bn : c.en}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder={lang === 'bn' ? 'সংক্ষিপ্ত বিবরণ' : 'Short note'}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </>
            )}

            {quickModal === 'workout' && (
              <>
                <select
                  value={woKey}
                  onChange={(e) => setWoKey(e.target.value)}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  {EXERCISE_LIBRARY.map((ex) => (
                    <option key={ex.key} value={ex.key}>
                      {lang === 'bn' ? ex.bn : ex.en}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={300}
                  required
                  value={woMins}
                  onChange={(e) => setWoMins(e.target.value)}
                  placeholder={lang === 'bn' ? 'সময় (মিনিট)' : 'Minutes'}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </>
            )}

            {quickModal === 'word' && (
              <>
                <input
                  type="text"
                  required
                  value={wordEn}
                  onChange={(e) => setWordEn(e.target.value)}
                  placeholder={lang === 'bn' ? 'ইংরেজি শব্দ' : 'Word'}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  required
                  value={wordBn}
                  onChange={(e) => setWordBn(e.target.value)}
                  placeholder={lang === 'bn' ? 'বাংলা অর্থ' : 'Bangla meaning'}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={wordDef}
                  onChange={(e) => setWordDef(e.target.value)}
                  placeholder={lang === 'bn' ? 'সমার্থক শব্দ / ব্যাখ্যা' : 'English definition'}
                  className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </>
            )}

            {quickModal === 'reading' && (
              <>
                {data.books.length > 0 && (
                  <select
                    value={readBookId}
                    onChange={(e) => setReadBookId(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    {data.books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    required
                    value={readPages}
                    onChange={(e) => setReadPages(e.target.value)}
                    placeholder={lang === 'bn' ? 'পৃষ্ঠা সংখ্যা' : 'Pages'}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    required
                    value={readMins}
                    onChange={(e) => setReadMins(e.target.value)}
                    placeholder={lang === 'bn' ? 'মিনিট' : 'Minutes'}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors"
            >
              {t('save', lang)}
            </button>
          </form>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <nav
        aria-label="Primary Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-5 items-center h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = mainTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[10px] leading-tight mt-1 truncate max-w-[68px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
