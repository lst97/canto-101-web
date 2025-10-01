export type TranslationData = Record<string, unknown>;
export type FlattenedTranslations = Record<string, string>;

export type TreeNode = {
  name: string;
  children?: TreeNode[];
  fullPath: string;
  isLeaf: boolean;
};

export type SupportedLanguage = {
  code: string;
  name: string;
};
