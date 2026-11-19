import { createRng, sample, shuffle } from '../../utils/random';
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
      topic.vocab.filter((o) => o !== w).map((o) => o.vi),
      3,
      rng,
    );
    const options = shuffle([w.vi, ...others], rng);
    return {
      ...base(`w${i}`),
      kind: 'choice',
      skill: 'vocabulary',
      instruction: 'Chọn nghĩa đúng',
      prompt: lang === 'zh' ? `${w.zh.hanzi} (${w.zh.pinyin})` : phraseIn(w, lang),
      lang,
      options,
      answerIndex: options.indexOf(w.vi),
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
      instruction: 'Điền vào chỗ trống',
      prompt: f.sentence,
      lang,
      accepted: variants(f.answer),
    }));
  const translations: Exercise[] = [...topic.sentences, ...topic.translate].map((s, i) => ({
    ...base(`t${i}`),
    kind: 'text',
    skill: 'translation',
    instruction: 'Dịch sang ngôn ngữ đang học',
    prompt: s.vi,
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
    explain: 'Nói to câu hỏi, rồi tự trả lời bằng 2–3 câu.',
  }));
  return [...words, ...fills, ...translations, ...speaking];
}
