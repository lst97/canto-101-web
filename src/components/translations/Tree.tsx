import { ChevronRight, File, Folder, Trash2 } from 'lucide-react';
import type React from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
} from '@/components/ui/sidebar';
import type { TreeNode as TreeNodeType } from './types';
import { useTranslationEditor } from './useTranslationEditor';

export const Tree = ({ nodes }: { nodes: TreeNodeType[] }) => {
	return (
		<>
			{nodes.map((node, index) => (
				<TreeNode key={`${node.fullPath}-${index}`} node={node} />
			))}
		</>
	);
};

const TreeNode: React.FC<{ node: TreeNodeType; level?: number }> = ({
	node,
	level = 0,
}) => {
	const {
		expandedNodes,
		setExpandedNodes,
		selectedKey,
		setSelectedKey,
		editedTranslations,
		translations,
		handleDeleteKey,
	} = useTranslationEditor();

	const isExpanded = expandedNodes.has(node.fullPath);
	const isSelected = selectedKey === node.fullPath;

	if (node.isLeaf) {
		const changedLangs = Object.keys(editedTranslations).filter(
			(code) =>
				(editedTranslations[code]?.[node.fullPath] ?? '') !==
				(translations[code]?.[node.fullPath] ?? ''),
		);
		const isUnsaved = changedLangs.length > 0;
		return (
			<div className="flex items-center gap-1 w-full group">
				<SidebarMenuButton
					isActive={isSelected}
					onClick={() => setSelectedKey(node.fullPath)}
					id={`key-${node.fullPath}`}
					className={`flex-1 justify-start ${
						isUnsaved ? 'text-[var(--warning)]' : ''
					}`}
					title={
						isUnsaved
							? `Unsaved changes in: ${changedLangs.join(', ')}`
							: undefined
					}
				>
					<File className="h-4 w-4" />
					{isUnsaved && (
						<span
							aria-hidden="true"
							className="ml-1 mr-1 h-2 w-2 rounded-full bg-[var(--warning)]"
						/>
					)}
					<span className="truncate">{node.name}</span>
				</SidebarMenuButton>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
							title="Delete translation key"
						>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Translation Key</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to delete the key{' '}
								<code className="bg-muted px-1 rounded">{node.fullPath}</code>?
								This will remove it from all language files. This action cannot
								be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => handleDeleteKey(node.fullPath)}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		);
	}

	return (
		<SidebarMenuItem>
			<Collapsible
				open={isExpanded}
				onOpenChange={(open) => {
					const next = new Set(expandedNodes);
					if (open) next.add(node.fullPath);
					else next.delete(node.fullPath);
					setExpandedNodes(next);
				}}
			>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton className="w-full justify-start">
						<ChevronRight
							className={`h-4 w-4 transition-transform ${
								isExpanded ? 'rotate-90' : ''
							}`}
						/>
						<Folder className="h-4 w-4" />
						<span className="truncate">{node.name}</span>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{node.children?.map((child, index) => (
							<TreeNode
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
