#!/usr/bin/env node
// Prints one regex that matches any answer option of the daily quiz in the given language, read from
// src/dailyData.ts. The daily quiz picks 5 questions per day, so a flow cannot know the option texts in advance;
// with this regex Maestro taps "the first visible answer" (tapOn text=<regex>, index 0) whatever the day.
// Usage: node quiz_regex.mjs [uz|ru|en]   (default uz)
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const lang = process.argv[2] || 'uz';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../src/dailyData.ts'), 'utf8');
const optionLists = [...src.matchAll(new RegExp(`o:\\{[^}]*?\\b${lang}:\\[([^\\]]*)\\]`, 'g'))].map((m) => m[1]);
const options = new Set();
for (const list of optionLists) for (const m of list.matchAll(/'((?:[^'\\]|\\.)*)'/g)) options.add(m[1].replace(/\\'/g, "'"));
if (options.size < 6) { console.error(`Only ${options.size} options found for ${lang}; did src/dailyData.ts change shape?`); process.exit(1); }
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest first so a short option never shadows a longer one.
process.stdout.write('(' + [...options].sort((a, b) => b.length - a.length).map(esc).join('|') + ')');
