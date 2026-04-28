const React = window.React;

const BRAND_NAME = 'Couple Planner';
const BRAND_DESCRIPTION = 'Shared calendar, tasks, places, trips, recipes, and watchlist for couples.';
const BRAND_MARK_SRC = '/assets/brand-mark.svg';

function BrandMark({ className = 'h-9 w-9', rounded = 'rounded-xl', title = BRAND_NAME }) {
  return (
    <img
      src={BRAND_MARK_SRC}
      alt=""
      aria-hidden="true"
      className={`${className} ${rounded} shrink-0 object-cover shadow-sm shadow-[#E63B2E]/25`}
      draggable="false"
    />
  );
}

function BrandLogo({
  subtitle,
  textClassName = 'text-lg font-extrabold tracking-tight text-[#410001]',
  markClassName = 'h-9 w-9',
  className = 'flex items-center gap-2'
}) {
  return (
    <span className={className}>
      <BrandMark className={markClassName} />
      <span className="min-w-0 leading-tight">
        <span className={`block truncate ${textClassName}`}>{BRAND_NAME}</span>
        {subtitle && (
          <span className="block truncate text-xs font-medium text-[#534340]">{subtitle}</span>
        )}
      </span>
    </span>
  );
}

Object.assign(window, {
  BRAND_NAME,
  BRAND_DESCRIPTION,
  BRAND_MARK_SRC,
  BrandLogo,
  BrandMark
});
