import { type ReactNode, useEffect, useEffectEvent } from 'react';
import {
  selectHasUnsavedChanges,
  useTranslationEditorStore,
} from '@/stores/translationEditorStore';

const LEAVE_WARNING =
  'You have unsaved changes. Are you sure you want to leave?';

type TranslationEditorProviderProps = {
  children: ReactNode;
};

export const TranslationEditorProvider = ({
  children,
}: TranslationEditorProviderProps) => {
  const hydrateFromStorage = useTranslationEditorStore(
    state => state.hydrateFromStorage
  );
  const hasUnsavedChanges = useTranslationEditorStore(selectHasUnsavedChanges);
  const isSaving = useTranslationEditorStore(state => state.isSaving);

  const requestNavigationConfirmation = useEffectEvent(() => {
    return window.confirm(LEAVE_WARNING);
  });

  const beforeUnloadHandler = useEffectEvent((event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = LEAVE_WARNING;
    return event.returnValue;
  });

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!hasUnsavedChanges || isSaving) return undefined;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('//') || href === '#') return;
      if (!href.startsWith('/')) return;
      event.preventDefault();
      const shouldLeave = requestNavigationConfirmation();
      if (shouldLeave) {
        window.location.href = href;
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [hasUnsavedChanges, isSaving]);

  useEffect(() => {
    if (!hasUnsavedChanges || isSaving) return undefined;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      beforeUnloadHandler(event);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSaving]);

  return <>{children}</>;
};
