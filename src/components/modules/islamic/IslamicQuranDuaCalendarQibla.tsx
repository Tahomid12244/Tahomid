import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Compass,
  HeartHandshake,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { formatGregorianDate, formatNum, t, toLocalDigits } from '../../../utils/i18n';
import {
  ASMAUL_HUSNA,
  BUILTIN_DUAS,
  computePrayerTimesForDate,
  formatHijriDate,
  getHijriDateParts,
  getSpecialIslamicDay,
  HIJRI_MONTHS_BN,
  HIJRI_MONTHS_EN,
  OFFLINE_SURAHS,
} from '../../../utils/islamicUtils';
import { BD_DISTRICTS } from '../../../utils/nctbCurriculum';

const POPULAR_SURAHS = [
  { no: 1, bn: '১. আল-ফাতিহা', en: '1. Al-Fatihah' },
  { no: 36, bn: '৩৬. ইয়াসিন', en: '36. Ya-Sin' },
  { no: 55, bn: '৫৫. আর-রাহমান', en: '55. Ar-Rahman' },
  { no: 56, bn: '৫৬. আল-ওয়াকিয়াহ', en: '56. Al-Waqiah' },
  { no: 67, bn: '৬৭. আল-মুলক', en: '67. Al-Mulk' },
  { no: 18, bn: '১৮. আল-কাহফ', en: '18. Al-Kahf' },
  { no: 112, bn: '১১২. আল-ইখলাস', en: '112. Al-Ikhlas' },
  { no: 113, bn: '১১৩. আল-ফালাক', en: '113. Al-Falaq' },
  { no: 114, bn: '১১৪. আন-নাস', en: '114. An-Nas' },
];

export const IslamicQuranTab: React.FC = () => {
  const { data, lang, updateIslamicState } = useLifeTrack();
  const istate = data.islamicState;

  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(false);
  const [ayahs, setAyahs] = useState<{ no: number; ar: string; bn: string; en: string }[]>(
    () => OFFLINE_SURAHS[0].ayahs
  );
  const [usedFallback, setUsedFallback] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const loadSurah = async () => {
      setLoadingSurah(true);
      setUsedFallback(false);
      try {
        const res = await fetch(
          `https://api.alquran.cloud/v1/surah/${selectedSurah}/editions/quran-uthmani,bn.bengali,en.sahih`
        );
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        const editions = json?.data;
        if (!Array.isArray(editions) || editions.length < 3) throw new Error('Malformed');
        const arList = editions[0].ayahs || [];
        const bnList = editions[1].ayahs || [];
        const enList = editions[2].ayahs || [];
        const merged = arList.slice(0, 40).map((item: { numberInSurah: number; text: string }, idx: number) => ({
          no: item.numberInSurah,
          ar: item.text,
          bn: bnList[idx]?.text || '',
          en: enList[idx]?.text || '',
        }));
        if (!cancelled) {
          setAyahs(merged);
          setLoadingSurah(false);
        }
      } catch {
        if (!cancelled) {
          const offline =
            OFFLINE_SURAHS.find((s) => s.number === selectedSurah) || OFFLINE_SURAHS[0];
          setAyahs(offline.ayahs);
          setUsedFallback(true);
          setLoadingSurah(false);
        }
      }
    };
    loadSurah();
    return () => {
      cancelled = true;
    };
  }, [selectedSurah]);

  const completedCount = istate.completedParas.length;
  const paraPct = Math.round((completedCount / 30) * 100);
  const remainingPages = Math.max(0, 604 - istate.currentQuranPage);
  const targetDays = Math.max(1, istate.khatamTargetDays || 30);
  const pagesPerDayNeeded = Math.ceil(remainingPages / targetDays);

  const togglePara = (p: number) => {
    updateIslamicState((prev) => {
      const exists = prev.completedParas.includes(p);
      return {
        ...prev,
        completedParas: exists
          ? prev.completedParas.filter((x) => x !== p)
          : [...prev.completedParas, p].sort((a, b) => a - b),
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* 30-Para Progress & Khatam Calculator */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {lang === 'bn' ? '৩০ পারা কুরআন খতম ট্র্যাকার' : '30-Para Quran Progress'}
            </h2>
          </div>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            {toLocalDigits(completedCount, lang)}/{toLocalDigits(30, lang)} ({toLocalDigits(paraPct, lang)}%)
          </span>
        </div>

        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
            style={{ width: `${paraPct}%` }}
          />
        </div>

        {/* 30 Para Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((p) => {
            const done = istate.completedParas.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePara(p)}
                className={`min-h-[44px] rounded-xl text-xs font-bold border transition-colors ${
                  done
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {toLocalDigits(p, lang)}
              </button>
            );
          })}
        </div>

        {/* Page Tracker & Daily Target Calculator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'বর্তমান পৃষ্ঠা (মোট ৬০৪)' : 'Current Mushaf Page (of 604)'}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="604"
              value={istate.currentQuranPage}
              onChange={(e) =>
                updateIslamicState((prev) => ({
                  ...prev,
                  currentQuranPage: Math.max(0, Math.min(604, Number(e.target.value) || 0)),
                }))
              }
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'খতম সম্পন্ন করার লক্ষ্য (দিন)' : 'Target Days to Complete Khatam'}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="365"
              value={istate.khatamTargetDays}
              onChange={(e) =>
                updateIslamicState((prev) => ({
                  ...prev,
                  khatamTargetDays: Math.max(1, Math.min(365, Number(e.target.value) || 30)),
                }))
              }
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
            />
          </div>
        </div>

        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/25 p-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {lang === 'bn' ? 'দৈনিক তিলাওয়াতের লক্ষ্যমাত্রা:' : 'Recommended Daily Target:'}
          </span>
          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
            {lang === 'bn'
              ? `প্রতিদিন ${formatNum(pagesPerDayNeeded, lang)} পৃষ্ঠা`
              : `${pagesPerDayNeeded} pages / day`}
          </span>
        </div>
      </div>

      {/* Surah Reader with AlQuran Cloud + Offline Fallback */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {lang === 'bn' ? 'সূরা পাঠক (অর্থসহ)' : 'Surah Reader (With Meaning)'}
          </h3>
          <select
            value={selectedSurah}
            onChange={(e) => setSelectedSurah(Number(e.target.value))}
            className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
          >
            {POPULAR_SURAHS.map((s) => (
              <option key={s.no} value={s.no}>
                {lang === 'bn' ? s.bn : s.en}
              </option>
            ))}
          </select>
        </div>

        {usedFallback && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {lang === 'bn'
              ? 'অফলাইন সংরক্ষিত সূরা দেখানো হচ্ছে।'
              : 'Showing offline saved Surah.'}
          </p>
        )}

        {loadingSurah ? (
          <div className="space-y-2 py-4">
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto pr-1">
            {ayahs.map((a) => (
              <div key={a.no} className="py-3.5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {toLocalDigits(a.no, lang)}
                  </span>
                  <p dir="rtl" className="font-arabic text-2xl leading-loose text-right text-slate-900 dark:text-slate-100">
                    {a.ar}
                  </p>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'bn' ? a.bn : a.en}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const IslamicDuaTab: React.FC = () => {
  const { lang } = useLifeTrack();
  const [catFilter, setCatFilter] = useState<'all' | 'daily' | 'study' | 'protection' | 'forgiveness'>('all');

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const duaOfDay = BUILTIN_DUAS[dayOfYear % BUILTIN_DUAS.length];

  const filteredDuas =
    catFilter === 'all' ? BUILTIN_DUAS : BUILTIN_DUAS.filter((d) => d.category === catFilter);

  const categories: { id: typeof catFilter; bn: string; en: string }[] = [
    { id: 'all', bn: 'সব দোয়া', en: 'All Duas' },
    { id: 'study', bn: 'পড়াশোনা', en: 'Study' },
    { id: 'daily', bn: 'দৈনন্দিন', en: 'Daily' },
    { id: 'protection', bn: 'নিরাপত্তা', en: 'Protection' },
    { id: 'forgiveness', bn: 'ক্ষমা প্রার্থনা', en: 'Forgiveness' },
  ];

  return (
    <div className="space-y-4">
      {/* Dua of the Day */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-5 space-y-3 shadow-md">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'bn' ? 'আজকের নির্বাচিত দোয়া' : 'Dua of the Day'}</span>
        </div>
        <h2 className="text-base font-bold">
          {lang === 'bn' ? duaOfDay.titleBn : duaOfDay.titleEn}
        </h2>
        <p dir="rtl" className="font-arabic text-2xl leading-loose text-right text-amber-100">
          {duaOfDay.arabic}
        </p>
        <p className="text-xs text-emerald-100 italic">
          {lang === 'bn' ? `উচ্চারণ: ${duaOfDay.pronunciationBn}` : `Pronunciation: ${duaOfDay.pronunciationEn}`}
        </p>
        <p className="text-sm text-white/95 leading-relaxed">
          {lang === 'bn' ? duaOfDay.meaningBn : duaOfDay.meaningEn}
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCatFilter(c.id)}
            className={`shrink-0 min-h-[44px] px-4 rounded-full text-xs font-bold transition-colors ${
              catFilter === c.id
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {lang === 'bn' ? c.bn : c.en}
          </button>
        ))}
      </div>

      {/* Duas List */}
      <div className="space-y-3">
        {filteredDuas.map((d) => (
          <div
            key={d.id}
            className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {lang === 'bn' ? d.titleBn : d.titleEn}
            </h3>
            <p dir="rtl" className="font-arabic text-2xl leading-loose text-right text-slate-900 dark:text-slate-100">
              {d.arabic}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">
                {lang === 'bn' ? 'উচ্চারণ: ' : 'Pronunciation: '}
              </span>
              {lang === 'bn' ? d.pronunciationBn : d.pronunciationEn}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              <span className="font-semibold">
                {lang === 'bn' ? 'অর্থ: ' : 'Meaning: '}
              </span>
              {lang === 'bn' ? d.meaningBn : d.meaningEn}
            </p>
          </div>
        ))}
      </div>

      {/* Asmaul Husna */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {lang === 'bn' ? 'আসমাউল হুসনা (আল্লাহর সুন্দর নামসমূহ)' : 'Asmaul Husna (Beautiful Names of Allah)'}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {ASMAUL_HUSNA.map((name) => (
            <div
              key={name.no}
              className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 p-3 text-center space-y-1"
            >
              <span className="text-[10px] font-bold text-slate-400 block">
                #{toLocalDigits(name.no, lang)}
              </span>
              <p className="font-arabic text-xl text-emerald-700 dark:text-emerald-300">
                {name.ar}
              </p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">
                {lang === 'bn' ? name.bn : name.en}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const IslamicCalendarTab: React.FC = () => {
  const { data, lang, updateProfile, updateIslamicState } = useLifeTrack();
  const profile = data.profile;
  const hijriAdj = profile?.hijriAdjustment ?? -1;

  const [viewMonthOffset, setViewMonthOffset] = useState(0);
  const [selectedGregorianDate, setSelectedGregorianDate] = useState<Date>(() => new Date());

  // Add event form
  const [eventTitle, setEventTitle] = useState('');
  const [calType, setCalType] = useState<'hijri' | 'gregorian'>('hijri');

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + viewMonthOffset);
    return d;
  }, [viewMonthOffset]);

  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDayDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d, 12, 0, 0));
    }
    return cells;
  }, [viewDate]);

  const midMonthHijri = useMemo(
    () => getHijriDateParts(new Date(viewDate.getFullYear(), viewDate.getMonth(), 15, 12), hijriAdj),
    [viewDate, hijriAdj]
  );

  const selectedHijri = useMemo(
    () => getHijriDateParts(selectedGregorianDate, hijriAdj),
    [selectedGregorianDate, hijriAdj]
  );
  const selectedSpecials = useMemo(
    () => getSpecialIslamicDay(selectedGregorianDate, hijriAdj),
    [selectedGregorianDate, hijriAdj]
  );

  const selectedIso = selectedGregorianDate.toISOString().slice(0, 10);
  const selectedHijriKey = `H-${String(selectedHijri.month).padStart(2, '0')}-${String(selectedHijri.day).padStart(2, '0')}`;

  const matchingCustomEvents = data.islamicState.islamicEvents.filter(
    (ev) =>
      (ev.calendarType === 'gregorian' && ev.dateKey === selectedIso) ||
      (ev.calendarType === 'hijri' && ev.dateKey === selectedHijriKey)
  );

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    const key = calType === 'gregorian' ? selectedIso : selectedHijriKey;
    updateIslamicState((prev) => ({
      ...prev,
      islamicEvents: [
        ...prev.islamicEvents,
        {
          id: `iev_${Date.now()}`,
          title: eventTitle.trim(),
          calendarType: calType,
          dateKey: key,
        },
      ],
    }));
    setEventTitle('');
  };

  const weekHeaders =
    lang === 'bn'
      ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Moon-Sighting Adjustment Selector */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 shadow-sm">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          {lang === 'bn' ? 'চাঁদ দেখার সমন্বয় (উম্মুল কুরা ক্যালেন্ডার)' : 'Moon-Sighting Adjustment (Umm al-Qura)'}
        </label>
        <select
          value={hijriAdj}
          onChange={(e) => {
            const val = Number(e.target.value) as -1 | 0 | 1;
            if (profile) updateProfile({ ...profile, hijriAdjustment: val });
          }}
          className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
        >
          <option value={-1}>{t('moonAdjMinus1', lang)}</option>
          <option value={0}>{t('moonAdjZero', lang)}</option>
          <option value={1}>{t('moonAdjPlus1', lang)}</option>
        </select>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {lang === 'bn'
            ? 'এই সমন্বয় কেবল হিজরি তারিখ, আইয়ামে বীজ, রমজান ও ঈদের গণনায় প্রযোজ্য। নামাজ, সাহরি বা ইফতারের সময় পরিবর্তন করে না।'
            : 'Affects only Hijri dates, White Days, Ramadan & Eid countdowns. Never alters prayer, Sehri, or Iftar times.'}
        </p>
      </div>

      {/* Monthly Hijri + Gregorian Grid */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewMonthOffset((v) => v - 1)}
            aria-label="Previous month"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
              {lang === 'bn' ? midMonthHijri.monthNameBn : midMonthHijri.monthNameEn}{' '}
              {toLocalDigits(midMonthHijri.year, lang)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
                month: 'long',
                year: 'numeric',
              }).format(viewDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setViewMonthOffset((v) => v + 1)}
            aria-label="Next month"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500">
          {weekHeaders.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((cellDate, idx) => {
            if (!cellDate) return <div key={`empty_${idx}`} className="min-h-[48px]" />;
            const hp = getHijriDateParts(cellDate, hijriAdj);
            const specials = getSpecialIslamicDay(cellDate, hijriAdj);
            const isSelected = cellDate.toDateString() === selectedGregorianDate.toDateString();
            const isToday = cellDate.toDateString() === new Date().toDateString();
            const hasMajorSpecial = specials.some((s) => s.key !== 'mon_thu_fast');

            return (
              <button
                key={cellDate.toISOString()}
                type="button"
                onClick={() => setSelectedGregorianDate(cellDate)}
                className={`min-h-[50px] rounded-xl p-1 flex flex-col items-center justify-center border transition-colors relative ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : isToday
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                    : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/70 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="text-sm font-extrabold leading-none">
                  {toLocalDigits(hp.day, lang)}
                </span>
                <span
                  className={`text-[10px] mt-1 leading-none ${
                    isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'
                  }`}
                >
                  {toLocalDigits(cellDate.getDate(), lang)}
                </span>
                {hasMajorSpecial && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-amber-300' : 'bg-amber-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details: Meaning, Amal & Custom Events */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatHijriDate(selectedGregorianDate, hijriAdj, lang)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatGregorianDate(selectedGregorianDate, lang)}
            </p>
          </div>
          <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        {selectedSpecials.length > 0 ? (
          <div className="space-y-2">
            {selectedSpecials.map((sp) => (
              <div
                key={sp.key}
                className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-500/30 p-3 space-y-1"
              >
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  {lang === 'bn' ? sp.bnTitle : sp.enTitle}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? sp.bnMeaning : sp.enMeaning}
                </p>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {lang === 'bn' ? `করণীয় আমল: ${sp.bnAmal}` : `Recommended Amal: ${sp.enAmal}`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'এই তারিখে বিশেষ কোনো ইসলামিক দিবস চিহ্নিত নেই। নিচের ফর্ম থেকে নিজস্ব ইভেন্ট যোগ করতে পারেন।'
              : 'No special Islamic observance on this date. You can add a personal reminder below.'}
          </p>
        )}

        {/* Custom Events on Selected Day */}
        {matchingCustomEvents.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {matchingCustomEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">{ev.title}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateIslamicState((prev) => ({
                      ...prev,
                      islamicEvents: prev.islamicEvents.filter((x) => x.id !== ev.id),
                    }))
                  }
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Event by Hijri or Gregorian Calendar */}
        <form onSubmit={handleAddEvent} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCalType('hijri')}
              className={`flex-1 min-h-[40px] rounded-xl text-xs font-bold ${
                calType === 'hijri'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {lang === 'bn' ? 'হিজরি তারিখ অনুযায়ী' : 'By Hijri Date'}
            </button>
            <button
              type="button"
              onClick={() => setCalType('gregorian')}
              className={`flex-1 min-h-[40px] rounded-xl text-xs font-bold ${
                calType === 'gregorian'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {lang === 'bn' ? 'ইংরেজি তারিখ অনুযায়ী' : 'By Gregorian Date'}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder={lang === 'bn' ? 'ইভেন্ট বা রোজার স্মারক লিখুন...' : 'Add event or fasting reminder...'}
              className="flex-1 min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add', lang)}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Hijri Months Reference */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-2 shadow-sm">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {lang === 'bn' ? '১২টি হিজরি মাসের নাম' : '12 Hijri Months'}
        </h4>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {(lang === 'bn' ? HIJRI_MONTHS_BN : HIJRI_MONTHS_EN).map((mName, idx) => (
            <div
              key={mName}
              className={`rounded-lg px-2.5 py-1.5 font-medium ${
                midMonthHijri.month === idx + 1
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {toLocalDigits(idx + 1, lang)}. {mName}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const IslamicQiblaTab: React.FC = () => {
  const { data, lang } = useLifeTrack();
  const districtId = data.profile?.district || 'dhaka';
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [sensorStatus, setSensorStatus] = useState<string>('');

  const qiblaAngle = useMemo(() => {
    return computePrayerTimesForDate(new Date(), districtId, coords).qiblaDegrees;
  }, [districtId, coords]);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const anyEv = event as DeviceOrientationEvent & { webkitCompassHeading?: number };
      if (typeof anyEv.webkitCompassHeading === 'number') {
        setHeading(anyEv.webkitCompassHeading);
      } else if (typeof event.alpha === 'number') {
        setHeading((360 - event.alpha) % 360);
      }
    };

    window.addEventListener('deviceorientationabsolute' as keyof WindowEventMap, handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute' as keyof WindowEventMap, handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const enableCompassAndGps = async () => {
    try {
      const DevOrient = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DevOrient.requestPermission === 'function') {
        const res = await DevOrient.requestPermission();
        if (res !== 'granted') {
          setSensorStatus(
            lang === 'bn'
              ? 'কম্পাস সেন্সর অনুমতি পাওয়া যায়নি; নিচের স্থির কোণ অনুসরণ করুন।'
              : 'Compass sensor permission denied; use the bearing angle below.'
          );
        }
      }
    } catch {
      // Non-iOS browsers do not require requestPermission
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setSensorStatus(
            lang === 'bn' ? 'সঠিক জিপিএস অবস্থান যুক্ত হয়েছে।' : 'Accurate GPS location active.'
          );
        },
        () => {
          setSensorStatus(
            lang === 'bn'
              ? 'নির্বাচিত জেলার অবস্থান থেকে কিবলার কোণ দেখানো হচ্ছে।'
              : 'Showing Qibla angle based on your selected district.'
          );
        }
      );
    }
  };

  const currentDist = BD_DISTRICTS.find((d) => d.id === districtId) || BD_DISTRICTS[0];
  const relativeRotation = heading !== null ? (qiblaAngle - heading + 360) % 360 : qiblaAngle;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-5 text-center space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {lang === 'bn' ? 'কিবলা কম্পাস' : 'Qibla Compass'}
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {lang === 'bn' ? currentDist.bn : currentDist.en}
          </span>
        </div>

        {/* Visual Compass Dial */}
        <div className="relative w-56 h-56 mx-auto rounded-full border-4 border-emerald-600/30 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center shadow-inner">
          <span className="absolute top-2 text-xs font-extrabold text-rose-500">
            {lang === 'bn' ? 'উত্তর' : 'N'}
          </span>
          <span className="absolute bottom-2 text-xs font-bold text-slate-400">
            {lang === 'bn' ? 'দক্ষিণ' : 'S'}
          </span>
          <span className="absolute right-3 text-xs font-bold text-slate-400">
            {lang === 'bn' ? 'পূর্ব' : 'E'}
          </span>
          <span className="absolute left-3 text-xs font-bold text-slate-400">
            {lang === 'bn' ? 'পশ্চিম' : 'W'}
          </span>

          {/* Rotating Qibla Pointer */}
          <div
            className="w-40 h-40 transition-transform duration-200 flex items-center justify-center"
            style={{ transform: `rotate(${relativeRotation}deg)` }}
          >
            <div className="flex flex-col items-center -mt-20">
              <div className="w-8 h-8 rounded-lg bg-slate-950 border-2 border-amber-400 flex items-center justify-center text-amber-300 text-xs font-bold shadow">
                🕋
              </div>
              <div className="w-1.5 h-16 bg-gradient-to-b from-emerald-500 to-transparent rounded-full" />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
            {lang === 'bn'
              ? `কিবলার দিক: উত্তর থেকে ${formatNum(qiblaAngle, lang, 1)}° (পশ্চিম-উত্তরপশ্চিম)`
              : `Qibla Bearing: ${qiblaAngle}° from True North (WNW)`}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {heading !== null
              ? lang === 'bn'
                ? `লাইভ কম্পাস সক্রিয় (ডিভাইস মুখ: ${formatNum(heading, lang, 0)}°)`
                : `Live orientation active (Device heading: ${Math.round(heading)}°)`
              : lang === 'bn'
              ? 'সেন্সর না থাকলে যেকোনো সাধারণ কম্পাসে উত্তর দিক থেকে এই কোণটি অনুসরণ করুন।'
              : 'Fallback mode: face this degree clockwise from North if your device has no magnetometer.'}
          </p>
          {sensorStatus && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{sensorStatus}</p>
          )}
        </div>

        <button
          type="button"
          onClick={enableCompassAndGps}
          className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          <span>
            {lang === 'bn' ? 'জিপিএস ও কম্পাস ক্যালিব্রেট করুন' : 'Calibrate GPS & Compass'}
          </span>
        </button>
      </div>
    </div>
  );
};
