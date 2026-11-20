import { createRng, sample, shuffle } from '../../utils/random';
import { getLocale, tr } from '../../i18n/locale';
import type { Exercise } from '../exercises';
import type { CurriculumLang } from '../levels/types';
import type { Topic, TopicPhrase } from './types';

let pending: Promise<Topic[]> | null = null;

export function loadTopics(): Promise<Topic[]> {
  pending ??= import('../../../content/topics/topics.json').then(
    (m) => (m.default as unknown as { topics: Topic[] }).topics,
  );
  return pending;
}

/**
 * The meaning shown to the learner: Vietnamese, or English when the interface is in English
 * and English is not the language being learned.
 */
export function meaningOf(p: TopicPhrase, lang: CurriculumLang): string {
  return getLocale() === 'en' && lang !== 'en' ? p.en : p.vi;
}

const SKILL_EN: Record<string, string> = {
  Nghe: 'Listening',
  Nói: 'Speaking',
  Đọc: 'Reading',
  Viết: 'Writing',
};

/** Skill name ("Nghe") in the interface language. */
export function skillName(skill: string): string {
  return getLocale() === 'en' ? (SKILL_EN[skill] ?? skill) : skill;
}

/** Study time ("~3,5 giờ mỗi ngôn ngữ") in the interface language. */
export function studyTime(hours: string): string {
  if (getLocale() !== 'en') return hours;
  return hours.replace(/(\d),(\d)/g, '$1.$2').replace('giờ mỗi ngôn ngữ', 'hours per language');
}

/** The phrase in the language being learned (Chinese: characters). */
export function phraseIn(p: TopicPhrase, lang: CurriculumLang): string {
  return lang === 'zh' ? p.zh.hanzi : p[lang];
}

/** Alternatives written "a / b" are each accepted. */
function variants(text: string): string[] {
  const parts = text.split(' / ').map((t) => t.trim());
  return [text, ...(parts.length > 1 ? parts : [])];
}

/**
 * Practice for one topic and language: meanings of the 10 words, the gap fills, translating
 * the example and translation sentences, and the speaking questions said aloud.
 */
export function topicExercises(topic: Topic, lang: CurriculumLang, seed: number): Exercise[] {
  const rng = createRng(seed);
  const base = (n: string) => ({ id: `${topic.id}:${lang}:${n}`, lessonId: topic.id });
  const words: Exercise[] = topic.vocab.map((w, i) => {
    const others = sample(
      topic.vocab.filter((o) => o !== w).map((o) => meaningOf(o, lang)),
      3,
      rng,
    );
    const options = shuffle([meaningOf(w, lang), ...others], rng);
    return {
      ...base(`w${i}`),
      kind: 'choice',
      skill: 'vocabulary',
      instruction: tr('Chọn nghĩa đúng', 'Choose the meaning'),
      prompt: lang === 'zh' ? `${w.zh.hanzi} (${w.zh.pinyin})` : phraseIn(w, lang),
      lang,
      options,
      answerIndex: options.indexOf(meaningOf(w, lang)),
      audioText: phraseIn(w, lang),
      passage: null,
    };
  });
  const fills: Exercise[] = topic.fill
    .filter((f) => f.lang === lang)
    .map((f, i) => ({
      ...base(`f${i}`),
      kind: 'text',
      skill: 'grammar',
      instruction: tr('Điền vào chỗ trống', 'Fill in the blank'),
      prompt: f.sentence,
      lang,
      accepted: variants(f.answer),
    }));
  const translations: Exercise[] = [...topic.sentences, ...topic.translate].map((s, i) => ({
    ...base(`t${i}`),
    kind: 'text',
    skill: 'translation',
    instruction: tr('Dịch sang ngôn ngữ đang học', 'Translate into the language you are learning'),
    prompt: meaningOf(s, lang),
    lang,
    // Chinese: characters or pinyin both count (not every learner has a Chinese keyboard).
    accepted:
      lang === 'zh' ? [...variants(s.zh.hanzi), ...variants(s.zh.pinyin)] : variants(s[lang]),
    explain: lang === 'zh' ? `${s.zh.hanzi} — ${s.zh.pinyin}` : null,
  }));
  const speaking: Exercise[] = topic.speaking.map((q, i) => ({
    ...base(`s${i}`),
    kind: 'say',
    skill: 'speaking',
    text: q[lang],
    lang,
    explain: tr(
      'Nói to câu hỏi, rồi tự trả lời bằng 2–3 câu.',
      'Say the question aloud, then answer it in 2–3 sentences.',
    ),
  }));
  return [...words, ...fills, ...translations, ...speaking];
}
