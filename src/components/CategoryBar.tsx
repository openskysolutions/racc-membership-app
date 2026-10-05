import React from 'react';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import { CATEGORY_BG_MAP, CATEGORY_TINT_MAP } from '@/lib/categoryImages';
import cn from 'classnames';


// Icon name → color classes (same color whether idle or active — indicator dot shows selection).
const COLOR_MAP: Record<string, string> = {
  Utensils:     'bg-orange-700 hover:bg-orange-600 ring-1 ring-inset ring-orange-500',
  Hotel:        'bg-sky-700 hover:bg-sky-600 ring-1 ring-inset ring-sky-500',
  ShoppingCart: 'bg-violet-700 hover:bg-violet-600 ring-1 ring-inset ring-violet-500 saturate-50',
  HeartPulse:   'bg-red-800 hover:bg-red-700 ring-1 ring-inset ring-red-600',
  Briefcase:    'bg-slate-600 hover:bg-slate-500 ring-1 ring-inset ring-slate-400',
  VscTools:     'bg-yellow-600 hover:bg-yellow-500 ring-1 ring-inset ring-yellow-400',
  Building2:    'bg-green-700 hover:bg-green-600 ring-1 ring-inset ring-green-500',
  Factory:      'bg-stone-700 hover:bg-stone-600 ring-1 ring-inset ring-stone-500',
  Megaphone:    'bg-teal-700 hover:bg-teal-600 ring-1 ring-inset ring-teal-500',
};

// Icon name → semi-transparent tint overlay class (painted over the bg image).
const TINT_MAP = CATEGORY_TINT_MAP;

// Icon name → placeholder background image (Unsplash).
const BG_MAP = CATEGORY_BG_MAP;

interface CategoryBarProps {
  selected: string; // top-level category id, or '' for all
  onChange: (categoryId: string) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ selected, onChange }) => {
  const { categories, loading } = useBusinessCategories();

  if (loading) return null;

  return (
    <div className="w-full grid grid-cols-5 2xl:grid-cols-10 gap-0.5 sm:gap-2">
      {/* "All" pill */}
      <button
        title="All categories"
        onClick={() => onChange('')}
        className={cn(
          'relative min-h-14 overflow-hidden flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-3 h-14 sm:h-auto py-1.5 sm:py-2 rounded-sm text-xs font-medium transition-colors',
          selected
            ? 'text-white dark:text-stone-900 border-border bg-card-foreground hover:text-white dark:hover:text-stone-900 hover:bg-stone-500 dark:hover:bg-stone-200 cursor-pointer'
            : 'text-white dark:text-stone-900 border-border bg-card-foreground hover:text-white dark:hover:text-stone-900 hover:bg-stone-400 dark:hover:bg-stone-200 cursor-pointer'
            // bg-card-foreground hover:bg-card-foreground/90 text-card
        )}
      >
        <span className="leading-tight">All Members</span>
      </button>

      {categories.map((cat) => {
        const isActive = selected === cat.id;
        const color = COLOR_MAP[cat.icon];
        const bgUrl = BG_MAP[cat.icon];
        const tint = TINT_MAP[cat.icon];
        return (
          <button
            key={cat.id}
            title={cat.name}
            onClick={() => onChange(isActive ? '' : cat.id)}
            className={cn(
              'group relative min-h-14 overflow-hidden flex flex-col items-center justify-center text-white gap-0.5 sm:gap-1 px-1 sm:px-3 h-14 sm:h-auto py-1.5 sm:py-2 rounded-sm text-xs font-medium transition-colors',
              color ?? 'ring-1 ring-inset ring-border hover:ring-primary/50 hover:text-foreground'
            )}
          >
            {/* Background image layer */}
            {bgUrl && (
              <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${bgUrl})` }}
              />
            )}
            {/* Color tint overlay */}
            {bgUrl && tint && (
              <div className={cn('absolute inset-0 z-0 transition-opacity group-hover:opacity-60', tint)} />
            )}
            {isActive && (
              <span className="absolute z-20 top-[20%] -left-[7px] sm:top-[35%] sm:-left-[9px] 2xl:top-[40%] w-3 h-3 sm:w-4 sm:h-4 rotate-45 bg-white/100 shadow-sm" />
            )}
            <div className="relative z-10 flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="text-[10px] sm:text-xs text-center leading-tight">{cat.name}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryBar;
