import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { api } from '@/services/apiClient';

interface NomineeData {
  id: string;
  name: string;
  businessName?: string;
  email?: string;
  phone?: string;
}

interface BusinessSearchComboboxProps {
  type: 'business' | 'individual';
  value: NomineeData | null;
  onChange: (value: NomineeData | null) => void;
}

const BusinessSearchCombobox: React.FC<BusinessSearchComboboxProps> = ({
  type,
  value,
  onChange
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allResults, setAllResults] = useState<NomineeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter results based on search query (client-side filtering)
  const filteredResults = allResults.filter((nominee) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      nominee.name.toLowerCase().includes(query) ||
      (nominee.businessName && nominee.businessName.toLowerCase().includes(query)) ||
      (nominee.email && nominee.email.toLowerCase().includes(query))
    );
  });

  // Check if search query matches any existing results exactly
  const hasExactMatch = filteredResults.some(
    (nominee) => nominee.name.toLowerCase() === searchQuery.toLowerCase()
  );

  // Show "Add custom" option if there's a search query and no exact match
  const showCustomOption = searchQuery.trim().length > 0 && !hasExactMatch;

  // Load all members once when component mounts
  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true);
      try {
        // Fetch all members without pagination limit
        const response = await api.get('/members?limit=1000');
        
        if (response.ok) {
          const data = await response.json();
          const members = data.members || [];
          
          console.log('Total members loaded:', members.length);
          
          // Filter and map based on type
          const filtered = members
            .filter((member: any) => {
              // Both types should show members with business names
              return member.businessName && member.businessName.trim().length > 0;
            })
            .map((member: any) => {
              return {
                id: member.id,
                // For business: show business name, for individual: show contact name
                name: type === 'business' ? member.businessName : member.name,
                businessName: member.businessName,
                email: member.email,
                phone: member.phone
              };
            });
          
          console.log(`Filtered ${type} nominees:`, filtered.length);
          console.log('Sample members:', members.slice(0, 3));
          
          setAllResults(filtered);
        }
      } catch (error) {
        console.error('Failed to load members:', error);
        setAllResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [type]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between hover:bg-transparent hover:border-input"
        >
          {value ? (
            <span className="truncate flex items-center gap-2">
              {value.name}
              {value.businessName && type === 'individual' && ` - ${value.businessName}`}
              {value.id.startsWith('custom-') && (
                <span className="text-xs text-muted-foreground">(custom)</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Search for {type === 'business' ? 'a business' : 'an individual'}...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${type === 'business' ? 'businesses' : 'members'}...`}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="py-6 text-center text-sm">No results found</div>
              )}
            </CommandEmpty>
            {showCustomOption && (
              <CommandGroup heading="Custom Entry">
                <CommandItem
                  value="__custom__"
                  onSelect={() => {
                    const customNominee: NomineeData = {
                      id: `custom-${Date.now()}`,
                      name: searchQuery.trim(),
                      businessName: type === 'business' ? searchQuery.trim() : undefined,
                    };
                    onChange(customNominee);
                    setOpen(false);
                  }}
                  className="cursor-pointer bg-muted/50 hover:text-foreground"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Add "{searchQuery.trim()}"</span>
                    <span className="text-xs text-muted-foreground hover:text-muted-foreground">
                      Manually entered {type === 'business' ? 'business' : 'individual'}
                    </span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {filteredResults.map((nominee) => (
                <CommandItem
                  key={nominee.id}
                  value={nominee.id}
                  onSelect={() => {
                    onChange(nominee);
                    setOpen(false);
                  }}
                  className="cursor-pointer hover:text-foreground"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value?.id === nominee.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{nominee.name}</span>
                    {nominee.businessName && type === 'individual' && (
                      <span className="text-sm text-muted-foreground hover:text-muted-foreground">
                        {nominee.businessName}
                      </span>
                    )}
                    {nominee.email && (
                      <span className="text-xs text-muted-foreground hover:text-muted-foreground">
                        {nominee.email}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default BusinessSearchCombobox;
