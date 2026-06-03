import React from 'react';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import { Badge } from '@/components/ui/badge';
import cn from 'classnames';

interface BusinessCategorySelectorProps {
  selected: string[]; // array of subcategory ids (max 3)
  onChange: (selected: string[]) => void;
}

const BusinessCategorySelector: React.FC<BusinessCategorySelectorProps> = ({ selected, onChange }) => {
  const { categories, loading } = useBusinessCategories();

  const toggle = (subcategoryId: string) => {
    if (selected.includes(subcategoryId)) {
      onChange(selected.filter(s => s !== subcategoryId));
    } else {
      if (selected.length >= 3) return;
      onChange([...selected, subcategoryId]);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading categories...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Select up to 3 subcategories that best describe your business.
        </p>
        {selected.length > 0 && (
          <Badge variant="secondary" className="shrink-0">{selected.length}/3</Badge>
        )}
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {cat.name}
            </p>
            <div className="flex flex-wrap gap-1">
              {cat.subcategories.map((sub) => {
                const isSelected = selected.includes(sub.id);
                const isDisabled = !isSelected && selected.length >= 3;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggle(sub.id)}
                    className={cn(
                      'px-2 py-0.5 rounded-full border text-sm transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : isDisabled
                          ? 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50'
                          : 'bg-background text-foreground border-border hover:border-primary/60 hover:bg-muted cursor-pointer'
                    )}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessCategorySelector;
