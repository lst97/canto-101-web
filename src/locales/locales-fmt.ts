#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Strict JSON types
type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
interface JSONObject {
  [key: string]: JSONValue;
}
type JSONArray = JSONValue[];

/**
 * Parse command-line arguments
 */
function parseArgs(): {
  dryRun: boolean;
  fixOnly: boolean;
  noCleanup: boolean;
  help: boolean;
  source: string;
} {
  const args = process.argv.slice(2);
  const flags = {
    dryRun: false,
    fixOnly: false,
    noCleanup: false,
    help: false,
    source: 'zh.json',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--dry-run':
        flags.dryRun = true;
        break;
      case '--fix-only':
        flags.fixOnly = true;
        break;
      case '--no-cleanup':
        flags.noCleanup = true;
        break;
      case '--source':
        if (i + 1 < args.length) {
          flags.source = args[i + 1];
          i++; // Skip next arg
        } else {
          console.error('--source requires a filename argument');
          process.exit(1);
        }
        break;
      case '--help':
      case '-h':
        flags.help = true;
        break;
      default:
        console.error(`Unknown flag: ${arg}`);
        console.error('Use --help for usage information.');
        process.exit(1);
    }
  }

  return flags;
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
Usage: npx tsx validate-locales.ts [options]

Options:
  --dry-run           Don't write any files, just report what would be done
  --fix-only          Only attempt to fix JSON syntax issues, skip structure normalization
  --no-cleanup        Don't remove backup files after successful validation
  --source <file>     Specify the source of truth file (default: zh.json)
  --help, -h          Show this help message

Examples:
  npx tsx validate-locales.ts                          # Full validation with zh.json as source
  npx tsx validate-locales.ts --source en.json         # Use en.json as source of truth
  npx tsx validate-locales.ts --dry-run                # Check without making changes
  npx tsx validate-locales.ts --fix-only               # Only fix JSON syntax, no normalization
  npx tsx validate-locales.ts --no-cleanup             # Keep backups after success
`);
}

/**
 * Recursively collects all keys from a nested object using dot notation
 * @param obj - The object to flatten
 * @param prefix - Current prefix for nested keys
 * @returns Set of all keys
 */
function collectKeys(obj: JSONObject, prefix = ''): Set<string> {
  const keys = new Set<string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedKeys = collectKeys(value, fullKey);
      for (const k of nestedKeys) {
        keys.add(k);
      }
    }
  }

  return keys;
}

/**
 * Compares the structure of two objects and reports differences
 * @param reference - Reference object (source of truth)
 * @param target - Target object to compare
 * @param targetName - Name of the target file
 * @param sourceName - Name of the source file
 */
function compareStructures(
  reference: JSONObject,
  target: JSONObject,
  targetName: string,
  sourceName: string
): void {
  const referenceKeys = collectKeys(reference);
  const targetKeys = collectKeys(target);

  const missingInTarget = new Set(
    [...referenceKeys].filter(key => !targetKeys.has(key))
  );
  const extraInTarget = new Set(
    [...targetKeys].filter(key => !referenceKeys.has(key))
  );

  console.log(`\n=== Comparing ${targetName} with ${sourceName} ===`);

  if (missingInTarget.size === 0 && extraInTarget.size === 0) {
    console.log('✅ Structures match perfectly!');
    return;
  }

  if (missingInTarget.size > 0) {
    console.log('\n❌ Missing keys in target:');
    for (const key of missingInTarget) {
      console.log(`  - ${key}`);
    }
  }

  if (extraInTarget.size > 0) {
    console.log('\n⚠️  Extra keys in target:');
    for (const key of extraInTarget) {
      console.log(`  + ${key}`);
    }
  }
}

/**
 * Try to auto-fix common JSON issues: trailing commas, missing commas between properties,
 * and unbalanced braces/brackets. Returns parsed object if success; otherwise undefined.
 */
function tryAutoFixJson(content: string): {
  fixed: string;
  parsed?: Record<string, unknown>;
  steps: string[];
} {
  let fixed = content;
  const steps: string[] = [];

  // Strip BOM if present
  if (fixed.codePointAt(0) === 0xfeff) {
    fixed = fixed.slice(1);
    steps.push('Removed BOM');
  }

  // Helper: attempt parse safely
  const tryParse = (src: string): Record<string, unknown> | undefined => {
    try {
      return JSON.parse(src);
    } catch {
      return undefined;
    }
  };

  // Early parse (may already be valid)
  const initialParsed = tryParse(fixed);
  if (initialParsed) {
    return { fixed, parsed: initialParsed, steps };
  }

  // Remove trailing commas before } or ]
  const trailingCommaRegex = /,\s*([}\]])/g;
  if (trailingCommaRegex.test(fixed)) {
    fixed = fixed.replaceAll(trailingCommaRegex, '$1');
    steps.push('Removed trailing commas before } or ]');
  }

  let parsed = tryParse(fixed);
  if (parsed) {
    return { fixed, parsed, steps };
  }

  // Insert missing commas between object properties when a value is followed by a new key on next line
  // Matches: (value)(newline + indent)"key":  -> ensures colon exists to avoid arrays of strings
  const missingCommaBetweenProps =
    /(\}|\]|"[^"\\]*(?:\\.[^"\\])*"|-?\d+(?:\.\d+)?|true|false|null)\s*\n(\s*)(?="[^"\n]+"\s*:)/g;
  let prevFixed: string;
  let insertedCommaCount = 0;
  do {
    prevFixed = fixed;
    fixed = fixed.replaceAll(missingCommaBetweenProps, (_m, v, indent) => {
      insertedCommaCount++;
      return `${v},\n${indent}`;
    });
  } while (fixed !== prevFixed && insertedCommaCount < 1000);
  if (insertedCommaCount > 0) {
    steps.push(
      `Inserted ${insertedCommaCount} missing comma(s) between properties`
    );
  }

  parsed = tryParse(fixed);
  if (parsed) {
    return { fixed, parsed, steps };
  }

  // Balance braces/brackets by appending/removing at the end when counts mismatch
  const count = (s: string, re: RegExp) => {
    re.lastIndex = 0; // Reset for safety
    let count = 0;
    while (re.exec(s) !== null) {
      count++;
    }
    return count;
  };
  const openCurly = count(fixed, /\{/g);
  const closeCurly = count(fixed, /\}/g);
  const openSquare = count(fixed, /\[/g);
  const closeSquare = count(fixed, /\]/g);

  if (openCurly > closeCurly) {
    const diff = openCurly - closeCurly;
    fixed = fixed + '\n' + '}'.repeat(diff) + '\n';
    steps.push(`Appended ${diff} missing }`);
  } else if (closeCurly > openCurly) {
    const diff = closeCurly - openCurly;
    let removed = 0;
    for (let i = 0; i < diff; i++) {
      const next = fixed.replaceAll(/\}\s*$/m, '');
      if (next !== fixed) {
        fixed = next;
        removed++;
      }
    }
    if (removed > 0) steps.push(`Removed ${removed} trailing }`);
  }

  if (openSquare > closeSquare) {
    const diff = openSquare - closeSquare;
    fixed = fixed + '\n' + ']'.repeat(diff) + '\n';
    steps.push(`Appended ${diff} missing ]`);
  } else if (closeSquare > openSquare) {
    const diff = closeSquare - openSquare;
    let removed = 0;
    for (let i = 0; i < diff; i++) {
      const next = fixed.replaceAll(/\]\s*$/m, '');
      if (next !== fixed) {
        fixed = next;
        removed++;
      }
    }
    if (removed > 0) steps.push(`Removed ${removed} trailing ]`);
  }

  parsed = tryParse(fixed);
  if (parsed) {
    return { fixed, parsed, steps };
  }

  // Heuristic: wrap with top-level braces if content looks like a top-level object without {}
  const trimmed = fixed.trim();
  if (
    !trimmed.startsWith('{') &&
    !trimmed.endsWith('}') &&
    /"[^"\n]+"\s*:/.test(trimmed)
  ) {
    fixed = '{\n' + fixed + '\n}\n';
    steps.push('Wrapped content with top-level {}');
  }

  parsed = tryParse(fixed);
  return { fixed, parsed, steps };
}

function ensureValidLocaleFileName(
  name: string,
  allowedFiles: Set<string>
): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Source locale filename is required.');
  }

  if (trimmed !== path.basename(trimmed)) {
    throw new Error('Source locale filename must not contain directories.');
  }

  if (!/^[\w.-]+$/.test(trimmed)) {
    throw new Error('Source locale filename contains invalid characters.');
  }

  if (!trimmed.endsWith('.json')) {
    throw new Error('Source locale filename must end with .json.');
  }

  if (!allowedFiles.has(trimmed)) {
    throw new Error(`Source locale file ${trimmed} is not available.`);
  }

  return trimmed;
}

function backupFile(filePath: string, dryRun: boolean): string {
  if (dryRun) {
    const base = path.basename(filePath);
    const stamp = new Date()
      .toISOString()
      .replaceAll(/[-:]/g, '')
      .replaceAll('T', '-')
      .replaceAll(/\..+$/, '');
    return path.join(path.dirname(filePath), `${base}.bak-${stamp}`); // Return path but don't create
  }
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const stamp = new Date()
    .toISOString()
    .replaceAll(/[-:]/g, '')
    .replaceAll('T', '-')
    .replaceAll(/\..+$/, '');
  const backupPath = path.join(dir, `${base}.bak-${stamp}`);
  fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'), 'utf8');
  return backupPath;
}

function deepGet(obj: JSONValue, pathStr: string): JSONValue | undefined {
  const parts = pathStr.split('.');
  let acc: JSONValue | undefined = obj;
  for (const key of parts) {
    if (
      acc !== undefined &&
      acc !== null &&
      typeof acc === 'object' &&
      !Array.isArray(acc)
    ) {
      acc = acc[key];
    } else {
      return undefined;
    }
  }
  return acc;
}

function deepDelete(obj: JSONValue, pathStr: string): void {
  const parts = pathStr.split('.');
  const last = parts.pop();
  if (!last) return;
  let parent: JSONValue | undefined = obj;
  for (const key of parts) {
    if (
      parent !== undefined &&
      parent !== null &&
      typeof parent === 'object' &&
      !Array.isArray(parent)
    ) {
      parent = parent[key];
    } else {
      parent = undefined;
      break;
    }
  }
  if (
    parent &&
    typeof parent === 'object' &&
    !Array.isArray(parent) &&
    Object.prototype.hasOwnProperty.call(parent, last)
  ) {
    delete parent[last];
  }
}

function deepMerge<T extends JSONValue>(target: T, source: T): T {
  if (target === source) return target;
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return target;

  if (Array.isArray(target) && Array.isArray(source)) {
    // Merge arrays by concatenation; caller decides semantics
    return [...target, ...source] as T;
  }

  const out: JSONObject = { ...(target as JSONObject) };
  for (const key of Object.keys(source as JSONObject)) {
    if (key in out) {
      out[key] = deepMerge(
        out[key] as JSONValue,
        (source as JSONObject)[key] as JSONValue
      );
    } else {
      out[key] = (source as JSONObject)[key] as JSONValue;
    }
  }
  return out as T;
}

function normalizeStructure(
  file: string,
  data: JSONObject,
  filePath: string,
  dryRun: boolean,
  fixOnly: boolean
): boolean {
  if (fixOnly) return false; // Skip normalization if fix-only mode
  let changed = false;
  // Hoist homepage.pron.cantoLyr -> cantoLyr if missing
  if (!data.cantoLyr) {
    const misplaced = deepGet(data, 'homepage.pron.cantoLyr');
    if (misplaced && typeof misplaced === 'object') {
      const backupPath = backupFile(filePath, dryRun);
      data.cantoLyr = misplaced;
      deepDelete(data, 'homepage.pron.cantoLyr');
      // Clean up empties when safe
      const homepage = data.homepage;
      if (
        homepage &&
        typeof homepage === 'object' &&
        !Array.isArray(homepage)
      ) {
        const pron = homepage.pron;
        if (
          pron &&
          typeof pron === 'object' &&
          !Array.isArray(pron) &&
          Object.keys(pron).length === 0
        ) {
          delete homepage.pron;
        }
        if (Object.keys(homepage).length === 0) {
          delete data.homepage;
        }
      }
      if (!dryRun) {
        fs.writeFileSync(
          filePath,
          JSON.stringify(data, null, 2) + '\n',
          'utf8'
        );
      }
      console.log(
        `${
          dryRun ? '[DRY-RUN] ' : ''
        }🧭 Normalized structure in ${file}: hoisted homepage.pron.cantoLyr to top-level cantoLyr. Backup: ${backupPath}`
      );
      changed = true;
    }
  }
  // Hoist or merge homepage.cantoLyr -> cantoLyr
  const homepageCanto = deepGet(data, 'homepage.cantoLyr');
  if (homepageCanto && typeof homepageCanto === 'object') {
    const backupPath = backupFile(filePath, dryRun);
    if (data.cantoLyr && typeof data.cantoLyr === 'object') {
      data.cantoLyr = deepMerge(data.cantoLyr, homepageCanto);
    } else {
      data.cantoLyr = homepageCanto;
    }
    deepDelete(data, 'homepage.cantoLyr');
    const homepage = data.homepage;
    if (
      homepage &&
      typeof homepage === 'object' &&
      !Array.isArray(homepage) &&
      Object.keys(homepage).length === 0
    ) {
      delete data.homepage;
    }
    if (!dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    }
    console.log(
      `${
        dryRun ? '[DRY-RUN] ' : ''
      }🧭 Normalized structure in ${file}: moved homepage.cantoLyr to top-level cantoLyr. Backup: ${backupPath}`
    );
    changed = true;
  }
  return changed;
}

/**
 * Main validation function
 */
function validateLocales(flags: {
  dryRun: boolean;
  fixOnly: boolean;
  noCleanup: boolean;
  source: string;
}): void {
  const localesDir = __dirname;
  const localesDirWithSep = localesDir.endsWith(path.sep)
    ? localesDir
    : `${localesDir}${path.sep}`;

  const availableJsonFiles = fs
    .readdirSync(localesDir)
    .filter((file: string) => file.endsWith('.json'));
  const allowedFiles = new Set(availableJsonFiles);

  let sourceFile: string;
  try {
    sourceFile = ensureValidLocaleFileName(flags.source, allowedFiles);
  } catch (validationErr) {
    console.error(`❌ ${(validationErr as Error).message}`);
    process.exit(1);
  }

  const referencePath = path.resolve(localesDir, sourceFile);
  if (!referencePath.startsWith(localesDirWithSep)) {
    console.error(
      '❌ Resolved source locale file is outside the locales directory.'
    );
    process.exit(1);
  }

  console.log(
    `🔍 Validating locale files against ${sourceFile} structure...\n`
  );

  try {
    // Read reference file (source of truth)
    const referenceContent = fs.readFileSync(referencePath, 'utf8');
    const reference = JSON.parse(referenceContent);

    console.log(
      `📋 Using ${sourceFile} as the source of truth for structure validation.\n`
    );

    // Get all JSON files in locales directory, excluding the source file
    const files = availableJsonFiles.filter(
      (file: string) => file !== sourceFile
    );

    if (files.length === 0) {
      console.log(
        'No other JSON files found in locales directory to validate.'
      );
      return;
    }

    let hasDifferences = false;

    for (const file of files) {
      const filePath = path.join(localesDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        // Normalize common structural mistakes
        normalizeStructure(file, data, filePath, flags.dryRun, flags.fixOnly);
        compareStructures(reference, data, file, flags.source);

        const referenceKeys = collectKeys(reference);
        const targetKeys = collectKeys(data);
        const missing = [...referenceKeys].filter(key => !targetKeys.has(key));
        const extra = [...targetKeys].filter(key => !referenceKeys.has(key));

        if (missing.length > 0 || extra.length > 0) {
          hasDifferences = true;
        }
      } catch (error) {
        console.error(
          `❌ Error reading/parsing ${file}: ${(error as Error).message}`
        );
        // Attempt auto-fix on parse errors
        try {
          const original = fs.readFileSync(filePath, 'utf8');
          const result = tryAutoFixJson(original);
          if (result.parsed) {
            const backupPath = backupFile(filePath, flags.dryRun);
            // Write prettified fixed JSON
            if (!flags.dryRun) {
              fs.writeFileSync(
                filePath,
                JSON.stringify(result.parsed, null, 2) + '\n',
                'utf8'
              );
            }
            console.log(
              `${
                flags.dryRun ? '[DRY-RUN] ' : ''
              }🛠️  Auto-fixed ${file}. Backup created at: ${backupPath}`
            );
            if (result.steps.length) {
              console.log('   Steps:');
              for (const s of result.steps) console.log(`   - ${s}`);
            }
            // Re-run comparison on the repaired content
            const data = result.parsed as JSONObject;
            // Normalize after auto-fix as well
            normalizeStructure(
              file,
              data,
              filePath,
              flags.dryRun,
              flags.fixOnly
            );
            compareStructures(reference, data, file, flags.source);

            const referenceKeys = collectKeys(reference);
            const targetKeys = collectKeys(data);
            const missing = [...referenceKeys].filter(
              key => !targetKeys.has(key)
            );
            const extra = [...targetKeys].filter(
              key => !referenceKeys.has(key)
            );
            if (missing.length > 0 || extra.length > 0) {
              hasDifferences = true;
            }
          } else {
            console.error(`   ⚠️  Auto-fix attempt failed for ${file}.`);
            hasDifferences = true;
          }
        } catch (fixErr) {
          console.error(
            `   ⚠️  Auto-fix encountered an error for ${file}: ${
              (fixErr as Error).message
            }`
          );
          hasDifferences = true;
        }
      }
    }

    if (hasDifferences) {
      console.log('\n❌ Validation completed with differences found.');
      process.exit(1);
    } else {
      console.log('\n✅ All locale files have matching structures!');
      // Clean up backup files after successful validation
      if (!flags.noCleanup) {
        try {
          const backupFiles = fs
            .readdirSync(localesDir)
            .filter(file => file.match(/\.bak-\d{8}-\d{6}$/));
          for (const backup of backupFiles) {
            if (!flags.dryRun) {
              fs.unlinkSync(path.join(localesDir, backup));
            }
            console.log(
              `${flags.dryRun ? '[DRY-RUN] ' : ''}🗑️  Removed backup: ${backup}`
            );
          }
        } catch (cleanupErr) {
          console.warn(
            `⚠️  Failed to clean up backups: ${(cleanupErr as Error).message}`
          );
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const flags = parseArgs();
  if (flags.help) {
    showHelp();
    process.exit(0);
  }
  validateLocales(flags);
}

export { collectKeys, compareStructures, validateLocales };
