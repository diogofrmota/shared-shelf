const React = window.React;
const { useMemo, useState } = React;

// ============================================================================
// EXPENSES VIEW COMPONENT
// ============================================================================

const getExpenseComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;
const getExpenseModalShell = () => window.getWindowComponent?.('ModalShell', window.MissingComponent) || window.MissingComponent;

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Drink' },
  { value: 'transport', label: 'Transport' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' }
];

const getCategoryLabel = (value) => {
  const found = EXPENSE_CATEGORIES.find(c => c.value === value);
  return found ? found.label : 'Other';
};

const formatExpenseDate = (date) => {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatAmount = (amount) => {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CATEGORY_COLORS = {
  food: 'bg-[#FFDAD4] text-[#A9372C]',
  transport: 'bg-[#E8F0FF] text-[#3B5BDB]',
  accommodation: 'bg-[#E8F8F0] text-[#2F7D52]',
  entertainment: 'bg-[#FFF3CD] text-[#856404]',
  shopping: 'bg-[#F3E8FF] text-[#6B21A8]',
  health: 'bg-[#FFE4F0] text-[#9D174D]',
  other: 'bg-[#F0E8E4] text-[#5C3C35]'
};

const CategoryBadge = ({ category }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${CATEGORY_COLORS[category] || CATEGORY_COLORS.other}`}>
    {getCategoryLabel(category)}
  </span>
);

const ExpenseCard = ({ expense, onDelete, onEdit }) => {
  const Trash = getExpenseComponent('Trash');
  const dateStr = formatExpenseDate(expense.date);

  return (
    <div className="group flex items-start gap-4 rounded-2xl border border-[#E1D8D4] bg-white p-4 shadow-sm transition hover:shadow-md hover:shadow-[#000000]/5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF8F5] text-lg font-extrabold text-[#E63B2E]">
        {expense.amount != null ? (
          <span className="text-sm font-extrabold">{formatAmount(expense.amount)}</span>
        ) : '—'}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-base font-bold text-[#000000] leading-snug">{expense.description || 'Untitled expense'}</p>
          <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            {onEdit && (
              <button
                onClick={() => onEdit(expense)}
                className="rounded-lg p-1.5 text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
                aria-label="Edit expense"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}
            <button
              onClick={() => onDelete(expense.id)}
              className="rounded-lg p-1.5 text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
              aria-label="Delete expense"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CategoryBadge category={expense.category} />
          {expense.paidBy && (
            <span className="text-xs font-semibold text-[#000000]">Paid by {expense.paidBy}</span>
          )}
          {dateStr && (
            <span className="text-xs text-[#000000]">{dateStr}</span>
          )}
        </div>

        {expense.notes && (
          <p className="mt-1.5 text-sm text-[#000000] line-clamp-2">{expense.notes}</p>
        )}
      </div>
    </div>
  );
};

const ExpensesView = ({ expenses, onDeleteExpense, onEditExpense, onAddClick }) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const DollarSign = getExpenseComponent('DollarSign');
  const EmptyState = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;

  const sorted = useMemo(() => (
    [...expenses].sort((a, b) => {
      const da = a.date || a.createdAt || '';
      const db = b.date || b.createdAt || '';
      return db.localeCompare(da);
    })
  ), [expenses]);

  const filtered = useMemo(() => (
    filterCategory === 'all' ? sorted : sorted.filter(e => e.category === filterCategory)
  ), [sorted, filterCategory]);

  const totalAll = useMemo(() => (
    sorted.reduce((sum, e) => sum + (Number.isFinite(Number(e.amount)) ? Number(e.amount) : 0), 0)
  ), [sorted]);

  const totalFiltered = useMemo(() => (
    filtered.reduce((sum, e) => sum + (Number.isFinite(Number(e.amount)) ? Number(e.amount) : 0), 0)
  ), [filtered]);

  return (
    <div className="space-y-6 animate-fade-in">
      {expenses.length === 0 && (
        <EmptyState
          title="No expenses yet"
          message="Track shared spending by adding your first expense."
          actionLabel="Add expense"
          icon={DollarSign}
          onAddClick={onAddClick}
        />
      )}

      {expenses.length > 0 && (
        <>
          <div className="rounded-2xl border border-[#E1D8D4] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#000000]">Total spent</p>
            <p className="mt-1 text-3xl font-extrabold text-[#E63B2E]">{formatAmount(totalAll)}</p>
            {filterCategory !== 'all' && (
              <p className="mt-1 text-sm text-[#000000]">
                {getCategoryLabel(filterCategory)}: <span className="font-bold">{formatAmount(totalFiltered)}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filterCategory === 'all' ? 'bg-[#E63B2E] text-white' : 'bg-white border border-[#E1D8D4] text-[#000000] hover:border-[#FFB4A9] hover:text-[#E63B2E]'}`}
            >
              All
            </button>
            {EXPENSE_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filterCategory === cat.value ? 'bg-[#E63B2E] text-white' : 'bg-white border border-[#E1D8D4] text-[#000000] hover:border-[#FFB4A9] hover:text-[#E63B2E]'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E1D8D4] bg-white py-10 text-center text-sm text-[#000000]">
              No expenses in this category yet.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(expense => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onDelete={onDeleteExpense}
                  onEdit={onEditExpense}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

Object.assign(window, { ExpensesView, EXPENSE_CATEGORIES });
