import {
  type ReactElement,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label.tsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { LoadingIndicator } from '@/components/ui/loading-indicator.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

export interface FilterMultiSelectFieldProps {
  id: string;
  label: string;
  description?: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

export function FilterMultiSelectField({
  id,
  label,
  description,
  placeholder,
  options,
  value,
  onChange,
  loading,
}: Readonly<FilterMultiSelectFieldProps>): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadedCount, setLoadedCount] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const applyDebouncedSearch = useEffectEvent((value: string) => {
    setDebouncedSearch(value);
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      applyDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setDebouncedSearch('');
      setLoadedCount(50);
      setIsLoadingMore(false);
    }
  }, [open]);

  const selected = useMemo(
    () =>
      value
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0),
    [value]
  );

  const filteredOptions = useMemo(() => {
    let filtered = options;
    if (debouncedSearch.trim()) {
      const lower = debouncedSearch.trim().toLowerCase();
      filtered = options.filter(option => option.toLowerCase().includes(lower));
    }
    return filtered.slice(0, loadedCount);
  }, [options, debouncedSearch, loadedCount]);

  const hasMoreOptions = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return options.length > loadedCount;
    }
    const filtered = options.filter(option =>
      option.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
    );
    return filtered.length > loadedCount;
  }, [options, debouncedSearch, loadedCount]);

  const totalFilteredCount = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return options.length;
    }
    return options.filter(option =>
      option.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
    ).length;
  }, [options, debouncedSearch]);

  const handleToggle = useCallback(
    (option: string) => {
      const selection = new Set(selected);
      if (selection.has(option)) selection.delete(option);
      else selection.add(option);
      const ordered = options.filter(item => selection.has(item));
      const remaining = Array.from(selection).filter(
        item => !ordered.includes(item)
      );
      onChange([...ordered, ...remaining].join(','));
    },
    [onChange, options, selected]
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(event.target.value);
      setLoadedCount(50);
    },
    []
  );

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setLoadedCount(prev => prev + 500);
    setIsLoadingMore(false);
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      setOpen(true);
      return;
    }
    setTimeout(() => setOpen(false), 150);
  }, []);

  const selectedPreview = selected.slice(0, 3).join(', ');
  const formattedSelection =
    selected.length > 3
      ? `${selectedPreview} +${selected.length - 3}`
      : selectedPreview;
  const displayValue = selected.length > 0 ? formattedSelection : placeholder;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="w-full justify-between"
            disabled={options.length === 0 && !loading}
          >
            <span className="truncate text-left text-sm font-normal">
              {displayValue}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 space-y-3 p-4"
          onInteractOutside={event => {
            const target = event.target as HTMLElement;
            if (
              target.closest('[data-checkbox-container]') ||
              target.closest('[role="checkbox"]') ||
              target.tagName === 'INPUT'
            ) {
              event.preventDefault();
            }
          }}
        >
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder={t('common.search', { defaultValue: 'Search' })}
                value={search}
                onChange={handleSearchChange}
              />
              {search !== debouncedSearch && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <LoadingIndicator size="sm" />
                </div>
              )}
            </div>
            <Separator />
          </div>
          <ScrollArea className="h-60">
            <div className="space-y-1">
              {loading && options.length === 0 ? (
                <div className="flex justify-center py-6">
                  <LoadingIndicator
                    label={t('common.loading', {
                      defaultValue: 'Loading...',
                    })}
                    size="sm"
                  />
                </div>
              ) : filteredOptions.length > 0 ? (
                <>
                  {filteredOptions.map(option => {
                    const checked = selected.includes(option);
                    return (
                      <div
                        key={option}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
                        data-checkbox-container
                        role="button"
                        tabIndex={0}
                        aria-pressed={checked}
                        onClick={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleToggle(option);
                        }}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            event.stopPropagation();
                            handleToggle(option);
                          }
                        }}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={checked => {
                            if (checked !== undefined) handleToggle(option);
                          }}
                          onClick={event => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onMouseDown={event => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                        />
                        <span className="flex-1 truncate">{option}</span>
                      </div>
                    );
                  })}
                  {hasMoreOptions && (
                    <div className="pt-2 border-t">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="w-full text-xs"
                      >
                        {isLoadingMore ? (
                          <LoadingIndicator
                            size="sm"
                            label={t('common.loading', {
                              defaultValue: 'Loading...',
                            })}
                            spinnerClassName="text-primary-foreground"
                            labelClassName="text-primary-foreground"
                          />
                        ) : (
                          t('common.loadMore', {
                            count: Math.min(
                              500,
                              totalFilteredCount - loadedCount
                            ),
                          })
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">
                  {t('common.noResults', { defaultValue: 'No results' })}
                </p>
              )}
            </div>
          </ScrollArea>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {selected.length > 0
                ? t('cantoLyr.lyricSearch.filters.selectedCount', {
                    count: selected.length,
                    defaultValue: `${selected.length} selected`,
                  })
                : t('common.noneSelected', { defaultValue: 'None selected' })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              {t('common.clear', { defaultValue: 'Clear' })}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export default FilterMultiSelectField;
