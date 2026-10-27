import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  MapPin,
  Minus,
  MoonStar,
  Navigation,
  Plus,
  RotateCcw,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { PrayerStatus } from '../../../types';
import { formatHHMM, formatNum, formatTime12h, t, toLocalDigits } from '../../../utils/i18n';
import {
  computePrayerTimesForDate,
  formatHijriDate,
  getHijriDateParts,
  getNextPrayerCountdown,
} from '../../../utils/islamicUtils';
import { createEmptyIbadahLog } from '../../../utils/migrationAndDefaults';
import { BD_DISTRICTS } from '../../../utils/nctbCurriculum';

const JUMUAH_SUNNAHS = [
  { id: 'ghusl', bn: 'জুমার গোসল করা', en: 'Perform Jumuah Ghusl' },
  { id: 'miswak', bn: 'মিসওয়াক করা ও পরিচ্ছন্ন হওয়া', en: 'Use Miswak & groom neatly' },
  { id: 'clothes', bn: 'উত্তম পোশাক ও সুগন্ধি ব্যবহার', en: 'Wear clean clothes & fragrance' },
  { id: 'kahf', bn: 'সূরা আল-কাহফ তিলাওয়াত করা', en: 'Recite Surah Al-Kahf' },
  { id: 'early', bn: 'আগেভাগে মসজিদে গমন ও খুতবা শোনা', en: 'Go early to the Masjid & listen attentively' },
  { id: 'durood', bn: 'বেশি বেশি দরুদ শরিফ পাঠ করা', en: 'Send abundant Durood upon the Prophet (SAW)' },
];

const TASBIH_PHRASES = [
  { ar: 'سُبْحَانَ ٱللَّٰهِ', bn: 'সুবহানাল্লাহ', en: 'SubhanAllah' },
  { ar: 'ٱلْحَمْدُ لِلَّٰهِ', bn: 'আলহামদুলিল্লাহ', en: 'Alhamdulillah' },
  { ar: 'ٱللَّٰهُ أَكْبَرُ', bn: 'আল্লাহু আকবার', en: 'Allahu Akbar' },
  { ar: 'أَسْتَغْفِرُ ٱللَّٰهَ', bn: 'আস্তাগফিরুল্লাহ', en: 'Astaghfirullah' },
  { ar: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', bn: 'লা ইলাহা ইল্লাল্লাহ', en: 'La ilaha illallah' },
];

export const IslamicPrayerTab: React.FC = () => {
  const { data, lang, updateProfile, updateIbadahLog, updateIslamicState, showToast } = useLifeTrack();
  const profile = data.profile;
  const districtId = profile?.district || 'dhaka';
  const hijriAdj = profile?.hijriAdjustment ?? -1;

  const [now, setNow] = useState(() => new Date());
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [showCustomTimes, setShowCustomTimes] = useState(false);

  // Ramadan & Zakat panel state
  const hijriToday = useMemo(() => getHijriDateParts(now, hijriAdj), [now, hijriAdj]);
  const isRamadanMonth = hijriToday.month === 9;
  const [ramadanOpen, setRamadanOpen] = useState<boolean>(isRamadanMonth);

  // Zakat & Fitrah inputs
  const [cashSavings, setCashSavings] = useState('0');
  const [goldGrams, setGoldGrams] = useState('0');
  const [silverGrams, setSilverGrams] = useState('0');
  const [businessGoods, setBusinessGoods] = useState('0');
  const [shortTermDebts, setShortTermDebts] = useState('0');
  const [nisabBasis, setNisabBasis] = useState<'silver' | 'gold'>('silver');
  const [familyMembers, setFamilyMembers] = useState('4');

  useEffect(() => {
    if (isRamadanMonth) setRamadanOpen(true);
  }, [isRamadanMonth]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Prayer schedule strictly ignores Hijri adjustment
  const schedule = useMemo(
    () => computePrayerTimesForDate(now, districtId, gpsCoords),
    [now, districtId, gpsCoords]
  );

  const nextPrayer = useMemo(() => getNextPrayerCountdown(now, districtId), [now, districtId]);

  const formatCountdown = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => toLocalDigits(String(n).padStart(2, '0'), lang);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const handleDistrictChange = (newDistId: string) => {
    setGpsCoords(null);
    setGpsStatus('');
    if (profile) {
      updateProfile({ ...profile, district: newDistId });
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus(lang === 'bn' ? 'এই ডিভাইসে জিপিএস সমর্থিত নয়।' : 'GPS is not supported on this device.');
      return;
    }
    setGpsStatus(lang === 'bn' ? 'অবস্থান নির্ণয় করা হচ্ছে...' : 'Detecting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus(
          lang === 'bn'
            ? `জিপিএস সক্রিয় (${toLocalDigits(pos.coords.latitude.toFixed(2), lang)}, ${toLocalDigits(pos.coords.longitude.toFixed(2), lang)})`
            : `GPS active (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`
        );
      },
      () => {
        setGpsStatus(
          lang === 'bn'
            ? 'জিপিএস অনুমতি পাওয়া যায়নি; নির্বাচিত জেলার সময় দেখানো হচ্ছে।'
            : 'Location permission declined; using selected district.'
        );
      },
      { timeout: 8000 }
    );
  };

  const todayIso = now.toISOString().slice(0, 10);
  const todayIbadah = data.ibadahLogs[todayIso] || createEmptyIbadahLog(todayIso);
  const isFriday = now.getDay() === 5;

  const currentDistrict = BD_DISTRICTS.find((d) => d.id === districtId) || BD_DISTRICTS[0];
  const offsetSign = currentDistrict.offsetMin > 0 ? '+' : '';

  // Eid Countdown (uses Hijri moon adjustment, as required)
  const daysUntilEid = useMemo(() => {
    for (let i = 0; i <= 370; i++) {
      const check = new Date(now.getTime() + i * 86400000);
      const hp = getHijriDateParts(check, hijriAdj);
      if ((hp.month === 10 && hp.day === 1) || (hp.month === 12 && hp.day === 10)) {
        return {
          days: i,
          isFitr: hp.month === 10,
        };
      }
    }
    return { days: 30, isFitr: true };
  }, [now, hijriAdj]);

  // Zakat calculation
  const zakatRates = data.islamicState.zakatRates;
  const goldValue = (Number(goldGrams) || 0) * zakatRates.goldPerGram;
  const silverValue = (Number(silverGrams) || 0) * zakatRates.silverPerGram;
  const netZakatable = Math.max(
    0,
    (Number(cashSavings) || 0) +
      goldValue +
      silverValue +
      (Number(businessGoods) || 0) -
      (Number(shortTermDebts) || 0)
  );
  const nisabAmount =
    nisabBasis === 'silver'
      ? Math.round(612.36 * zakatRates.silverPerGram)
      : Math.round(87.48 * zakatRates.goldPerGram);
  const zakatPayable = netZakatable >= nisabAmount ? Math.round(netZakatable * 0.025) : 0;
  const totalFitrah = Math.max(1, Number(familyMembers) || 1) * zakatRates.fitrahPerPerson;
  const currency = profile?.currency || '৳';

  const fardRows = [
    { key: 'fajr', bn: 'ফজর', en: 'Fajr', time: schedule.fajr },
    { key: 'sunrise', bn: 'সূর্যোদয়', en: 'Sunrise', time: schedule.sunrise, isInfo: true },
    { key: 'dhuhr', bn: isFriday ? (lang === 'bn' ? 'জুমা / যোহর' : "Jumu'ah / Dhuhr") : 'যোহর', en: isFriday ? "Jumu'ah / Dhuhr" : 'Dhuhr', time: schedule.dhuhr },
    { key: 'asr', bn: 'আসর', en: 'Asr', time: schedule.asr, sub: t('asrHanafiLabel', lang) },
    { key: 'maghrib', bn: 'মাগরিব', en: 'Maghrib', time: schedule.maghrib },
    { key: 'isha', bn: 'এশা', en: 'Isha', time: schedule.isha },
  ];

  return (
    <div className="space-y-4">
      {/* Next Prayer Hero Countdown */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-5 shadow-md space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-emerald-100">{t('nextPrayerCard', lang)}</p>
            <h2 className="text-2xl font-extrabold tracking-tight mt-0.5">
              {lang === 'bn' ? nextPrayer.bn : nextPrayer.en}
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              {formatTime12h(nextPrayer.time, lang)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-amber-200 font-medium">
              {formatHijriDate(now, hijriAdj, lang)}
            </p>
            <p className="text-2xl font-mono font-extrabold text-amber-300 mt-1">
              {formatCountdown(nextPrayer.diffSec)}
            </p>
          </div>
        </div>

        {/* Sehri & Iftar strip */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/15">
          <div className="rounded-xl bg-black/20 px-3 py-2">
            <span className="text-[11px] text-emerald-100 block">
              {lang === 'bn' ? 'সাহরির শেষ সময়' : 'Sehri Ends'}
            </span>
            <span className="text-sm font-bold text-white">
              {profile?.customSehriTime
                ? formatHHMM(profile.customSehriTime, lang)
                : formatTime12h(schedule.sehriEnd, lang)}
            </span>
          </div>
          <div className="rounded-xl bg-black/20 px-3 py-2">
            <span className="text-[11px] text-emerald-100 block">
              {lang === 'bn' ? 'ইফতারের সময়' : 'Iftar Time'}
            </span>
            <span className="text-sm font-bold text-amber-300">
              {profile?.customIftarTime
                ? formatHHMM(profile.customIftarTime, lang)
                : formatTime12h(schedule.iftar, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Calculation Method & District / GPS Selector */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {t('karachiMethodLabel', lang)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('karachiHelperText', lang)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="sr-only">{t('districtLabel', lang)}</label>
            <select
              value={districtId}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              {BD_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {lang === 'bn' ? d.bn : d.en}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleUseGps}
            className="min-h-[44px] px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <MapPin className="w-4 h-4" />
            <span>{lang === 'bn' ? 'জিপিএস অবস্থান' : 'Use GPS'}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {gpsStatus
            ? gpsStatus
            : lang === 'bn'
            ? `ঢাকা থেকে দ্রাঘিমাংশ ভিত্তিক সময়ের পার্থক্য: ${offsetSign}${toLocalDigits(currentDistrict.offsetMin, lang)} মিনিট (হিজরি চাঁদ সমন্বয় নামাজের সময় পরিবর্তন করে না)`
            : `Longitude offset from Dhaka: ${offsetSign}${currentDistrict.offsetMin} min (Hijri moon adjustment never alters prayer times)`}
        </p>

        {/* Optional Custom Sehri/Iftar Override */}
        <div>
          <button
            type="button"
            onClick={() => setShowCustomTimes((v) => !v)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 underline min-h-[36px]"
          >
            {lang === 'bn'
              ? 'কাস্টম সাহরি/ইফতারের সময় নির্ধারণ করুন (ঐচ্ছিক)'
              : 'Set custom Sehri/Iftar time (optional)'}
          </button>
          {showCustomTimes && profile && (
            <div className="grid grid-cols-2 gap-2.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  {lang === 'bn' ? 'কাস্টম সাহরি' : 'Custom Sehri'}
                </label>
                <input
                  type="time"
                  value={profile.customSehriTime || ''}
                  onChange={(e) => updateProfile({ ...profile, customSehriTime: e.target.value })}
                  className="w-full min-h-[44px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  {lang === 'bn' ? 'কাস্টম ইফতার' : 'Custom Iftar'}
                </label>
                <input
                  type="time"
                  value={profile.customIftarTime || ''}
                  onChange={(e) => updateProfile({ ...profile, customIftarTime: e.target.value })}
                  className="w-full min-h-[44px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Prayer Timetable */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {lang === 'bn' ? 'আজকের নামাজের সময়সূচি' : "Today's Prayer Schedule"}
        </h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {fardRows.map((row) => {
            const isNext = nextPrayer.key === row.key;
            return (
              <div
                key={row.key}
                className={`py-2.5 flex items-center justify-between gap-2 ${
                  isNext ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''
                }`}
              >
                <div>
                  <span className="text-sm font-semibold">
                    {lang === 'bn' ? row.bn : row.en}
                  </span>
                  {row.sub && (
                    <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">
                      {row.sub}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {formatTime12h(row.time, lang)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Nafl & Makruh Times */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5">
            <span className="text-slate-500 dark:text-slate-400 block">
              {lang === 'bn' ? 'তাহাজ্জুদ (শেষ তৃতীয়াংশ)' : 'Tahajjud (Last Third)'}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatTime12h(schedule.tahajjudLastThird, lang)}
            </span>
          </div>
          <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5">
            <span className="text-slate-500 dark:text-slate-400 block">
              {lang === 'bn' ? 'ইশরাক / চাশত শুরু' : 'Ishraq / Chasht'}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatTime12h(schedule.ishraqStart, lang)} / {formatTime12h(schedule.chashtStart, lang)}
            </span>
          </div>
          <div className="col-span-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-500/20 p-2.5 space-y-1">
            <span className="font-bold text-amber-800 dark:text-amber-300 block">
              {lang === 'bn' ? 'নিষিদ্ধ / মাকরুহ সময়সমূহ' : 'Prohibited / Makruh Windows'}
            </span>
            <p className="text-slate-600 dark:text-slate-300">
              {lang === 'bn' ? 'সূর্যোদয়:' : 'Sunrise:'} {formatTime12h(schedule.sunrise, lang)} –{' '}
              {formatTime12h(schedule.makruhSunriseEnd, lang)} •{' '}
              {lang === 'bn' ? 'দ্বিপ্রহর:' : 'Zawal:'} {formatTime12h(schedule.makruhZawalStart, lang)} –{' '}
              {formatTime12h(schedule.dhuhr, lang)} •{' '}
              {lang === 'bn' ? 'সূর্যাস্ত:' : 'Sunset:'} {formatTime12h(schedule.makruhSunsetStart, lang)} –{' '}
              {formatTime12h(schedule.maghrib, lang)}
            </p>
          </div>
        </div>
      </div>

      {/* Jumu'ah Sunnah Reminder & Checklist */}
      <div
        className={`rounded-2xl border p-4 space-y-3 shadow-sm ${
          isFriday
            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500/40'
            : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {lang === 'bn' ? 'জুমার দিনের সুন্নাত আমলসমূহ' : "Jumu'ah Sunnah Checklist"}
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {toLocalDigits(todayIbadah.jumuahSunnahs.length, lang)}/{toLocalDigits(JUMUAH_SUNNAHS.length, lang)}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {JUMUAH_SUNNAHS.map((item) => {
            const checked = todayIbadah.jumuahSunnahs.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  updateIbadahLog(todayIso, (prev) => ({
                    ...prev,
                    jumuahSunnahs: checked
                      ? prev.jumuahSunnahs.filter((k) => k !== item.id)
                      : [...prev.jumuahSunnahs, item.id],
                  }))
                }
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-left flex items-center gap-2.5 text-xs font-medium transition-colors ${
                  checked
                    ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Check className={`w-4 h-4 shrink-0 ${checked ? 'opacity-100' : 'opacity-30'}`} />
                <span>{lang === 'bn' ? item.bn : item.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ramadan Mode & Zakat / Fitrah Calculator */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-amber-500/30 p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MoonStar className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'bn'
                  ? 'রমজান মোড এবং যাকাত ও ফিতরা ক্যালকুলেটর'
                  : 'Ramadan Mode, Zakat & Fitrah Calculator'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRamadanMonth
                  ? lang === 'bn'
                    ? 'পবিত্র রমজান মাস চলমান — স্বয়ংক্রিয়ভাবে সক্রিয়'
                    : 'Blessed Ramadan active automatically'
                  : lang === 'bn'
                  ? `${daysUntilEid.isFitr ? 'ঈদুল ফিতর' : 'ঈদুল আজহা'} পর্যন্ত আনুমানিক ${toLocalDigits(daysUntilEid.days, lang)} দিন বাকি`
                  : `Approx. ${daysUntilEid.days} days until ${daysUntilEid.isFitr ? 'Eid-ul-Fitr' : 'Eid-ul-Adha'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRamadanOpen((v) => !v)}
            className="min-h-[44px] px-3.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold"
          >
            {ramadanOpen
              ? lang === 'bn'
                ? 'সংক্ষিপ্ত করুন'
                : 'Collapse'
              : lang === 'bn'
              ? 'খুলুন'
              : 'Open'}
          </button>
        </div>

        {ramadanOpen && (
          <div className="space-y-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 30-Day Fasting & Taraweeh Tracker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? '৩০ দিনের রোজা ও তারাবিহ ট্র্যাকার' : '30-Day Fasting & Taraweeh Tracker'}
                </h4>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {lang === 'bn' ? 'রোজা:' : 'Fasts:'}{' '}
                  {toLocalDigits(Object.values(data.islamicState.ramadanFasts).filter(Boolean).length, lang)}/
                  {toLocalDigits(30, lang)}
                </span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {Array.from({ length: 30 }, (_, idx) => idx + 1).map((dayNum) => {
                  const fasted = Boolean(data.islamicState.ramadanFasts[dayNum]);
                  const taraweeh = Boolean(data.islamicState.ramadanTaraweeh[dayNum]);
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() =>
                        updateIslamicState((prev) => {
                          if (!fasted) {
                            return {
                              ...prev,
                              ramadanFasts: { ...prev.ramadanFasts, [dayNum]: true },
                            };
                          }
                          if (!taraweeh) {
                            return {
                              ...prev,
                              ramadanTaraweeh: { ...prev.ramadanTaraweeh, [dayNum]: true },
                            };
                          }
                          return {
                            ...prev,
                            ramadanFasts: { ...prev.ramadanFasts, [dayNum]: false },
                            ramadanTaraweeh: { ...prev.ramadanTaraweeh, [dayNum]: false },
                          };
                        })
                      }
                      className={`min-h-[44px] rounded-xl text-xs font-bold flex flex-col items-center justify-center border transition-colors ${
                        fasted && taraweeh
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : fasted
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-500/40'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{toLocalDigits(dayNum, lang)}</span>
                      <span className="text-[9px] leading-none mt-0.5">
                        {fasted && taraweeh
                          ? lang === 'bn'
                            ? 'রোজা+তা'
                            : 'F+T'
                          : fasted
                          ? lang === 'bn'
                            ? 'রোজা'
                            : 'Fast'
                          : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? '১ বার ট্যাপ = রোজা, ২ বার ট্যাপ = রোজা + তারাবিহ, ৩ বার ট্যাপ = রিসেট'
                  : '1st tap = Fast, 2nd tap = Fast + Taraweeh, 3rd tap = Reset'}
              </p>
            </div>

            {/* Laylat al-Qadr Odd Nights Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {lang === 'bn' ? 'লাইলাতুল কদরের বেজোড় রাতের ইবাদত তালিকা' : 'Laylat al-Qadr Odd Nights Checklist'}
              </h4>
              <div className="grid grid-cols-5 gap-1.5">
                {[21, 23, 25, 27, 29].map((night) => {
                  const key = `night_${night}`;
                  const done = Boolean(data.islamicState.laylatulQadrChecks[key]);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        updateIslamicState((prev) => ({
                          ...prev,
                          laylatulQadrChecks: { ...prev.laylatulQadrChecks, [key]: !done },
                        }))
                      }
                      className={`min-h-[44px] rounded-xl text-xs font-bold border ${
                        done
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lang === 'bn' ? `${toLocalDigits(night, lang)}তম রাত` : `Night ${night}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zakat & Fitrah Calculator */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {lang === 'bn' ? 'যাকাত ও ফিতরা ক্যালকুলেটর' : 'Zakat & Fitrah Calculator'}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'bn' ? 'সর্বশেষ আপডেট:' : 'Last updated:'}{' '}
                  {toLocalDigits(zakatRates.lastUpdated, lang)}
                </span>
              </div>

              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {t('zakatMarketNote', lang)}
              </p>

              {/* Editable Gold / Silver / Fitrah Market Rates */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {lang === 'bn' ? `স্বর্ণ/গ্রাম (${currency})` : `Gold/g (${currency})`}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={zakatRates.goldPerGram}
                    onChange={(e) =>
                      updateIslamicState((prev) => ({
                        ...prev,
                        zakatRates: {
                          ...prev.zakatRates,
                          goldPerGram: Math.max(0, Number(e.target.value) || 0),
                          lastUpdated: todayIso,
                        },
                      }))
                    }
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {lang === 'bn' ? `রুপা/গ্রাম (${currency})` : `Silver/g (${currency})`}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={zakatRates.silverPerGram}
                    onChange={(e) =>
                      updateIslamicState((prev) => ({
                        ...prev,
                        zakatRates: {
                          ...prev.zakatRates,
                          silverPerGram: Math.max(0, Number(e.target.value) || 0),
                          lastUpdated: todayIso,
                        },
                      }))
                    }
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {lang === 'bn' ? `ফিতরা/জন (${currency})` : `Fitrah/person (${currency})`}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={zakatRates.fitrahPerPerson}
                    onChange={(e) =>
                      updateIslamicState((prev) => ({
                        ...prev,
                        zakatRates: {
                          ...prev.zakatRates,
                          fitrahPerPerson: Math.max(0, Number(e.target.value) || 0),
                          lastUpdated: todayIso,
                        },
                      }))
                    }
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Nisab Basis Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNisabBasis('silver')}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold ${
                    nisabBasis === 'silver'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lang === 'bn' ? 'রুপার নিসাব (৫২.৫ তোলা / ৬১২.৩৬ গ্রাম)' : 'Silver Nisab (612.36g)'}
                </button>
                <button
                  type="button"
                  onClick={() => setNisabBasis('gold')}
                  className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold ${
                    nisabBasis === 'gold'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lang === 'bn' ? 'স্বর্ণের নিসাব (৭.৫ তোলা / ৮৭.৪৮ গ্রাম)' : 'Gold Nisab (87.48g)'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {lang === 'bn' ? `নগদ ও ব্যাংক সঞ্চয় (${currency})` : `Cash & Savings (${currency})`}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={cashSavings}
                    onChange={(e) => setCashSavings(e.target.value)}
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {lang === 'bn' ? 'স্বর্ণের পরিমাণ (গ্রাম)' : 'Gold Owned (grams)'}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={goldGrams}
                    onChange={(e) => setGoldGrams(e.target.value)}
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {lang === 'bn' ? 'রুপার পরিমাণ (গ্রাম)' : 'Silver Owned (grams)'}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={silverGrams}
                    onChange={(e) => setSilverGrams(e.target.value)}
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {lang === 'bn' ? `ব্যবসায়িক পণ্য (${currency})` : `Business Assets (${currency})`}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={businessGoods}
                    onChange={(e) => setBusinessGoods(e.target.value)}
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {lang === 'bn' ? `তাৎক্ষণিক ঋণ বাদ (${currency})` : `Deductible Debts (${currency})`}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={shortTermDebts}
                    onChange={(e) => setShortTermDebts(e.target.value)}
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {lang === 'bn' ? 'ফিতরার সদস্য সংখ্যা' : 'Family Members (Fitrah)'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={familyMembers}
                    onChange={(e) => setFamilyMembers(e.target.value)}
                    className="w-full min-h-[44px] px-2.5 rounded-xl bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-emerald-600/10 dark:bg-emerald-500/10 border border-emerald-500/30 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span>{lang === 'bn' ? 'নিসাব সীমা:' : 'Nisab Threshold:'}</span>
                  <span className="font-bold">
                    {currency} {formatNum(nisabAmount, lang)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'bn' ? 'নিট যাকাতযোগ্য সম্পদ:' : 'Net Zakatable Wealth:'}</span>
                  <span className="font-bold">
                    {currency} {formatNum(netZakatable, lang)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-emerald-700 dark:text-emerald-300 pt-1 border-t border-emerald-500/20">
                  <span>{lang === 'bn' ? 'প্রদেয় যাকাত (২.৫%):' : 'Payable Zakat (2.5%):'}</span>
                  <span>
                    {currency} {formatNum(zakatPayable, lang)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span>{lang === 'bn' ? 'মোট সদকাতুল ফিতর:' : 'Total Sadaqatul Fitr:'}</span>
                  <span>
                    {currency} {formatNum(totalFitrah, lang)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const IslamicIbadahTab: React.FC = () => {
  const { data, lang, updateIbadahLog, updateIslamicState } = useLifeTrack();
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayIso);

  const dayLog = data.ibadahLogs[selectedDate] || createEmptyIbadahLog(selectedDate);
  const istate = data.islamicState;

  const fardPrayers: { key: keyof typeof dayLog.fard; bn: string; en: string }[] = [
    { key: 'fajr', bn: 'ফজর', en: 'Fajr' },
    { key: 'dhuhr', bn: 'যোহর', en: 'Dhuhr' },
    { key: 'asr', bn: 'আসর', en: 'Asr' },
    { key: 'maghrib', bn: 'মাগরিব', en: 'Maghrib' },
    { key: 'isha', bn: 'এশা', en: 'Isha' },
  ];

  const statusOptions: { val: PrayerStatus; bn: string; en: string }[] = [
    { val: 'jamaat', bn: 'জামাতে', en: 'Jamaat' },
    { val: 'ontime', bn: 'সময়ে', en: 'On Time' },
    { val: 'qaza', bn: 'কাজা', en: 'Qaza' },
  ];

  const extraChecks: {
    key: 'sunnahNafl' | 'witr' | 'tahajjud' | 'duha' | 'morningAdhkar' | 'eveningAdhkar' | 'sadaqahDone';
    bn: string;
    en: string;
  }[] = [
    { key: 'sunnahNafl', bn: 'সুন্নাত ও নফল নামাজ', en: 'Sunnah & Nafl Prayers' },
    { key: 'witr', bn: 'বিতর নামাজ', en: 'Witr Prayer' },
    { key: 'tahajjud', bn: 'তাহাজ্জুদ নামাজ', en: 'Tahajjud' },
    { key: 'duha', bn: 'সালাতুদ দুহা / চাশত', en: 'Duha / Chasht' },
    { key: 'morningAdhkar', bn: 'সকালের মাসনুন আজকার', en: 'Morning Adhkar' },
    { key: 'eveningAdhkar', bn: 'সন্ধ্যার মাসনুন আজকার', en: 'Evening Adhkar' },
    { key: 'sadaqahDone', bn: 'আজকের দান / সদকা', en: 'Daily Sadaqah' },
  ];

  // Compute 28-day Ibadah heatmap & streak
  const { heatmapDays, ibadahStreak } = useMemo(() => {
    const cells: { iso: string; score: number }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const log = data.ibadahLogs[iso];
      let score = 0;
      if (log) {
        score += Object.values(log.fard).filter((s) => s !== 'none').length;
        if (log.witr) score += 1;
        if (log.morningAdhkar || log.eveningAdhkar) score += 1;
      }
      cells.push({ iso, score });
    }
    let streak = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].score >= 5) streak++;
      else if (i < cells.length - 1) break;
    }
    return { heatmapDays: cells, ibadahStreak: streak };
  }, [data.ibadahLogs]);

  const currentPhrase = TASBIH_PHRASES[istate.tasbihPhraseIndex % TASBIH_PHRASES.length] || TASBIH_PHRASES[0];

  const handleTasbihTap = () => {
    const nextCount = istate.tasbihCount + 1;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (nextCount % istate.tasbihGoal === 0) {
        navigator.vibrate([50, 40, 80]);
      } else {
        navigator.vibrate(18);
      }
    }
    updateIslamicState((prev) => ({ ...prev, tasbihCount: prev.tasbihCount + 1 }));
  };

  return (
    <div className="space-y-4">
      {/* 5 Fard Prayers Tracker */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {lang === 'bn' ? 'পাঁচ ওয়াক্ত ফরজ নামাজ' : 'Five Daily Fard Prayers'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              {lang === 'bn'
                ? `ধারাবাহিকতা: ${toLocalDigits(ibadahStreak, lang)} দিন`
                : `Streak: ${ibadahStreak} days`}
            </p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium"
          />
        </div>

        <div className="space-y-2">
          {fardPrayers.map((p) => {
            const current = dayLog.fard[p.key];
            return (
              <div
                key={p.key}
                className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 flex items-center justify-between gap-2"
              >
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 min-w-[64px]">
                  {lang === 'bn' ? p.bn : p.en}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {statusOptions.map((opt) => {
                    const active = current === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() =>
                          updateIbadahLog(selectedDate, (prev) => ({
                            ...prev,
                            fard: {
                              ...prev.fard,
                              [p.key]: active ? 'none' : opt.val,
                            },
                          }))
                        }
                        className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold transition-colors ${
                          active
                            ? opt.val === 'qaza'
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lang === 'bn' ? opt.bn : opt.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sunnah, Nafl, Adhkar, Tilawat & Durood */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {lang === 'bn' ? 'সুন্নাত, নফল ও দৈনিক আমল' : 'Sunnah, Nafl & Daily Amal'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {extraChecks.map((item) => {
            const done = dayLog[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  updateIbadahLog(selectedDate, (prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key],
                  }))
                }
                className={`min-h-[44px] px-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{lang === 'bn' ? item.bn : item.en}</span>
                <CheckCircle2 className={`w-4 h-4 ${done ? 'opacity-100' : 'opacity-30'}`} />
              </button>
            );
          })}
        </div>

        {/* Numeric counters for Tilawat, Istighfar, Durood */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-2.5 text-center space-y-1">
            <span className="text-[11px] text-slate-500 block">
              {lang === 'bn' ? 'তিলাওয়াত (পৃষ্ঠা)' : 'Tilawat (Pages)'}
            </span>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  updateIbadahLog(selectedDate, (prev) => ({
                    ...prev,
                    tilawatPages: Math.max(0, prev.tilawatPages - 1),
                  }))
                }
                className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold">{toLocalDigits(dayLog.tilawatPages, lang)}</span>
              <button
                type="button"
                onClick={() =>
                  updateIbadahLog(selectedDate, (prev) => ({
                    ...prev,
                    tilawatPages: prev.tilawatPages + 1,
                  }))
                }
                className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-2.5 text-center space-y-1">
            <span className="text-[11px] text-slate-500 block">
              {lang === 'bn' ? 'ইস্তিগফার' : 'Istighfar'}
            </span>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  updateIbadahLog(selectedDate, (prev) => ({
                    ...prev,
                    istighfarCount: Math.max(0, prev.istighfarCount - 10),
                  }))
                }
                className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold">{toLocalDigits(dayLog.istighfarCount, lang)}</span>
              <button
                type="button"
                onClick={() =>
                  updateIbadahLog(selectedDate, (prev) => ({
                    ...prev,
                    istighfarCount: prev.istighfarCount + 10,
                  }))
                }
                className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-2.5 text-center space-y-1">
            <span className="text-[11px] text-slate-500 block">
              {lang === 'bn' ? 'দরুদ শরিফ' : 'Durood'}
            </span>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  updateIbadahLog(selectedDate, (prev) => ({
                    ...prev,
                    duroodCount: Math.max(0, prev.duroodCount - 10),
                  }))
                }
                className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold">{toLocalDigits(dayLog.duroodCount, lang)}</span>
              <button
                type="button"
                onClick={() =>
                  updateIbadahLog(selectedDate, (prev) => ({
                    ...prev,
                    duroodCount: prev.duroodCount + 10,
                  }))
                }
                className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Tasbih Counter */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm text-center">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {lang === 'bn' ? 'ডিজিটাল তাসবিহ কাউন্টার' : 'Digital Tasbih Counter'}
          </h3>
          <div className="flex items-center gap-1.5">
            {[33, 100].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => updateIslamicState((prev) => ({ ...prev, tasbihGoal: g }))}
                className={`min-h-[36px] px-2.5 rounded-lg text-xs font-bold ${
                  istate.tasbihGoal === g
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {toLocalDigits(g, lang)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => updateIslamicState((prev) => ({ ...prev, tasbihCount: 0 }))}
              aria-label={t('resetBtn', lang)}
              className="min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phrase selector */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {TASBIH_PHRASES.map((ph, idx) => (
            <button
              key={ph.en}
              type="button"
              onClick={() => updateIslamicState((prev) => ({ ...prev, tasbihPhraseIndex: idx }))}
              className={`shrink-0 min-h-[40px] px-3 rounded-xl text-xs font-semibold ${
                istate.tasbihPhraseIndex === idx
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {lang === 'bn' ? ph.bn : ph.en}
            </button>
          ))}
        </div>

        <p className="font-arabic text-2xl text-emerald-700 dark:text-emerald-300 py-1">
          {currentPhrase.ar}
        </p>

        <button
          type="button"
          onClick={handleTasbihTap}
          className="w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 active:scale-95 transition-transform text-white shadow-lg flex flex-col items-center justify-center select-none"
        >
          <span className="text-3xl font-extrabold tabular-nums">
            {toLocalDigits(istate.tasbihCount, lang)}
          </span>
          <span className="text-xs text-emerald-100 mt-1">
            / {toLocalDigits(istate.tasbihGoal, lang)}
          </span>
        </button>
      </div>

      {/* Qaza Prayer & Fast Counters */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {lang === 'bn' ? 'বকেয়া কাজা নামাজ ও রোজার হিসাব' : 'Qaza Prayer & Fast Tracker'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(
            [
              { k: 'fajr', bn: 'ফজর', en: 'Fajr' },
              { k: 'dhuhr', bn: 'যোহর', en: 'Dhuhr' },
              { k: 'asr', bn: 'আসর', en: 'Asr' },
              { k: 'maghrib', bn: 'মাগরিব', en: 'Maghrib' },
              { k: 'isha', bn: 'এশা', en: 'Isha' },
              { k: 'witr', bn: 'বিতর', en: 'Witr' },
            ] as const
          ).map((item) => (
            <div key={item.k} className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-2.5 space-y-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block text-center">
                {lang === 'bn' ? item.bn : item.en}
              </span>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    updateIslamicState((prev) => ({
                      ...prev,
                      qazaPrayers: {
                        ...prev.qazaPrayers,
                        [item.k]: Math.max(0, prev.qazaPrayers[item.k] - 1),
                      },
                    }))
                  }
                  className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold">
                  {toLocalDigits(istate.qazaPrayers[item.k], lang)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateIslamicState((prev) => ({
                      ...prev,
                      qazaPrayers: {
                        ...prev.qazaPrayers,
                        [item.k]: prev.qazaPrayers[item.k] + 1,
                      },
                    }))
                  }
                  className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Qaza Fasts */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {lang === 'bn' ? 'বকেয়া কাজা রোজা' : 'Remaining Qaza Fasts'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                updateIslamicState((prev) => ({ ...prev, qazaFasts: Math.max(0, prev.qazaFasts - 1) }))
              }
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-base font-extrabold min-w-[28px] text-center">
              {toLocalDigits(istate.qazaFasts, lang)}
            </span>
            <button
              type="button"
              onClick={() =>
                updateIslamicState((prev) => ({ ...prev, qazaFasts: prev.qazaFasts + 1 }))
              }
              className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 28-Day Ibadah Consistency Heatmap */}
      <div className="rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {lang === 'bn' ? 'গত ২৮ দিনের ইবাদত হিটম্যাপ' : '28-Day Ibadah Heatmap'}
        </h3>
        <div className="grid grid-cols-7 gap-1.5">
          {heatmapDays.map((cell) => {
            const bg =
              cell.score === 0
                ? 'bg-slate-100 dark:bg-slate-800'
                : cell.score <= 2
                ? 'bg-emerald-200 dark:bg-emerald-900/60'
                : cell.score <= 4
                ? 'bg-emerald-400 dark:bg-emerald-700'
                : 'bg-emerald-600 dark:bg-emerald-500 text-white';
            return (
              <div
                key={cell.iso}
                title={cell.iso}
                className={`h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold ${bg}`}
              >
                {toLocalDigits(Number(cell.iso.slice(-2)), lang)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
