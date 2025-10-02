import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  flattenObject,
  getAncestorPaths,
  isValidLocaleCode,
  isValidTranslationKey,
  unflattenObject,
} from './utils';
import { SUPPORTED_LANGUAGES, type SearchMode } from './constants';
import type { FlattenedTranslations, TreeNode, TranslationData } from './types';
import enTranslations from '@/locales/en.json';
import zhTranslations from '@/locales/zh.json';
import jaTranslations from '@/locales/ja.json';
import cnTranslations from '@/locales/cn.json';
import { readLocaleFile, saveLocaleFile } from '@/lib/devLocalesApi';

type TranslationsMap = Record<string, FlattenedTranslations>;

type TranslationEditorContextValue = {
  translations: TranslationsMap;
  editedTranslations: TranslationsMap;
  pendingTranslations: TranslationsMap;
  setEditedTranslations: React.Dispatch<React.SetStateAction<TranslationsMap>>;
  setTranslations: React.Dispatch<React.SetStateAction<TranslationsMap>>;

  searchTerm: string;
  setSearchTerm: (s: string) => void;
  searchMode: SearchMode;
  setSearchMode: (m: SearchMode) => void;
  selectedKey: string | null;
  setSelectedKey: (k: string | null) => void;
  expandedNodes: Set<string>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  sourceOfTruth: string;
  setSourceOfTruth: (s: string) => void;
  isSaving: boolean;

  buildTree: TreeNode[];
  filteredTree: TreeNode[];
  allFolderPaths: string[];
  allExpanded: boolean;
  toggleExpandCollapse: () => void;

  validationByLanguage: Record<string, { missing: string[]; extra: string[] }>;
  hasUnsavedChanges: boolean;

  commitEditedKey: (language: string, key: string) => void;
  handleTranslationChange: (
    language: string,
    key: string,
    value: string
  ) => void;
  resetLanguage: (language: string) => void;
  hasChanges: (language: string) => boolean;

  handleAddKey: (key: string) => { ok: boolean; error?: string };
  handleDeleteKey: (key: string) => void;
  handleAddMissingKey: (targetLanguage: string, key: string) => void;
  handleDeleteExtraKey: (targetLanguage: string, key: string) => void;

  saveLanguage: (code: string) => Promise<void>;
  reloadLanguage: (code: string) => Promise<void>;
  saveAllLanguages: () => Promise<void>;
  reloadAllLanguages: () => Promise<void>;
};

export const TranslationEditorContext =
  createContext<TranslationEditorContextValue | null>(null);

const LS_SELECTED_KEY = 'translationEditor.selectedKey';
const LS_EXPANDED_NODES = 'translationEditor.expandedNodes';

export const TranslationEditorProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [translations, setTranslations] = useState<TranslationsMap>({});
  const [editedTranslations, setEditedTranslations] = useState<TranslationsMap>(
    {}
  );
  const [pendingTranslations, setPendingTranslations] =
    useState<TranslationsMap>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('key');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [sourceOfTruth, setSourceOfTruth] = useState('zh');
  const [isSaving, setIsSaving] = useState(false);

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
  useEffect(() => {
    if (!selectedKey) return;
    setExpandedNodes(prev => {
      const next = new Set(prev);
      for (const a of getAncestorPaths(selectedKey)) next.add(a);
      return next;
    });
  }, [selectedKey]);

  // Initialize from bundled JSON
  useEffect(() => {
    const loadedTranslations: Record<string, FlattenedTranslations> = {};
    const loadedEdited: Record<string, FlattenedTranslations> = {};
    const initial = [
      { code: 'en', data: enTranslations as TranslationData },
      { code: 'zh', data: zhTranslations as TranslationData },
      { code: 'ja', data: jaTranslations as TranslationData },
      { code: 'cn', data: cnTranslations as TranslationData },
    ];
    initial.forEach(({ code, data }) => {
      const flattened = flattenObject(data);
      loadedTranslations[code] = flattened;
      loadedEdited[code] = { ...flattened };
    });
    setTranslations(loadedTranslations);
    setEditedTranslations(loadedEdited);
    setPendingTranslations(
      initial.reduce<Record<string, FlattenedTranslations>>((acc, { code }) => {
        acc[code] = { ...loadedTranslations[code] };
        return acc;
      }, {})
    );
  }, []);

  // Keep pendingTranslations in sync when saved translations change
  useEffect(() => {
    const next: Record<string, FlattenedTranslations> = {};
    SUPPORTED_LANGUAGES.forEach(({ code }) => {
      next[code] = { ...translations[code] };
    });
    setPendingTranslations(next);
  }, [translations]);

  // Build tree structure from flattened keys sourced from selected source-of-truth
  const buildTree = useMemo((): TreeNode[] => {
    const sourceKeysFlat = translations[sourceOfTruth] || {};
    const keys = Object.keys(sourceKeysFlat);
    const nodeMap = new Map<string, TreeNode>();

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

    const rootNodes: TreeNode[] = [];
    nodeMap.forEach((node, path) => {
      if (path.includes('.')) {
        const parentPath = path.substring(0, path.lastIndexOf('.'));
        const parent = nodeMap.get(parentPath);
        if (parent && !parent.isLeaf) parent.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    const sortNodes = (nodes: TreeNode[]): TreeNode[] =>
      nodes
        .sort((a, b) =>
          a.isLeaf !== b.isLeaf
            ? a.isLeaf
              ? 1
              : -1
            : a.name.localeCompare(b.name)
        )
        .map(node => ({
          ...node,
          children: node.children ? sortNodes(node.children) : undefined,
        }));

    return sortNodes(rootNodes);
  }, [sourceOfTruth, translations]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchTerm) return buildTree;
    const term = searchTerm.toLowerCase();
    const textMatchCache = new Map<string, boolean>();
    const leafMatches = (path: string): boolean => {
      if (textMatchCache.has(path)) return textMatchCache.get(path)!;
      const checkPaths: string[] = [];
      const src = pendingTranslations[sourceOfTruth] ?? {};
      const prefix = path ? path + '.' : '';
      for (const key of Object.keys(src)) {
        if (key === path || key.startsWith(prefix)) checkPaths.push(key);
      }
      let match = false;
      if (searchMode === 'text') {
        for (const { code } of SUPPORTED_LANGUAGES) {
          const flat = pendingTranslations[code] ?? {};
          for (const k of checkPaths) {
            const v = (flat[k] ?? '').toLowerCase();
            if (v.includes(term)) {
              match = true;
              break;
            }
          }
          if (match) break;
        }
      }
      textMatchCache.set(path, match);
      return match;
    };
    const filterNode = (node: TreeNode): TreeNode | null => {
      const keyMatch =
        node.name.toLowerCase().includes(term) ||
        node.fullPath.toLowerCase().includes(term);
      const matchesSearch =
        searchMode === 'key'
          ? keyMatch
          : keyMatch || leafMatches(node.fullPath);
      if (node.children) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((c): c is TreeNode => c !== null);
        if (filteredChildren.length > 0 || matchesSearch)
          return { ...node, children: filteredChildren };
      }
      return matchesSearch ? node : null;
    };
    return buildTree.map(filterNode).filter((n): n is TreeNode => n !== null);
  }, [buildTree, searchTerm, searchMode, pendingTranslations, sourceOfTruth]);

  // Expand/collapse helpers
  const allFolderPaths = useMemo(() => {
    const paths: string[] = [];
    const collect = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        if (!n.isLeaf) {
          paths.push(n.fullPath);
          if (n.children) collect(n.children);
        }
      });
    };
    collect(filteredTree);
    return paths;
  }, [filteredTree]);

  const allExpanded = useMemo(
    () =>
      allFolderPaths.length > 0 &&
      allFolderPaths.every(p => expandedNodes.has(p)),
    [allFolderPaths, expandedNodes]
  );

  const toggleExpandCollapse = useCallback(() => {
    if (allExpanded) setExpandedNodes(new Set());
    else setExpandedNodes(new Set(allFolderPaths));
  }, [allExpanded, allFolderPaths]);

  // Validation vs source-of-truth
  const validationByLanguage = useMemo(() => {
    const sourceFlat = pendingTranslations[sourceOfTruth] ?? {};
    const sourceKeys = new Set(Object.keys(sourceFlat));
    const result: Record<string, { missing: string[]; extra: string[] }> = {};
    for (const { code } of SUPPORTED_LANGUAGES) {
      if (code === sourceOfTruth) continue;
      const currentFlat = pendingTranslations[code] ?? {};
      const currentKeys = new Set(Object.keys(currentFlat));
      const missing = [...sourceKeys].filter(k => !currentKeys.has(k));
      const extra = [...currentKeys].filter(k => !sourceKeys.has(k));
      result[code] = { missing, extra };
    }
    return result;
  }, [pendingTranslations, sourceOfTruth]);

  const commitEditedKey = (language: string, key: string) => {
    const allowed = SUPPORTED_LANGUAGES.map(l => l.code);
    if (!isValidLocaleCode(language, allowed) || !isValidTranslationKey(key))
      return;
    const value = editedTranslations[language]?.[key] ?? '';
    setPendingTranslations(prev => {
      const langMap = { ...(prev[language] ?? {}) };
      if (value !== '') {
        langMap[key] = value;
      } else {
        delete langMap[key];
        return { ...prev, [language]: langMap };
      }
      return { ...prev, [language]: langMap };
    });
  };

  const handleTranslationChange = (
    language: string,
    key: string,
    value: string
  ) => {
    setEditedTranslations(prev => ({
      ...prev,
      [language]: { ...prev[language], [key]: value },
    }));
  };

  const resetLanguage = (language: string) => {
    setEditedTranslations(prev => ({
      ...prev,
      [language]: { ...translations[language] },
    }));
  };

  const hasChanges = useCallback(
    (language: string) => {
      const original = translations[language] || {};
      const edited = editedTranslations[language] || {};
      return Object.keys(edited).some(key => edited[key] !== original[key]);
    },
    [translations, editedTranslations]
  );

  const hasUnsavedChanges = useMemo(
    () => SUPPORTED_LANGUAGES.some(({ code }) => hasChanges(code)),
    [hasChanges]
  );

  // Navigation guards for unsaved changes (dev experience)
  useEffect(() => {
    if (!hasUnsavedChanges || isSaving) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      if (link) {
        const href = link.getAttribute('href');
        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          href !== '#'
        ) {
          e.preventDefault();
          const shouldLeave = window.confirm(
            'You have unsaved changes. Are you sure you want to leave?'
          );
          if (shouldLeave) window.location.href = href;
        }
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedChanges, isSaving]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault();
        e.returnValue =
          'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    if (hasUnsavedChanges && !isSaving)
      window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSaving]);

  const handleAddKey = (inputKey: string) => {
    const trimmedKey = inputKey.trim();
    if (!trimmedKey)
      return { ok: false, error: 'Key cannot be empty' } as const;
    if (!isValidTranslationKey(trimmedKey))
      return {
        ok: false,
        error:
          'Invalid key format. Use only letters, numbers, dots, hyphens, and underscores. No leading/trailing dots, no consecutive dots, no slashes.',
      } as const;
    if (translations[sourceOfTruth]?.[trimmedKey])
      return { ok: false, error: 'Key already exists' } as const;

    setEditedTranslations(prev => {
      const updated = { ...prev };
      SUPPORTED_LANGUAGES.forEach(({ code }) => {
        updated[code] = { ...updated[code], [trimmedKey]: '' };
      });
      return updated;
    });
    setTranslations(prev => {
      const updated = { ...prev };
      SUPPORTED_LANGUAGES.forEach(({ code }) => {
        updated[code] = { ...updated[code], [trimmedKey]: '' };
      });
      return updated;
    });
    setSelectedKey(trimmedKey);
    setExpandedNodes(prev => {
      const next = new Set(prev);
      for (const a of getAncestorPaths(trimmedKey)) next.add(a);
      return next;
    });
    return { ok: true } as const;
  };

  const handleDeleteKey = (keyToDelete: string) => {
    setEditedTranslations(prev => {
      const updated = { ...prev };
      SUPPORTED_LANGUAGES.forEach(({ code }) => {
        const langMap = { ...(updated[code] || {}) };
        delete langMap[keyToDelete];
        updated[code] = langMap;
      });
      return updated;
    });
    setTranslations(prev => {
      const updated = { ...prev };
      SUPPORTED_LANGUAGES.forEach(({ code }) => {
        const langMap = { ...(updated[code] || {}) };
        delete langMap[keyToDelete];
        updated[code] = langMap;
      });
      return updated;
    });
    if (selectedKey === keyToDelete) setSelectedKey(null);
  };

  const handleAddMissingKey = (targetLanguage: string, key: string) => {
    const allowed = SUPPORTED_LANGUAGES.map(l => l.code);
    if (
      !isValidLocaleCode(targetLanguage, allowed) ||
      !isValidTranslationKey(key)
    )
      return;
    setExpandedNodes(prev => {
      const next = new Set(prev);
      for (const a of getAncestorPaths(key)) next.add(a);
      return next;
    });
    setSelectedKey(key);
    // focusing is handled by UI component effect
  };

  const handleDeleteExtraKey = (targetLanguage: string, key: string) => {
    const allowed = SUPPORTED_LANGUAGES.map(l => l.code);
    if (
      !isValidLocaleCode(targetLanguage, allowed) ||
      !isValidTranslationKey(key)
    )
      return;
    setEditedTranslations(prev => {
      const updated = { ...prev };
      const langMap = { ...(updated[targetLanguage] || {}) };
      delete langMap[key];
      updated[targetLanguage] = langMap;
      return updated;
    });
    setTranslations(prev => {
      const updated = { ...prev };
      const langMap = { ...(updated[targetLanguage] || {}) };
      delete langMap[key];
      updated[targetLanguage] = langMap;
      return updated;
    });
  };

  const saveLanguage = async (code: string) => {
    if (!import.meta.env.DEV) return;
    const allowed = SUPPORTED_LANGUAGES.map(l => l.code);
    if (!isValidLocaleCode(code, allowed)) {
      alert(`Invalid locale code: ${code}`);
      return;
    }
    setIsSaving(true);
    try {
      const edited = editedTranslations[code];
      const nested = unflattenObject(edited);
      const sourceFlat = translations[sourceOfTruth] ?? {};
      const sourceKeys = new Set(Object.keys(sourceFlat));
      const targetKeys = new Set(Object.keys(edited ?? {}));
      const missing = [...sourceKeys].filter(k => !targetKeys.has(k));
      const extra = [...targetKeys].filter(k => !sourceKeys.has(k));
      if (missing.length > 0 || extra.length > 0) {
        alert(
          `Validation failed for ${code}: ${missing.length} missing, ${extra.length} extra keys.`
        );
        return;
      }
      await saveLocaleFile(`${code}.json`, nested);
      const flattened = flattenObject(nested as TranslationData);
      setTranslations(prev => ({ ...prev, [code]: flattened }));
      setEditedTranslations(prev => ({ ...prev, [code]: { ...flattened } }));
    } finally {
      setIsSaving(false);
    }
  };

  const reloadLanguage = async (code: string) => {
    if (!import.meta.env.DEV) return;
    const allowed = SUPPORTED_LANGUAGES.map(l => l.code);
    if (!isValidLocaleCode(code, allowed)) {
      alert(`Invalid locale code: ${code}`);
      return;
    }
    const res = await readLocaleFile(`${code}.json`);
    const flattened = flattenObject(res.content as TranslationData);
    setTranslations(prev => ({ ...prev, [code]: flattened }));
    setEditedTranslations(prev => ({ ...prev, [code]: { ...flattened } }));
  };

  const saveAllLanguages = async () => {
    if (!import.meta.env.DEV) return;
    setIsSaving(true);
    try {
      for (const { code } of SUPPORTED_LANGUAGES) {
        await saveLanguage(code);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const reloadAllLanguages = async () => {
    if (!import.meta.env.DEV) return;
    for (const { code } of SUPPORTED_LANGUAGES) {
      await reloadLanguage(code);
    }
  };

  const value: TranslationEditorContextValue = {
    translations,
    editedTranslations,
    pendingTranslations,
    setEditedTranslations,
    setTranslations,
    searchTerm,
    setSearchTerm,
    searchMode,
    setSearchMode,
    selectedKey,
    setSelectedKey,
    expandedNodes,
    setExpandedNodes,
    sourceOfTruth,
    setSourceOfTruth,
    isSaving,
    buildTree,
    filteredTree,
    allFolderPaths,
    allExpanded,
    toggleExpandCollapse,
    validationByLanguage,
    hasUnsavedChanges,
    commitEditedKey,
    handleTranslationChange,
    resetLanguage,
    hasChanges,
    handleAddKey,
    handleDeleteKey,
    handleAddMissingKey,
    handleDeleteExtraKey,
    saveLanguage,
    reloadLanguage,
    saveAllLanguages,
    reloadAllLanguages,
  };

  return (
    <TranslationEditorContext.Provider value={value}>
      {children}
    </TranslationEditorContext.Provider>
  );
};

