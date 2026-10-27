import React, { useMemo, useState } from 'react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, BookOpen, CheckCircle2, Dumbbell, Flame, Moon, NotebookPen, Sparkles, Trash2 } from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { formatGregorianDate, formatNum, t, toLocalDigits } from '../../../utils/i18n';

const MOOD_ITEMS: { val: 1 | 2 | 3 | 4 | 5; emoji: string; bn: string; en: string }[] = [
  { val: 1, emoji: '😞', bn: 'খুব খারাপ', en: 'Very Low' },
  { val: 2, emoji: '😕', bn: 'মনমরা', en: 'Low' },
  { val: 3, emoji: '😐', bn: 'স্বাভাবিক', en: 'Neutral' },
  { val: 4, emoji: '🙂', bn: 'ভালো', en: 'Good' },
  { val: 5, emoji: '😄', bn: 'দারুণ', en: 'Great' },
];

export const DailySleepMoodTab: React.FC = () => {
  const { data, lang, saveSleepMood } = useLifeTrack();
  const today = new Date().toISOString().slice(0, 10);
  const existing = data.sleepMoodLogs[today];

  const [sleepDate, setSleepDate] = useState(today);
  const [sleepHours, setSleepHours] = useState<string>(() => String(existing?.sleepHours ?? 7));
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(() => existing?.mood ?? 4);
  const [note, setNote] = useState<string>(() => existing?.note ?? '');

  const handleDateChange = (nextDate: string) => {
    setSleepDate(nextDate);
    const found = data.sleepMoodLogs[nextDate];
    if (found) {
      setSleepHours(String(found.sleepHours));
      setMood(found.mood);
      setNote(found.note);
    } else {
      setSleepHours('7');
      setMood(4);
      setNote('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = Math.max(0, Math.min(24, Number(sleepHours) || 0));
    saveSleepMood({
      date: sleepDate,
      sleepHours: hrs,
      mood,
      note: note.trim(),
    });
  };

  const weeklyChartData = useMemo(() => {
    const arr: { label: string; sleep: number; mood: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const log = data.sleepMoodLogs[iso];
      const dayLabel = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' }).format(d);
      arr.push({
        label: dayLabel,
        sleep: log?.sleepHours ?? 0,
        mood: log?.mood ?? 0,
      });
    }
    return arr;
  }, [data.sleepMoodLogs, lang]);

  const avgSleep = useMemo(() => {
    const logged = weeklyChartData.filter((x) => x.sleep > 0);
    if (logged.length === 0) return 0;
    return logged.reduce((acc, x) => acc + x.sleep, 0) / logged.length;
  }, [weeklyChartData]);

  return (
    <div className="space-y-4">
      {/* Log Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {lang === 'bn' ? 'ঘুম ও মনের অবস্থা লগ করুন' : 'Log Sleep & Mood'}
            </h2>
          </div>
          <input
            type="date"
            value={sleepDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            {lang === 'bn' ? 'মোট ঘুমের সময় (ঘণ্টা)' : 'Sleep Duration (Hours)'}
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            max="24"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            {lang === 'bn' ? 'আজকের মেজাজ / মন কেমন?' : 'How are you feeling today?'}
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {MOOD_ITEMS.map((item) => {
              const active = mood === item.val;
              return (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setMood(item.val)}
                  className={`min-h-[58px] rounded-xl flex flex-col items-center justify-center p-1.5 border transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-xl leading-none">{item.emoji}</span>
                  <span className="text-[11px] mt-1 leading-tight text-center">
                    {lang === 'bn' ? item.bn : item.en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={lang === 'bn' ? 'সংক্ষিপ্ত নোট (ঐচ্ছিক)...' : 'Short reflection (optional)...'}
            className="w-full min-h-[44px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>

        <button
          type="submit"
          className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
        >
          {t('save', lang)}
        </button>
      </form>

      {/* Weekly Sleep & Mood Trend Charts */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {lang === 'bn' ? 'সাপ্তাহিক ঘুম ও মনের প্রবণতা' : 'Weekly Sleep & Mood Trend'}
          </h3>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {lang === 'bn'
              ? `গড় ঘুম: ${formatNum(avgSleep, lang, 1)} ঘণ্টা`
              : `Avg: ${formatNum(avgSleep, lang, 1)} hrs`}
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} stroke="#94a3b8" width={28} />
              <Tooltip
                formatter={(value) => [
                  `${formatNum(Number(value ?? 0), lang, 1)} ${t('hoursUnit', lang)}`,
                  lang === 'bn' ? 'ঘুম' : 'Sleep',
                ]}
              />
              <Bar dataKey="sleep" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-36 w-full pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            {lang === 'bn' ? 'মনের অবস্থা (১ - ৫ স্কেল)' : 'Mood Score (1 - 5 Scale)'}
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyChartData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} stroke="#94a3b8" width={28} />
              <Tooltip
                formatter={(value) => [toLocalDigits(Number(value ?? 0), lang), lang === 'bn' ? 'মন' : 'Mood']}
              />
              <Line type="monotone" dataKey="mood" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const DailyJournalTab: React.FC = () => {
  const { data, lang, saveJournalEntry, deleteJournalEntry } = useLifeTrack();
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(today);
  const existingForDate = data.journalEntries.find((j) => j.date === selectedDate);
  const [content, setContent] = useState<string>(() => existingForDate?.content ?? '');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSelectDate = (d: string) => {
    setSelectedDate(d);
    const entry = data.journalEntries.find((j) => j.date === d);
    setContent(entry?.content ?? '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    saveJournalEntry(selectedDate, content.trim());
  };

  const sortedEntries = useMemo(
    () => [...data.journalEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [data.journalEntries]
  );

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSave}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {lang === 'bn' ? 'দৈনিক ডায়েরি' : 'Daily Journal'}
            </h2>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleSelectDate(e.target.value)}
            className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
          />
        </div>

        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            lang === 'bn'
              ? 'আজকের দিনটি কেমন গেল? কৃতজ্ঞতা, উপলব্ধি বা গুরুত্বপূর্ণ স্মৃতি লিখে রাখুন...'
              : 'How did today go? Write a short note, gratitude, or lesson learned...'
          }
          className="w-full p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 resize-none"
        />

        <button
          type="submit"
          disabled={!content.trim()}
          className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
        >
          {t('save', lang)}
        </button>
      </form>

      {/* Date History */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {lang === 'bn' ? 'পূর্ববর্তী ডায়েরি ইতিহাস' : 'Journal History'}
        </h3>

        {sortedEntries.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'এখনো কোনো ডায়েরি লেখা হয়নি।' : 'No journal notes saved yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedEntries.map((entry) => (
              <div key={entry.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectDate(entry.date)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline min-h-[36px] flex items-center"
                  >
                    {formatGregorianDate(new Date(entry.date + 'T00:00:00'), lang)}
                  </button>
                  {confirmDeleteId === entry.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          deleteJournalEntry(entry.id);
                          setConfirmDeleteId(null);
                        }}
                        className="min-h-[36px] px-2.5 rounded-lg bg-rose-600 text-white text-xs font-semibold"
                      >
                        {t('delete', lang)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[36px] px-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs"
                      >
                        {t('cancel', lang)}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(entry.id)}
                      aria-label={t('delete', lang)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const DailyBadgesTab: React.FC = () => {
  const { data, lang } = useLifeTrack();
  const today = new Date().toISOString().slice(0, 10);

  const totalXp = data.xp.totalXp || 0;
  const level = Math.floor(totalXp / 100) + 1;
  const xpIntoLevel = totalXp % 100;
  const todayCaps = data.xp.dailyEarned[today] || {};

  const reviewedWordsCount = data.words.filter((w) => w.reviewed).length;
  const totalWorkoutSessions = data.workoutLogs.length;
  const totalReadingSessions = data.readingLogs.length + data.readStories.length;
  const totalStudyMinutes = data.studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const completedHabitsCount = Object.values(data.habitLogs).reduce(
    (acc, dayMap) => acc + Object.values(dayMap).filter(Boolean).length,
    0
  );

  const badges = [
    {
      id: 'fitness_star',
      icon: Dumbbell,
      bnTitle: 'ফিটনেস স্টার',
      enTitle: 'Fitness Star',
      bnDesc: 'কমপক্ষে ৩টি ব্যায়াম সেশন সম্পন্ন করুন',
      enDesc: 'Complete at least 3 workout sessions',
      current: totalWorkoutSessions,
      target: 3,
    },
    {
      id: 'word_warrior',
      icon: Sparkles,
      bnTitle: 'শব্দ যোদ্ধা',
      enTitle: 'Word Warrior',
      bnDesc: '২০টি ইংরেজি শব্দ অনুশীলন সম্পন্ন করুন',
      enDesc: 'Review and master 20 vocabulary words',
      current: reviewedWordsCount,
      target: 20,
    },
    {
      id: 'bookworm',
      icon: BookOpen,
      bnTitle: 'বইপোকা',
      enTitle: 'Bookworm',
      bnDesc: '৩টি পড়া সেশন অথবা গল্প পাঠ সম্পন্ন করুন',
      enDesc: 'Complete 3 reading sessions or practice stories',
      current: totalReadingSessions,
      target: 3,
    },
    {
      id: 'study_focus',
      icon: Flame,
      bnTitle: 'অধ্যবসায়ী শিক্ষার্থী',
      enTitle: 'Dedicated Scholar',
      bnDesc: 'মোট ৩০০ মিনিট মনোযোগী পড়াশোনা লগ করুন',
      enDesc: 'Log 300 total minutes of focused study',
      current: totalStudyMinutes,
      target: 300,
    },
    {
      id: 'habit_builder',
      icon: CheckCircle2,
      bnTitle: 'নিয়মিত অভ্যাস গড়ার কারিগর',
      enTitle: 'Consistency Builder',
      bnDesc: '১০ বার দৈনিক অভ্যাস সম্পন্ন করুন',
      enDesc: 'Complete 10 daily habit check-ins',
      current: completedHabitsCount,
      target: 10,
    },
  ];

  const capRows = [
    { key: 'workout', bn: 'ব্যায়াম (+১০ প্রতি সেশন)', en: 'Workout (+10 per session)', max: 30 },
    { key: 'vocab', bn: 'শব্দভাণ্ডার (+৫ প্রতি ১০ শব্দ)', en: 'Vocabulary (+5 per 10 words)', max: 30 },
    { key: 'reading', bn: 'বই ও গল্প পড়া (+১০ প্রতি সেশন)', en: 'Reading (+10 per session)', max: 30 },
    { key: 'study', bn: 'পড়াশোনা সেশন (+১০ প্রতি সেশন)', en: 'Study (+10 per session)', max: 40 },
    { key: 'habit', bn: 'দৈনিক অভ্যাস (+৫ প্রতি টিক)', en: 'Habits (+5 per habit)', max: 25 },
  ];

  return (
    <div className="space-y-4">
      {/* Level Summary Card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Award className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <p className="text-xs text-emerald-100 font-medium">
                {lang === 'bn' ? 'আপনার বর্তমান স্তর' : 'Current Level'}
              </p>
              <h2 className="text-2xl font-extrabold">
                {lang === 'bn' ? `লেভেল ${toLocalDigits(level, lang)}` : `Level ${level}`}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-emerald-100">{lang === 'bn' ? 'মোট পয়েন্ট' : 'Total XP'}</p>
            <p className="text-xl font-bold text-amber-300">
              {formatNum(totalXp, lang)} {lang === 'bn' ? 'পয়েন্ট' : 'XP'}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-emerald-100">
            <span>
              {lang === 'bn'
                ? `পরবর্তী লেভেলের অগ্রগতি`
                : `Progress to Level ${level + 1}`}
            </span>
            <span>
              {toLocalDigits(xpIntoLevel, lang)} / {toLocalDigits(100, lang)} {lang === 'bn' ? 'পয়েন্ট' : 'XP'}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-black/25 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, xpIntoLevel)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's XP Cap Status */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {lang === 'bn' ? 'আজকের অর্জিত পয়েন্ট ও দৈনিক সীমা' : "Today's Earned XP & Daily Caps"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'শুধুমাত্র প্রকৃত সম্পন্ন কাজ থেকেই পয়েন্ট যোগ হয়।'
              : 'Only genuine logged activity earns XP up to the daily cap.'}
          </p>
        </div>

        <div className="space-y-2.5">
          {capRows.map((row) => {
            const earned = todayCaps[row.key] || 0;
            const pct = Math.min(100, Math.round((earned / row.max) * 100));
            return (
              <div key={row.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? row.bn : row.en}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {toLocalDigits(earned, lang)} / {toLocalDigits(row.max, lang)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {badges.map((b) => {
          const Icon = b.icon;
          const unlocked = b.current >= b.target;
          const pct = Math.min(100, Math.round((b.current / b.target) * 100));
          return (
            <div
              key={b.id}
              className={`rounded-2xl border p-4 space-y-2.5 transition-colors ${
                unlocked
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      unlocked
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {lang === 'bn' ? b.bnTitle : b.enTitle}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lang === 'bn' ? b.bnDesc : b.enDesc}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  {unlocked
                    ? lang === 'bn'
                      ? 'অর্জিত'
                      : 'Unlocked'
                    : `${toLocalDigits(b.current, lang)}/${toLocalDigits(b.target, lang)}`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${unlocked ? 'bg-amber-500' : 'bg-emerald-600'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
