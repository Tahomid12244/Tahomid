import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { ChapterItem } from '../../../types';
import { calculateChapterProgress, getChapterStatus } from '../../../utils/hscSyllabus';
import { formatNum, t } from '../../../utils/i18n';
import { getOverallHscStats, getSubjectStats, isHscClass } from '../../../utils/nctbCurriculum';

export const StudySyllabusTab: React.FC = () => {
  const {
    data,
    lang,
    selectedSyllabusSubjectId,
    addOrUpdateSubject,
    deleteOrHideSubject,
    restoreSubject,
    updateChapter,
    addChapter,
    deleteOrHideChapter,
    restoreHiddenChapters,
  } = useLifeTrack();

  const visibleSubjects = data.subjects.filter((s) => !s.archived && !s.hidden);
  const hiddenSubjects = data.subjects.filter((s) => !s.archived && s.hidden);

  const [activeSubjId, setActiveSubjId] = useState<string>(
    () => selectedSyllabusSubjectId || visibleSubjects[0]?.id || ''
  );
  const [paperTab, setPaperTab] = useState<1 | 2>(1);
  const [expandedChId, setExpandedChId] = useState<string | null>(null);

  // Modals
  const [showAddCh, setShowAddCh] = useState(false);
  const [chName, setChName] = useState('');
  const [chTotalClasses, setChTotalClasses] = useState('10');

  const [showManageSubjects, setShowManageSubjects] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjTwoPapers, setNewSubjTwoPapers] = useState(false);
  const [newSubjColor, setNewSubjColor] = useState('#059669');

  useEffect(() => {
    if (selectedSyllabusSubjectId && visibleSubjects.some((s) => s.id === selectedSyllabusSubjectId)) {
      setActiveSubjId(selectedSyllabusSubjectId);
    } else if (!visibleSubjects.some((s) => s.id === activeSubjId)) {
      setActiveSubjId(visibleSubjects[0]?.id || '');
    }
  }, [selectedSyllabusSubjectId, visibleSubjects, activeSubjId]);

  const currentSubject = visibleSubjects.find((s) => s.id === activeSubjId) || visibleSubjects[0];
  const isUserHsc = data.profile ? isHscClass(data.profile.classLevel) : false;
  const hscOverall = getOverallHscStats(data.subjects);

  const handleAddNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    const id = `subj_user_${Date.now()}`;
    addOrUpdateSubject({
      id,
      key: id,
      bn: newSubjName.trim(),
      en: newSubjName.trim(),
      color: newSubjColor,
      icon: 'BookOpen',
      hasTwoPapers: newSubjTwoPapers,
      preloaded: false,
      hidden: false,
      archived: false,
      chapters: [],
    });
    setActiveSubjId(id);
    setNewSubjName('');
    setShowManageSubjects(false);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject || !chName.trim()) return;
    addChapter(
      currentSubject.id,
      currentSubject.hasTwoPapers ? paperTab : 1,
      chName.trim(),
      chName.trim(),
      Math.max(0, Math.floor(Number(chTotalClasses) || 0))
    );
    setChName('');
    setShowAddCh(false);
  };

  if (visibleSubjects.length === 0) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
        <BookOpen className="w-10 h-10 text-emerald-600 mx-auto" />
        <p className="text-sm font-bold">{t('addFirstSubjectEmpty', lang)}</p>
        {hiddenSubjects.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {hiddenSubjects.map((hs) => (
              <button
                key={hs.id}
                type="button"
                onClick={() => restoreSubject(hs.id)}
                className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                {t('restoreBtn', lang)}: {lang === 'bn' ? hs.bn : hs.en}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleAddNewSubject} className="max-w-xs mx-auto space-y-2.5">
          <input
            type="text"
            required
            value={newSubjName}
            onChange={(e) => setNewSubjName(e.target.value)}
            placeholder={lang === 'bn' ? 'বিষয়ের নাম লিখুন' : 'Subject name'}
            className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
          />
          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-emerald-600 text-white font-bold text-sm"
          >
            {t('add', lang)}
          </button>
        </form>
      </div>
    );
  }

  const subjStats = getSubjectStats(currentSubject);
  const paperChapters = currentSubject.chapters.filter(
    (c) => !c.hidden && (currentSubject.hasTwoPapers ? c.paper === paperTab : true)
  );
  const hiddenChaptersCount = currentSubject.chapters.filter((c) => c.hidden).length;
  const isWeakest = hscOverall.weakestSubject?.id === currentSubject.id && subjStats.hasChapters && subjStats.avgPct < 100;

  return (
    <div className="space-y-4">
      {/* HSC Student Banner (from single profile object — never duplicated) */}
      {isUserHsc && data.profile && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>
              {t('studentNameLabel', lang)}: <strong className="text-slate-900 dark:text-white">{data.profile.name}</strong>
            </span>
            {data.profile.rollId && (
              <span>
                {t('studentIdLabel', lang)}: <strong className="text-slate-900 dark:text-white">{data.profile.rollId}</strong>
              </span>
            )}
            {data.profile.batch && (
              <span>
                {t('batchDisplayLabel', lang)}: <strong className="text-emerald-600 dark:text-emerald-400">{data.profile.batch}</strong>
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>{t('hscPrepCardTitle', lang)}</span>
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatNum(hscOverall.overallPct, lang, 1)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${Math.min(100, hscOverall.overallPct)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Subject Pills + Manage Button */}
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5">
        {visibleSubjects.map((s) => {
          const active = s.id === currentSubject.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveSubjId(s.id);
                setPaperTab(1);
              }}
              className={`min-h-[44px] px-4 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 border transition-colors ${
                active
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span>{lang === 'bn' ? s.bn : s.en}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowManageSubjects((v) => !v)}
          className="min-h-[44px] px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold shrink-0 flex items-center gap-1.5"
        >
          <Settings2 className="w-4 h-4" />
          <span>{lang === 'bn' ? 'বিষয় ব্যবস্থাপনা' : 'Manage Subjects'}</span>
        </button>
      </div>

      {/* Manage Subjects Panel */}
      {showManageSubjects && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <form onSubmit={handleAddNewSubject} className="space-y-2.5">
            <p className="text-xs font-bold">{t('addNewSubjectOption', lang)}</p>
            <input
              type="text"
              required
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              placeholder={lang === 'bn' ? 'নতুন বিষয়ের নাম' : 'New subject name'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSubjTwoPapers}
                  onChange={(e) => setNewSubjTwoPapers(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                <span>{lang === 'bn' ? '১ম ও ২য় পত্র আছে' : 'Has 1st & 2nd Paper'}</span>
              </label>
              <div className="flex items-center gap-1.5">
                {['#059669', '#2563eb', '#d97706', '#e11d48', '#7c3aed'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewSubjColor(col)}
                    className={`w-6 h-6 rounded-full ${newSubjColor === col ? 'ring-2 ring-emerald-500' : ''}`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              {t('add', lang)}
            </button>
          </form>

          {/* Hide / Delete current subject or Restore hidden subjects */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => deleteOrHideSubject(currentSubject.id, true)}
              className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
            >
              <EyeOff className="w-4 h-4" />
              <span>
                {t('hideSubjectBtn', lang)}: {lang === 'bn' ? currentSubject.bn : currentSubject.en}
              </span>
            </button>

            {!currentSubject.preloaded && (
              <button
                type="button"
                onClick={() => deleteOrHideSubject(currentSubject.id, false)}
                className="min-h-[44px] px-3.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('delete', lang)}</span>
              </button>
            )}

            {hiddenSubjects.map((hs) => (
              <button
                key={hs.id}
                type="button"
                onClick={() => restoreSubject(hs.id)}
                className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>
                  {t('restoreBtn', lang)}: {lang === 'bn' ? hs.bn : hs.en}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject Summary Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold">{lang === 'bn' ? currentSubject.bn : currentSubject.en}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('totalChapters', lang)}: {formatNum(subjStats.total, lang)} · {t('completed', lang)}:{' '}
              {formatNum(subjStats.completed, lang)} · {t('inProgress', lang)}:{' '}
              {formatNum(subjStats.inProgress, lang)} · {t('notStarted', lang)}:{' '}
              {formatNum(subjStats.notStarted, lang)}
            </p>
          </div>
          {isWeakest && (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('weakBadge', lang)}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>{t('subjectPrepPct', lang)}</span>
            <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatNum(subjStats.avgPct, lang, 1)}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, subjStats.avgPct)}%`, backgroundColor: currentSubject.color }}
            />
          </div>
        </div>

        {currentSubject.hasTwoPapers && (
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
            <div>
              {t('paper1', lang)}: <strong className="tabular-nums text-slate-900 dark:text-white">{formatNum(subjStats.paper1Pct, lang, 1)}%</strong>
            </div>
            <div>
              {t('paper2', lang)}: <strong className="tabular-nums text-slate-900 dark:text-white">{formatNum(subjStats.paper2Pct, lang, 1)}%</strong>
            </div>
          </div>
        )}
      </div>

      {/* 1st Paper / 2nd Paper Toggle + Add Chapter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {currentSubject.hasTwoPapers ? (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPaperTab(1)}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-bold transition-colors ${
                paperTab === 1 ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('paper1', lang)}
            </button>
            <button
              type="button"
              onClick={() => setPaperTab(2)}
              className={`min-h-[40px] px-4 rounded-lg text-xs font-bold transition-colors ${
                paperTab === 2 ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('paper2', lang)}
            </button>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {hiddenChaptersCount > 0 && (
            <button
              type="button"
              onClick={() => restoreHiddenChapters(currentSubject.id)}
              className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
            >
              {t('showHiddenChapters', lang)} ({formatNum(hiddenChaptersCount, lang)})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAddCh((v) => !v)}
            className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addChapterBtn', lang)}</span>
          </button>
        </div>
      </div>

      {/* Add Chapter Form */}
      {showAddCh && (
        <form
          onSubmit={handleCreateChapter}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"
        >
          <input
            type="text"
            required
            value={chName}
            onChange={(e) => setChName(e.target.value)}
            placeholder={lang === 'bn' ? 'অধ্যায়ের নাম লিখুন' : 'Chapter title'}
            className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
          />
          <div>
            <label className="block text-xs font-semibold mb-1">{t('totalClassesLabel', lang)}</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={200}
              value={chTotalClasses}
              onChange={(e) => setChTotalClasses(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            {t('save', lang)}
          </button>
        </form>
      )}

      {/* Chapter Cards List */}
      {paperChapters.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <p className="text-sm text-slate-500">
            {lang === 'bn'
              ? 'এই পত্রে এখনও কোনো অধ্যায় যোগ করা হয়নি। নিজের সিলেবাস অনুযায়ী অধ্যায় যোগ করুন।'
              : 'No chapters added yet for this paper. Write your own chapters to start tracking.'}
          </p>
          <button
            type="button"
            onClick={() => setShowAddCh(true)}
            className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            {t('addChapterBtn', lang)}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {paperChapters.map((ch) => {
            const pct = calculateChapterProgress(ch);
            const status = getChapterStatus(pct);
            const isExpanded = expandedChId === ch.id;

            const statusLabel =
              status === 'completed'
                ? t('completed', lang)
                : status === 'in_progress'
                ? t('inProgress', lang)
                : t('notStarted', lang);

            const tickFields: { key: keyof ChapterItem; label: string; weight: number }[] = [
              { key: 'cqSolved', label: t('cqSolvedLabel', lang), weight: 20 },
              { key: 'mcqSolved', label: t('mcqSolvedLabel', lang), weight: 10 },
              { key: 'admissionPyq', label: t('admissionPyqLabel', lang), weight: 10 },
              { key: 'otherProblems', label: t('otherProblemsLabel', lang), weight: 10 },
              { key: 'examDone', label: t('examDoneLabel', lang), weight: 10 },
              { key: 'mistakesCorrected', label: t('mistakesCorrectedLabel', lang), weight: 5 },
            ];

            return (
              <div
                key={ch.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedChId(isExpanded ? null : ch.id)}
                  className="w-full min-h-[58px] p-3.5 flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Small Progress Ring */}
                    <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.2"
                          className="text-slate-100 dark:text-slate-800"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 15}
                          strokeDashoffset={2 * Math.PI * 15 * (1 - pct / 100)}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold tabular-nums">
                        {formatNum(Math.round(pct), lang)}%
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-snug break-words">
                        {formatNum(ch.no, lang)}. {lang === 'bn' ? ch.bn : ch.en}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {statusLabel} · {formatNum(ch.completedClasses, lang)}/{formatNum(ch.totalClasses, lang)}{' '}
                        {lang === 'bn' ? 'ক্লাস' : 'classes'}
                      </p>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
                    {/* Classes Counter (35% max) */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold mb-1">{t('totalClassesLabel', lang)}</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={500}
                          value={ch.totalClasses || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const nextTotal = Math.max(0, Math.floor(Number(e.target.value) || 0));
                            const clampedCompleted = Math.min(nextTotal, ch.completedClasses);
                            updateChapter(currentSubject.id, {
                              ...ch,
                              totalClasses: nextTotal,
                              completedClasses: clampedCompleted,
                            });
                          }}
                          className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">{t('completedClassesLabel', lang)}</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={ch.totalClasses}
                          value={ch.completedClasses || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const rawVal = Math.max(0, Math.floor(Number(e.target.value) || 0));
                            const clamped = Math.min(ch.totalClasses, rawVal);
                            updateChapter(currentSubject.id, {
                              ...ch,
                              completedClasses: clamped,
                            });
                          }}
                          className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm tabular-nums"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-700 dark:text-amber-400">{t('chapterTickHint', lang)}</p>

                    {/* 6 Weighted Checkboxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tickFields.map((tf) => {
                        const checked = Boolean(ch[tf.key]);
                        return (
                          <label
                            key={tf.key}
                            className={`min-h-[44px] px-3 rounded-xl flex items-center justify-between cursor-pointer border transition-colors ${
                              checked
                                ? 'bg-emerald-600/10 border-emerald-600/40 text-emerald-900 dark:text-emerald-200'
                                : 'bg-slate-50 dark:bg-slate-800/70 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  updateChapter(currentSubject.id, {
                                    ...ch,
                                    [tf.key]: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 accent-emerald-600"
                              />
                              <span className="text-xs font-semibold">{tf.label}</span>
                            </div>
                            <span className="text-[11px] font-bold tabular-nums text-slate-500">
                              +{formatNum(tf.weight, lang)}%
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Difficulty & Notes */}
                    <div className="flex items-center gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => updateChapter(currentSubject.id, { ...ch, difficulty: diff })}
                          className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold ${
                            ch.difficulty === diff
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {diff === 'easy' && t('difficultyEasy', lang)}
                          {diff === 'medium' && t('difficultyMedium', lang)}
                          {diff === 'hard' && t('difficultyHard', lang)}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      value={ch.notes}
                      onChange={(e) => updateChapter(currentSubject.id, { ...ch, notes: e.target.value })}
                      placeholder={t('notesPlaceholder', lang)}
                      className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => deleteOrHideChapter(currentSubject.id, ch.id)}
                        className="min-h-[40px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5"
                      >
                        {ch.preloaded ? <EyeOff className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span>{ch.preloaded ? t('hideSubjectBtn', lang) : t('delete', lang)}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
