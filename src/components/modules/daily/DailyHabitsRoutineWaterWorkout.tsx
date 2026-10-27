import React, { useEffect, useState } from 'react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flame,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { formatHHMM, formatNum, t, toLocalDigits } from '../../../utils/i18n';
import { EXERCISE_LIBRARY, QUICK_WORKOUT_ROUTINES } from '../../../utils/starterData';
import { playTimerChime } from '../../../utils/security';

export const DailyHabitsTab: React.FC = () => {
  const {
    data,
    lang,
    saveHabitDef,
    deleteHabitDef,
    toggleHabitToday,
    saveTask,
    toggleTaskDone,
    deleteTask,
  } = useLifeTrack();

  const today = new Date().toISOString().slice(0, 10);
  const [newHabitName, setNewHabitName] = useState('');
  const [taskFilter, setTaskFilter] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [showAddTask, setShowAddTask] = useState(false);

  // Task form
  const [tkTitle, setTkTitle] = useState('');
  const [tkCat, setTkCat] = useState<'study' | 'home' | 'personal' | 'coaching' | 'other'>('study');
  const [tkDate, setTkDate] = useState(today);
  const [tkTime, setTkTime] = useState('18:00');
  const [tkPriority, setTkPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [tkSubtaskText, setTkSubtaskText] = useState('');

  const todayHabitMap = data.habitLogs[today] || {};

  const getHabitStreak = (habitId: string) => {
    let s = 0;
    for (let i = 0; i < 120; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      if (data.habitLogs[d]?.[habitId]) s++;
      else if (i > 0) break;
    }
    return s;
  };

  const last28Days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(Date.now() - (27 - i) * 86400000).toISOString().slice(0, 10);
    const doneCount = Object.values(data.habitLogs[d] || {}).filter(Boolean).length;
    return { date: d, doneCount };
  });

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    saveHabitDef({
      id: `hab_${Date.now()}`,
      bn: newHabitName.trim(),
      en: newHabitName.trim(),
      icon: 'Sparkles',
      color: '#059669',
    });
    setNewHabitName('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tkTitle.trim()) return;
    const subs = tkSubtaskText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s, idx) => ({ id: `sub_${Date.now()}_${idx}`, title: s, done: false }));

    saveTask({
      id: `task_${Date.now()}`,
      title: tkTitle.trim(),
      category: tkCat,
      date: tkDate,
      time: tkTime,
      priority: tkPriority,
      repeat: 'none',
      reminderTime: tkTime,
      done: false,
      subtasks: subs,
    });
    setTkTitle('');
    setTkSubtaskText('');
    setShowAddTask(false);
  };

  const filteredTasks = data.tasks.filter((tk) => {
    if (taskFilter === 'completed') return tk.done;
    if (taskFilter === 'upcoming') return !tk.done && tk.date > today;
    return !tk.done && tk.date <= today;
  });

  return (
    <div className="space-y-5">
      {/* Daily Habits Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <h3 className="text-sm font-bold">{lang === 'bn' ? 'দৈনিক অভ্যাস' : 'Daily Habits'}</h3>

        <form onSubmit={handleCreateHabit} className="flex gap-2">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder={lang === 'bn' ? 'নতুন অভ্যাস যোগ করুন...' : 'Add custom habit...'}
            className="flex-1 min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0"
          >
            {t('add', lang)}
          </button>
        </form>

        <div className="space-y-2">
          {data.habits.map((hab) => {
            const done = Boolean(todayHabitMap[hab.id]);
            const streak = getHabitStreak(hab.id);
            return (
              <div
                key={hab.id}
                className="min-h-[48px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 flex items-center justify-between gap-2"
              >
                <button
                  type="button"
                  onClick={() => toggleHabitToday(hab.id, today)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                      done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {done && <Check className="w-4 h-4" />}
                  </span>
                  <span className={`text-sm font-semibold ${done ? 'line-through text-slate-400' : ''}`}>
                    {lang === 'bn' ? hab.bn : hab.en}
                  </span>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5 tabular-nums">
                    <Flame className="w-3.5 h-3.5" />
                    {formatNum(streak, lang)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteHabitDef(hab.id)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Monthly Habit Heatmap */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">
            {lang === 'bn' ? 'মাসিক অভ্যাস হিটম্যাপ' : 'Monthly Habit Consistency'}
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {last28Days.map((item) => (
              <div
                key={item.date}
                className={`h-6 rounded-md ${
                  item.doneCount >= 3
                    ? 'bg-emerald-600'
                    : item.doneCount >= 1
                    ? 'bg-emerald-500/45'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* General Tasks Section */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{lang === 'bn' ? 'দৈনন্দিন কাজসমূহ' : 'Daily Tasks'}</h3>
          <button
            type="button"
            onClick={() => setShowAddTask((v) => !v)}
            className="min-h-[40px] px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add', lang)}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {(['today', 'upcoming', 'completed'] as const).map((flt) => (
            <button
              key={flt}
              type="button"
              onClick={() => setTaskFilter(flt)}
              className={`min-h-[38px] rounded-lg text-xs font-bold ${
                taskFilter === flt ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
              }`}
            >
              {t(flt, lang)}
            </button>
          ))}
        </div>

        {showAddTask && (
          <form onSubmit={handleCreateTask} className="space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <input
              type="text"
              required
              value={tkTitle}
              onChange={(e) => setTkTitle(e.target.value)}
              placeholder={lang === 'bn' ? 'কাজের শিরোনাম' : 'Task title'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={tkCat}
                onChange={(e) => setTkCat(e.target.value as typeof tkCat)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 text-xs"
              >
                <option value="study">{lang === 'bn' ? 'পড়াশোনা' : 'Study'}</option>
                <option value="home">{lang === 'bn' ? 'বাসা' : 'Home'}</option>
                <option value="personal">{lang === 'bn' ? 'ব্যক্তিগত' : 'Personal'}</option>
                <option value="coaching">{lang === 'bn' ? 'কোচিং' : 'Coaching'}</option>
                <option value="other">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
              </select>
              <select
                value={tkPriority}
                onChange={(e) => setTkPriority(e.target.value as typeof tkPriority)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 text-xs"
              >
                <option value="high">{lang === 'bn' ? 'জরুরি' : 'High Priority'}</option>
                <option value="medium">{lang === 'bn' ? 'মাঝারি' : 'Medium Priority'}</option>
                <option value="low">{lang === 'bn' ? 'সাধারণ' : 'Low Priority'}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={tkDate}
                onChange={(e) => setTkDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 text-xs"
              />
              <input
                type="time"
                value={tkTime}
                onChange={(e) => setTkTime(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <input
              type="text"
              value={tkSubtaskText}
              onChange={(e) => setTkSubtaskText(e.target.value)}
              placeholder={lang === 'bn' ? 'সাব-টাস্ক (কমা দিয়ে লিখুন)' : 'Subtasks (comma separated)'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 text-xs"
            />
            <button type="submit" className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold">
              {t('save', lang)}
            </button>
          </form>
        )}

        {filteredTasks.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">{t('noTasksToday', lang)}</p>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((tk) => (
              <div key={tk.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTaskDone(tk.id)}
                    className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                  >
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${tk.done ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${tk.done ? 'line-through text-slate-400' : ''}`}>
                        {tk.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {toLocalDigits(tk.date, lang)} · {formatHHMM(tk.time, lang)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(tk.id)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Shared Routine view reading directly from data.routines (daily life + all)
export const DailyRoutineTab: React.FC = () => {
  const { data, lang, saveRoutine, toggleRoutineDone, deleteRoutine } = useLifeTrack();
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('06:30');
  const [end, setEnd] = useState('07:15');

  const dailyRoutines = data.routines.filter((r) => r.routineType === 'daily' || r.repeat === 'daily');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    saveRoutine({
      id: `rt_daily_${Date.now()}`,
      title: title.trim(),
      routineType: 'daily',
      subjectId: 'none',
      date: today,
      repeat: 'daily',
      startTime: start,
      endTime: end,
      reminderTime: start,
      done: false,
      progress: 0,
    });
    setTitle('');
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleAdd}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"
      >
        <h3 className="text-sm font-bold">{lang === 'bn' ? 'দৈনন্দিন রুটিন ব্লক যোগ করুন' : 'Add Daily Life Time Block'}</h3>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === 'bn' ? 'যেমন: সকালের হাঁটা বা নাস্তা' : 'e.g., Morning walk & breakfast'}
          className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
          />
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
          />
        </div>
        <button type="submit" className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold">
          {t('addRoutineBtn', lang)}
        </button>
      </form>

      <div className="space-y-2.5">
        {dailyRoutines.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-2"
          >
            <button
              type="button"
              onClick={() => toggleRoutineDone(r.id)}
              className="flex items-center gap-3 flex-1 text-left min-w-0"
            >
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${r.done ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="min-w-0">
                <p className={`text-sm font-bold truncate ${r.done ? 'line-through text-slate-400' : ''}`}>{r.title}</p>
                <p className="text-xs text-slate-500">
                  {formatHHMM(r.startTime, lang)} - {formatHHMM(r.endTime, lang)}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => deleteRoutine(r.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DailyWaterTab: React.FC = () => {
  const { data, lang, setWaterGlasses } = useLifeTrack();
  const today = new Date().toISOString().slice(0, 10);
  const current = data.waterLogs[today] || 0;
  const goal = data.profile?.goals.dailyWaterGlasses || 8;
  const pct = Math.min(100, Math.round((current / goal) * 100));

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mx-auto">
        <Droplets className="w-9 h-9" />
      </div>

      <div>
        <p className="text-3xl font-bold tabular-nums">
          {formatNum(current, lang)} / {formatNum(goal, lang)}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {lang === 'bn' ? 'আজকের পানি পানের গ্লাস' : 'Glasses of water today'} ({formatNum(pct, lang)}%)
        </p>
      </div>

      <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden max-w-xs mx-auto">
        <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setWaterGlasses(today, current - 1)}
          className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
        >
          <Minus className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={() => setWaterGlasses(today, current + 1)}
          className="h-14 px-8 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>{lang === 'bn' ? '১ গ্লাস যোগ' : '+1 Glass'}</span>
        </button>
      </div>
    </div>
  );
};

export const DailyWorkoutTab: React.FC = () => {
  const {
    data,
    lang,
    addWorkoutLog,
    deleteWorkoutLog,
    updateTimer,
    addWeightEntry,
  } = useLifeTrack();

  const today = new Date().toISOString().slice(0, 10);
  const timer = data.activeTimers.workout;
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [exKey, setExKey] = useState('pushups');
  const [customEx, setCustomEx] = useState('');
  const [mode, setMode] = useState<'reps' | 'duration' | 'distance'>('reps');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [durationMin, setDurationMin] = useState('15');
  const [distanceKm, setDistanceKm] = useState('2');

  // Weight & BMI (strictly >= 18 only!)
  const userAge = data.profile?.age ?? 18;
  const isAdult = userAge >= 18;
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('168');

  useEffect(() => {
    if (!timer.isRunning) return;
    const tick = () => setNowMs(Date.now());
    const id = window.setInterval(tick, 300);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [timer.isRunning]);

  const remMs = timer.isRunning && timer.targetEndMs ? Math.max(0, timer.targetEndMs - nowMs) : timer.remainingMsWhenPaused;
  const remSec = Math.ceil(remMs / 1000);

  const handleLogWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    const found = EXERCISE_LIBRARY.find((x) => x.key === exKey);
    const met = found?.met || 5.0;
    const estMins =
      mode === 'duration'
        ? Math.max(1, Number(durationMin) || 10)
        : mode === 'distance'
        ? Math.max(5, Math.round((Number(distanceKm) || 1) * 7))
        : Math.max(3, Math.round(((Number(sets) || 1) * (Number(reps) || 10)) / 8));
    const approxCal = Math.round(met * 60 * (estMins / 60));

    addWorkoutLog({
      exerciseKey: exKey,
      customExerciseName: exKey === 'custom' ? customEx.trim() : undefined,
      mode,
      sets: mode === 'reps' ? Number(sets) || 1 : 0,
      reps: mode === 'reps' ? Number(reps) || 10 : 0,
      durationMinutes: estMins,
      distanceKm: mode === 'distance' ? Number(distanceKm) || 0 : 0,
      calories: approxCal,
      date: today,
    });
  };

  const startQuickRoutine = (minutes: number, label: string) => {
    playTimerChime();
    const now = Date.now();
    updateTimer('workout', (prev) => ({
      ...prev,
      isRunning: true,
      workMinutes: minutes,
      startedAtMs: now,
      targetEndMs: now + minutes * 60 * 1000,
      remainingMsWhenPaused: minutes * 60 * 1000,
      workoutLabel: label,
    }));
  };

  const last7Workout = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
    const mins = data.workoutLogs.filter((w) => w.date === d).reduce((a, b) => a + b.durationMinutes, 0);
    return { date: toLocalDigits(d.slice(8, 10), lang), mins };
  });

  const latestWeight = data.weightLogs[data.weightLogs.length - 1];
  const bmi =
    latestWeight && latestWeight.heightCm > 0
      ? Math.round((latestWeight.weightKg / Math.pow(latestWeight.heightCm / 100, 2)) * 10) / 10
      : null;

  return (
    <div className="space-y-4">
      {/* Safety Banner */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">{t('workoutSafetyNote', lang)}</p>
      </div>

      {/* Quick Routines + Accurate Workout Timer */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{lang === 'bn' ? 'দ্রুত রুটিন ও টাইমার' : 'Quick Routines & Timer'}</h3>
          <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {toLocalDigits(String(Math.floor(remSec / 60)).padStart(2, '0'), lang)}:
            {toLocalDigits(String(remSec % 60).padStart(2, '0'), lang)}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const now = Date.now();
              if (!timer.isRunning) {
                playTimerChime();
                updateTimer('workout', (p) => ({
                  ...p,
                  isRunning: true,
                  startedAtMs: p.startedAtMs ?? now,
                  targetEndMs: now + p.remainingMsWhenPaused,
                }));
              } else {
                updateTimer('workout', (p) => ({
                  ...p,
                  isRunning: false,
                  targetEndMs: null,
                  remainingMsWhenPaused: p.targetEndMs ? Math.max(0, p.targetEndMs - now) : p.remainingMsWhenPaused,
                }));
              }
            }}
            className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
          >
            {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{timer.isRunning ? t('pauseBtn', lang) : t('startBtn', lang)}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              updateTimer('workout', (p) => ({
                ...p,
                isRunning: false,
                startedAtMs: null,
                targetEndMs: null,
                remainingMsWhenPaused: p.workMinutes * 60 * 1000,
              }))
            }
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {QUICK_WORKOUT_ROUTINES.map((qr) => (
            <button
              key={qr.id}
              type="button"
              onClick={() => startQuickRoutine(qr.minutes, lang === 'bn' ? qr.bn : qr.en)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-left space-y-1 hover:border-emerald-500 border border-transparent"
            >
              <p className="text-xs font-bold">{lang === 'bn' ? qr.bn : qr.en}</p>
              <p className="text-[11px] text-slate-500">
                {formatNum(qr.minutes, lang)} {t('minutesUnit', lang)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Log Exercise Form */}
      <form
        onSubmit={handleLogWorkout}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"
      >
        <h3 className="text-sm font-bold">{t('qaLogWorkout', lang)}</h3>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={exKey}
            onChange={(e) => {
              const k = e.target.value;
              setExKey(k);
              const f = EXERCISE_LIBRARY.find((x) => x.key === k);
              if (f) setMode(f.defaultMode);
            }}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
          >
            {EXERCISE_LIBRARY.map((ex) => (
              <option key={ex.key} value={ex.key}>
                {lang === 'bn' ? ex.bn : ex.en}
              </option>
            ))}
            <option value="custom">{lang === 'bn' ? 'কাস্টম ব্যায়াম' : 'Custom Exercise'}</option>
          </select>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="reps">{lang === 'bn' ? 'সেট x বার' : 'Sets x Reps'}</option>
            <option value="duration">{lang === 'bn' ? 'সময় (মিনিট)' : 'Duration'}</option>
            <option value="distance">{lang === 'bn' ? 'দূরত্ব (কিমি)' : 'Distance (km)'}</option>
          </select>
        </div>

        {exKey === 'custom' && (
          <input
            type="text"
            required
            value={customEx}
            onChange={(e) => setCustomEx(e.target.value)}
            placeholder={lang === 'bn' ? 'ব্যায়ামের নাম লিখুন' : 'Exercise name'}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
          />
        )}

        {mode === 'reps' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder={lang === 'bn' ? 'সেট' : 'Sets'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder={lang === 'bn' ? 'বার' : 'Reps'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
          </div>
        )}

        {mode === 'duration' && (
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            placeholder={t('minutesUnit', lang)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
          />
        )}

        {mode === 'distance' && (
          <input
            type="number"
            inputMode="decimal"
            min={0.1}
            step="0.1"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            placeholder={lang === 'bn' ? 'কিলোমিটার' : 'Kilometers'}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
          />
        )}

        <button type="submit" className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold">
          {t('save', lang)}
        </button>
      </form>

      {/* Weekly Activity Chart */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
        <h4 className="text-xs font-bold">{lang === 'bn' ? 'সাপ্তাহিক ব্যায়ামের মিনিট' : 'Weekly Activity Minutes'}</h4>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7Workout}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Bar dataKey="mins" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Age-Gated Weight & BMI: ONLY for users aged 18 or older! */}
      {isAdult ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold">{lang === 'bn' ? 'ওজন ও বিএমআই ট্র্যাকার (১৮+)' : 'Weight & BMI Tracker (18+)'}</h4>
            {bmi !== null && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                BMI: {formatNum(bmi, lang, 1)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder={lang === 'bn' ? 'ওজন (কেজি)' : 'Weight (kg)'}
              className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
            />
            <input
              type="number"
              inputMode="numeric"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder={lang === 'bn' ? 'উচ্চতা (সেমি)' : 'Height (cm)'}
              className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                const w = Number(weightKg);
                const h = Number(heightCm);
                if (!w || w <= 0) return;
                addWeightEntry({ date: today, weightKg: w, heightCm: h || 168 });
                setWeightKg('');
              }}
              className="min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              {t('save', lang)}
            </button>
          </div>

          {data.weightLogs.length > 1 && (
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.weightLogs.slice(-10)}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weightKg" stroke="#059669" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-emerald-600/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
          {t('under18FitnessNote', lang)}
        </div>
      )}

      {/* Logged Workout Sessions */}
      <div className="space-y-2">
        {data.workoutLogs.slice(0, 12).map((w) => {
          const exObj = EXERCISE_LIBRARY.find((x) => x.key === w.exerciseKey);
          const title = w.customExerciseName || (exObj ? (lang === 'bn' ? exObj.bn : exObj.en) : w.exerciseKey);
          return (
            <div
              key={w.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Dumbbell className="w-4 h-4 text-teal-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{title}</p>
                  <p className="text-xs text-slate-500">
                    {formatNum(w.durationMinutes, lang)} {t('minutesUnit', lang)} · {t('approxCalories', lang)}:{' '}
                    {formatNum(w.calories, lang)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteWorkoutLog(w.id)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
