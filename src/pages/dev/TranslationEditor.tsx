import React, { useState, useEffect, useMemo } from 'react';
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
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ChevronRight,
  File,
  Folder,
  Search,
  CheckCircle,
  RotateCcw,
  Save,
  RefreshCcw,
} from 'lucide-react';
import { US, HK, JP, CN } from 'country-flag-icons/react/3x2';

// Import translation files directly
import enTranslations from '../../locales/en.json';
import zhTranslations from '../../locales/zh.json';
import jaTranslations from '../../locales/ja.json';
import cnTranslations from '../../locales/cn.json';
import { readLocaleFile, saveLocaleFile } from '@/lib/devLocalesApi';

type TranslationData = Record<string, unknown>;
type FlattenedTranslations = Record<string, string>;

// Flatten nested object to dot notation keys
const flattenObject = (
  obj: TranslationData,
  prefix = ''
): FlattenedTranslations => {
  const flattened: FlattenedTranslations = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value as TranslationData, newKey));
    } else {
      flattened[newKey] = String(value);
    }
  }

  return flattened;
};

// Validation helper (from locales-fmt.ts)
const collectKeys = (
  obj: Record<string, unknown>,
  prefix = ''
): Set<string> => {
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedKeys = collectKeys(value as Record<string, unknown>, fullKey);
      nestedKeys.forEach(k => keys.add(k));
    }
  }
  return keys;
};

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', data: enTranslations, flag: US },
  { code: 'zh', name: '中文', data: zhTranslations, flag: HK },
  { code: 'ja', name: '日本語', data: jaTranslations, flag: JP },
  { code: 'cn', name: '简体中文', data: cnTranslations, flag: CN },
];

// Helper function to render breadcrumb for selected key
const renderBreadcrumb = (selectedKey: string) => {
  const parts = selectedKey.split('.');
  const items = parts.map((part, index) => {
    const path = parts.slice(0, index + 1).join('.');
    const isLast = index === parts.length - 1;

    return (
      <React.Fragment key={path}>
        <BreadcrumbItem>
          {isLast ? (
            <BreadcrumbPage>{part}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href="#">{part}</BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator />}
      </React.Fragment>
    );
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>{items}</BreadcrumbList>
    </Breadcrumb>
  );
};

// Tree node type for the translation keys
type TreeNode = {
  name: string;
  children?: TreeNode[];
  fullPath: string;
  isLeaf: boolean;
};

const TranslationEditor: React.FC = () => {
  const [translations, setTranslations] = useState<
    Record<string, FlattenedTranslations>
  >({});
  const [editedTranslations, setEditedTranslations] = useState<
    Record<string, FlattenedTranslations>
  >({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [sourceOfTruth, setSourceOfTruth] = useState('zh');

  // Persist selection and expansion across HMR reloads (Save All writes locale files -> Vite reloads)
  const LS_SELECTED_KEY = 'translationEditor.selectedKey';
  const LS_EXPANDED_NODES = 'translationEditor.expandedNodes';

  // Restore persisted state on mount
  useEffect(() => {
    try {
      const sk = localStorage.getItem(LS_SELECTED_KEY);
      if (sk) setSelectedKey(sk);
      const en = localStorage.getItem(LS_EXPANDED_NODES);
      if (en) {
        const arr = JSON.parse(en) as string[];
        if (Array.isArray(arr)) setExpandedNodes(new Set(arr));
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      if (selectedKey) localStorage.setItem(LS_SELECTED_KEY, selectedKey);
    } catch {
      // ignore localStorage errors
    }
  }, [selectedKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_EXPANDED_NODES,
        JSON.stringify(Array.from(expandedNodes))
      );
    } catch {
      // ignore localStorage errors
    }
  }, [expandedNodes]);

  // Ensure ancestors of selectedKey are expanded so the item is visible after reload
  const getAncestorPaths = (path: string): string[] => {
    const parts = path.split('.');
    const ancestors: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      ancestors.push(parts.slice(0, i).join('.'));
    }
    return ancestors;
  };

  useEffect(() => {
    if (!selectedKey) return;
    setExpandedNodes(prev => {
      const next = new Set(prev);
      for (const a of getAncestorPaths(selectedKey)) next.add(a);
      return next;
    });
  }, [selectedKey]);

  // After selection is set/restored, scroll sidebar item into view and focus the first input
  useEffect(() => {
    if (!selectedKey) return;
    // Scroll the selected key in the sidebar into view
    const btn = document.getElementById(`key-${selectedKey}`);
    btn?.scrollIntoView({ block: 'center' });
    // Focus the first language input for this key (English if present)
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

  useEffect(() => {
    // Load and flatten all translation files
    const loadedTranslations: Record<string, FlattenedTranslations> = {};
    const loadedEdited: Record<string, FlattenedTranslations> = {};

    SUPPORTED_LANGUAGES.forEach(({ code, data }) => {
      const flattened = flattenObject(data);
      loadedTranslations[code] = flattened;
      loadedEdited[code] = { ...flattened };
    });

    setTranslations(loadedTranslations);
    setEditedTranslations(loadedEdited);
  }, []);

  // Build tree structure from flattened keys sourced from selected source-of-truth
  const buildTree = useMemo((): TreeNode[] => {
    const sourceKeysFlat = translations[sourceOfTruth] || {};
    const keys = Object.keys(sourceKeysFlat);
    const nodeMap = new Map<string, TreeNode>();

    // First pass: create all nodes
    keys.forEach(key => {
      const parts = key.split('.');
      let currentPath = '';

      parts.forEach((part, index) => {
        const path = currentPath ? `${currentPath}.${part}` : part;
        const isLeaf = index === parts.length - 1;

        if (!nodeMap.has(path)) {
          nodeMap.set(path, {
            name: part,
            children: [],
            fullPath: path,
            isLeaf,
          });
        }

        currentPath = path;
      });
    });

    // Second pass: build hierarchy
    const rootNodes: TreeNode[] = [];

    nodeMap.forEach((node, path) => {
      if (path.includes('.')) {
        // This is a child node
        const parentPath = path.substring(0, path.lastIndexOf('.'));
        const parent = nodeMap.get(parentPath);
        if (parent && !parent.isLeaf) {
          parent.children!.push(node);
        }
      } else {
        // This is a root node
        rootNodes.push(node);
      }
    });

    // Sort nodes: folders first, then alphabetically
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .sort((a, b) => {
          if (a.isLeaf !== b.isLeaf) {
            return a.isLeaf ? 1 : -1;
          }
          return a.name.localeCompare(b.name);
        })
        .map(node => ({
          ...node,
          children: node.children ? sortNodes(node.children) : undefined,
        }));
    };

    return sortNodes(rootNodes);
  }, [translations, sourceOfTruth]);

  // Filter tree based on search term
  const filteredTree = useMemo(() => {
    if (!searchTerm) return buildTree;

    const filterNode = (node: TreeNode): TreeNode | null => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.fullPath.toLowerCase().includes(searchTerm.toLowerCase());

      if (node.children) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((child): child is TreeNode => child !== null);

        if (filteredChildren.length > 0 || matchesSearch) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
      }

      return matchesSearch ? node : null;
    };

    return buildTree
      .map(filterNode)
      .filter((node): node is TreeNode => node !== null);
  }, [buildTree, searchTerm]);

  // Compute validation vs source-of-truth for each language (nested data)
  const validationByLanguage = useMemo(() => {
    const sourceData = SUPPORTED_LANGUAGES.find(
      l => l.code === sourceOfTruth
    )?.data;
    if (!sourceData)
      return {} as Record<string, { missing: string[]; extra: string[] }>;
    const sourceKeys = collectKeys(sourceData);
    const result: Record<string, { missing: string[]; extra: string[] }> = {};
    for (const { code, data } of SUPPORTED_LANGUAGES) {
      if (code === sourceOfTruth) continue;
      const currentKeys = collectKeys(data);
      const missing = [...sourceKeys].filter(k => !currentKeys.has(k));
      const extra = [...currentKeys].filter(k => !sourceKeys.has(k));
      result[code] = { missing, extra };
    }
    return result;
  }, [sourceOfTruth]);

  // Tree component for rendering the hierarchical structure
  const TreeNodeComponent: React.FC<{ node: TreeNode; level?: number }> = ({
    node,
    level = 0,
  }) => {
    const isExpanded = expandedNodes.has(node.fullPath);
    const isSelected = selectedKey === node.fullPath;

    if (node.isLeaf) {
      return (
        <SidebarMenuButton
          isActive={isSelected}
          onClick={() => setSelectedKey(node.fullPath)}
          id={`key-${node.fullPath}`}
          className="w-full justify-start"
        >
          <File className="h-4 w-4" />
          <span className="truncate">{node.name}</span>
        </SidebarMenuButton>
      );
    }

    return (
      <SidebarMenuItem>
        <Collapsible
          open={isExpanded}
          onOpenChange={open => {
            const newExpanded = new Set(expandedNodes);
            if (open) {
              newExpanded.add(node.fullPath);
            } else {
              newExpanded.delete(node.fullPath);
            }
            setExpandedNodes(newExpanded);
          }}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="w-full justify-start">
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
              <Folder className="h-4 w-4" />
              <span className="truncate">{node.name}</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {node.children?.map((child, index) => (
                <TreeNodeComponent
                  key={`${child.fullPath}-${index}`}
                  node={child}
                  level={level + 1}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  };

  const handleTranslationChange = (
    language: string,
    key: string,
    value: string
  ) => {
    setEditedTranslations(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        [key]: value,
      },
    }));
  };

  const resetLanguage = (language: string) => {
    setEditedTranslations(prev => ({
      ...prev,
      [language]: { ...translations[language] },
    }));
  };

  const hasChanges = (language: string) => {
    const original = translations[language] || {};
    const edited = editedTranslations[language] || {};
    return Object.keys(edited).some(key => edited[key] !== original[key]);
  };

  // Dev-only save & reload actions
  const saveLanguage = async (code: string) => {
    if (!import.meta.env.DEV) return;
    // Persist the unflattened edited translations to the file
    const edited = editedTranslations[code];
    const nested: Record<string, unknown> = {};
    // Unflatten inline to avoid re-introducing removed helper
    Object.entries(edited).forEach(([k, v]) => {
      const parts = k.split('.');
      let curr: Record<string, unknown> = nested;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]] as Record<string, unknown>;
      }
      curr[parts[parts.length - 1]] = v;
    });

    // Validate against source of truth before saving
    const sourceData = SUPPORTED_LANGUAGES.find(
      l => l.code === sourceOfTruth
    )?.data;
    if (sourceData) {
      const sourceKeys = collectKeys(sourceData);
      const targetKeys = collectKeys(nested);
      const missing = [...sourceKeys].filter(k => !targetKeys.has(k));
      const extra = [...targetKeys].filter(k => !sourceKeys.has(k));
      if (missing.length > 0 || extra.length > 0) {
        alert(
          `Validation failed for ${code}: ${missing.length} missing, ${extra.length} extra keys.`
        );
        return;
      }
    }

    await saveLocaleFile(`${code}.json`, nested);
    // Optimistically update in-memory translations so UI reflects latest values without reload
    const flattened = flattenObject(nested);
    setTranslations(prev => ({ ...prev, [code]: flattened }));
    setEditedTranslations(prev => ({ ...prev, [code]: { ...flattened } }));
  };

  const reloadLanguage = async (code: string) => {
    if (!import.meta.env.DEV) return;
    const res = await readLocaleFile(`${code}.json`);
    const flattened = flattenObject(res.content as TranslationData);
    setTranslations(prev => ({ ...prev, [code]: flattened }));
    setEditedTranslations(prev => ({ ...prev, [code]: { ...flattened } }));
  };

  const saveAllLanguages = async () => {
    if (!import.meta.env.DEV) return;
    // Save sequentially and update state in-memory; preserve selectedKey and expanded nodes
    for (const { code } of SUPPORTED_LANGUAGES) {
      await saveLanguage(code);
    }
    // After all saves, ensure focus remains on the selected key input
    if (selectedKey) {
      const preferredLang = SUPPORTED_LANGUAGES[0]?.code;
      const input = document.getElementById(
        `input-${preferredLang}-${selectedKey}`
      ) as HTMLInputElement | null;
      input?.focus?.();
    }
  };

  const reloadAllLanguages = async () => {
    if (!import.meta.env.DEV) return;
    for (const { code } of SUPPORTED_LANGUAGES) {
      await reloadLanguage(code);
    }
    if (selectedKey) {
      const preferredLang = SUPPORTED_LANGUAGES[0]?.code;
      const input = document.getElementById(
        `input-${preferredLang}-${selectedKey}`
      ) as HTMLInputElement | null;
      input?.focus?.();
    }
  };

  if (import.meta.env.PROD) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Translation Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is only available in development mode.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-none">
      <SidebarProvider>
        <div className="flex h-[calc(100vh-12rem)] w-full border rounded-lg overflow-hidden">
          <Sidebar>
            <SidebarHeader className="border-b p-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 flex-shrink-0" />
                <Input
                  placeholder="Search translations..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-8 flex-1"
                />
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Translation Keys</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredTree.map((node, index) => (
                      <TreeNodeComponent
                        key={`${node.fullPath}-${index}`}
                        node={node}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">Translation Editor</h1>
                  <Badge variant="secondary">Development Only</Badge>
                </div>
                {selectedKey && renderBreadcrumb(selectedKey)}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Label htmlFor="source-select" className="text-sm">
                  Source of Truth:
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
            <div className="flex flex-1 flex-col gap-4 p-4 relative">
              {/* Validation Summary per Language (vs source-of-truth) */}
              {Object.keys(validationByLanguage).length > 0 && (
                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <CardHeader>
                    <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                      <File className="h-4 w-4" />
                      Validation Summary (source: {sourceOfTruth})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    {SUPPORTED_LANGUAGES.filter(
                      l => l.code !== sourceOfTruth
                    ).map(({ code, name }) => {
                      const v = validationByLanguage[code] ?? {
                        missing: [],
                        extra: [],
                      };
                      const issues = v.missing.length + v.extra.length;
                      return (
                        <div key={code} className="flex items-center gap-2">
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
                                {name}: Synced
                              </>
                            ) : (
                              name
                            )}
                          </Badge>
                          {issues > 0 && (
                            <div className="flex items-center gap-1">
                              {v.missing.length > 0 && (
                                <Badge className="bg-[var(--error)] text-[var(--error-foreground)] text-xs">
                                  Missing: {v.missing.length}
                                </Badge>
                              )}
                              {v.extra.length > 0 && (
                                <Badge className="bg-[var(--warning)] text-[var(--warning-foreground)] text-xs">
                                  Extra: {v.extra.length}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {selectedKey ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {SUPPORTED_LANGUAGES.map(({ code, flag: Flag }) => (
                    <Card key={code}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flag className="w-6 h-4" />
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
                  ))}
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
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default TranslationEditor;
