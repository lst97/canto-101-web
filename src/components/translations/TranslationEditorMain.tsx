import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File, CheckCircle, RotateCcw, RefreshCcw, Save } from 'lucide-react';
import { BreadcrumbForKey, FlagIcon } from './components';
import { SUPPORTED_LANGUAGES, FLAG_COMPONENTS } from './constants';
import { useTranslationEditor } from './state';

export const TranslationEditorMain = () => {
  const {
    selectedKey,
    setSelectedKey,
    sourceOfTruth,
    setSourceOfTruth,
    validationByLanguage,
    handleTranslationChange,
    commitEditedKey,
    resetLanguage,
    hasChanges,
    saveAllLanguages,
    reloadAllLanguages,
    editedTranslations,
    translations,
  } = useTranslationEditor();

  // Focus handling when selectedKey changes
  useEffect(() => {
    if (!selectedKey) return;
    const btn = document.getElementById(`key-${selectedKey}`);
    btn?.scrollIntoView({ block: 'center' });
    const preferredLang = SUPPORTED_LANGUAGES[0]?.code;
    const input = document.getElementById(
      `input-${preferredLang}-${selectedKey}`
    ) as HTMLInputElement | null;
    (
      input ??
      (document.querySelector(
        `[id^="input-"][id$="-${CSS.escape(selectedKey)}"]`
      ) as HTMLInputElement | null)
    )?.focus?.();
  }, [selectedKey]);

  return (
    <div className="container mx-auto p-6 max-w-none">
      <div className="rounded-lg border overflow-hidden">
        <header className="flex h-24 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Translation Editor</h1>
              <Badge variant="secondary">Local</Badge>
            </div>
            {selectedKey && <BreadcrumbForKey selectedKey={selectedKey} />}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Label htmlFor="source-select" className="text-sm">
              Source:
            </Label>
            <Select value={sourceOfTruth} onValueChange={setSourceOfTruth}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(({ code, name }) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {import.meta.env.DEV && (
              <Button
                onClick={reloadAllLanguages}
                variant="outline"
                size="sm"
                title="Reload all languages from files"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </header>
        <ScrollArea className="flex-1">
          <div className="relative flex flex-col gap-4 p-4">
            <Card className="border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Validation Summary (source: {sourceOfTruth}.json)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const hasIssues = Object.values(validationByLanguage).some(
                    ({ missing, extra }) =>
                      missing.length > 0 || extra.length > 0
                  );
                  if (!hasIssues) {
                    return (
                      <div className="text-center py-4 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>
                          All languages are in sync with the source of truth.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <Accordion type="multiple" className="w-full space-y-2">
                      {SUPPORTED_LANGUAGES.filter(
                        l => l.code !== sourceOfTruth
                      ).map(({ code, name }) => {
                        const Flag = FLAG_COMPONENTS[code];
                        const v = validationByLanguage[code] ?? {
                          missing: [],
                          extra: [],
                        };
                        const issues = v.missing.length + v.extra.length;
                        return (
                          <AccordionItem
                            key={code}
                            value={code}
                            className="border rounded-lg"
                          >
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <FlagIcon
                                  component={Flag}
                                  className="w-5 h-3"
                                />
                                <span className="font-medium">
                                  {name} ({code}.json)
                                </span>
                                <Badge
                                  className={
                                    issues === 0
                                      ? 'bg-[var(--success)] text-[var(--success-foreground)] border-[var(--success)]'
                                      : 'bg-secondary text-secondary-foreground border border-gray-400'
                                  }
                                >
                                  {issues === 0 ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      PASS
                                    </>
                                  ) : (
                                    `${issues} issues`
                                  )}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                {v.missing.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge className="bg-[var(--error)] text-[var(--error-foreground)] text-xs">
                                        Missing: {v.missing.length}
                                      </Badge>
                                    </div>
                                    <div className="h-40 w-full rounded border p-2 overflow-auto">
                                      <div className="space-y-2">
                                        {v.missing.map(key => (
                                          <div
                                            key={key}
                                            className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-2 rounded border"
                                          >
                                            <code className="text-sm font-mono flex-1 mr-2 break-all">
                                              {key}
                                            </code>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                // navigate to key and focus input of that language
                                                setSelectedKey(key);
                                                setTimeout(() => {
                                                  const input =
                                                    document.getElementById(
                                                      `input-${code}-${key}`
                                                    ) as HTMLInputElement | null;
                                                  input?.focus?.();
                                                }, 0);
                                              }}
                                              className="h-7 px-2 shrink-0"
                                            >
                                              Add
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {v.extra.length > 0 && (
                                  <div className="space-y-2">
                                    <Badge className="bg-[var(--warning)] text-[var(--warning-foreground)] text-xs">
                                      Extra: {v.extra.length}
                                    </Badge>
                                    <div className="h-40 w-full rounded border p-2 overflow-auto">
                                      <div className="space-y-2">
                                        {v.extra.map(key => (
                                          <div
                                            key={key}
                                            className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border"
                                          >
                                            <code className="text-sm font-mono flex-1 mr-2 break-all">
                                              {key}
                                            </code>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  );
                })()}
              </CardContent>
            </Card>

            {selectedKey ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {SUPPORTED_LANGUAGES.map(({ code }) => {
                  const Flag = FLAG_COMPONENTS[code];
                  return (
                    <Card key={code}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FlagIcon component={Flag} className="w-6 h-4" />
                            {code}.json
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => resetLanguage(code)}
                              variant="outline"
                              size="sm"
                              disabled={!hasChanges(code)}
                              title="Reset changes"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Input
                              id={`input-${code}-${selectedKey}`}
                              value={
                                editedTranslations[code]?.[selectedKey] || ''
                              }
                              onChange={e =>
                                handleTranslationChange(
                                  code,
                                  selectedKey,
                                  e.target.value
                                )
                              }
                              onBlur={() => commitEditedKey(code, selectedKey)}
                              className={
                                editedTranslations[code]?.[selectedKey] !==
                                translations[code]?.[selectedKey]
                                  ? 'border-orange-500'
                                  : ''
                              }
                            />
                            {editedTranslations[code]?.[selectedKey] !==
                              translations[code]?.[selectedKey] && (
                              <p className="text-xs text-muted-foreground">
                                Original: {translations[code]?.[selectedKey]}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a translation key from the sidebar to edit</p>
                </CardContent>
              </Card>
            )}

            {import.meta.env.DEV && (
              <div className="absolute bottom-4 right-4">
                <Button
                  onClick={saveAllLanguages}
                  variant="default"
                  title="Save all languages to files"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TranslationEditorMain;
