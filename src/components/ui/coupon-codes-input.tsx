import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CouponCodesInputProps {
  id: string;
  name: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const CouponCodesInput: React.FC<CouponCodesInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = "Add a coupon code...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      const newTags = [...value];
      newTags.pop();
      onChange(newTags);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 p-2 py-1 min-h-9 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${className}`}>
      {value.map((tag, index) => (
        <Badge key={index} variant="secondary" className="bg-highlight-foreground hover:bg-highlight text-card text-sm font-medium flex items-center gap-1 h-6 p-1 pl-2">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0"
          >
            <X className="h-4 w-4 font-bold" />
          </button>
        </Badge>
      ))}
      <Input
        id={id}
        name={name}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 border-0 h-8 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[120px]"
      />
    </div>
  );
};