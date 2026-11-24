/**
 * Learning notes (PRD 01 REQ-01-042, REQ-01-046): the learner saves a word, a grammar rule or
 * their own note while studying. Notes belong to Olaa Language and stay in this browser.
 *
 * Sending to Olaa Note goes through the command `takenote.note.create_from_source`
 * (PRD 01 §contracts; status PENDING in olaa-platform). Language never writes Note's data:
 * until the command channel exists, notes wait in an outbox and can be exported as a Markdown
 * file that Olaa Note imports.
 */
import { createLocalStore, isRecord } from '../../services/localStore';
import type { CurriculumLang } from '../levels/types';

export type NoteSourceKind = 'unit' | 'topic' | 'word' | 'grammar';

export interface LearningNote {
  id: string;
  createdAt: number;
  lang: CurriculumLang;
  /** What the note was taken from, e.g. { kind: 'unit', ref: 'en/A1/a1-1' }. */
  source: { kind: NoteSourceKind; ref: string; title: string };
  title: string;
  body: string;
  tags: string[];
  /** Waiting to be sent to Olaa Note (outbox). */
  pending: boolean;
}

const isNote = (v: unknown): v is LearningNote =>
  isRecord(v) &&
  typeof v.id === 'string' &&
  typeof v.title === 'string' &&
  typeof v.body === 'string' &&
  isRecord(v.source) &&
  Array.isArray(v.tags);

export const notesStore = createLocalStore<LearningNote[]>(
  'olaa-language/notes',
  () => [],
  (v): v is LearningNote[] => Array.isArray(v) && v.every(isNote),
);

/** Adds a note, or replaces the note with the same source and title (saving twice is a no-op). */
export function addNote(
  notes: LearningNote[],
  input: Omit<LearningNote, 'id' | 'createdAt' | 'pending'>,
  now: number,
): LearningNote[] {
  const same = notes.find((n) => n.source.ref === input.source.ref && n.title === input.title);
  if (same) {
    return notes.map((n) => (n === same ? { ...n, ...input, pending: true } : n));
  }
  const id = `${input.lang}:${now.toString(36)}:${notes.length}`;
  return [{ ...input, id, createdAt: now, pending: true }, ...notes];
}

export function removeNote(notes: LearningNote[], id: string): LearningNote[] {
  return notes.filter((n) => n.id !== id);
}

export function hasNote(notes: LearningNote[], ref: string, title: string): boolean {
  return notes.some((n) => n.source.ref === ref && n.title === title);
}

export function notesFor(notes: LearningNote[], ref: string): LearningNote[] {
  return notes.filter((n) => n.source.ref === ref);
}

export function markSent(notes: LearningNote[], ids: string[]): LearningNote[] {
  const set = new Set(ids);
  return notes.map((n) => (set.has(n.id) ? { ...n, pending: false } : n));
}

/**
 * The command body for Olaa Note, in the field names of the pending contract
 * (`user_id`, `source_app`, `source_ref`, `title`, `body`, `tags`).
 */
export function createFromSourceCommand(note: LearningNote, userId: string) {
  return {
    type: 'takenote.note.create_from_source' as const,
    user_id: userId,
    source_app: 'language' as const,
    source_ref: `${note.lang}/${note.source.kind}/${note.source.ref}`,
    title: note.title,
    body: note.body,
    tags: note.tags,
  };
}

const LANG_TAG: Record<CurriculumLang, string> = { en: 'english', es: 'spanish', zh: 'chinese' };

export function defaultTags(lang: CurriculumLang, kind: NoteSourceKind): string[] {
  return ['olaa-language', LANG_TAG[lang], kind];
}

/** Markdown for Olaa Note's import: one section per note, newest first, with tags. */
export function notesToMarkdown(notes: LearningNote[], heading: string, now: Date): string {
  const lines = [`# ${heading}`, '', `_${now.toISOString().slice(0, 10)} · Olaa Language_`, ''];
  for (const n of notes) {
    lines.push(`## ${n.title}`, '');
    if (n.source.title) lines.push(`> ${n.source.title}`, '');
    if (n.body.trim()) lines.push(n.body.trim(), '');
    if (n.tags.length) lines.push(n.tags.map((t) => `#${t.replace(/\s+/g, '-')}`).join(' '), '');
  }
  return lines.join('\n');
}

/** Save notes as a Markdown file (browser only). */
export function downloadNotes(notes: LearningNote[], heading: string): void {
  const now = new Date();
  const blob = new Blob([notesToMarkdown(notes, heading, now)], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `olaa-language-notes-${now.toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
