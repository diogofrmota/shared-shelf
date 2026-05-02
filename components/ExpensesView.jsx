const React = window.React;
const { useMemo, useState } = React;

const getExpenseComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Drink' },
  { value: 'transport', label: 'Transport' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' }
];
const getCategoryLabel = (value) => (EXPENSE_CATEGORIES.find(c => c.value === value)?.label || 'Other');
const formatExpenseDate = (date) => date ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const formatAmount = (amount) => Number.isFinite(Number(amount)) ? `€${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const ExpenseCard = ({ expense, onDelete, onEdit }) => {
  const Trash = getExpenseComponent('Trash');
  const recurrenceLabel = expense?.recurrence?.frequency ? `Repeats ${expense.recurrence.frequency}` : '';
  return (
    <div className="group rounded-2xl border border-[#E1D8D4] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-[#000000]">{expense.description || 'Untitled expense'}</p>
          <p className="text-sm text-[#E63B2E] font-extrabold">{formatAmount(expense.amount)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(expense)} className="h-10 w-10">✎</button>
          <button onClick={() => onDelete(expense.id)} className="h-10 w-10"><Trash size={14} /></button>
        </div>
      </div>
      <p className="mt-1 text-xs text-[#000000]">{getCategoryLabel(expense.category)} • {formatExpenseDate(expense.date)} • Paid by {expense.paidBy || '—'}</p>
      {recurrenceLabel && <p className="mt-1 text-xs font-semibold text-[#000000]">{recurrenceLabel}</p>}
      {Array.isArray(expense.splitBy) && expense.splitBy.length > 0 && (
        <p className="mt-1 text-xs text-[#000000]">Split: {expense.splitBy.map(s => `${s.name} ${Number(s.percent || 0)}%`).join(', ')}</p>
      )}
      {Array.isArray(expense.billSplits) && expense.billSplits.length > 0 && (
        <p className="mt-1 text-xs text-[#000000]">Bill split: {expense.billSplits.map(s => `${getCategoryLabel(s.category)} ${formatAmount(s.amount)}`).join(' · ')}</p>
      )}
      {expense.notes && <details className="mt-2"><summary className="cursor-pointer text-xs font-bold">View details</summary><p className="text-sm whitespace-pre-wrap">{expense.notes}</p></details>}
    </div>
  );
};

const ExpensesView = ({ expenses, onDeleteExpense, onEditExpense, onAddClick }) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [rangeType, setRangeType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(() => {
    const now = new Date();
    return (expenses || []).filter(e => {
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (!e.date) return rangeType === 'all';
      if (rangeType === 'month') return e.date.slice(0, 7) === now.toISOString().slice(0, 7);
      if (rangeType === 'year') return e.date.slice(0, 4) === String(now.getFullYear());
      if (rangeType === 'custom') return (!fromDate || e.date >= fromDate) && (!toDate || e.date <= toDate);
      return true;
    });
  }, [expenses, filterCategory, rangeType, fromDate, toDate]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (sortBy === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    if (sortBy === 'amount_asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
    if (sortBy === 'date_asc') return (a.date || '').localeCompare(b.date || '');
    return (b.date || '').localeCompare(a.date || '');
  }), [filtered, sortBy]);

  const byMonth = useMemo(() => sorted.reduce((acc, e) => {
    const key = e.date ? e.date.slice(0, 7) : 'No date';
    (acc[key] = acc[key] || []).push(e);
    return acc;
  }, {}), [sorted]);

  const partnerTotals = useMemo(() => sorted.reduce((acc, e) => {
    const key = e.paidBy || 'Unknown';
    acc[key] = (acc[key] || 0) + (Number(e.amount) || 0);
    return acc;
  }, {}), [sorted]);

  return <div className="space-y-4">
    <div className="rounded-2xl border p-4 bg-white">
      <p className="text-xs font-bold">Total spent</p>
      <p className="text-3xl font-extrabold text-[#E63B2E]">{formatAmount(sorted.reduce((s, e) => s + (Number(e.amount) || 0), 0))}</p>
      <p className="text-xs mt-1">{Object.entries(partnerTotals).map(([k, v]) => `${k}: ${formatAmount(v)}`).join(' • ') || 'No partner totals yet'}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <select className="rounded border px-2" value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="date_desc">Newest</option><option value="date_asc">Oldest</option><option value="amount_desc">Amount high-low</option><option value="amount_asc">Amount low-high</option></select>
      <select className="rounded border px-2" value={rangeType} onChange={(e) => setRangeType(e.target.value)}><option value="all">All time</option><option value="month">This month</option><option value="year">This year</option><option value="custom">Custom</option></select>
      {rangeType === 'custom' && <><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></>}
      <button onClick={() => setFilterCategory('all')}>All</button>
      {EXPENSE_CATEGORIES.map(cat => <button key={cat.value} onClick={() => setFilterCategory(cat.value)}>{cat.label}</button>)}
    </div>
    {Object.keys(byMonth).length === 0 ? <div className="rounded border-dashed border p-5">No expenses found.</div> : Object.entries(byMonth).map(([month, list]) => <div key={month} className="space-y-2"><h3 className="font-bold">{month === 'No date' ? 'No date' : new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>{list.map(expense => <ExpenseCard key={expense.id} expense={expense} onDelete={onDeleteExpense} onEdit={onEditExpense} />)}</div>)}
  </div>;
};

Object.assign(window, { ExpensesView, EXPENSE_CATEGORIES });
