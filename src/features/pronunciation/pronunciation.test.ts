import { describe, expect, it } from 'vitest';
import en from '../../../content/english/pronunciation.json';
import es from '../../../content/spanish/pronunciation.json';
import zh from '../../../content/chinese/pronunciation.json';
import { gradeExercise } from '../exercises/grade';
import {
  markStress,
  pairDrill,
  parsePronunciation,
  soundDrills,
  sourceLink,
  stressDrill,
  toneDrill,
} from './pronunciation';

describe('parsePronunciation', () => {
  it('reads every row of the three files', () => {
    const e = parsePronunciation(en, 'en');
    expect(e.chart.reduce((n, g) => n + g.rows.length, 0)).toBe(32);
    expect(e.pairs).toHaveLength(30);
    expect(e.stress).toHaveLength(30);
    expect(parsePronunciation(es, 'es').stress).toHaveLength(24);
    const z = parsePronunciation(zh, 'zh');
    expect(z.tones).toHaveLength(12);
    expect(z.pairs).toHaveLength(18);
    expect(z.sources.length).toBeGreaterThan(0);
  });

  it('survives garbage', () => {
    const p = parsePronunciation({ chart: 'x', pairs: [[1]], stress: [['a', ['a'], 0]] }, 'en');
    expect(p).toMatchObject({ chart: [], pairs: [], stress: [], tones: [] });
  });
});

describe('drills', () => {
  it('a minimal pair drill has its heard word as the answer', () => {
    const d = pairDrill({ a: 'ship', b: 'sheep', contrast: 'ɪ – iː' }, 'en', 3);
    expect(d.options[d.answerIndex]).toBe(d.audioText);
    expect(gradeExercise(d, String(d.answerIndex)).correct).toBe(true);
  });

  it('a stress drill marks the stressed syllable', () => {
    const w = { word: 'banana', syllables: ['ba', 'na', 'na'], stressed: 1 };
    expect(markStress(w)).toBe('ba·NA·na');
    const d = stressDrill(w, 'en');
    expect(d.options[d.answerIndex]).toBe('ba·NA·na');
  });

  it('a tone drill reads a character and asks for its pinyin', () => {
    const d = toneDrill({ syllable: 'ma', hanzi: ['妈', '麻', '马', '骂'], pinyin: ['mā', 'má', 'mǎ', 'mà'] }, 9);
    expect(['妈', '麻', '马', '骂'].indexOf(d.audioText!)).toBe(d.answerIndex);
  });

  it.each([
    ['en', en],
    ['es', es],
    ['zh', zh],
  ] as const)('%s: a session mixes drills with unique ids and valid keys', (lang, raw) => {
    const drills = soundDrills(parsePronunciation(raw, lang), 42);
    expect(drills).toHaveLength(12);
    expect(new Set(drills.map((d) => d.id)).size).toBe(12);
    drills.forEach((d) => expect(d.options[d.answerIndex]).toBeDefined());
  });

  it('builds dictionary links', () => {
    expect(sourceLink({ name: 'x', about: ['', ''], url: 'https://d.org/{w}' }, 'Sheep')).toBe(
      'https://d.org/sheep',
    );
  });
});
