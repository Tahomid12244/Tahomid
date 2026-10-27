import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Dumbbell,
  GraduationCap,
  Languages,
  ListTodo,
  Play,
  PlusCircle,
  Quote,
  Sparkles,
  Timer,
  Wallet,
} from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import {
  formatGregorianDate,
  formatHHMM,
  formatNum,
  formatTime12h,
  t,
  toLocalDigits,
} from '../../../utils/i18n';
import { formatHijriDate, getNextPrayerCountdown } from '../../../utils/islamicUtils';
import { getOverallHscStats, getSubjectStats, isHscClass } from '../../../utils/nctbCurriculum';
import { DAILY_QUOTES } from '../../../utils/starterData';

export const HomeDashboard: React.FC = () => {
  const {
    data,
    lang,
    navigateTo,
    clearDemoData,
    toggleTaskDone,
    toggleRoutineDone,
  } = useLifeTrack();

  const profile = data.profile;
  const currency = profile?.currency || '৳';
  const hijriAdj = profile?.hijriAdjustment ?? -1;
  const districtId = profile?.district || 'dhaka';

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const todayIso = now.toISOString().slice(0, 10);
  const hour = now.getHours();
  const greeting =
    hour < 12
      ? t('greetingMorning', lang)
      : hour < 17
      ? t('greetingAfternoon', lang)
      : t('greetingEvening', lang);

  // HSC Card stats (ONLY shown for Class 11 / 12 HSC users)
  const showHscCard = Boolean(profile?.isStudent && isHscClass(profile.classLevel));
  const hscStats = useMemo(
    () => (showHscCard ? getOverallHscStats(data.subjects) : { overallPct: 0, weakestSubject: null }),
    [showHscCard, data.subjects]
  );

  // Exam countdown
  const examCountdown = useMemo(() => {
    const upcomingExams = data.exams
      .filter((e) => !e.isModelTest && e.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date));
    const targetDate = upcomingExams[0]?.date || profile?.goals.examDate || '';
    const targetTitle =
      upcomingExams[0]?.title ||
      profile?.goals.examTitle ||
      (lang === 'bn' ? 'প্রধান পরীক্ষা' : 'Upcoming Exam');

    if (!targetDate) return null;
    const diffMs = new Date(targetDate + 'T00:00:00').getTime() - new Date(todayIso + 'T00:00:00').getTime();
    const days = Math.max(0, Math.ceil(diffMs / 86400000));
    return { title: targetTitle, days, date: targetDate };
  }, [data.exams, profile?.goals.examDate, profile?.goals.examTitle, todayIso, lang]);

  // Study hours today vs goal
  const studyMinutesToday = useMemo(
    () =>
      data.studySessions
        .filter((s) => s.date === todayIso)
        .reduce((acc, s) => acc + s.durationMinutes, 0),
    [data.studySessions, todayIso]
  );
  const studyHoursToday = studyMinutesToday / 60;
  const studyGoalHours = profile?.goals.dailyStudyHours || 4;
  const studyPct = Math.min(100, Math.round((studyHoursToday / Math.max(0.5, studyGoalHours)) * 100));

  // Next prayer live countdown
  const nextPrayer = useMemo(() => getNextPrayerCountdown(now, districtId), [now, districtId]);
  const formatCountdown = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => toLocalDigits(String(n).padStart(2, '0'), lang);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Money today spending & current balance
  const { todaySpend, balance } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let tSpend = 0;
    for (const tx of data.expenses) {
      if (tx.txType === 'income') inc += tx.amount;
      else {
        exp += tx.amount;
        if (tx.date === todayIso) tSpend += tx.amount;
      }
    }
    return { todaySpend: tSpend, balance: inc - exp };
  }, [data.expenses, todayIso]);

  // Habits done today
  const totalHabits = data.habits.length;
  const habitsDoneToday = useMemo(() => {
    const map = data.habitLogs[todayIso] || {};
    return data.habits.filter((h) => map[h.id]).length;
  }, [data.habits, data.habitLogs, todayIso]);

  // Compact Activity Cards: Workout minutes, Words reviewed today, Pages read today
  const workoutMinsToday = useMemo(
    () =>
      data.workoutLogs
        .filter((w) => w.date === todayIso)
        .reduce((acc, w) => acc + w.durationMinutes, 0),
    [data.workoutLogs, todayIso]
  );
  const wordsReviewedToday = (data.xp.reviewedCardsToday[todayIso] || []).length;
  const pagesReadToday = useMemo(
    () =>
      data.readingLogs
        .filter((r) => r.date === todayIso)
        .reduce((acc, r) => acc + r.pages, 0),
    [data.readingLogs, todayIso]
  );

  // Today's Schedule & Tasks Due
  const dow = now.getDay();
  const todaysRoutines = useMemo(
    () =>
      data.routines
        .filter(
          (r) =>
            r.date === todayIso ||
            r.repeat === 'daily' ||
            (r.repeat === 'weekly' && (r.dayOfWeek === dow || !r.date))
        )
        .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'))
        .slice(0, 5),
    [data.routines, todayIso, dow]
  );

  const todaysTasks = useMemo(
    () => data.tasks.filter((tk) => !tk.done && (!tk.date || tk.date <= todayIso)).slice(0, 5),
    [data.tasks, todayIso]
  );

  // Word of the day & Daily Motivational Quote
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const wordOfDay = data.words.length > 0 ? data.words[dayOfYear % data.words.length] : null;
  const dailyQuote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];

  return (
    <div className="max-w-3xl mx-auto px-3.5 pt-4 pb-24 space-y-4">
      {/* Sample Demo Data Banner */}
      {data.isDemoDataLoaded && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-900 dark:text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{t('demoBanner', lang)}</span>
          </div>
          <button
            type="button"
            onClick={clearDemoData}
            className="shrink-0 min-h-[40px] px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
          >
            {t('clearDemo', lang)}
          </button>
        </div>
      )}

      {/* Hero Greeting + Gregorian & Hijri Date + Quick Action Buttons */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-slate-900 text-white p-5 space-y-4 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-emerald-200">{greeting}</p>
            <h1 className="text-xl font-extrabold tracking-tight truncate mt-0.5">
              {profile?.name || t('appName', lang)}
            </h1>
            <p className="text-xs text-emerald-100 mt-1">
              {formatGregorianDate(now, lang)} • {formatHijriDate(now, hijriAdj, lang)}
            </p>
          </div>

          {examCountdown ? (
            <button
              type="button"
              onClick={() => navigateTo('study', 'exams')}
              className="shrink-0 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2 text-right transition-colors min-h-[44px]"
            >
              <span className="text-[11px] text-amber-200 block truncate max-w-[115px]">
                {examCountdown.title}
              </span>
              <span className="text-base font-extrabold text-amber-300">
                {toLocalDigits(examCountdown.days, lang)} {t('daysLeft', lang)}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigateTo('study', 'exams')}
              className="shrink-0 min-h-[44px] px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-emerald-100"
            >
              {t('noExamSet', lang)}
            </button>
          )}
        </div>

        {/* 3 Quick Buttons: Start timer, Add task, Log study */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => navigateTo('study', 'timer')}
            className="min-h-[44px] px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 shrink-0 fill-current" />
            <span className="truncate">{t('qaStartTimer', lang)}</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('daily', 'habits')}
            className="min-h-[44px] px-2 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('qaAddTask', lang)}</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('study', 'logs')}
            className="min-h-[44px] px-2 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Timer className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('qaLogStudy', lang)}</span>
          </button>
        </div>
      </div>

      {/* HSC Preparation Card — Strictly ONLY for Class 11 / 12 (HSC) users */}
      {showHscCard && (
        <button
          type="button"
          onClick={() =>
            navigateTo(
              'study',
              'syllabus',
              hscStats.weakestSubject ? hscStats.weakestSubject.id : undefined
            )
          }
          className="w-full text-left rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 p-4 space-y-3 shadow-sm hover:border-emerald-500 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {t('hscPrepCardTitle', lang)}
                </h2>
                {profile?.batch && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('batchDisplayLabel', lang)}: {profile.batch}
                  </p>
                )}
              </div>
            </div>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatNum(hscStats.overallPct, lang, 1)}%
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, hscStats.overallPct)}%` }}
            />
          </div>

          {hscStats.weakestSubject && (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-slate-600 dark:text-slate-300">
                {t('weakestSubjectLabel', lang)}{' '}
                <strong className="text-amber-600 dark:text-amber-400">
                  {lang === 'bn' ? hscStats.weakestSubject.bn : hscStats.weakestSubject.en} (
                  {formatNum(getSubjectStats(hscStats.weakestSubject).avgPct, lang, 1)}%)
                </strong>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1 shrink-0">
                <span>{t('tapToOpenSyllabus', lang)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
        </button>
      )}

      {/* Primary 2x2 Summary Grid: Study vs Goal, Next Prayer, Spending & Balance, Habits Done */}
      <div className="grid grid-cols-2 gap-3">
        {/* Study Hours vs Goal */}
        <button
          type="button"
          onClick={() => navigateTo('study', 'progress')}
          className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('studyTodayCard', lang)}</span>
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {formatNum(studyHoursToday, lang, 1)} / {formatNum(studyGoalHours, lang, 1)}{' '}
            <span className="text-xs font-semibold text-slate-500">{t('hoursUnit', lang)}</span>
          </p>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${studyPct}%` }} />
          </div>
        </button>

        {/* Next Prayer Countdown */}
        <button
          type="button"
          onClick={() => navigateTo('islamic', 'prayer')}
          className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('nextPrayerCard', lang)}</span>
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {lang === 'bn' ? nextPrayer.bn : nextPrayer.en} • {formatTime12h(nextPrayer.time, lang)}
          </p>
          <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            {formatCountdown(nextPrayer.diffSec)}
          </p>
        </button>

        {/* Today's Spending & Balance */}
        <button
          type="button"
          onClick={() => navigateTo('money', 'overview')}
          className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('todaySpendingCard', lang)}</span>
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
            {currency}
            {formatNum(todaySpend, lang)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {t('currentBalance', lang)}: {currency}
            {formatNum(balance, lang)}
          </p>
        </button>

        {/* Habits Done (x/y) */}
        <button
          type="button"
          onClick={() => navigateTo('daily', 'habits')}
          className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('habitsDoneCard', lang)}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {toLocalDigits(habitsDoneToday, lang)} / {toLocalDigits(totalHabits, lang)}
          </p>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{
                width: `${totalHabits > 0 ? Math.round((habitsDoneToday / totalHabits) * 100) : 0}%`,
              }}
            />
          </div>
        </button>
      </div>

      {/* 3 Compact Cards: Workout Minutes, Words Reviewed, Pages Read vs Goals */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => navigateTo('daily', 'workout')}
          className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-1 shadow-sm"
        >
          <Dumbbell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {t('workoutCard', lang)}
          </p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {toLocalDigits(workoutMinsToday, lang)}/{toLocalDigits(profile?.goals.dailyWorkoutMinutes || 20, lang)}{' '}
            <span className="text-[10px] font-normal">{t('minutesUnit', lang)}</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('daily', 'vocab')}
          className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-1 shadow-sm"
        >
          <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {t('vocabReviewedCard', lang)}
          </p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {toLocalDigits(wordsReviewedToday, lang)}/{toLocalDigits(profile?.goals.dailyVocabWords || 10, lang)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('daily', 'storybook')}
          className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-1 shadow-sm"
        >
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {t('pagesReadCard', lang)}
          </p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {toLocalDigits(pagesReadToday, lang)}/{toLocalDigits(profile?.goals.dailyReadingPages || 15, lang)}
          </p>
        </button>
      </div>

      {/* Today's Schedule & Tasks Due */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t('todayScheduleTitle', lang)}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('study', 'planner')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 min-h-[36px] flex items-center"
          >
            {t('studyTabPlanner', lang)}
          </button>
        </div>

        {todaysRoutines.length === 0 && todaysTasks.length === 0 ? (
          <div className="py-4 text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('noTasksToday', lang)}</p>
            <button
              type="button"
              onClick={() => navigateTo('daily', 'habits')}
              className="min-h-[40px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              {t('qaAddTask', lang)}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysRoutines.map((rt) => (
              <button
                key={rt.id}
                type="button"
                onClick={() => toggleRoutineDone(rt.id)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      rt.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {rt.title}
                  </p>
                  {rt.startTime && (
                    <p className="text-[11px] text-slate-500">
                      {formatHHMM(rt.startTime, lang)}
                      {rt.endTime ? ` – ${formatHHMM(rt.endTime, lang)}` : ''}
                    </p>
                  )}
                </div>
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    rt.done ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}

            {todaysTasks.map((tk) => (
              <button
                key={tk.id}
                type="button"
                onClick={() => toggleTaskDone(tk.id)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ListTodo className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {tk.title}
                  </span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Word of the Day */}
      {wordOfDay && (
        <button
          type="button"
          onClick={() => navigateTo('daily', 'vocab')}
          className="w-full text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>{t('wordOfTheDay', lang)}</span>
            <span>{wordOfDay.partOfSpeech}</span>
          </div>
          <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            {wordOfDay.word} —{' '}
            <span className="text-emerald-700 dark:text-emerald-300">
              {lang === 'bn' ? wordOfDay.bnMeaning : wordOfDay.enMeaning}
            </span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">{wordOfDay.example}</p>
        </button>
      )}

      {/* Daily Motivational Quote */}
      <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/20 p-4 flex items-start gap-3">
        <Quote className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">
            {t('dailyQuoteTitle', lang)}
          </span>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
            {lang === 'bn' ? dailyQuote.bn : dailyQuote.en}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
