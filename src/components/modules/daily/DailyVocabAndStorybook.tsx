import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Edit3,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Star,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { VocabWord } from '../../../types';
import { formatNum, t, toLocalDigits } from '../../../utils/i18n';
import { ORIGINAL_PRACTICE_STORIES, PracticeStory } from '../../../utils/starterData';
import { playTimerChime } from '../../../utils/security';

export const DailyVocabTab: React.FC = () => {
  const {
    data,
    lang,
    saveWord,
    importWordsBulk,
    reviewWordCard,
    recordQuizMistake,
  } = useLifeTrack();

  const today = new Date().toISOString().slice(0, 10);
  const [subMode, setSubMode] = useState<'flashcards' | 'list' | 'quiz'>('flashcards');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [flipped, setFlipped] = useState(false);
  const [cardIdx, setCardIdx] = useState(0);
  const [hasBnVoice, setHasBnVoice] = useState(false);

  // Add / Edit / Report Wrong Meaning Modal
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Quiz state
  const [quizDirection, setQuizDirection] = useState<'en_to_bn' | 'bn_to_en'>('en_to_bn');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<string | null>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setHasBnVoice(voices.some((v) => v.lang.toLowerCase().startsWith('bn')));
    };
    checkVoices();
    window.speechSynthesis.onvoiceschanged = checkVoices;
  }, []);

  const speakWord = (text: string, voiceLang: 'en-US' | 'bn-BD') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = voiceLang;
    window.speechSynthesis.speak(utter);
  };

  const dueWords = data.words.filter((w) => !w.nextReviewDate || w.nextReviewDate <= today);
  const activeDeck = dueWords.length > 0 ? dueWords : data.words;
  const currentCard = activeDeck[cardIdx % Math.max(1, activeDeck.length)];

  const dayOfYear = Math.floor(Date.now() / 86400000);
  const wordOfDay = data.words[dayOfYear % Math.max(1, data.words.length)];

  const filteredList = data.words.filter((w) => {
    if (tagFilter !== 'all' && w.tag !== tagFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        w.word.toLowerCase().includes(q) ||
        w.bnMeaning.toLowerCase().includes(q) ||
        w.enMeaning.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Quiz options generator
  const quizPool = data.words.slice(0, 30);
  const currentQuizWord = quizPool[quizIndex % Math.max(1, quizPool.length)];
  const quizOptions = React.useMemo(() => {
    if (!currentQuizWord) return [];
    const others = data.words
      .filter((w) => w.id !== currentQuizWord.id)
      .slice(0, 12)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    return [...others, currentQuizWord].sort((a, b) => a.id.localeCompare(b.id));
  }, [currentQuizWord, data.words]);

  const handleExportVocabJson = () => {
    const blob = new Blob([JSON.stringify(data.words, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lifetrack-vocabulary.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportVocabFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) importWordsBulk(parsed);
        } else {
          // CSV: word,bnMeaning,enMeaning
          const rows = text.split(/\r?\n/).filter(Boolean);
          const imported: VocabWord[] = rows.slice(1).map((line, idx): VocabWord => {
            const [w, bn, en] = line.split(',');
            return {
              id: `imp_${Date.now()}_${idx}`,
              word: (w || '').trim(),
              bnMeaning: (bn || '').trim(),
              enMeaning: (en || '').trim(),
              partOfSpeech: 'noun',
              example: '',
              tag: 'HSC',
              difficulty: 'medium',
              reviewed: false,
              intervalDays: 0,
              nextReviewDate: today,
            };
          }).filter((x) => x.word);
          importWordsBulk(imported);
        }
      } catch {
        // Ignore malformed file
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Word of the Day Banner */}
      {wordOfDay && (
        <div className="rounded-2xl bg-emerald-600/10 border border-emerald-600/30 p-3.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{t('wordOfTheDay', lang)}</p>
            <p className="text-sm font-bold truncate">
              {wordOfDay.word} — {wordOfDay.bnMeaning}
            </p>
          </div>
          <button
            type="button"
            onClick={() => speakWord(wordOfDay.word, 'en-US')}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mode Switch + Add Word */}
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 flex-1">
          {(['flashcards', 'list', 'quiz'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSubMode(m)}
              className={`min-h-[38px] rounded-lg text-xs font-bold ${
                subMode === m ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
              }`}
            >
              {m === 'flashcards'
                ? lang === 'bn'
                  ? 'ফ্ল্যাশকার্ড'
                  : 'Flashcards'
                : m === 'list'
                ? lang === 'bn'
                  ? 'তালিকা'
                  : 'Word List'
                : lang === 'bn'
                ? 'কুইজ'
                : 'Quiz'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingWord({
              id: `word_${Date.now()}`,
              word: '',
              bnMeaning: '',
              enMeaning: '',
              partOfSpeech: 'noun',
              example: '',
              tag: 'HSC',
              difficulty: 'medium',
              reviewed: false,
              intervalDays: 0,
              nextReviewDate: today,
            });
            setShowAddModal(true);
          }}
          className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>{t('add', lang)}</span>
        </button>
      </div>

      {/* FLASHCARDS */}
      {subMode === 'flashcards' && currentCard && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {t('dueTodayLabel', lang)}: <strong className="text-emerald-600">{formatNum(dueWords.length, lang)}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingWord(currentCard);
                setShowAddModal(true);
              }}
              className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('reportWrongMeaning', lang)}</span>
            </button>
          </div>

          <div
            onClick={() => setFlipped((f) => !f)}
            className="min-h-[220px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-xs space-y-3"
          >
            {!flipped ? (
              <>
                <span className="text-xs text-slate-400">{currentCard.tag} · {currentCard.partOfSpeech}</span>
                <h3 className="text-2xl font-bold">{currentCard.word}</h3>
                <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => speakWord(currentCard.word, 'en-US')}
                    className="min-h-[40px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>EN</span>
                  </button>
                  {hasBnVoice && (
                    <button
                      type="button"
                      onClick={() => speakWord(currentCard.bnMeaning, 'bn-BD')}
                      className="min-h-[40px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>বাংলা</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'অর্থ দেখতে কার্ডে ট্যাপ করুন' : 'Tap card to reveal meaning'}
                </p>
              </>
            ) : (
              <>
                <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{currentCard.bnMeaning}</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">{currentCard.enMeaning}</p>
                {currentCard.example && (
                  <p className="text-xs italic text-slate-500 pt-1">"{currentCard.example}"</p>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                reviewWordCard(currentCard.id, false);
                setFlipped(false);
                setCardIdx((i) => i + 1);
              }}
              className="min-h-[48px] rounded-2xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-sm"
            >
              {t('showAgainBtn', lang)}
            </button>
            <button
              type="button"
              onClick={() => {
                reviewWordCard(currentCard.id, true);
                setFlipped(false);
                setCardIdx((i) => i + 1);
              }}
              className="min-h-[48px] rounded-2xl bg-emerald-600 text-white font-bold text-sm"
            >
              {t('knowBtn', lang)}
            </button>
          </div>
        </div>
      )}

      {/* WORD LIST & IMPORT/EXPORT */}
      {subMode === 'list' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search', lang)}
              className="flex-1 min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
            />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="min-h-[44px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <option value="all">{t('all', lang)}</option>
              <option value="SSC">SSC</option>
              <option value="HSC">HSC</option>
              <option value="Admission">Admission</option>
              <option value="IELTS">IELTS</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportVocabJson}
              className="flex-1 min-h-[40px] rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <label className="flex-1 min-h-[40px] rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>CSV / JSON</span>
              <input type="file" accept=".csv,.json" onChange={handleImportVocabFile} className="hidden" />
            </label>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredList.slice(0, 60).map((w) => (
              <div
                key={w.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">{w.word}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{w.bnMeaning} · {w.enMeaning}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingWord(w);
                    setShowAddModal(true);
                  }}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-emerald-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUIZ MODE (Both Directions) */}
      {subMode === 'quiz' && currentQuizWord && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setQuizDirection((d) => (d === 'en_to_bn' ? 'bn_to_en' : 'en_to_bn'))}
              className="min-h-[38px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
            >
              {quizDirection === 'en_to_bn' ? 'EN → বাংলা' : 'বাংলা → EN'}
            </button>
            <span className="text-xs font-bold text-emerald-600 tabular-nums">
              {lang === 'bn' ? 'স্কোর' : 'Score'}: {formatNum(quizScore, lang)}
            </span>
          </div>

          <div className="py-4 text-center">
            <p className="text-xl font-bold">
              {quizDirection === 'en_to_bn' ? currentQuizWord.word : currentQuizWord.bnMeaning}
            </p>
          </div>

          <div className="space-y-2">
            {quizOptions.map((opt) => {
              const label = quizDirection === 'en_to_bn' ? opt.bnMeaning : opt.word;
              const isCorrect = opt.id === currentQuizWord.id;
              const chosen = quizAnswered === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={Boolean(quizAnswered)}
                  onClick={() => {
                    setQuizAnswered(opt.id);
                    if (isCorrect) setQuizScore((s) => s + 1);
                    else recordQuizMistake(currentQuizWord.id);
                  }}
                  className={`w-full min-h-[46px] px-4 rounded-xl text-left text-sm font-semibold border transition-colors ${
                    quizAnswered
                      ? isCorrect
                        ? 'bg-emerald-600/20 border-emerald-600 text-emerald-800 dark:text-emerald-200'
                        : chosen
                        ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-transparent'
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:border-emerald-500'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {quizAnswered && (
            <button
              type="button"
              onClick={() => {
                setQuizAnswered(null);
                setQuizIndex((i) => i + 1);
              }}
              className="w-full min-h-[46px] rounded-xl bg-emerald-600 text-white text-sm font-bold"
            >
              {t('nextBtn', lang)}
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Word Modal */}
      {showAddModal && editingWord && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingWord.word.trim() || !editingWord.bnMeaning.trim()) return;
              saveWord(editingWord);
              setShowAddModal(false);
            }}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{t('qaAddWord', lang)}</h3>
              <button type="button" onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              required
              value={editingWord.word}
              onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
              placeholder={lang === 'bn' ? 'ইংরেজি শব্দ' : 'English Word'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
            <input
              type="text"
              required
              value={editingWord.bnMeaning}
              onChange={(e) => setEditingWord({ ...editingWord, bnMeaning: e.target.value })}
              placeholder={lang === 'bn' ? 'বাংলা অর্থ' : 'Bangla Meaning'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
            <input
              type="text"
              value={editingWord.enMeaning}
              onChange={(e) => setEditingWord({ ...editingWord, enMeaning: e.target.value })}
              placeholder={lang === 'bn' ? 'ইংরেজি ব্যাখ্যা' : 'English Meaning'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
            <input
              type="text"
              value={editingWord.example}
              onChange={(e) => setEditingWord({ ...editingWord, example: e.target.value })}
              placeholder={lang === 'bn' ? 'উদাহরণ বাক্য' : 'Example sentence'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
            <button type="submit" className="w-full min-h-[46px] rounded-xl bg-emerald-600 text-white text-sm font-bold">
              {t('save', lang)}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const DailyStorybookTab: React.FC = () => {
  const {
    data,
    lang,
    saveBook,
    addReadingLog,
    markStoryRead,
    saveWord,
    updateTimer,
  } = useLifeTrack();

  const today = new Date().toISOString().slice(0, 10);
  const timer = data.activeTimers.reading;
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [activeStory, setActiveStory] = useState<PracticeStory | null>(null);
  const [readerTheme, setReaderTheme] = useState<'default' | 'sepia' | 'dark'>('default');
  const [fontSize, setFontSize] = useState<number>(16);
  const [tappedWord, setTappedWord] = useState<string | null>(null);

  const [showAddBook, setShowAddBook] = useState(false);
  const [bTitle, setBTitle] = useState('');
  const [bAuthor, setBAuthor] = useState('');
  const [bTotal, setBTotal] = useState('200');

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

  const matchedVocab = tappedWord
    ? data.words.find((w) => w.word.toLowerCase() === tappedWord.toLowerCase())
    : undefined;

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle.trim()) return;
    saveBook({
      id: `book_${Date.now()}`,
      title: bTitle.trim(),
      author: bAuthor.trim(),
      bookType: 'General',
      language: lang,
      totalPages: Math.max(1, Number(bTotal) || 100),
      pagesRead: 0,
      coverEmoji: '📗',
      coverColor: '#059669',
      status: 'reading',
      rating: 5,
      review: '',
      notes: '',
      quotes: [],
    });
    setBTitle('');
    setBAuthor('');
    setShowAddBook(false);
  };

  if (activeStory) {
    const readerBg =
      readerTheme === 'sepia'
        ? 'bg-amber-50 text-amber-950'
        : readerTheme === 'dark'
        ? 'bg-slate-950 text-slate-100'
        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100';

    const isRead = data.readStories.includes(activeStory.id);

    return (
      <div className={`rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 ${readerBg}`}>
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/50 pb-3">
          <button
            type="button"
            onClick={() => {
              setActiveStory(null);
              setTappedWord(null);
            }}
            className="min-h-[40px] px-3 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-xs font-bold"
          >
            {t('backBtn', lang)}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className="min-h-[38px] px-2.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-xs font-bold"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(24, s + 2))}
              className="min-h-[38px] px-2.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-xs font-bold"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() =>
                setReaderTheme((th) => (th === 'default' ? 'sepia' : th === 'sepia' ? 'dark' : 'default'))
              }
              className="min-h-[38px] px-2.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-xs font-bold"
            >
              {readerTheme === 'sepia' ? 'Sepia' : readerTheme === 'dark' ? 'Dark' : 'Auto'}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold">{activeStory.title}</h3>
          <p className="text-xs opacity-70 mt-0.5">{activeStory.author}</p>
        </div>

        {/* Tapped English Word Instant Lookup / One-Tap Add */}
        {tappedWord && (
          <div className="rounded-2xl bg-emerald-600/15 border border-emerald-600/40 p-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold">{tappedWord}</p>
              <p className="text-xs">
                {matchedVocab
                  ? `${matchedVocab.bnMeaning} · ${matchedVocab.enMeaning}`
                  : lang === 'bn'
                  ? 'শব্দভাণ্ডারে নেই'
                  : 'Not in your vocabulary list yet'}
              </p>
            </div>
            {!matchedVocab && (
              <button
                type="button"
                onClick={() => {
                  saveWord({
                    id: `word_${Date.now()}`,
                    word: tappedWord,
                    bnMeaning: lang === 'bn' ? 'অর্থ যোগ করুন' : 'Edit meaning',
                    enMeaning: tappedWord,
                    partOfSpeech: 'word',
                    example: '',
                    tag: 'General',
                    difficulty: 'medium',
                    reviewed: false,
                    intervalDays: 0,
                    nextReviewDate: today,
                  });
                }}
                className="min-h-[40px] px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0"
              >
                + {t('add', lang)}
              </button>
            )}
          </div>
        )}

        <div className="space-y-3 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
          {activeStory.paragraphs.map((para, pIdx) => (
            <p key={pIdx}>
              {activeStory.language === 'en'
                ? para.split(' ').map((token, wIdx) => {
                    const cleanWord = token.replace(/[^a-zA-Z]/g, '');
                    return (
                      <span
                        key={wIdx}
                        onClick={() => cleanWord && setTappedWord(cleanWord)}
                        className="cursor-pointer hover:bg-emerald-500/20 rounded px-0.5 transition-colors"
                      >
                        {token}{' '}
                      </span>
                    );
                  })
                : para}
            </p>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-emerald-600/10 text-xs font-medium">
          {activeStory.moral}
        </div>

        <button
          type="button"
          onClick={() => markStoryRead(activeStory.id)}
          className={`w-full min-h-[46px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
            isRead ? 'bg-slate-200 dark:bg-slate-800 text-emerald-600' : 'bg-emerald-600 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isRead ? t('completed', lang) : t('markAsRead', lang)}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reading Timer */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {lang === 'bn' ? 'পড়ার টাইমার' : 'Reading Timer'}
          </p>
          <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {toLocalDigits(String(Math.floor(remSec / 60)).padStart(2, '0'), lang)}:
            {toLocalDigits(String(remSec % 60).padStart(2, '0'), lang)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const now = Date.now();
              if (!timer.isRunning) {
                playTimerChime();
                updateTimer('reading', (p) => ({
                  ...p,
                  isRunning: true,
                  startedAtMs: p.startedAtMs ?? now,
                  targetEndMs: now + p.remainingMsWhenPaused,
                }));
              } else {
                updateTimer('reading', (p) => ({
                  ...p,
                  isRunning: false,
                  targetEndMs: null,
                  remainingMsWhenPaused: p.targetEndMs ? Math.max(0, p.targetEndMs - now) : p.remainingMsWhenPaused,
                }));
              }
            }}
            className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"
          >
            {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{timer.isRunning ? t('pauseBtn', lang) : t('startBtn', lang)}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              updateTimer('reading', (p) => ({
                ...p,
                isRunning: false,
                startedAtMs: null,
                targetEndMs: null,
                remainingMsWhenPaused: 20 * 60 * 1000,
              }))
            }
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5 Original Practice Stories */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-bold">
          {lang === 'bn' ? 'অনুশীলনের মৌলিক গল্প (৩টি বাংলা, ২টি ইংরেজি)' : '5 Original Practice Stories (Tap EN words for meaning)'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ORIGINAL_PRACTICE_STORIES.map((st) => {
            const done = data.readStories.includes(st.id);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStory(st)}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left space-y-1.5 hover:border-emerald-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {st.language === 'bn' ? 'বাংলা গল্প' : 'English Story'}
                  </span>
                  {done && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-sm font-bold">{st.title}</p>
                <p className="text-xs text-slate-500">
                  {formatNum(st.readingMinutes, lang)} {t('minutesUnit', lang)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal Book Library */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{lang === 'bn' ? 'ব্যক্তিগত পাঠাগার' : 'Personal Book Library'}</h3>
          <button
            type="button"
            onClick={() => setShowAddBook((v) => !v)}
            className="min-h-[40px] px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add', lang)}</span>
          </button>
        </div>

        {showAddBook && (
          <form
            onSubmit={handleCreateBook}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
          >
            <input
              type="text"
              required
              value={bTitle}
              onChange={(e) => setBTitle(e.target.value)}
              placeholder={lang === 'bn' ? 'বইয়ের নাম' : 'Book Title'}
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={bAuthor}
                onChange={(e) => setBAuthor(e.target.value)}
                placeholder={lang === 'bn' ? 'লেখক' : 'Author'}
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={bTotal}
                onChange={(e) => setBTotal(e.target.value)}
                placeholder={lang === 'bn' ? 'মোট পৃষ্ঠা' : 'Total Pages'}
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />
            </div>
            <button type="submit" className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold">
              {t('save', lang)}
            </button>
          </form>
        )}

        {data.books.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-2">
            <BookOpen className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'আপনার পাঠাগারে প্রথম বই যোগ করুন' : 'Add your first book to track reading'}
            </p>
          </div>
        ) : (
          data.books.map((bk) => {
            const pct = Math.min(100, Math.round((bk.pagesRead / Math.max(1, bk.totalPages)) * 100));
            return (
              <div
                key={bk.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      {bk.coverEmoji} {bk.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {bk.author} · {formatNum(bk.pagesRead, lang)}/{formatNum(bk.totalPages, lang)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addReadingLog({ bookId: bk.id, pages: 10, minutes: 15, date: today })}
                    className="min-h-[40px] px-3 rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0"
                  >
                    +{formatNum(10, lang)} {lang === 'bn' ? 'পৃষ্ঠা' : 'p'}
                  </button>
                </div>

                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => saveBook({ ...bk, rating: st })}
                      className="p-1"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          st <= bk.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
