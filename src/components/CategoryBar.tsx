import React from 'react';
import {
  Utensils,
  Hotel,
  ShoppingCart,
  HeartPulse,
  Briefcase,
  Building2,
  Factory,
  Megaphone,
  LayoutGrid,
} from 'lucide-react';
import { VscTools } from 'react-icons/vsc';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import cn from 'classnames';

// Icon name → icon component. Accepts any icon library (lucide-react, react-icons, etc.).
type AnyIcon = React.ComponentType<{ className?: string; size?: number | string }>;
const ICON_MAP: Record<string, AnyIcon> = {
  Utensils,
  Hotel,
  ShoppingCart,
  HeartPulse,
  Briefcase,
  VscTools,
  Building2,
  Factory,
  Megaphone,
};

interface CategoryBarProps {
  selected: string; // top-level category id, or '' for all
  onChange: (categoryId: string) => void;
}

const CategoryBar: React.FC<CategoryBarProps> = ({ selected, onChange }) => {
  const { categories, loading } = useBusinessCategories();

  if (loading) return null;

  return (
    <div className="w-full grid grid-cols-5 2xl:grid-cols-10 gap-1 sm:gap-2">
      {/* "All" pill */}
      <button
        title="All categories"
        onClick={() => onChange('')}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-3 py-1.5 sm:py-2 bg-card rounded-lg border text-xs font-medium transition-colors',
          selected === ''
            ? 'text-foreground border-primary/50'
            : 'text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
        )}
      >
        <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="hidden sm:inline leading-tight">All Members</span>
      </button>

      {categories.map((cat) => {
        const Icon = ICON_MAP[cat.icon];
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            title={cat.name}
            onClick={() => onChange(isActive ? '' : cat.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-1 sm:px-3 py-1.5 sm:py-2 bg-card rounded-lg border text-xs font-medium transition-colors',
              isActive
                ? 'text-foreground border-primary/50'
                : 'text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            )}
          >
            {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
            <span className="hidden sm:inline text-center leading-tight">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryBar;
