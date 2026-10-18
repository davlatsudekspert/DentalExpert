#!/usr/bin/env node
// Prints one regex that matches any answer option of the daily quiz in the given language, read from
// src/dailyData.ts. The daily quiz picks 5 questions per day, so a flow cannot know the option texts in advance;
// with this regex Maestro taps "the first visible answer" (tapOn text=<regex>, index 0) whatever the day.
// With a topic id it reads that topic's test instead (src/curriculum/topics/<id>.json), for the classroom topic test.
// Usage: node quiz_regex.mjs [uz|ru|en] [topicId]   (default uz, daily quiz)
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const lang = process.argv[2] || 'uz';
const topic = process.argv[3];
const here = dirname(fileURLToPath(import.meta.url));
const options = new Set();
if (topic) {
  if (!/^[a-z]+-[0-9]+$/.test(topic)) { console.error(`Bad topic id ${topic}`); process.exit(1); }
  const t = JSON.parse(readFileSync(join(here, `../../src/curriculum/topics/${topic}.json`), 'utf8'));
  for (const q of t.test || []) for (const o of q.options) if (o[lang]) options.add(o[lang]);
} else {
  const src = readFileSync(join(here, '../../src/dailyData.ts'), 'utf8');
  const optionLists = [...src.matchAll(new RegExp(`o:\\{[^}]*?\\b${lang}:\\[([^\\]]*)\\]`, 'g'))].map((m) => m[1]);
  for (const list of optionLists) for (const m of list.matchAll(/'((?:[^'\\]|\\.)*)'/g)) options.add(m[1].replace(/\\'/g, "'"));
}
if (options.size < 6) { console.error(`Only ${options.size} options found for ${lang}${topic ? ' in ' + topic : ''}; did the question files change shape?`); process.exit(1); }
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest first so a short option never shadows a longer one.
process.stdout.write('(' + [...options].sort((a, b) => b.length - a.length).map(esc).join('|') + ')');
