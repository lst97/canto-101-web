import * as React from 'react';
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';

import { cn } from '../../lib/utils.ts';
import { Button } from './button.tsx';
import { Input } from './input.tsx';
import { Popover, PopoverContent, PopoverTrigger } from './popover.tsx';
import { ScrollArea } from './scroll-area.tsx';

interface SearchableSelectProps {
  options: string[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  disabled = false,
  loading = false,
  className,
}: Readonly<SearchableSelectProps>) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    if (!open) {
      setSearch('');
      setDebouncedSearch('');
    }
  }, [open]);

  const filteredOptions = React.useMemo(() => {
    if (!debouncedSearch.trim()) {
      return options;
    }
    const lower = debouncedSearch.trim().toLowerCase();
    return options.filter(option => option.toLowerCase().includes(lower));
  }, [options, debouncedSearch]);

  const handleClear = React.useCallback(() => {
    onValueChange('');
  }, [onValueChange]);

  const selectedLabel = value || placeholder;
  const isPlaceholder = !value;

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      onValueChange(selectedValue);
      setOpen(false);
    },
    [onValueChange]
  );

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (newOpen) {
      setOpen(true);
    } else {
      // Small delay to allow click events to propagate
      setTimeout(() => setOpen(false), 150);
    }
  }, []);

  const handleOptionKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, optionValue: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelect(optionValue);
      }
    },
    [handleSelect]
  );

  let optionsContent: React.ReactNode;
  if (loading) {
    optionsContent = (
      <div className="flex justify-center py-6">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  } else if (filteredOptions.length > 0) {
    optionsContent = filteredOptions.map(option => (
      <div
        key={option}
        className={cn(
          'flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted',
          value === option && 'bg-muted'
        )}
        onClick={() => handleSelect(option)}
        onKeyDown={event => handleOptionKeyDown(event, option)}
        tabIndex={0}
        role="option"
        aria-selected={value === option}
      >
        <span className="truncate">{option}</span>
        {value === option && <CheckIcon className="size-4 text-primary" />}
      </div>
    ));
  } else {
    optionsContent = (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No results found
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-between pr-8',
              isPlaceholder && 'text-muted-foreground',
              className
            )}
            disabled={disabled || loading}
          >
            <span className="truncate text-left text-sm font-normal">
              {selectedLabel}
            </span>
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-8 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }}
              disabled={disabled || loading}
            >
              <XIcon className="h-3 w-3" />
              <span className="sr-only">Clear selection</span>
            </Button>
          )}
          <ChevronDownIcon className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        onInteractOutside={event => {
          // Prevent closing when clicking on input or options
          const target = event.target as HTMLElement;
          if (
            target.closest('[data-searchable-select]') ||
            target.closest('[role="option"]') ||
            target.tagName === 'INPUT'
          ) {
            event.preventDefault();
          }
        }}
      >
        <div className="p-3" data-searchable-select>
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-2"
          />
          <ScrollArea className="h-60">{optionsContent}</ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { SearchableSelect };
