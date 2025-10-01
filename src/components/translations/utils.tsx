import type { TranslationData, FlattenedTranslations } from './types';

export const flattenObject = (
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

export const unflattenObject = (
  flat: FlattenedTranslations
): Record<string, unknown> => {
  const nested: Record<string, unknown> = {};
  Object.entries(flat).forEach(([k, v]) => {
    const parts = k.split('.');
    let curr: Record<string, unknown> = nested;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]] as Record<string, unknown>;
    }
    curr[parts[parts.length - 1]] = v;
  });
  return nested;
};

export const isValidTranslationKey = (key: string): boolean => {
  if (
    !key ||
    key.startsWith('.') ||
    key.endsWith('.') ||
    key.includes('..') ||
    key.includes('/') ||
    key.includes('\\')
  ) {
    return false;
  }
  return /^[a-zA-Z0-9._-]+$/.test(key);
};

export const isValidLocaleCode = (
  code: string,
  allowed: string[]
): code is string => {
  return allowed.includes(code);
};

export const getAncestorPaths = (path: string): string[] => {
  const parts = path.split('.');
  const ancestors: string[] = [];
  for (let i = 1; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i).join('.'));
  }
  return ancestors;
};
