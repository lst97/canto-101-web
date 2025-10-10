import { useMemo } from 'react';
import { useTranslationEditorStore } from '@/stores/translationEditorStore';
import { SUPPORTED_LANGUAGES } from './constants';
import type { TreeNode } from './types';

export const useTranslationEditor = () => {
	const translations = useTranslationEditorStore((state) => state.translations);
	const editedTranslations = useTranslationEditorStore(
		(state) => state.editedTranslations,
	);
	const pendingTranslations = useTranslationEditorStore(
		(state) => state.pendingTranslations,
	);
	const searchTerm = useTranslationEditorStore((state) => state.searchTerm);
	const setSearchTerm = useTranslationEditorStore(
		(state) => state.setSearchTerm,
	);
	const searchMode = useTranslationEditorStore((state) => state.searchMode);
	const setSearchMode = useTranslationEditorStore(
		(state) => state.setSearchMode,
	);
	const selectedKey = useTranslationEditorStore((state) => state.selectedKey);
	const setSelectedKey = useTranslationEditorStore(
		(state) => state.setSelectedKey,
	);
	const expandedNodes = useTranslationEditorStore(
		(state) => state.expandedNodes,
	);
	const setExpandedNodes = useTranslationEditorStore(
		(state) => state.setExpandedNodes,
	);
	const toggleExpandCollapse = useTranslationEditorStore(
		(state) => state.toggleExpandCollapse,
	);
	const sourceOfTruth = useTranslationEditorStore(
		(state) => state.sourceOfTruth,
	);
	const setSourceOfTruth = useTranslationEditorStore(
		(state) => state.setSourceOfTruth,
	);
	const isSaving = useTranslationEditorStore((state) => state.isSaving);
	const commitEditedKey = useTranslationEditorStore(
		(state) => state.commitEditedKey,
	);
	const handleTranslationChange = useTranslationEditorStore(
		(state) => state.handleTranslationChange,
	);
	const resetLanguage = useTranslationEditorStore(
		(state) => state.resetLanguage,
	);
	const hasChanges = useTranslationEditorStore((state) => state.hasChanges);
	const handleAddKey = useTranslationEditorStore((state) => state.handleAddKey);
	const handleDeleteKey = useTranslationEditorStore(
		(state) => state.handleDeleteKey,
	);
	const handleAddMissingKey = useTranslationEditorStore(
		(state) => state.handleAddMissingKey,
	);
	const handleDeleteExtraKey = useTranslationEditorStore(
		(state) => state.handleDeleteExtraKey,
	);
	const saveLanguage = useTranslationEditorStore((state) => state.saveLanguage);
	const reloadLanguage = useTranslationEditorStore(
		(state) => state.reloadLanguage,
	);
	const saveAllLanguages = useTranslationEditorStore(
		(state) => state.saveAllLanguages,
	);
	const reloadAllLanguages = useTranslationEditorStore(
		(state) => state.reloadAllLanguages,
	);

	const buildTree = useMemo<TreeNode[]>(() => {
		const sourceFlat = translations[sourceOfTruth] ?? {};
		const keys = Object.keys(sourceFlat);
		const nodeMap = new Map<string, TreeNode>();

		for (const key of keys) {
			const parts = key.split('.');
			let currentPath = '';
			for (const [index, part] of parts.entries()) {
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
			}
		}

		const rootNodes: TreeNode[] = [];
		for (const [path, node] of nodeMap.entries()) {
			if (path.includes('.')) {
				const parentPath = path.substring(0, path.lastIndexOf('.'));
				const parent = nodeMap.get(parentPath);
				if (parent && !parent.isLeaf) parent.children?.push(node);
			} else {
				rootNodes.push(node);
			}
		}

		const compareNodes = (a: TreeNode, b: TreeNode): number => {
			if (a.isLeaf === b.isLeaf) {
				return a.name.localeCompare(b.name);
			} else {
				return a.isLeaf ? 1 : -1;
			}
		};

		const sortNodes = (nodes: TreeNode[]): TreeNode[] =>
			nodes.toSorted(compareNodes).map((node) => ({
				...node,
				children: node.children ? sortNodes(node.children) : undefined,
			}));

		return sortNodes(rootNodes);
	}, [translations, sourceOfTruth]);

	const filteredTree = useMemo<TreeNode[]>(() => {
		if (!searchTerm) return buildTree;
		const term = searchTerm.toLowerCase();
		const textMatchCache = new Map<string, boolean>();

		const leafMatches = (path: string): boolean => {
			if (textMatchCache.has(path)) return textMatchCache.get(path) ?? false;
			const src = pendingTranslations[sourceOfTruth] ?? {};
			const prefix = path ? `${path}.` : '';
			const checkPaths = Object.keys(src).filter(
				(k) => k === path || k.startsWith(prefix),
			);
			let match = false;
			if (searchMode === 'text') {
				for (const { code } of SUPPORTED_LANGUAGES) {
					const flat = pendingTranslations[code] ?? {};
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
				searchMode === 'key'
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

		return buildTree.map(filterNode).filter((n): n is TreeNode => n !== null);
	}, [buildTree, searchTerm, searchMode, pendingTranslations, sourceOfTruth]);

	const allFolderPaths = useMemo<string[]>(() => {
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
	}, [filteredTree]);

	const allExpanded = useMemo(
		() =>
			allFolderPaths.length > 0 &&
			allFolderPaths.every((path) => expandedNodes.has(path)),
		[allFolderPaths, expandedNodes],
	);

	const validationByLanguage = useMemo(() => {
		const sourceFlat = pendingTranslations[sourceOfTruth] ?? {};
		const sourceKeys = new Set(Object.keys(sourceFlat));
		const result: Record<string, { missing: string[]; extra: string[] }> = {};
		for (const { code } of SUPPORTED_LANGUAGES) {
			if (code === sourceOfTruth) continue;
			const currentFlat = pendingTranslations[code] ?? {};
			const currentKeys = new Set(Object.keys(currentFlat));
			const missing = [...sourceKeys].filter((key) => !currentKeys.has(key));
			const extra = [...currentKeys].filter((key) => !sourceKeys.has(key));
			result[code] = { missing, extra };
		}
		return result;
	}, [pendingTranslations, sourceOfTruth]);

	const hasUnsavedChanges = useMemo(() => {
		return SUPPORTED_LANGUAGES.some(({ code }) => {
			const original = translations[code] ?? {};
			const edited = editedTranslations[code] ?? {};
			const keys = new Set([...Object.keys(original), ...Object.keys(edited)]);
			for (const key of keys) {
				if (edited[key] !== original[key]) return true;
			}
			return false;
		});
	}, [translations, editedTranslations]);

	return {
		translations,
		editedTranslations,
		pendingTranslations,
		searchTerm,
		setSearchTerm,
		searchMode,
		setSearchMode,
		selectedKey,
		setSelectedKey,
		expandedNodes,
		setExpandedNodes,
		toggleExpandCollapse,
		sourceOfTruth,
		setSourceOfTruth,
		isSaving,
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
		buildTree,
		filteredTree,
		allFolderPaths,
		allExpanded,
		validationByLanguage,
		hasUnsavedChanges,
	};
};
