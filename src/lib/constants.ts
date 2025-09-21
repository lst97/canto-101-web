// Shared application constants
// Entry types align with backend Zod schema (`lexicon.ts`); keep in sync with validation contract.
export const ENTRY_TYPES = [
  "all", // sentinel handled client-side (omitted in requests)
  "vocab",
  "char",
] as const;

export type EntryTypeValue = typeof ENTRY_TYPES[number];
