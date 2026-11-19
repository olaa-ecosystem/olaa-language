#!/usr/bin/env node
/**
 * Import "Bài tập 15 chủ đề" (Markdown export) into content/topics/topics.json.
 * Usage: node scripts/import-topics.mjs <path-to-md>
 * The Markdown keeps tables as: a line " | " starts a row, then one cell per line ending in
 * " | " (the last cell without it). Column count comes from each table's header row.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/import-topics.mjs <path-to-md>');
  process.exit(1);
}
const raw = readFileSync(src, 'utf8');
const lines = raw.split(/\r?\n/);

const isRowStart = (l) => l.trim() === '|';
const cellText = (l) => l.replace(/\s*\|\s*$/, '').trim();

/** Read a table starting at index i (a row-start line). Returns rows and the next index. */
function readTable(i) {
  // Header row decides the column count.
  const header = [];
  let j = i + 1;
  while (j < lines.length && !isRowStart(lines[j])) {
    header.push(cellText(lines[j]));
    j += 1;
    if (!/\|\s*$/.test(lines[j - 1])) break;
  }
  const n = header.length;
  const rows = [];
  while (j < lines.length && isRowStart(lines[j])) {
    const row = [];
    j += 1;
    for (let c = 0; c < n && j < lines.length; c++, j++) row.push(cellText(lines[j]));
    rows.push(row);
  }
  return { header, rows, next: j };
}

const CJK = /[㐀-鿿　-〿＀-￯]/;
/** "名字 (míngzi)" or "我叫安。Wǒ jiào Ān." → { hanzi, pinyin } */
function splitChinese(text) {
  const paren = [...text.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim());
  if (paren.length)
    return { hanzi: text.replace(/\s*\([^)]*\)/g, '').trim(), pinyin: paren.join(' / ') };
  let k = 0;
  while (k < text.length && (CJK.test(text[k]) || /[\s\d，。？！、：；…“”‘’（）·/]/.test(text[k])))
    k++;
  return { hanzi: text.slice(0, k).trim(), pinyin: text.slice(k).trim() };
}

const LANG_BY_NAME = { Anh: 'en', Trung: 'zh', 'Tây Ban Nha': 'es' };
const topics = [];
let topic = null;
let section = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const h2 = line.match(/^## (\d+)\. (.+)$/);
  if (h2) {
    topic = {
      id: `t${h2[1].padStart(2, '0')}`,
      title: h2[2].trim(),
      level: null,
      hours: null,
      vocab: [],
      sentences: [],
      grammar: {},
      pronunciation: {},
      skills: [],
      hanzi: [],
      fill: [],
      translate: [],
      speaking: [],
      writing: null,
      dictation: null,
      challenge: null,
    };
    topics.push(topic);
    const metaLine = lines.slice(i + 1, i + 4).find((l) => l.trim() !== '') ?? '';
    const meta = metaLine.match(/^Cấp độ: (.+?) — Thời lượng: (.+)$/);
    if (meta) {
      const [cefr, hsk] = meta[1].split('·').map((s) => s.trim());
      topic.level = { cefr, hsk };
      topic.hours = meta[2].trim();
    }
    section = null;
    continue;
  }
  if (!topic) continue;
  const h3 = line.match(/^### (.+)$/);
  if (h3) {
    section = h3[1].trim();
    continue;
  }
  if (/^[A-F]\. /.test(line)) {
    section = line.slice(0, 1);
    const text = line.replace(/^[A-F]\.\s*/, '');
    if (section === 'D') topic.writing = text.replace(/^Đề viết\s*\([^)]*\):\s*/, '');
    if (section === 'E')
      topic.dictation = text.replace(/^Chép chính tả & shadowing\s*\([^)]*\):\s*/, '');
    if (section === 'F') topic.challenge = text.replace(/^Thử thách thực tế\s*\([^)]*\):\s*/, '');
    continue;
  }
  if (isRowStart(line)) {
    const { rows, next } = readTable(i);
    i = next - 1;
    if (section === 'Từ vựng') {
      for (const [vi, en, zh, es] of rows) topic.vocab.push({ vi, en, zh: splitChinese(zh), es });
    } else if (section === 'Mẫu câu') {
      for (const [vi, en, zh, es] of rows)
        topic.sentences.push({ vi, en, zh: splitChinese(zh), es });
    } else if (section === 'Bài tập kỹ năng') {
      for (const [skill, task, time] of rows)
        topic.skills.push({ skill, task, minutes: Number.parseInt(time, 10) || null });
    } else if (section === 'A') {
      for (const [lang, sentence, answer] of rows)
        topic.fill.push({ lang: LANG_BY_NAME[lang] ?? lang, sentence, answer });
    } else if (section === 'B') {
      for (const [vi, en, zh, es] of rows)
        topic.translate.push({ vi, en, zh: splitChinese(zh), es });
    } else if (section === 'C') {
      for (const [en, zh, es] of rows) topic.speaking.push({ en, zh, es });
    }
    continue;
  }
  const text = line.trim();
  if (!text) continue;
  if (section === 'Ngữ pháp' || section === 'Phát âm') {
    const m = text.match(/^(Anh|Trung|Tây Ban Nha): (.+)$/);
    if (m)
      topic[section === 'Ngữ pháp' ? 'grammar' : 'pronunciation'][LANG_BY_NAME[m[1]]] = m[2].trim();
  } else if (section?.startsWith('Chữ Hán')) {
    topic.hanzi.push(text);
  }
}

const out = {
  source: basename(src),
  sha256: createHash('sha256').update(raw).digest('hex'),
  importedAt: new Date().toISOString().slice(0, 10),
  topics,
};
writeFileSync('content/topics/topics.json', JSON.stringify(out, null, 1) + '\n');
console.log(`topics: ${topics.length}`);
for (const t of topics) {
  console.log(
    `${t.id} ${t.title} | ${t.level?.cefr}/${t.level?.hsk} | vocab ${t.vocab.length} sent ${t.sentences.length} fill ${t.fill.length} trans ${t.translate.length} speak ${t.speaking.length} skills ${t.skills.length} gr ${Object.keys(t.grammar).length} pr ${Object.keys(t.pronunciation).length} hz ${t.hanzi.length} W${t.writing ? 1 : 0}E${t.dictation ? 1 : 0}F${t.challenge ? 1 : 0}`,
  );
}
