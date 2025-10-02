import { useContext } from 'react';
import { TranslationEditorContext } from './state';

export const useTranslationEditor = () => {
  const ctx = useContext(TranslationEditorContext);
  if (!ctx)
    throw new Error(
      'useTranslationEditor must be used within TranslationEditorProvider'
    );
  return ctx;
};
