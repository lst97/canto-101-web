import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Minus, Search, Key, FileText } from 'lucide-react';
import { Tree } from './Tree';
import { useTranslationEditor } from './useTranslationEditor';

export const TranslationEditorSidebar = () => {
  const {
    searchTerm,
    setSearchTerm,
    searchMode,
    setSearchMode,
    filteredTree,
    allExpanded,
    toggleExpandCollapse,
    handleAddKey,
  } = useTranslationEditor();
  const [newKeyDialog, setNewKeyDialog] = useState(false);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newKeyError, setNewKeyError] = useState('');

  const onAddKey = () => {
    const res = handleAddKey(newKeyInput);
    if (!res.ok) {
      setNewKeyError(res.error ?? 'Failed to add key');
      return;
    }
    setNewKeyInput('');
    setNewKeyError('');
    setNewKeyDialog(false);
  };

  return (
    <Sidebar>
      <div className="border-b p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 flex-shrink-0" />
          <Input
            placeholder={
              searchMode === 'key'
                ? 'Search translation keys…'
                : 'Search translation text…'
            }
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-8 flex-1"
          />
          <div className="ml-auto flex items-center gap-2">
            <Toggle
              aria-label={`Search by ${searchMode === 'key' ? 'translation text' : 'translation key'}`}
              pressed={searchMode === 'text'}
              onPressedChange={(pressed: boolean) =>
                setSearchMode(pressed ? 'text' : 'key')
              }
              variant="outline"
              size="sm"
              className="h-8 px-3 gap-1.5 font-medium"
            >
              {searchMode === 'key' ? (
                <>
                  <Key className="h-3.5 w-3.5" />
                  Key
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  Text
                </>
              )}
            </Toggle>
          </div>
        </div>
        <Dialog open={newKeyDialog} onOpenChange={setNewKeyDialog}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setNewKeyInput('');
                setNewKeyError('');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Translation Key</DialogTitle>
              <DialogDescription>
                Use dot notation for nested keys (e.g., "common.actions.save").
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-key-input">Translation Key</Label>
                <Input
                  id="new-key-input"
                  placeholder="e.g., common.welcome or feature.title"
                  value={newKeyInput}
                  onChange={e => {
                    setNewKeyInput(e.target.value);
                    setNewKeyError('');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onAddKey();
                    }
                  }}
                  className={newKeyError ? 'border-destructive' : ''}
                />
                {newKeyError && (
                  <p className="text-sm text-destructive">{newKeyError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Valid characters: letters, numbers, dots (.), hyphens (-), and
                  underscores (_)
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={onAddKey}>Add Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 py-2">
            <SidebarGroupLabel>Translation Keys</SidebarGroupLabel>
            <Toggle
              aria-label={
                allExpanded ? 'Collapse all folders' : 'Expand all folders'
              }
              title={
                allExpanded ? 'Collapse all folders' : 'Expand all folders'
              }
              pressed={allExpanded}
              onPressedChange={() => toggleExpandCollapse()}
              variant="outline"
              size="sm"
              className="h-7 px-2"
            >
              {allExpanded ? (
                <Minus className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </Toggle>
          </div>
          <ScrollArea className="h-full">
            <SidebarGroupContent>
              <Tree nodes={filteredTree} />
            </SidebarGroupContent>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default TranslationEditorSidebar;
