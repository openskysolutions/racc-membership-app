import React, { useState } from 'react';
import { useBusinessCategories, getSubcategoryName, getCategoryForSubcategory } from '@/hooks/useBusinessCategories';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import cn from 'classnames';

interface BusinessCategorySelectorProps {
  selected: string[]; // array of subcategory ids (max 3)
  onChange: (selected: string[]) => void;
}

const BusinessCategorySelector: React.FC<BusinessCategorySelectorProps> = ({ selected, onChange }) => {
  const { categories, loading } = useBusinessCategories();
  const [open, setOpen] = useState(false);

  const toggle = (subcategoryId: string) => {
    if (selected.includes(subcategoryId)) {
      onChange(selected.filter(s => s !== subcategoryId));
    } else {
      if (selected.length >= 3) return;
      onChange([...selected, subcategoryId]);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading categories…</p>;

  return (
    <div className="space-y-2">
      {/* Selected badges with remove buttons */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(subcatId => {
            const cat = getCategoryForSubcategory(subcatId, categories);
            return (
              <Badge key={subcatId} variant="secondary" className="flex items-center gap-1 pr-1 text-sm">
                {cat && (
                  <span className="text-muted-foreground text-xs mr-0.5">{cat.name} ·</span>
                )}
                {getSubcategoryName(subcatId, categories)}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter(s => s !== subcatId))}
                  className="ml-1 rounded-sm opacity-60 hover:opacity-100 hover:bg-muted-foreground/20 p-0.5"
                  aria-label="Remove category"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Add trigger — hidden once limit reached */}
      {selected.length < 3 ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-muted-foreground font-normal"
            >
              {selected.length === 0 ? 'Select up to 3 categories…' : 'Add another category…'}
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0"
            style={{ width: 'var(--radix-popover-trigger-width)' }}
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search categories…" />
              <CommandList>
                <CommandEmpty>No categories found.</CommandEmpty>
                {categories.map(cat => (
                  <CommandGroup key={cat.id} heading={cat.name}>
                    {cat.subcategories.map(sub => {
                      const isSelected = selected.includes(sub.id);
                      return (
                        <CommandItem
                          key={sub.id}
                          value={`${cat.name} ${sub.name}`}
                          onSelect={() => {
                            toggle(sub.id);
                            if (!isSelected) setOpen(false);
                          }}
                        >
                          <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                          {sub.name}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <p className="text-xs text-muted-foreground">Maximum of 3 categories selected.</p>
      )}
    </div>
  );
};

export default BusinessCategorySelector;
