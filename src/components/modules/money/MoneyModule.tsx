import React, { useMemo, useState } from 'react';
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
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  ListOrdered,
  PieChart as PieChartIcon,
  PiggyBank,
  Plus,
  Search,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { DebtRecord, ExpenseRecord, SavingsGoal } from '../../../types';
import { formatGregorianDate, formatHHMM, formatNum, t, toLocalDigits } from '../../../utils/i18n';
import { DEFAULT_MONEY_CATEGORIES } from '../../../utils/starterData';
import { SubTabBar, SubTabItem } from '../../common/SubTabBar';

const CHART_COLORS = ['#059669', '#d97706', '#0284c7', '#7c3aed', '#e11d48', '#0d9488', '#ea580c', '#64748b'];

const PAYMENT_METHODS: { id: ExpenseRecord['paymentMethod']; bn: string; en: string }[] = [
  { id: 'cash', bn: 'নগদ (ক্যাশ)', en: 'Cash' },
  { id: 'bkash', bn: 'বিকাশ', en: 'bKash' },
  { id: 'nagad', bn: 'নগদ অ্যাপ', en: 'Nagad' },
  { id: 'card', bn: 'কার্ড', en: 'Card' },
  { id: 'bank', bn: 'ব্যাংক', en: 'Bank' },
];

export const MoneyModule: React.FC = () => {
  const {
    data,
    lang,
    moneySubTab,
    navigateTo,
    saveExpense,
    deleteExpense,
    addCustomMoneyCategory,
    setCategoryBudget,
    saveSavingsGoal,
    deleteSavingsGoal,
    saveDebt,
    deleteDebt,
    toggleRoutineDone,
  } = useLifeTrack();

  const currency = data.profile?.currency || '৳';
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentMonthPrefix = todayIso.slice(0, 7);

  // Add Transaction Form State
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [txDate, setTxDate] = useState(todayIso);
  const [paymentMethod, setPaymentMethod] = useState<ExpenseRecord['paymentMethod']>('cash');
  const [note, setNote] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [newCustomCat, setNewCustomCat] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);
  const [submittingTx, setSubmittingTx] = useState(false);

  // Filters for Transactions sub-tab
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');

  // Savings Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  // Debt / Loan Form
  const [debtPerson, setDebtPerson] = useState('');
  const [debtType, setDebtType] = useState<'i_owe' | 'owed_to_me'>('i_owe');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDue, setDebtDue] = useState('');
  const [debtNote, setDebtNote] = useState('');

  const allCategories = useMemo(() => {
    const customItems = data.customMoneyCategories.map((c) => ({ id: c, bn: c, en: c }));
    return [...DEFAULT_MONEY_CATEGORIES, ...customItems];
  }, [data.customMoneyCategories]);

  const getCategoryLabel = (catId: string) => {
    const found = allCategories.find((c) => c.id === catId);
    if (!found) return catId;
    return lang === 'bn' ? found.bn : found.en;
  };

  const getPaymentLabel = (pm: ExpenseRecord['paymentMethod']) => {
    const found = PAYMENT_METHODS.find((p) => p.id === pm);
    if (!found) return pm;
    return lang === 'bn' ? found.bn : found.en;
  };

  // Totals
  const { totalIncome, totalExpense, balance, monthIncome, monthExpense, todayExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let mInc = 0;
    let mExp = 0;
    let tExp = 0;

    for (const tx of data.expenses) {
      if (tx.txType === 'income') {
        inc += tx.amount;
        if (tx.date.startsWith(currentMonthPrefix)) mInc += tx.amount;
      } else {
        exp += tx.amount;
        if (tx.date.startsWith(currentMonthPrefix)) mExp += tx.amount;
        if (tx.date === todayIso) tExp += tx.amount;
      }
    }
    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: inc - exp,
      monthIncome: mInc,
      monthExpense: mExp,
      todayExpense: tExp,
    };
  }, [data.expenses, currentMonthPrefix, todayIso]);

  // Shared Money Routines from Study > Planner
  const moneyRoutines = useMemo(
    () => data.routines.filter((r) => r.routineType === 'money'),
    [data.routines]
  );

  // Monthly Category Spend Map
  const monthlyCategorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of data.expenses) {
      if (tx.txType === 'expense' && tx.date.startsWith(currentMonthPrefix)) {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      }
    }
    return map;
  }, [data.expenses, currentMonthPrefix]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingTx) return;
    const num = Number(amount);
    if (!num || num <= 0) return;
    setSubmittingTx(true);
    saveExpense({
      id: `tx_${Date.now()}`,
      txType,
      amount: num,
      category: txType === 'income' && category === 'Food' ? 'Other' : category,
      date: txDate || todayIso,
      note: note.trim(),
      paymentMethod,
      recurring,
    });
    setAmount('');
    setNote('');
    setRecurring(false);
    setTimeout(() => setSubmittingTx(false), 300);
  };

  const handleCreateCustomCategory = () => {
    const trimmed = newCustomCat.trim();
    if (!trimmed) return;
    addCustomMoneyCategory(trimmed);
    setCategory(trimmed);
    setNewCustomCat('');
    setShowCustomCatInput(false);
  };

  const filteredTransactions = useMemo(() => {
    return [...data.expenses]
      .filter((tx) => {
        if (typeFilter !== 'all' && tx.txType !== typeFilter) return false;
        if (catFilter !== 'all' && tx.category !== catFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const catLab = getCategoryLabel(tx.category).toLowerCase();
          return (
            tx.note.toLowerCase().includes(q) ||
            catLab.includes(q) ||
            String(tx.amount).includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.expenses, typeFilter, catFilter, searchQuery, lang]);

  // Charts Data for Reports
  const pieData = useMemo(() => {
    return Object.entries(monthlyCategorySpend)
      .filter(([, v]) => v > 0)
      .map(([cat, value]) => ({
        name: getCategoryLabel(cat),
        value,
      }));
  }, [monthlyCategorySpend, lang]);

  const barAndTrendData = useMemo(() => {
    const days: { label: string; income: number; expense: number; balance: number }[] = [];
    let running = 0;
    const sortedAsc = [...data.expenses].sort((a, b) => a.date.localeCompare(b.date));
    const last7Dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Dates.push(d.toISOString().slice(0, 10));
    }

    for (const tx of sortedAsc) {
      if (tx.date < last7Dates[0]) {
        running += tx.txType === 'income' ? tx.amount : -tx.amount;
      }
    }

    for (const iso of last7Dates) {
      let dInc = 0;
      let dExp = 0;
      for (const tx of data.expenses) {
        if (tx.date === iso) {
          if (tx.txType === 'income') dInc += tx.amount;
          else dExp += tx.amount;
        }
      }
      running += dInc - dExp;
      const dObj = new Date(iso + 'T12:00:00');
      const shortDay = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
        day: 'numeric',
        month: 'short',
      }).format(dObj);
      days.push({ label: shortDay, income: dInc, expense: dExp, balance: running });
    }
    return days;
  }, [data.expenses, lang]);

  const tabs: SubTabItem[] = [
    { id: 'overview', label: t('moneyTabOverview', lang), icon: Wallet },
    { id: 'transactions', label: t('moneyTabTransactions', lang), icon: ListOrdered },
    { id: 'budget', label: t('moneyTabBudget', lang), icon: Target },
    { id: 'goals', label: t('moneyTabGoals', lang), icon: PiggyBank },
    { id: 'reports', label: t('moneyTabReports', lang), icon: PieChartIcon },
  ];

  return (
    <div className="min-h-full">
      <SubTabBar
        tabs={tabs}
        activeId={moneySubTab}
        onSelect={(sub) => navigateTo('money', sub)}
      />

      <div className="max-w-3xl mx-auto px-3.5 pt-4 pb-24 space-y-4">
        {/* ================= OVERVIEW TAB ================= */}
        {moneySubTab === 'overview' && (
          <div className="space-y-4">
            {/* Balance Hero Card */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white p-5 space-y-4 shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-emerald-100 font-medium">{t('currentBalance', lang)}</p>
                  <h2 className="text-3xl font-extrabold tracking-tight mt-0.5">
                    {currency} {formatNum(balance, lang)}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-100">{t('todaySpendingCard', lang)}</p>
                  <p className="text-lg font-bold text-amber-300">
                    {currency} {formatNum(todayExpense, lang)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/15">
                <div className="rounded-xl bg-black/20 p-2.5 flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-emerald-300 shrink-0" />
                  <div>
                    <span className="text-[11px] text-emerald-100 block">
                      {lang === 'bn' ? 'এই মাসের আয়' : 'Monthly Income'}
                    </span>
                    <span className="text-sm font-bold">
                      {currency} {formatNum(monthIncome, lang)}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-black/20 p-2.5 flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-rose-300 shrink-0" />
                  <div>
                    <span className="text-[11px] text-emerald-100 block">
                      {lang === 'bn' ? 'এই মাসের খরচ' : 'Monthly Expense'}
                    </span>
                    <span className="text-sm font-bold">
                      {currency} {formatNum(monthExpense, lang)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Money Routines synced from Study > Planner */}
            {moneyRoutines.length > 0 && (
              <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-500/30 p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      {lang === 'bn'
                        ? 'আর্থিক রুটিন ও স্মারক (পরিকল্পনা থেকে যুক্ত)'
                        : 'Money Routines & Reminders (Synced from Planner)'}
                    </h3>
                  </div>
                </div>
                <div className="space-y-2">
                  {moneyRoutines.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRoutineDone(r.id)}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-left"
                    >
                      <div>
                        <p
                          className={`text-xs font-bold ${
                            r.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {r.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {r.repeat === 'weekly'
                            ? lang === 'bn'
                              ? 'সাপ্তাহিক'
                              : 'Weekly'
                            : r.repeat === 'monthly'
                            ? lang === 'bn'
                              ? 'মাসিক'
                              : 'Monthly'
                            : r.date}{' '}
                          {r.reminderTime ? `• ${formatHHMM(r.reminderTime, lang)}` : ''}
                        </p>
                      </div>
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 ${
                          r.done ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Add Income / Expense Form */}
            <form
              onSubmit={handleAddTransaction}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'bn' ? 'নতুন আয় বা খরচ যোগ করুন' : 'Add Income or Expense'}
                </h3>
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setTxType('expense')}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-bold ${
                      txType === 'expense'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? 'খরচ' : 'Expense'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('income')}
                    className={`min-h-[36px] px-3 rounded-lg text-xs font-bold ${
                      txType === 'income'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? 'আয়' : 'Income'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {lang === 'bn' ? `পরিমাণ (${currency})` : `Amount (${currency})`}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {lang === 'bn' ? 'তারিখ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {lang === 'bn' ? 'খাত / ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setShowCustomCatInput(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    {allCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'bn' ? c.bn : c.en}
                      </option>
                    ))}
                    <option value="__new__">
                      {lang === 'bn' ? '+ নতুন খাত যোগ করুন' : '+ Add Custom Category'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as ExpenseRecord['paymentMethod'])}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {lang === 'bn' ? pm.bn : pm.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showCustomCatInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomCat}
                    onChange={(e) => setNewCustomCat(e.target.value)}
                    placeholder={lang === 'bn' ? 'নতুন খাতের নাম...' : 'Custom category name...'}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomCategory}
                    className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    {t('add', lang)}
                  </button>
                </div>
              )}

              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={lang === 'bn' ? 'সংক্ষিপ্ত বিবরণ লিখুন...' : 'Short note...'}
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
              />

              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 min-h-[36px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
                <span>
                  {lang === 'bn' ? 'নিয়মিত পৌনঃপুনিক লেনদেন (মাসিক)' : 'Recurring monthly transaction'}
                </span>
              </label>

              <button
                type="submit"
                disabled={submittingTx}
                className="w-full min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
              >
                {t('save', lang)}
              </button>
            </form>
          </div>
        )}

        {/* ================= TRANSACTIONS TAB ================= */}
        {moneySubTab === 'transactions' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search', lang)}
                  className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(['all', 'expense', 'income'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTypeFilter(tf)}
                    className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold ${
                      typeFilter === tf
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tf === 'all'
                      ? t('all', lang)
                      : tf === 'expense'
                      ? lang === 'bn'
                        ? 'খরচ'
                        : 'Expenses'
                      : lang === 'bn'
                      ? 'আয়'
                      : 'Income'}
                  </button>
                ))}

                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="min-h-[40px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold ml-auto"
                >
                  <option value="all">{t('all', lang)}</option>
                  {allCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'bn' ? c.bn : c.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              {filteredTransactions.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <p className="text-sm text-slate-500">
                    {lang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি।' : 'No transactions found.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('money', 'overview')}
                    className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    {t('qaAddExpense', lang)}
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {getCategoryLabel(tx.category)}
                          {tx.note ? ` — ${tx.note}` : ''}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatGregorianDate(new Date(tx.date + 'T12:00:00'), lang)} •{' '}
                          {getPaymentLabel(tx.paymentMethod)}
                          {tx.recurring ? (lang === 'bn' ? ' • মাসিক' : ' • Monthly') : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-sm font-extrabold tabular-nums ${
                            tx.txType === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.txType === 'income' ? '+' : '-'}
                          {currency}
                          {formatNum(tx.amount, lang)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteExpense(tx.id)}
                          aria-label={t('delete', lang)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500"
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
        )}

        {/* ================= BUDGET TAB ================= */}
        {moneySubTab === 'budget' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-1 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {lang === 'bn' ? 'মাসিক খাতভিত্তিক বাজেট' : 'Monthly Category Budgets'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'খরচ ৮০% ও ১০০% অতিক্রম করলে স্বয়ংক্রিয় সতর্কবার্তা দেখাবে।'
                  : 'Automatic alerts appear when category spending reaches 80% and 100%.'}
              </p>
            </div>

            {allCategories.map((c) => {
              const limit = data.categoryBudgets[c.id] || 0;
              const spent = monthlyCategorySpend[c.id] || 0;
              const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              const isOver100 = limit > 0 && pct >= 100;
              const isWarn80 = limit > 0 && pct >= 80 && pct < 100;

              return (
                <div
                  key={c.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {lang === 'bn' ? c.bn : c.en}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {lang === 'bn' ? 'খরচ হয়েছে:' : 'Spent:'} {currency}
                        {formatNum(spent, lang)}{' '}
                        {limit > 0 ? `/ ${currency}${formatNum(limit, lang)} (${toLocalDigits(pct, lang)}%)` : ''}
                      </p>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={limit || ''}
                        placeholder={lang === 'bn' ? 'বাজেট দিন' : 'Set limit'}
                        onChange={(e) => setCategoryBudget(c.id, Math.max(0, Number(e.target.value) || 0))}
                        className="w-full min-h-[44px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-right"
                      />
                    </div>
                  </div>

                  {limit > 0 && (
                    <>
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver100
                              ? 'bg-rose-600'
                              : isWarn80
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      {isOver100 && (
                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            {lang === 'bn'
                              ? '১০০% বাজেট সীমা অতিক্রম করেছে!'
                              : '100% budget limit exceeded!'}
                          </span>
                        </p>
                      )}
                      {isWarn80 && (
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            {lang === 'bn'
                              ? 'সতর্কতা: বাজেটের ৮০% এর বেশি খরচ হয়েছে।'
                              : 'Warning: Over 80% of monthly budget used.'}
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ================= GOALS & DEBT TAB ================= */}
        {moneySubTab === 'goals' && (
          <div className="space-y-4">
            {/* Savings Goals */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {lang === 'bn' ? 'সঞ্চয় লক্ষ্যমাত্রা' : 'Savings Goals'}
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!goalTitle.trim() || !Number(goalTarget)) return;
                  const newGoal: SavingsGoal = {
                    id: `goal_${Date.now()}`,
                    title: goalTitle.trim(),
                    targetAmount: Math.max(1, Number(goalTarget)),
                    savedAmount: Math.max(0, Number(goalSaved) || 0),
                    deadline: goalDeadline || todayIso,
                  };
                  saveSavingsGoal(newGoal);
                  setGoalTitle('');
                  setGoalTarget('');
                  setGoalSaved('');
                  setGoalDeadline('');
                }}
                className="grid grid-cols-2 gap-2"
              >
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder={lang === 'bn' ? 'লক্ষ্যের নাম (যেমন: বই কেনা)' : 'Goal title (e.g., New Laptop)'}
                  className="col-span-2 min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder={lang === 'bn' ? `লক্ষ্য পরিমাণ (${currency})` : `Target (${currency})`}
                  className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={goalSaved}
                  onChange={(e) => setGoalSaved(e.target.value)}
                  placeholder={lang === 'bn' ? `জমা হয়েছে (${currency})` : `Saved (${currency})`}
                  className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                />
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                />
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('add', lang)}</span>
                </button>
              </form>

              {data.savingsGoals.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">
                  {lang === 'bn' ? 'এখনো কোনো সঞ্চয় লক্ষ্য যোগ করা হয়নি।' : 'No savings goals added yet.'}
                </p>
              ) : (
                <div className="space-y-2.5 pt-2">
                  {data.savingsGoals.map((g) => {
                    const pct = Math.min(100, Math.round((g.savedAmount / Math.max(1, g.targetAmount)) * 100));
                    return (
                      <div
                        key={g.id}
                        className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3 space-y-2 border border-slate-200/70 dark:border-slate-700/70"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{g.title}</h4>
                            <p className="text-[11px] text-slate-500">
                              {currency}
                              {formatNum(g.savedAmount, lang)} / {currency}
                              {formatNum(g.targetAmount, lang)} ({toLocalDigits(pct, lang)}%) •{' '}
                              {g.deadline}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                saveSavingsGoal({
                                  ...g,
                                  savedAmount: Math.min(g.targetAmount, g.savedAmount + 100),
                                })
                              }
                              className="min-h-[38px] px-2.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                            >
                              +{toLocalDigits(100, lang)}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSavingsGoal(g.id)}
                              className="min-h-[38px] min-w-[38px] flex items-center justify-center text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Debt & Loan Tracker (I owe / Owed to me) */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {lang === 'bn' ? 'দেনা-পাওনা ও ঋণ ট্র্যাকার' : 'Debt & Loan Tracker'}
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!debtPerson.trim() || !Number(debtAmount)) return;
                  const nextDebt: DebtRecord = {
                    id: `debt_${Date.now()}`,
                    person: debtPerson.trim(),
                    debtType,
                    amount: Math.max(1, Number(debtAmount)),
                    dueDate: debtDue || todayIso,
                    note: debtNote.trim(),
                    settled: false,
                  };
                  saveDebt(nextDebt);
                  setDebtPerson('');
                  setDebtAmount('');
                  setDebtDue('');
                  setDebtNote('');
                }}
                className="space-y-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDebtType('i_owe')}
                    className={`min-h-[40px] rounded-xl text-xs font-bold ${
                      debtType === 'i_owe'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? 'আমি ধার নিয়েছি (দেনা)' : 'I Owe'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtType('owed_to_me')}
                    className={`min-h-[40px] rounded-xl text-xs font-bold ${
                      debtType === 'owed_to_me'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lang === 'bn' ? 'আমি পাবো (পাওনা)' : 'Owed to Me'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={debtPerson}
                    onChange={(e) => setDebtPerson(e.target.value)}
                    placeholder={lang === 'bn' ? 'ব্যক্তির নাম' : 'Person name'}
                    className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder={lang === 'bn' ? `পরিমাণ (${currency})` : `Amount (${currency})`}
                    className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="date"
                    value={debtDue}
                    onChange={(e) => setDebtDue(e.target.value)}
                    className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="text"
                    value={debtNote}
                    onChange={(e) => setDebtNote(e.target.value)}
                    placeholder={lang === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Note (optional)'}
                    className="min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  {t('add', lang)}
                </button>
              </form>

              {data.debts.length > 0 && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2">
                  {data.debts.map((d) => (
                    <div key={d.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            d.settled ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {d.person} — {currency}
                          {formatNum(d.amount, lang)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {d.debtType === 'i_owe'
                            ? lang === 'bn'
                              ? 'দেনা'
                              : 'I Owe'
                            : lang === 'bn'
                            ? 'পাওনা'
                            : 'Owed to Me'}{' '}
                          • {d.dueDate}
                          {d.note ? ` • ${d.note}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => saveDebt({ ...d, settled: !d.settled })}
                          className={`min-h-[38px] px-2.5 rounded-lg text-xs font-bold ${
                            d.settled
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {d.settled
                            ? lang === 'bn'
                              ? 'পরিশোধিত'
                              : 'Settled'
                            : lang === 'bn'
                            ? 'পরিশোধ চিহ্ন'
                            : 'Mark Paid'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDebt(d.id)}
                          className="min-h-[38px] min-w-[38px] flex items-center justify-center text-rose-500"
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
        )}

        {/* ================= REPORTS TAB ================= */}
        {moneySubTab === 'reports' && (
          <div className="space-y-4">
            {/* Category Pie Chart */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'bn' ? 'খাতভিত্তিক খরচের অনুপাত (চলতি মাস)' : 'Expense Breakdown by Category'}
              </h3>
              {pieData.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  {lang === 'bn' ? 'এই মাসে কোনো খরচের তথ্য নেই।' : 'No expenses recorded this month.'}
                </p>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={78}
                        label={({ name, percent }) =>
                          `${name} ${toLocalDigits(Math.round((percent || 0) * 100), lang)}%`
                        }
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `${currency}${formatNum(Number(val ?? 0), lang)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Income vs Expense Bars */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'bn' ? 'আয় বনাম খরচ (গত ৭ দিন)' : 'Income vs Expense (Last 7 Days)'}
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barAndTrendData}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={38} />
                    <Tooltip formatter={(val) => `${currency}${formatNum(Number(val ?? 0), lang)}`} />
                    <Bar
                      dataKey="income"
                      name={lang === 'bn' ? 'আয়' : 'Income'}
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      name={lang === 'bn' ? 'খরচ' : 'Expense'}
                      fill="#e11d48"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Running Balance Trend */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'bn' ? 'ব্যালেন্স প্রবণতা' : 'Running Balance Trend'}
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={barAndTrendData}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={40} />
                    <Tooltip formatter={(val) => `${currency}${formatNum(Number(val ?? 0), lang)}`} />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      name={t('currentBalance', lang)}
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyModule;
