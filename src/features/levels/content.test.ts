/**
 * Content checks (Ecosystem PRD v1.0 §6.1 "Content quality: schema validation, answer-key
 * validation … automated curriculum checks"). Reads the JSON files from disk.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeLevels, normalizeUnit, rawItemCount } from './normalize';
import { CURRICULUM_DIRS, type CurriculumLang } from './types';

const ROOT = join(__dirname, '../../../content');
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as unknown;
const manifest = read('manifest.json') as {
  languages: Record<
    CurriculumLang,
    {
      levels: Record<string, number>;
      units: number;
      exercises: number;
      vocabulary: number;
      passages: number;
    }
  >;
};

describe.each(['en', 'es', 'zh'] as const)('content %s', (lang) => {
  const dir = CURRICULUM_DIRS[lang];
  const meta = read(`${dir}/meta.json`) as { levels: unknown };
  const levels = normalizeLevels(meta.levels);
  const expected = manifest.languages[lang];

  it('has every level from the manifest', () => {
    expect(
      Object.fromEntries(
        levels.map((l) => [l.code, (read(`${dir}/levels/${l.code}.json`) as unknown[]).length]),
      ),
    ).toEqual(expected.levels);
  });

  it('reads every unit and every question without dropping any', () => {
    let units = 0;
    let questions = 0;
    let vocab = 0;
    let passages = 0;
    const dropped: string[] = [];
    for (const level of levels) {
      for (const raw of read(`${dir}/levels/${level.code}.json`) as unknown[]) {
        const unit = normalizeUnit(raw, level.code, lang);
        expect(unit, `unit in ${level.code}`).not.toBeNull();
        units += 1;
        vocab += unit!.vocab.length;
        passages += unit!.passage ? 1 : 0;
        const got = unit!.items.length + unit!.challenge.length;
        questions += got;
        if (got !== rawItemCount(raw)) dropped.push(`${unit!.id}: ${rawItemCount(raw) - got}`);
      }
    }
    expect(dropped).toEqual([]);
    expect({ units, questions, vocab, passages }).toEqual({
      units: expected.units,
      questions: expected.exercises,
      vocab: expected.vocabulary,
      passages: expected.passages,
    });
  });

  it('has valid answer keys', () => {
    for (const level of levels) {
      for (const raw of read(`${dir}/levels/${level.code}.json`) as unknown[]) {
        const unit = normalizeUnit(raw, level.code, lang)!;
        for (const item of [...unit.items, ...unit.challenge]) {
          if (item.kind === 'choice')
            expect(item.options[item.answer], `${unit.id} ${item.prompt}`).toBeTruthy();
          if (item.kind === 'text')
            expect(
              item.accepted.every((a) => a.trim().length > 0),
              `${unit.id} ${item.prompt}`,
            ).toBe(true);
          if (item.kind === 'order')
            expect(item.parts.join('').trim().length, unit.id).toBeGreaterThan(0);
        }
      }
    }
  });
});
