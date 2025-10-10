import { create } from 'zustand';
import {
	type SearchMode,
	SUPPORTED_LANGUAGES,
} from '@/components/translations/constants';
import type {
	FlattenedTranslations,
	TranslationData,
	TreeNode,
} from '@/components/translations/types';
import {
	flattenObject,
	getAncestorPaths,
	isValidLocaleCode,
	isValidTranslationKey,
	unflattenObject,
} from '@/components/translations/utils';
import { readLocaleFile, saveLocaleFile } from '@/lib/devLocalesApi';
import cnTranslations from '@/locales/cn.json';
import enTranslations from '@/locales/en.json';
import jaTranslations from '@/locales/ja.json';
import zhTranslations from '@/locales/zh.json';

export type TranslationsMap = Record<string, FlattenedTranslations>;
type ValidationSummary = Record<string, { missing: string[]; extra: string[] }>;
type ExpandedNodesUpdater = (prev: Set<string>) => Set<string>;
type ExpandedNodesInput = Set<string> | ExpandedNodesUpdater;

const setsAreEqual = (a: Set<string>, b: Set<string>): boolean => {
	if (a === b) return true;
	if (a.size !== b.size) return false;
	for (const value of a) {
		if (!b.has(value)) return false;
	}
	return true;
};

const LS_SELECTED_KEY = 'translationEditor.selectedKey';
const LS_EXPANDED_NODES = 'translationEditor.expandedNodes';

const createInitialTranslations = (): TranslationsMap => {
	const bundles: Record<string, TranslationData> = {
		en: enTranslations as TranslationData,
		zh: zhTranslations as TranslationData,
		ja: jaTranslations as TranslationData,
		cn: cnTranslations as TranslationData,
	};
	return Object.fromEntries(
		Object.entries(bundles).map(([code, data]) => [code, flattenObject(data)]),
	) as TranslationsMap;
};

const cloneTranslations = (source: TranslationsMap): TranslationsMap =>
	Object.fromEntries(
		Object.entries(source).map(([code, map]) => [code, { ...map }]),
	) as TranslationsMap;

interface TranslationEditorState {
	translations: TranslationsMap;
	editedTranslations: TranslationsMap;
	pendingTranslations: TranslationsMap;
	searchTerm: string;
	searchMode: SearchMode;
	selectedKey: string | null;
	expandedNodes: Set<string>;
	sourceOfTruth: string;
	isSaving: boolean;
}

interface TranslationEditorActions {
	hydrateFromStorage: () => void;
	setSearchTerm: (value: string) => void;
	setSearchMode: (mode: SearchMode) => void;
	setSelectedKey: (key: string | null) => void;
	setExpandedNodes: (input: ExpandedNodesInput) => void;
	toggleExpandCollapse: () => void;
	setSourceOfTruth: (code: string) => void;
	commitEditedKey: (language: string, key: string) => void;
	handleTranslationChange: (
		language: string,
		key: string,
		value: string,
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
}

export type TranslationEditorStore = TranslationEditorState &
	TranslationEditorActions;

const initialTranslations = createInitialTranslations();

export const useTranslationEditorStore = create<TranslationEditorStore>(
	(set, get) => ({
		translations: initialTranslations,
		editedTranslations: cloneTranslations(initialTranslations),
		pendingTranslations: cloneTranslations(initialTranslations),
		searchTerm: '',
		searchMode: 'key',
		selectedKey: null,
		expandedNodes: new Set<string>(),
		sourceOfTruth: 'zh',
		isSaving: false,
		hydrateFromStorage: () => {
			if (globalThis.window === undefined) return;
			let selectedKey: string | null = null;
			const expanded = new Set<string>();
			try {
				selectedKey = globalThis.window.localStorage.getItem(LS_SELECTED_KEY);
				const storedExpanded =
					globalThis.window.localStorage.getItem(LS_EXPANDED_NODES);
				if (storedExpanded) {
					const parsed = JSON.parse(storedExpanded) as unknown;
					if (Array.isArray(parsed)) {
						for (const value of parsed) {
							if (typeof value === 'string') expanded.add(value);
						}
					}
				}
			} catch {
				selectedKey = null;
			}

			const nextExpanded = new Set(expanded);
			if (selectedKey) {
				for (const ancestor of getAncestorPaths(selectedKey)) {
					nextExpanded.add(ancestor);
				}
			}

			set({ selectedKey, expandedNodes: nextExpanded });
		},
		setSearchTerm: (value) => set({ searchTerm: value }),
		setSearchMode: (mode) => set({ searchMode: mode }),
		setSelectedKey: (key) => {
			const state = get();
			const nextExpanded = new Set(state.expandedNodes);
			if (key) {
				for (const ancestor of getAncestorPaths(key)) {
					nextExpanded.add(ancestor);
				}
			}
			const selectedKeyChanged = state.selectedKey !== key;
			const expandedChanged = !setsAreEqual(nextExpanded, state.expandedNodes);
			if (!selectedKeyChanged && !expandedChanged) return;
			if (globalThis.window !== undefined) {
				try {
					if (selectedKeyChanged) {
						if (key) {
							globalThis.window.localStorage.setItem(LS_SELECTED_KEY, key);
						} else globalThis.window.localStorage.removeItem(LS_SELECTED_KEY);
					}
					if (expandedChanged) {
						globalThis.window.localStorage.setItem(
							LS_EXPANDED_NODES,
							JSON.stringify(Array.from(nextExpanded)),
						);
					}
				} catch {
					/* ignore */
				}
			}
			set({ selectedKey: key, expandedNodes: nextExpanded });
		},
		setExpandedNodes: (input) => {
			const state = get();
			const base = new Set(state.expandedNodes);
			const result =
				typeof input === 'function'
					? (input as ExpandedNodesUpdater)(base)
					: new Set(input as Set<string>);
			if (setsAreEqual(result, state.expandedNodes)) return;
			if (globalThis.window !== undefined) {
				try {
					globalThis.window.localStorage.setItem(
						LS_EXPANDED_NODES,
						JSON.stringify(Array.from(result)),
					);
				} catch {
					/* ignore */
				}
			}
			set({ expandedNodes: result });
		},
		toggleExpandCollapse: () => {
			const state = get();
			const folderPaths = computeAllFolderPaths(state);
			const shouldCollapse =
				folderPaths.length > 0 &&
				folderPaths.every((path) => state.expandedNodes.has(path));
			const nextExpanded = shouldCollapse
				? new Set<string>()
				: new Set(folderPaths);
			if (setsAreEqual(nextExpanded, state.expandedNodes)) return;
			if (globalThis.window !== undefined) {
				try {
					globalThis.window.localStorage.setItem(
						LS_EXPANDED_NODES,
						JSON.stringify(Array.from(nextExpanded)),
					);
				} catch {
					/* ignore */
				}
			}
			set({ expandedNodes: nextExpanded });
		},
		setSourceOfTruth: (code) => set({ sourceOfTruth: code }),
		commitEditedKey: (language, key) => {
			const allowed = SUPPORTED_LANGUAGES.map((l) => l.code);
			if (
				!isValidLocaleCode(language, allowed) ||
				!isValidTranslationKey(key)
			) {
				return;
			}
			set((state) => {
				const value = state.editedTranslations[language]?.[key] ?? '';
				const langMap = { ...state.pendingTranslations[language] };
				if (value === '') delete langMap[key];
				else langMap[key] = value;
				return {
					pendingTranslations: {
						...state.pendingTranslations,
						[language]: langMap,
					},
				} satisfies Partial<TranslationEditorState>;
			});
		},
		handleTranslationChange: (language, key, value) => {
			set(
				(state) =>
					({
						editedTranslations: {
							...state.editedTranslations,
							[language]: {
								...state.editedTranslations[language],
								[key]: value,
							},
						},
					}) satisfies Partial<TranslationEditorState>,
			);
		},
		resetLanguage: (language) => {
			set(
				(state) =>
					({
						editedTranslations: {
							...state.editedTranslations,
							[language]: { ...state.translations[language] },
						},
					}) satisfies Partial<TranslationEditorState>,
			);
		},
		hasChanges: (language) => computeHasChanges(get(), language),
		handleAddKey: (inputKey) => {
			const trimmedKey = inputKey.trim();
			if (!trimmedKey) {
				return { ok: false, error: 'Key cannot be empty' } as const;
			}
			if (!isValidTranslationKey(trimmedKey)) {
				return {
					ok: false,
					error:
						'Invalid key format. Use only letters, numbers, dots, hyphens, and underscores. No leading/trailing dots, no consecutive dots, no slashes.',
				} as const;
			}
			const { translations, sourceOfTruth } = get();
			if (translations[sourceOfTruth]?.[trimmedKey]) {
				return { ok: false, error: 'Key already exists' } as const;
			}

			set((state) => {
				const nextTranslations: TranslationsMap = { ...state.translations };
				const nextEdited: TranslationsMap = { ...state.editedTranslations };
				const nextPending: TranslationsMap = { ...state.pendingTranslations };
				for (const { code } of SUPPORTED_LANGUAGES) {
					nextTranslations[code] = {
						...nextTranslations[code],
						[trimmedKey]: '',
					};
					nextEdited[code] = {
						...nextEdited[code],
						[trimmedKey]: '',
					};
					nextPending[code] = {
						...nextPending[code],
						[trimmedKey]: '',
					};
				}
				return {
					translations: nextTranslations,
					editedTranslations: nextEdited,
					pendingTranslations: nextPending,
				} satisfies Partial<TranslationEditorState>;
			});
			get().setSelectedKey(trimmedKey);
			return { ok: true } as const;
		},
		handleDeleteKey: (keyToDelete) => {
			set((state) => {
				const nextTranslations: TranslationsMap = { ...state.translations };
				const nextEdited: TranslationsMap = { ...state.editedTranslations };
				const nextPending: TranslationsMap = { ...state.pendingTranslations };
				for (const { code } of SUPPORTED_LANGUAGES) {
					const updatedTranslations = { ...nextTranslations[code] };
					const updatedEdited = { ...nextEdited[code] };
					const updatedPending = { ...nextPending[code] };
					delete updatedTranslations[keyToDelete];
					delete updatedEdited[keyToDelete];
					delete updatedPending[keyToDelete];
					nextTranslations[code] = updatedTranslations;
					nextEdited[code] = updatedEdited;
					nextPending[code] = updatedPending;
				}
				return {
					translations: nextTranslations,
					editedTranslations: nextEdited,
					pendingTranslations: nextPending,
					selectedKey:
						state.selectedKey === keyToDelete ? null : state.selectedKey,
				} satisfies Partial<TranslationEditorState>;
			});
		},
		handleAddMissingKey: (targetLanguage, key) => {
			const allowed = SUPPORTED_LANGUAGES.map((l) => l.code);
			if (
				!isValidLocaleCode(targetLanguage, allowed) ||
				!isValidTranslationKey(key)
			) {
				return;
			}
			get().setSelectedKey(key);
		},
		handleDeleteExtraKey: (targetLanguage, key) => {
			const allowed = SUPPORTED_LANGUAGES.map((l) => l.code);
			if (
				!isValidLocaleCode(targetLanguage, allowed) ||
				!isValidTranslationKey(key)
			) {
				return;
			}
			set((state) => {
				const updatedTranslations = {
					...state.translations[targetLanguage],
				};
				const updatedEdited = {
					...state.editedTranslations[targetLanguage],
				};
				const updatedPending = {
					...state.pendingTranslations[targetLanguage],
				};
				delete updatedTranslations[key];
				delete updatedEdited[key];
				delete updatedPending[key];
				return {
					translations: {
						...state.translations,
						[targetLanguage]: updatedTranslations,
					},
					editedTranslations: {
						...state.editedTranslations,
						[targetLanguage]: updatedEdited,
					},
					pendingTranslations: {
						...state.pendingTranslations,
						[targetLanguage]: updatedPending,
					},
				} satisfies Partial<TranslationEditorState>;
			});
		},
		saveLanguage: async (code) => {
			const allowed = SUPPORTED_LANGUAGES.map((l) => l.code);
			if (!isValidLocaleCode(code, allowed)) {
				alert(`Invalid locale code: ${code}`);
				return;
			}
			set({ isSaving: true });
			try {
				const { editedTranslations, sourceOfTruth, translations } = get();
				const edited = editedTranslations[code];
				const nested = unflattenObject(edited);
				const sourceFlat = translations[sourceOfTruth];
				const sourceKeys = new Set(Object.keys(sourceFlat));
				const targetKeys = new Set(Object.keys(edited));
				const missing = [...sourceKeys].filter((k) => !targetKeys.has(k));
				const extra = [...targetKeys].filter((k) => !sourceKeys.has(k));
				if (missing.length > 0 || extra.length > 0) {
					alert(
						`Validation failed for ${code}: ${missing.length} missing, ${extra.length} extra keys.`,
					);
					return;
				}
				if (import.meta.env.DEV) {
					await saveLocaleFile(`${code}.json`, nested);
				}
				const flattened = flattenObject(nested as TranslationData);
				set(
					(state) =>
						({
							translations: {
								...state.translations,
								[code]: flattened,
							},
							editedTranslations: {
								...state.editedTranslations,
								[code]: { ...flattened },
							},
							pendingTranslations: {
								...state.pendingTranslations,
								[code]: { ...flattened },
							},
						}) satisfies Partial<TranslationEditorState>,
				);
			} finally {
				set({ isSaving: false });
			}
		},
		reloadLanguage: async (code) => {
			const allowed = SUPPORTED_LANGUAGES.map((l) => l.code);
			if (!isValidLocaleCode(code, allowed)) {
				alert(`Invalid locale code: ${code}`);
				return;
			}
			if (!import.meta.env.DEV) return;
			const res = await readLocaleFile(`${code}.json`);
			const flattened = flattenObject(res.content as TranslationData);
			set(
				(state) =>
					({
						translations: {
							...state.translations,
							[code]: flattened,
						},
						editedTranslations: {
							...state.editedTranslations,
							[code]: { ...flattened },
						},
						pendingTranslations: {
							...state.pendingTranslations,
							[code]: { ...flattened },
						},
					}) satisfies Partial<TranslationEditorState>,
			);
		},
		saveAllLanguages: async () => {
			if (!import.meta.env.DEV) return;
			set({ isSaving: true });
			try {
				for (const { code } of SUPPORTED_LANGUAGES) {
					await get().saveLanguage(code);
				}
			} finally {
				set({ isSaving: false });
			}
		},
		reloadAllLanguages: async () => {
			if (!import.meta.env.DEV) return;
			for (const { code } of SUPPORTED_LANGUAGES) {
				await get().reloadLanguage(code);
			}
		},
	}),
);

const computeBuildTree = (state: TranslationEditorState): TreeNode[] => {
	const sourceFlat = state.translations[state.sourceOfTruth];
	const keys = Object.keys(sourceFlat);
	const nodeMap = new Map<string, TreeNode>();

	for (const key of keys) {
		const parts = key.split('.');
		let currentPath = '';
		for (const part of parts) {
			const path = currentPath ? `${currentPath}.${part}` : part;
			const isLeaf = parts.length === 1;
			if (!nodeMap.has(path)) {
				nodeMap.set(path, {
					name: part,
					children: [],
					fullPath: path,
					isLeaf,
				});
			}
			currentPath = path;
		}
	}

	const rootNodes: TreeNode[] = [];
	for (const [path, node] of nodeMap) {
		if (path.includes('.')) {
			const parentPath = path.substring(0, path.lastIndexOf('.'));
			const parent = nodeMap.get(parentPath);
			if (parent && !parent.isLeaf) parent.children?.push(node);
		} else {
			rootNodes.push(node);
		}
	}

	const sortNodes = (nodes: TreeNode[]): TreeNode[] =>
		nodes
			.toSorted((a, b) => {
				if (a.isLeaf === b.isLeaf) {
					return a.name.localeCompare(b.name);
				} else {
					return a.isLeaf ? -1 : 1;
				}
			})
			.map((node) => ({
				...node,
				children: node.children ? sortNodes(node.children) : undefined,
			}));

	return sortNodes(rootNodes);
};

const computeFilteredTree = (state: TranslationEditorState): TreeNode[] => {
	const baseTree = computeBuildTree(state);
	if (!state.searchTerm) return baseTree;
	const term = state.searchTerm.toLowerCase();
	const textMatchCache = new Map<string, boolean>();

	const leafMatches = (path: string): boolean => {
		if (textMatchCache.has(path)) return textMatchCache.get(path) ?? false;
		const src = state.pendingTranslations[state.sourceOfTruth];
		const prefix = path ? `${path}.` : '';
		const checkPaths = Object.keys(src).filter(
			(k) => k === path || k.startsWith(prefix),
		);
		let match = false;
		if (state.searchMode === 'text') {
			for (const { code } of SUPPORTED_LANGUAGES) {
				const flat = state.pendingTranslations[code];
				for (const key of checkPaths) {
					const value = (flat[key] ?? '').toLowerCase();
					if (value.includes(term)) {
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
			state.searchMode === 'key'
				? keyMatch
				: keyMatch || leafMatches(node.fullPath);
		if (node.children) {
			const filteredChildren = node.children
				.map(filterNode)
				.filter((child): child is TreeNode => child !== null);
			if (filteredChildren.length > 0 || matchesSearch) {
				return { ...node, children: filteredChildren };
			}
		}
		return matchesSearch ? node : null;
	};

	return baseTree.map(filterNode).filter((n): n is TreeNode => n !== null);
};

const computeAllFolderPaths = (state: TranslationEditorState): string[] => {
	const filteredTree = computeFilteredTree(state);
	const paths: string[] = [];
	const collect = (nodes: TreeNode[]) => {
		for (const node of nodes) {
			if (!node.isLeaf) {
				paths.push(node.fullPath);
				if (node.children) collect(node.children);
			}
		}
	};
	collect(filteredTree);
	return paths;
};

const computeValidationByLanguage = (
	state: TranslationEditorState,
): ValidationSummary => {
	const sourceFlat = state.pendingTranslations[state.sourceOfTruth];
	const sourceKeys = new Set(Object.keys(sourceFlat));
	const result: ValidationSummary = {};
	for (const { code } of SUPPORTED_LANGUAGES) {
		if (code === state.sourceOfTruth) continue;
		const targetFlat = state.pendingTranslations[code];
		const targetKeys = new Set(Object.keys(targetFlat));
		const missing = [...sourceKeys].filter((key) => !targetKeys.has(key));
		const extra = [...targetKeys].filter((key) => !sourceKeys.has(key));
		result[code] = { missing, extra };
	}
	return result;
};

const computeHasChanges = (
	state: TranslationEditorState,
	language: string,
): boolean => {
	const original = state.translations[language];
	const edited = state.editedTranslations[language];
	const keys = new Set([...Object.keys(original), ...Object.keys(edited)]);
	for (const key of keys) {
		if (edited[key] !== original[key]) return true;
	}
	return false;
};

const computeHasUnsavedChanges = (state: TranslationEditorState): boolean =>
	SUPPORTED_LANGUAGES.some(({ code }) => computeHasChanges(state, code));

export const selectBuildTree = (state: TranslationEditorStore): TreeNode[] =>
	computeBuildTree(state);

export const selectFilteredTree = (state: TranslationEditorStore): TreeNode[] =>
	computeFilteredTree(state);

export const selectAllExpanded = (state: TranslationEditorStore): boolean => {
	const paths = computeAllFolderPaths(state);
	return (
		paths.length > 0 && paths.every((path) => state.expandedNodes.has(path))
	);
};

export const selectAllFolderPaths = (state: TranslationEditorStore): string[] =>
	computeAllFolderPaths(state);

export const selectValidationByLanguage = (
	state: TranslationEditorStore,
): ValidationSummary => computeValidationByLanguage(state);

export const selectHasUnsavedChanges = (
	state: TranslationEditorStore,
): boolean => computeHasUnsavedChanges(state);
