// Dev-only helpers to interact with Vite middleware API
// Only available during `pnpm dev` runs.

export type LocaleCode = 'en' | 'zh' | 'ja' | 'cn';

export type ListResponse = {
  files: string[]; // e.g., ['en.json','zh.json']
};

export type ReadResponse = {
  name: string;
  content: unknown;
};

export type SaveBody = {
  content: unknown;
};

const base = '/api/locales';

export async function listLocaleFiles(): Promise<ListResponse> {
  const res = await fetch(base);
  if (!res.ok) throw new Error(`list failed: ${res.status}`);
  return res.json();
}

export async function readLocaleFile(name: string): Promise<ReadResponse> {
  const res = await fetch(`${base}/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`read failed: ${res.status}`);
  return res.json();
}

export async function saveLocaleFile(
  name: string,
  content: unknown
): Promise<{ status: 'ok' }> {
  const res = await fetch(`${base}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content } satisfies SaveBody),
  });
  if (!res.ok) throw new Error(`save failed: ${res.status}`);
  return res.json();
}
