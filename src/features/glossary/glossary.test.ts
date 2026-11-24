import { describe, expect, it } from 'vitest';
import enRaw from '../../../content/english/glossary.json';
import esRaw from '../../../content/spanish/glossary.json';
import zhRaw from '../../../content/chinese/glossary.json';
import manifest from '../../../content/manifest.json';
import {
  buildGlossary,
  glossCardId,
  lookup,
  searchGlossary,
  tokenizeForGloss,
  type RawGlossary,
} from './glossary';

const sample: RawGlossary = {
  'a1-1': {
    hi: ['/haɪ/', 'chào', 'hello'],
    'nice to meet you': ['/naɪs/', 'rất vui được gặp bạn', 'polite phrase'],
    nice: ['/naɪs/', 'tốt, dễ chịu', 'pleasant'],
    "I'm": ['/aɪm/', 'tôi là', 'I am'],
    broken: ['x'],
  },
  'a1-2': { hi: ['/haɪ/', 'xin chào (thân mật)', 'hi'] },
};

describe('buildGlossary', () => {
  it('indexes valid rows and skips malformed ones', () => {
    const g = buildGlossary(sample, 'en');
    expect(g.entries).toHaveLength(5);
    expect(g.maxSpan).toBe(4);
  });

  it('prefers the meaning from the unit being studied', () => {
    const g = buildGlossary(sample, 'en');
    expect(lookup(g, 'Hi', 'a1-2')?.vi).toBe('xin chào (thân mật)');
    expect(lookup(g, 'hi')?.vi).toBe('chào');
    expect(lookup(g, 'im')?.word).toBe("I'm");
    expect(lookup(g, 'nope')).toBeNull();
  });
});

describe('tokenizeForGloss', () => {
  it('matches the longest phrase and keeps the text intact', () => {
    const g = buildGlossary(sample, 'en');
    const text = 'Hi! Nice to meet you, nice day.';
    const tokens = tokenizeForGloss(g, text);
    expect(tokens.map((t) => t.text).join('')).toBe(text);
    const tapped = tokens.filter((t) => t.entry).map((t) => t.text);
    expect(tapped).toEqual(['Hi', 'Nice to meet you', 'nice']);
  });

  it('segments Chinese by longest match', () => {
    const g = buildGlossary(
      {
        'h1-1': {
          我: ['wǒ', 'tôi', 'I'],
          学习: ['xué xí', 'học', 'study'],
          学: ['xué', 'học', 'learn'],
          汉语: ['hàn yǔ', 'tiếng Trung', 'Chinese'],
        },
      },
      'zh',
    );
    const tokens = tokenizeForGloss(g, '我学习汉语。');
    expect(tokens.map((t) => t.text)).toEqual(['我', '学习', '汉语', '。']);
    expect(tokens[3]?.entry).toBeNull();
  });
});

describe('searchGlossary', () => {
  it('finds by word, by sound without tone marks and by meaning', () => {
    const zh = buildGlossary(zhRaw as RawGlossary, 'zh');
    expect(searchGlossary(zh, '学习')[0]?.word).toBe('学习');
    expect(searchGlossary(zh, 'xuexi').some((e) => e.word === '学习')).toBe(true);
    const en = buildGlossary(enRaw as RawGlossary, 'en');
    expect(searchGlossary(en, 'giáo viên').some((e) => e.word === 'teacher')).toBe(true);
    expect(searchGlossary(en, 'giao vien').some((e) => e.word === 'teacher')).toBe(true);
    expect(searchGlossary(en, '   ')).toEqual([]);
  });

  it('returns one result per word', () => {
    const g = buildGlossary(sample, 'en');
    expect(searchGlossary(g, 'hi').filter((e) => e.word === 'hi')).toHaveLength(1);
  });
});

describe('imported glossary files', () => {
  it.each([
    ['en', enRaw],
    ['es', esRaw],
    ['zh', zhRaw],
  ] as const)('%s: every entry from the export is readable', (lang, raw) => {
    const g = buildGlossary(raw as RawGlossary, lang);
    expect(g.entries.length).toBe(manifest.languages[lang].glossaryEntries);
  });

  it('gives stable card ids', () => {
    const g = buildGlossary(sample, 'en');
    expect(glossCardId(lookup(g, 'hi')!)).toBe('gloss:a1-1:hi');
  });
});
