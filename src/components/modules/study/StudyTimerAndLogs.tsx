import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Clock, Pause, Play, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { formatNum, t, toLocalDigits } from '../../../utils/i18n';
import { playTimerChime } from '../../../utils/security';

export const StudyTimerTab: React.FC = () => {
  const { data, lang, updateTimer, addStudySession, addOrUpdateSubject } = useLifeTrack();
  const timer = data.activeTimers.pomodoro;

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newSubjModal, setNewSubjModal] = useState(false);
  const [newSubjBn, setNewSubjBn] = useState('');
  const [newSubjEn, setNewSubjEn] = useState('');
  const [newSubjColor, setNewSubjColor] = useState('#059669');
  const [customModal, setCustomModal] = useState(false);
  const [customWork, setCustomWork] = useState(String(timer.workMinutes));
  const [customBreak, setCustomBreak] = useState(String(timer.breakMinutes));

  useEffect(() => {
    if (!timer.isRunning) return;
    const tick = () => setNowMs(Date.now());
    const id = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [timer.isRunning]);

  const activeSubjects = data.subjects.filter((s) => !s.archived && !s.hidden);
  const selectedSubject = data.subjects.find((s) => s.id === timer.subjectId);

  const remainingMs =
    timer.isRunning && timer.targetEndMs
      ? Math.max(0, timer.targetEndMs - nowMs)
      : timer.remainingMsWhenPaused;

  const totalPhaseMs = (timer.phase === 'work' ? timer.workMinutes : timer.breakMinutes) * 60 * 1000;
  const elapsedMinutes = Math.floor(Math.max(0, totalPhaseMs - remainingMs) / 60000);

  const remTotalSec = Math.ceil(remainingMs / 1000);
  const minsStr = String(Math.floor(remTotalSec / 60)).padStart(2, '0');
  const secsStr = String(remTotalSec % 60).padStart(2, '0');
  const ringPct = totalPhaseMs > 0 ? Math.min(100, ((totalPhaseMs - remainingMs) / totalPhaseMs) * 100) : 0;

  const applyPreset = (workMin: number, breakMin: number) => {
    updateTimer('pomodoro', (prev) => ({
      ...prev,
      isRunning: false,
      phase: 'work',
      workMinutes: workMin,
      breakMinutes: breakMin,
      startedAtMs: null,
      targetEndMs: null,
      remainingMsWhenPaused: workMin * 60 * 1000,
    }));
  };

  const toggleStartPause = () => {
    const now = Date.now();
    if (!timer.isRunning) {
      // Unlock Web Audio context on user gesture
      playTimerChime();
      updateTimer('pomodoro', (prev) => ({
        ...prev,
        isRunning: true,
        startedAtMs: prev.startedAtMs ?? now,
        targetEndMs: now + prev.remainingMsWhenPaused,
      }));
    } else {
      updateTimer('pomodoro', (prev) => {
        const rem = prev.targetEndMs ? Math.max(0, prev.targetEndMs - now) : prev.remainingMsWhenPaused;
        return {
          ...prev,
          isRunning: false,
          targetEndMs: null,
          remainingMsWhenPaused: rem,
        };
      });
    }
  };

  const handleReset = () => {
    updateTimer('pomodoro', (prev) => ({
      ...prev,
      isRunning: false,
      phase: 'work',
      startedAtMs: null,
      targetEndMs: null,
      remainingMsWhenPaused: prev.workMinutes * 60 * 1000,
    }));
  };

  const handleSaveElapsedNow = () => {
    if (elapsedMinutes < 1) return;
    addStudySession({
      subjectId: timer.subjectId || 'none',
      topic: timer.topic.trim() || (lang === 'bn' ? 'পোমোডোরো সেশন' : 'Pomodoro Session'),
      durationMinutes: elapsedMinutes,
      date: new Date().toISOString().slice(0, 10),
      startedAt: new Date(timer.startedAtMs || Date.now() - elapsedMinutes * 60000).toISOString(),
      source: 'timer',
    });
    handleReset();
  };

  const handleCreateQuickSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBn = newSubjBn.trim() || newSubjEn.trim();
    const cleanEn = newSubjEn.trim() || newSubjBn.trim();
    if (!cleanBn) return;
    const id = `subj_custom_${Date.now()}`;
    addOrUpdateSubject({
      id,
      key: id,
      bn: cleanBn,
      en: cleanEn,
      color: newSubjColor,
      icon: 'BookOpen',
      hasTwoPapers: false,
      preloaded: false,
      hidden: false,
      archived: false,
      chapters: [],
    });
    updateTimer('pomodoro', (prev) => ({ ...prev, subjectId: id }));
    setNewSubjBn('');
    setNewSubjEn('');
    setNewSubjModal(false);
    setPickerOpen(false);
  };

  const presets = [
    { work: 25, brk: 5 },
    { work: 50, brk: 10 },
    { work: 90, brk: 15 },
  ];

  return (
    <div className="space-y-4">
      {/* Presets Row */}
      <div className="grid grid-cols-4 gap-2">
        {presets.map((p) => {
          const isSelected = timer.workMinutes === p.work && timer.breakMinutes === p.brk;
          return (
            <button
              key={p.work}
              type="button"
              onClick={() => applyPreset(p.work, p.brk)}
              className={`min-h-[44px] rounded-2xl text-xs font-bold transition-colors ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {formatNum(p.work, lang)}/{formatNum(p.brk, lang)}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCustomModal(true)}
          className="min-h-[44px] rounded-2xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
        >
          {t('customTimer', lang)}
        </button>
      </div>

      {/* Circular Timer Display */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center space-y-5 shadow-xs">
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {timer.phase === 'work' ? t('pomodoroWork', lang) : t('pomodoroBreak', lang)}
        </span>

        <div className="relative w-52 h-52 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - ringPct / 100)}
              className="text-emerald-600 dark:text-emerald-400 transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
              {toLocalDigits(minsStr, lang)}:{toLocalDigits(secsStr, lang)}
            </span>
          </div>
        </div>

        {/* Controlled Subject Bottom-Sheet Picker Trigger */}
        <div className="w-full space-y-2.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            {t('linkSubjectLabel', lang)}
          </label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full min-h-[48px] px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selectedSubject ? selectedSubject.color : '#64748b' }}
              />
              <span className="truncate">
                {selectedSubject
                  ? lang === 'bn'
                    ? selectedSubject.bn
                    : selectedSubject.en
                  : t('noSubjectOption', lang)}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          </button>

          <input
            type="text"
            value={timer.topic}
            onChange={(e) => updateTimer('pomodoro', (prev) => ({ ...prev, topic: e.target.value }))}
            placeholder={t('topicGoalPlaceholder', lang)}
            className="w-full min-h-[46px] px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
        </div>

        {/* Controls */}
        <div className="w-full flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleStartPause}
            className="flex-1 min-h-[50px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            {timer.isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{timer.isRunning ? t('pauseBtn', lang) : t('startBtn', lang)}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            aria-label={t('resetBtn', lang)}
            className="min-h-[50px] min-w-[50px] rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {timer.phase === 'work' && elapsedMinutes >= 1 && (
          <button
            type="button"
            onClick={handleSaveElapsedNow}
            className="w-full min-h-[44px] rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>
              {t('saveSessionBtn', lang)} ({formatNum(elapsedMinutes, lang)} {t('minutesUnit', lang)})
            </span>
          </button>
        )}
      </div>

      {/* Bottom Sheet Subject Picker */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setPickerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-8 max-h-[75vh] overflow-y-auto"
          >
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold">{t('linkSubjectLabel', lang)}</h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* 1. No Subject */}
              <button
                type="button"
                onClick={() => {
                  updateTimer('pomodoro', (prev) => ({ ...prev, subjectId: 'none' }));
                  setPickerOpen(false);
                }}
                className="w-full min-h-[48px] px-3 flex items-center justify-between text-sm font-medium"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <span>{t('noSubjectOption', lang)}</span>
                </div>
                {timer.subjectId === 'none' && <Check className="w-4 h-4 text-emerald-600" />}
              </button>

              {/* 2. Active Subjects */}
              {activeSubjects.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    updateTimer('pomodoro', (prev) => ({ ...prev, subjectId: s.id }));
                    setPickerOpen(false);
                  }}
                  className="w-full min-h-[48px] px-3 flex items-center justify-between text-sm font-medium"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="truncate">{lang === 'bn' ? s.bn : s.en}</span>
                  </div>
                  {timer.subjectId === s.id && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              ))}

              {/* 3. + Add New Subject */}
              <button
                type="button"
                onClick={() => setNewSubjModal(true)}
                className="w-full min-h-[48px] px-3 flex items-center gap-3 text-sm font-bold text-emerald-600 dark:text-emerald-400"
              >
                <span>{t('addNewSubjectOption', lang)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Subject Modal */}
      {newSubjModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateQuickSubject}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <h3 className="text-base font-bold">{t('addNewSubjectOption', lang)}</h3>
            <input
              type="text"
              required
              value={lang === 'bn' ? newSubjBn : newSubjEn}
              onChange={(e) => {
                if (lang === 'bn') setNewSubjBn(e.target.value);
                else setNewSubjEn(e.target.value);
              }}
              placeholder={lang === 'bn' ? 'বিষয়ের নাম লিখুন' : 'Subject name'}
              className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
            <div className="flex items-center gap-2">
              {['#059669', '#2563eb', '#d97706', '#e11d48', '#7c3aed', '#0891b2'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNewSubjColor(col)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newSubjColor === col ? 'border-white ring-2 ring-emerald-500' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setNewSubjModal(false)}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                {t('save', lang)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Pomodoro Modal */}
      {customModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-base font-bold">{t('customTimer', lang)}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold mb-1">{t('pomodoroWork', lang)}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={180}
                  value={customWork}
                  onChange={(e) => setCustomWork(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">{t('pomodoroBreak', lang)}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={60}
                  value={customBreak}
                  onChange={(e) => setCustomBreak(e.target.value)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomModal(false)}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="button"
                onClick={() => {
                  applyPreset(Math.max(1, Number(customWork) || 25), Math.max(1, Number(customBreak) || 5));
                  setCustomModal(false);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                {t('save', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const StudyLogsTab: React.FC = () => {
  const { data, lang, addStudySession, deleteStudySession } = useLifeTrack();
  const today = new Date().toISOString().slice(0, 10);

  const [filterSubj, setFilterSubj] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const [subjId, setSubjId] = useState('none');
  const [topic, setTopic] = useState('');
  const [mins, setMins] = useState('45');
  const [date, setDate] = useState(today);

  const subjectMap = new Map(data.subjects.map((s) => [s.id, s]));
  const activeSubjects = data.subjects.filter((s) => !s.archived && !s.hidden);

  const filtered = data.studySessions.filter((ss) => {
    if (filterSubj !== 'all' && ss.subjectId !== filterSubj) return false;
    if (filterDate && ss.date !== filterDate) return false;
    return true;
  });

  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = Math.max(1, Number(mins) || 0);
    addStudySession({
      subjectId: subjId,
      topic: topic.trim() || (lang === 'bn' ? 'স্বাভাবিক পড়াশোনা' : 'Manual Study'),
      durationMinutes: duration,
      date,
      startedAt: new Date().toISOString(),
      source: 'manual',
    });
    setTopic('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterSubj}
          onChange={(e) => setFilterSubj(e.target.value)}
          className="flex-1 min-w-[140px] min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
        >
          <option value="all">{t('all', lang)}</option>
          {/* Includes archived subjects so old logs remain filterable */}
          {data.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {lang === 'bn' ? s.bn : s.en}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
        />

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
          onSubmit={handleManualLog}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"
        >
          <select
            value={subjId}
            onChange={(e) => setSubjId(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
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
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('topicGoalPlaceholder', lang)}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={720}
              required
              value={mins}
              onChange={(e) => setMins(e.target.value)}
              placeholder={t('minutesUnit', lang)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-emerald-600 text-white text-sm font-bold"
          >
            {t('save', lang)}
          </button>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm text-slate-500">
            {lang === 'bn' ? 'এখনও কোনো পড়ার সেশন সংরক্ষিত নেই' : 'No study sessions logged yet'}
          </p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="min-h-[44px] px-5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            {t('qaLogStudy', lang)}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const subj = subjectMap.get(item.subjectId);
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: subj?.color || '#64748b' }}
                    />
                    <span className="font-bold text-sm truncate">
                      {subj ? (lang === 'bn' ? subj.bn : subj.en) : t('noSubjectOption', lang)}
                    </span>
                    {subj?.archived && (
                      <span className="text-[11px] text-slate-400">
                        · {lang === 'bn' ? 'আর্কাইভ' : 'Archived'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5">
                    {item.topic} · {toLocalDigits(item.date, lang)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatNum(item.durationMinutes, lang)} {t('minutesUnit', lang)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteStudySession(item.id)}
                    aria-label={t('delete', lang)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
