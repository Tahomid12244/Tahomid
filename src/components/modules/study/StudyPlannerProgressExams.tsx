import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Copy,
  Flame,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { RoutineItem } from '../../../types';
import { calculateChapterProgress } from '../../../utils/hscSyllabus';
import { formatHHMM, formatNum, formatTime12h, t, toLocalDigits } from '../../../utils/i18n';
import { computePrayerTimesForDate, formatShortHijri } from '../../../utils/islamicUtils';
import { getOverallHscStats } from '../../../utils/nctbCurriculum';

export const StudyPlannerTab: React.FC = () => {
  const {
    data,
    lang,
    saveRoutine,
    toggleRoutineDone,
    deleteRoutine,
    setRoutinesBulk,
    saveDailyReflection,
    setWeeklyReviewNote,
    setYearlyGoal,
  } = useLifeTrack();

  const today = new Date().toISOString().slice(0, 10);
  const [typeFilter, setTypeFilter] = useState<'all' | 'study' | 'daily' | 'money'>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [showAdd, setShowAdd] = useState(false);

  // Add routine form
  const [rTitle, setRTitle] = useState('');
  const [rType, setRType] = useState<'study' | 'daily' | 'money'>('study');
  const [rSubjectId, setRSubjectId] = useState('none');
  const [rRepeat, setRRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [rStart, setRStart] = useState('07:00');
  const [rEnd, setREnd] = useState('08:30');
  const [rReminder, setRReminder] = useState('06:50');
  const [rIsCoaching, setRIsCoaching] = useState(false);

  const hijriAdj = data.profile?.hijriAdjustment ?? -1;
  const district = data.profile?.district || 'dhaka';
  const prayerSched = computePrayerTimesForDate(new Date(selectedDate + 'T12:00:00'), district);

  const filteredRoutines = data.routines.filter((r) => {
    if (typeFilter !== 'all' && r.routineType !== typeFilter) return false;
    return true;
  });

  const routinesForDay = (isoDate: string) => {
    const dow = new Date(isoDate + 'T12:00:00').getDay();
    return filteredRoutines.filter((r) => {
      if (r.repeat === 'daily') return true;
      if (r.repeat === 'weekly') {
        if (r.dayOfWeek !== undefined) return r.dayOfWeek === dow;
        return new Date((r.date || isoDate) + 'T12:00:00').getDay() === dow;
      }
      if (r.repeat === 'monthly') {
        return (r.date || '').slice(8, 10) === isoDate.slice(8, 10);
      }
      return r.date === isoDate;
    });
  };

  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle.trim()) return;
    const item: RoutineItem = {
      id: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title: rTitle.trim(),
      routineType: rType,
      subjectId: rType === 'study' ? rSubjectId : 'none',
      date: selectedDate,
      repeat: rRepeat,
      dayOfWeek: new Date(selectedDate + 'T12:00:00').getDay(),
      startTime: rStart,
      endTime: rEnd,
      reminderTime: rReminder,
      done: false,
      progress: 0,
      isCoaching: rIsCoaching,
    };
    saveRoutine(item);
    setRTitle('');
    setShowAdd(false);
  };

  // Auto-generate study plan from incomplete chapters across remaining weeks before exam
  const handleGenerateAutoPlan = () => {
    const incomplete: { subjId: string; subjName: string; chName: string }[] = [];
    for (const s of data.subjects.filter((x) => !x.archived && !x.hidden)) {
      for (const c of s.chapters.filter((ch) => !ch.hidden)) {
        if (calculateChapterProgress(c) < 100) {
          incomplete.push({
            subjId: s.id,
            subjName: lang === 'bn' ? s.bn : s.en,
            chName: lang === 'bn' ? c.bn : c.en,
          });
        }
      }
    }

    if (incomplete.length === 0) return;

    const dailyHrs = data.profile?.goals.dailyStudyHours || 4;
    const blocksPerDay = Math.max(1, Math.min(3, Math.floor(dailyHrs / 1.5)));
    const generated: RoutineItem[] = [];

    let cursor = 0;
    for (let dayOffset = 0; dayOffset < 7 && cursor < incomplete.length; dayOffset++) {
      const targetDate = new Date(Date.now() + dayOffset * 86400000).toISOString().slice(0, 10);
      for (let b = 0; b < blocksPerDay && cursor < incomplete.length; b++) {
        const item = incomplete[cursor++];
        const startHour = 7 + b * 3;
        generated.push({
          id: `rt_gen_${Date.now()}_${cursor}`,
          title: `${item.subjName}: ${item.chName}`,
          routineType: 'study',
          subjectId: item.subjId,
          date: targetDate,
          repeat: 'none',
          startTime: `${String(startHour).padStart(2, '0')}:00`,
          endTime: `${String(startHour + 1).padStart(2, '0')}:30`,
          reminderTime: `${String(startHour - 1).padStart(2, '0')}:50`,
          done: false,
          progress: 0,
        });
      }
    }

    setRoutinesBulk([...data.routines.filter((r) => !r.id.startsWith('rt_gen_')), ...generated]);
  };

  const handleCopyLastWeek = () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const oldOnes = data.routines.filter((r) => r.repeat === 'none' && r.date >= sevenDaysAgo && r.date < today);
    if (oldOnes.length === 0) return;
    const copied = oldOnes.map((r, i) => {
      const nextD = new Date(new Date(r.date + 'T12:00:00').getTime() + 7 * 86400000).toISOString().slice(0, 10);
      return {
        ...r,
        id: `rt_copy_${Date.now()}_${i}`,
        date: nextD,
        done: false,
        progress: 0,
      };
    });
    setRoutinesBulk([...data.routines, ...copied]);
  };

  const curReflection = data.dailyReflections[selectedDate] || {
    date: selectedDate,
    priorities: ['', '', ''] as [string, string, string],
    reflection: '',
  };

  const monthNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Build current month calendar days
  const selDateObj = new Date(selectedDate + 'T12:00:00');
  const yearNum = selDateObj.getFullYear();
  const monthIdx = selDateObj.getMonth();
  const daysInMonth = new Date(yearNum, monthIdx + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dStr = `${yearNum}-${String(monthIdx + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    return dStr;
  });

  // Weekly 7 days starting today
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + (i - 2) * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const weeklyLoggedHours =
    data.studySessions
      .filter((s) => weekDays.includes(s.date))
      .reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
  const weeklyGoalHours = (data.profile?.goals.dailyStudyHours || 4) * 7;

  return (
    <div className="space-y-4">
      {/* Type Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'all', label: t('all', lang) },
            { id: 'study', label: t('typeStudy', lang) },
            { id: 'daily', label: t('typeDaily', lang) },
            { id: 'money', label: t('typeMoney', lang) },
          ] as const
        ).map((tf) => (
          <button
            key={tf.id}
            type="button"
            onClick={() => setTypeFilter(tf.id)}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold shrink-0 ${
              typeFilter === tf.id
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* View Switcher + Add Routine */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-1">
          {(
            [
              { id: 'daily', label: t('viewDaily', lang) },
              { id: 'weekly', label: t('viewWeekly', lang) },
              { id: 'monthly', label: t('viewMonthly', lang) },
              { id: 'yearly', label: t('viewYearly', lang) },
            ] as const
          ).map((vm) => (
            <button
              key={vm.id}
              type="button"
              onClick={() => setViewMode(vm.id)}
              className={`min-h-[38px] rounded-lg text-xs font-bold ${
                viewMode === vm.id ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {vm.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addRoutineBtn', lang)}</span>
        </button>
      </div>

      {/* Action Buttons: Generate Plan & Copy Last Week */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerateAutoPlan}
          className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('generatePlanBtn', lang)}</span>
        </button>
        <button
          type="button"
          onClick={handleCopyLastWeek}
          className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
        >
          <Copy className="w-4 h-4" />
          <span>{t('copyLastWeekBtn', lang)}</span>
        </button>
      </div>

      {/* Add Routine Form */}
      {showAdd && (
        <form
          onSubmit={handleCreateRoutine}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"
        >
          <input
            type="text"
            required
            value={rTitle}
            onChange={(e) => setRTitle(e.target.value)}
            placeholder={lang === 'bn' ? 'রুটিনের নাম লিখুন' : 'Routine title'}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={rType}
              onChange={(e) => setRType(e.target.value as 'study' | 'daily' | 'money')}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="study">{t('typeStudy', lang)}</option>
              <option value="daily">{t('typeDaily', lang)}</option>
              <option value="money">{t('typeMoney', lang)}</option>
            </select>

            <select
              value={rRepeat}
              onChange={(e) => setRRepeat(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="daily">{lang === 'bn' ? 'প্রতিদিন' : 'Daily'}</option>
              <option value="weekly">{lang === 'bn' ? 'সাপ্তাহিক' : 'Weekly'}</option>
              <option value="monthly">{lang === 'bn' ? 'মাসিক' : 'Monthly'}</option>
              <option value="none">{lang === 'bn' ? 'নির্দিষ্ট দিন' : 'One-time'}</option>
            </select>
          </div>

          {rType === 'study' && (
            <select
              value={rSubjectId}
              onChange={(e) => setRSubjectId(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
            >
              <option value="none">{t('noSubjectOption', lang)}</option>
              {data.subjects
                .filter((s) => !s.archived && !s.hidden)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {lang === 'bn' ? s.bn : s.en}
                  </option>
                ))}
            </select>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">{lang === 'bn' ? 'শুরু' : 'Start'}</label>
              <input
                type="time"
                value={rStart}
                onChange={(e) => setRStart(e.target.value)}
                className="w-full min-h-[44px] px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">{lang === 'bn' ? 'শেষ' : 'End'}</label>
              <input
                type="time"
                value={rEnd}
                onChange={(e) => setREnd(e.target.value)}
                className="w-full min-h-[44px] px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">{lang === 'bn' ? 'রিমাইন্ডার' : 'Reminder'}</label>
              <input
                type="time"
                value={rReminder}
                onChange={(e) => setRReminder(e.target.value)}
                className="w-full min-h-[44px] px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={rIsCoaching}
              onChange={(e) => setRIsCoaching(e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            <span>{lang === 'bn' ? 'নির্ধারিত সাপ্তাহিক ক্লাস / কোচিং' : 'Fixed Weekly Class / Coaching'}</span>
          </label>

          <button type="submit" className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold">
            {t('save', lang)}
          </button>
        </form>
      )}

      {/* DAILY VIEW */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="min-h-[40px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
            />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {formatShortHijri(new Date(selectedDate + 'T12:00:00'), hijriAdj, lang)}
            </span>
          </div>

          {/* Fixed Prayer Blocks + Day Routines */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
            <p className="text-xs font-bold text-slate-500">
              {t('fixedPrayerBlock', lang)}: {' '}
              {lang === 'bn' ? 'ফজর' : 'Fajr'} {formatTime12h(prayerSched.fajr, lang)} ·{' '}
              {lang === 'bn' ? 'যোহর' : 'Dhuhr'} {formatTime12h(prayerSched.dhuhr, lang)} ·{' '}
              {lang === 'bn' ? 'আসর' : 'Asr'} {formatTime12h(prayerSched.asr, lang)} ·{' '}
              {lang === 'bn' ? 'মাগরিব' : 'Maghrib'} {formatTime12h(prayerSched.maghrib, lang)} ·{' '}
              {lang === 'bn' ? 'এশা' : 'Isha'} {formatTime12h(prayerSched.isha, lang)}
            </p>

            {routinesForDay(selectedDate).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                {lang === 'bn' ? 'এই দিনের জন্য কোনো রুটিন নেই' : 'No routines scheduled for this day'}
              </p>
            ) : (
              routinesForDay(selectedDate).map((rt) => (
                <div
                  key={rt.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => toggleRoutineDone(rt.id)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 ${
                        rt.done ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${rt.done ? 'line-through text-slate-400' : ''}`}>
                        {rt.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatHHMM(rt.startTime, lang)} - {formatHHMM(rt.endTime, lang)} ·{' '}
                        {rt.routineType === 'study'
                          ? t('typeStudy', lang)
                          : rt.routineType === 'money'
                          ? t('typeMoney', lang)
                          : t('typeDaily', lang)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRoutine(rt.id)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Top 3 Priorities & Reflection */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
            <h4 className="text-xs font-bold">{t('top3Priorities', lang)}</h4>
            {[0, 1, 2].map((idx) => (
              <input
                key={idx}
                type="text"
                value={curReflection.priorities[idx]}
                onChange={(e) => {
                  const nextP: [string, string, string] = [...curReflection.priorities] as [string, string, string];
                  nextP[idx] = e.target.value;
                  saveDailyReflection(selectedDate, nextP, curReflection.reflection);
                }}
                placeholder={`${formatNum(idx + 1, lang)}.`}
                className="w-full min-h-[42px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
              />
            ))}
            <label className="block text-xs font-bold pt-1">{t('dailyReflectionLabel', lang)}</label>
            <textarea
              rows={2}
              value={curReflection.reflection}
              onChange={(e) => saveDailyReflection(selectedDate, curReflection.priorities, e.target.value)}
              placeholder={lang === 'bn' ? 'আজকের দিনটি কেমন কাটল?' : 'How did today go?'}
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
            />
          </div>
        </div>
      )}

      {/* WEEKLY VIEW */}
      {viewMode === 'weekly' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
            <span className="text-xs font-bold">
              {lang === 'bn' ? 'সাপ্তাহিক পড়া বনাম লক্ষ্য' : 'Weekly Hours vs Goal'}
            </span>
            <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatNum(weeklyLoggedHours, lang, 1)} / {formatNum(weeklyGoalHours, lang)} {t('hoursUnit', lang)}
            </span>
          </div>

          {weekDays.map((wd) => {
            const list = routinesForDay(wd);
            return (
              <div
                key={wd}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{toLocalDigits(wd, lang)}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatShortHijri(new Date(wd + 'T12:00:00'), hijriAdj, lang)}
                  </span>
                </div>
                {list.length === 0 ? (
                  <p className="text-[11px] text-slate-400">{lang === 'bn' ? 'কোনো রুটিন নেই' : 'No routines'}</p>
                ) : (
                  list.map((r) => (
                    <div key={r.id} className="text-xs text-slate-700 dark:text-slate-300 flex justify-between">
                      <span className="truncate">{r.title}</span>
                      <span className="text-slate-400 shrink-0">{formatHHMM(r.startTime, lang)}</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <label className="block text-xs font-bold">
              {lang === 'bn' ? 'সাপ্তাহিক পর্যালোচনা' : 'Weekly Review'}
            </label>
            <textarea
              rows={2}
              value={data.weeklyReviewNote}
              onChange={(e) => setWeeklyReviewNote(e.target.value)}
              placeholder={lang === 'bn' ? 'এই সপ্তাহের অর্জন ও পরবর্তী লক্ষ্য...' : 'Wins and lessons from this week...'}
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
            />
          </div>
        </div>
      )}

      {/* MONTHLY VIEW (with Hijri date under each day) */}
      {viewMode === 'monthly' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-3">
          <h4 className="text-sm font-bold text-center">
            {lang === 'bn' ? monthNamesBn[monthIdx] : monthNamesEn[monthIdx]} {formatNum(yearNum, lang)}
          </h4>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((dStr) => {
              const dObj = new Date(dStr + 'T12:00:00');
              const hDay = formatShortHijri(dObj, hijriAdj, lang).split(' ')[0];
              const dayRoutines = routinesForDay(dStr);
              const hasExam = data.exams.some((ex) => ex.date === dStr);
              const isSelected = dStr === selectedDate;
              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(dStr);
                    setViewMode('daily');
                  }}
                  className={`min-h-[48px] rounded-xl p-1 flex flex-col items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : hasExam
                      ? 'bg-amber-500/15 border-amber-500/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-transparent'
                  }`}
                >
                  <span className="text-xs font-bold tabular-nums">{formatNum(Number(dStr.slice(8, 10)), lang)}</span>
                  <span className={`text-[9px] tabular-nums ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {hDay}
                  </span>
                  {dayRoutines.length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* YEARLY VIEW */}
      {viewMode === 'yearly' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Array.from({ length: 12 }, (_, mIdx) => (
            <div
              key={mIdx}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">
                  {lang === 'bn' ? monthNamesBn[mIdx] : monthNamesEn[mIdx]}
                </span>
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <input
                type="text"
                value={data.yearlyGoals[mIdx] || ''}
                onChange={(e) => setYearlyGoal(mIdx, e.target.value)}
                placeholder={lang === 'bn' ? 'মাসিক লক্ষ্য লিখুন...' : 'Monthly target...'}
                className="w-full min-h-[40px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const StudyProgressTab: React.FC = () => {
  const { data, lang } = useLifeTrack();
  const today = new Date().toISOString().slice(0, 10);

  const todayMins = data.studySessions
    .filter((s) => s.date === today)
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
    const mins = data.studySessions.filter((s) => s.date === d).reduce((a, b) => a + b.durationMinutes, 0);
    return {
      date: toLocalDigits(d.slice(8, 10), lang),
      hours: Math.round((mins / 60) * 10) / 10,
    };
  });

  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(Date.now() - (27 - i) * 86400000).toISOString().slice(0, 10);
    const mins = data.studySessions.filter((s) => s.date === d).reduce((a, b) => a + b.durationMinutes, 0);
    return { date: d, mins };
  });

  const weekMins = data.studySessions
    .filter((s) => s.date >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10))
    .reduce((a, b) => a + b.durationMinutes, 0);

  const monthMins = data.studySessions
    .filter((s) => s.date.slice(0, 7) === today.slice(0, 7))
    .reduce((a, b) => a + b.durationMinutes, 0);

  // Streak calculation
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const has = data.studySessions.some((s) => s.date === d && s.durationMinutes > 0);
    if (has) streak++;
    else if (i > 0) break;
  }

  // Hours per subject Pie
  const subjMap = new Map(data.subjects.map((s) => [s.id, s]));
  const totalsBySubj: Record<string, number> = {};
  for (const ss of data.studySessions) {
    totalsBySubj[ss.subjectId] = (totalsBySubj[ss.subjectId] || 0) + ss.durationMinutes;
  }
  const pieData = Object.entries(totalsBySubj).map(([sid, mins]) => {
    const s = subjMap.get(sid);
    return {
      name: s ? (lang === 'bn' ? s.bn : s.en) : t('noSubjectOption', lang),
      value: Math.round((mins / 60) * 10) / 10,
      color: s?.color || '#64748b',
    };
  });

  const syllabusStats = getOverallHscStats(data.subjects);
  const goalHours = data.profile?.goals.dailyStudyHours || 4;
  const onTrack = todayMins / 60 >= goalHours * 0.6;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5">
          <p className="text-xs text-slate-500">{t('today', lang)}</p>
          <p className="text-xl font-bold tabular-nums mt-1">
            {formatNum(todayMins / 60, lang, 1)} {t('hoursUnit', lang)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5">
          <p className="text-xs text-slate-500">{lang === 'bn' ? '৭ দিন' : '7 Days'}</p>
          <p className="text-xl font-bold tabular-nums mt-1">
            {formatNum(weekMins / 60, lang, 1)} {t('hoursUnit', lang)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5">
          <p className="text-xs text-slate-500">{lang === 'bn' ? 'এই মাস' : 'This Month'}</p>
          <p className="text-xl font-bold tabular-nums mt-1">
            {formatNum(monthMins / 60, lang, 1)} {t('hoursUnit', lang)}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5">
          <p className="text-xs text-slate-500">{lang === 'bn' ? 'ধারাবাহিকতা' : 'Streak'}</p>
          <p className="text-xl font-bold tabular-nums mt-1 flex items-center gap-1 text-amber-500">
            <Flame className="w-5 h-5" />
            {formatNum(streak, lang)}
          </p>
        </div>
      </div>

      {/* Syllabus % & Status */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{lang === 'bn' ? 'সিলেবাস অগ্রগতি' : 'Syllabus Completion'}</p>
          <p className="text-lg font-bold tabular-nums">{formatNum(syllabusStats.overallPct, lang, 1)}%</p>
        </div>
        <span
          className={`text-xs font-bold ${
            onTrack ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {onTrack
            ? lang === 'bn'
              ? 'সঠিক পথে আছেন'
              : 'On Track'
            : lang === 'bn'
            ? 'গতি বাড়ানো প্রয়োজন'
            : 'Behind Target'}
        </span>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
        <h4 className="text-xs font-bold">{lang === 'bn' ? 'দৈনিক পড়ার ঘণ্টা (৭ দিন)' : 'Daily Study Hours (7 Days)'}</h4>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Days}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Bar dataKey="hours" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart by Subject */}
      {pieData.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
          <h4 className="text-xs font-bold">{lang === 'bn' ? 'বিষয়ভিত্তিক সময়' : 'Hours by Subject'}</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={3}>
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 28-Day Heatmap */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
        <h4 className="text-xs font-bold">{lang === 'bn' ? 'মাসিক পড়ার হিটম্যাপ' : 'Monthly Study Heatmap'}</h4>
        <div className="grid grid-cols-7 gap-1.5">
          {last28Days.map((item) => {
            const intensity =
              item.mins >= 180
                ? 'bg-emerald-600'
                : item.mins >= 90
                ? 'bg-emerald-500/70'
                : item.mins > 0
                ? 'bg-emerald-500/35'
                : 'bg-slate-100 dark:bg-slate-800';
            return (
              <div
                key={item.date}
                title={`${item.date}: ${item.mins}m`}
                className={`h-7 rounded-lg ${intensity}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const StudyExamsTab: React.FC = () => {
  const { data, lang, saveExam, deleteExam } = useLifeTrack();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('none');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isModelTest, setIsModelTest] = useState(true);
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    saveExam({
      id: `exam_${Date.now()}`,
      title: title.trim(),
      subjectId,
      date,
      isModelTest,
      score: score !== '' ? Number(score) : undefined,
      maxScore: maxScore !== '' ? Number(maxScore) : 100,
    });
    setTitle('');
    setScore('');
    setShowAdd(false);
  };

  const modelTestsWithScores = data.exams
    .filter((ex) => ex.isModelTest && ex.score !== undefined && (ex.maxScore || 100) > 0)
    .map((ex) => ({
      name: ex.title.slice(0, 10),
      pct: Math.round(((ex.score || 0) / (ex.maxScore || 100)) * 100),
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">{t('studyTabExams', lang)}</h3>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t('add', lang)}</span>
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={lang === 'bn' ? 'পরীক্ষা বা মডেল টেস্টের নাম' : 'Exam or Model Test title'}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
            >
              <option value="none">{t('noSubjectOption', lang)}</option>
              {data.subjects
                .filter((s) => !s.archived)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {lang === 'bn' ? s.bn : s.en}
                  </option>
                ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={isModelTest}
              onChange={(e) => setIsModelTest(e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            <span>{lang === 'bn' ? 'এটি একটি মডেল টেস্ট (নম্বরসহ)' : 'Model Test (with score)'}</span>
          </label>

          {isModelTest && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder={lang === 'bn' ? 'প্রাপ্ত নম্বর' : 'Score'}
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
              <input
                type="number"
                inputMode="decimal"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder={lang === 'bn' ? 'মোট নম্বর' : 'Max score'}
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
            </div>
          )}

          <button type="submit" className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold">
            {t('save', lang)}
          </button>
        </form>
      )}

      {modelTestsWithScores.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
          <h4 className="text-xs font-bold">{lang === 'bn' ? 'মডেল টেস্ট নম্বর প্রবণতা (%)' : 'Model Test Score Trend (%)'}</h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={modelTestsWithScores}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={28} />
                <Tooltip />
                <Line type="monotone" dataKey="pct" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data.exams.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <Trophy className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-sm text-slate-500">
            {lang === 'bn' ? 'এখনও কোনো পরীক্ষা যোগ করা হয়নি' : 'No exams or model tests added yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.exams.map((ex) => {
            const daysDiff = Math.ceil((new Date(ex.date + 'T00:00:00').getTime() - Date.now()) / 86400000);
            return (
              <div
                key={ex.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{ex.title}</p>
                  <p className="text-xs text-slate-500">
                    {toLocalDigits(ex.date, lang)}
                    {daysDiff >= 0 && ` · ${formatNum(daysDiff, lang)} ${t('daysLeft', lang)}`}
                    {ex.score !== undefined &&
                      ` · ${formatNum(ex.score, lang)}/${formatNum(ex.maxScore || 100, lang)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteExam(ex.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
