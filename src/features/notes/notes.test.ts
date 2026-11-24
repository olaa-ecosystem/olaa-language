import { describe, expect, it } from 'vitest';
import { addWordCard, initialState, levelProgress } from '../../stores/appState';
import {
  addNote,
  createFromSourceCommand,
  defaultTags,
  hasNote,
  markSent,
  notesFor,
  notesToMarkdown,
  removeNote,
} from './notes';

const draft = {
  lang: 'en' as const,
  source: { kind: 'grammar' as const, ref: 'en/a1-1', title: 'Greetings & to be' },
  title: 'To be',
  body: 'I → am, he/she/it → is',
  tags: defaultTags('en', 'grammar'),
};

describe('learning notes', () => {
  it('adds once per source and title, newest first', () => {
    let notes = addNote([], draft, 1);
    notes = addNote(notes, { ...draft, body: 'edited' }, 2);
    expect(notes).toHaveLength(1);
    expect(notes[0]?.body).toBe('edited');
    notes = addNote(notes, { ...draft, title: 'Questions' }, 3);
    expect(notes[0]?.title).toBe('Questions');
    expect(hasNote(notes, 'en/a1-1', 'To be')).toBe(true);
    expect(notesFor(notes, 'en/a1-1')).toHaveLength(2);
    expect(removeNote(notes, notes[0]!.id)).toHaveLength(1);
  });

  it('keeps notes in the outbox until sent', () => {
    const notes = addNote([], draft, 1);
    expect(notes[0]?.pending).toBe(true);
    expect(markSent(notes, [notes[0]!.id])[0]?.pending).toBe(false);
  });

  it('builds the Olaa Note command with the contract field names', () => {
    const [note] = addNote([], draft, 1);
    expect(createFromSourceCommand(note!, 'uid1')).toEqual({
      type: 'takenote.note.create_from_source',
      user_id: 'uid1',
      source_app: 'language',
      source_ref: 'grammar/en/a1-1',
      title: 'To be',
      body: 'I → am, he/she/it → is',
      tags: ['olaa-language', 'english', 'grammar'],
    });
  });

  it('exports Markdown for Olaa Note', () => {
    const md = notesToMarkdown(addNote([], draft, 1), 'My notes', new Date('2026-11-24'));
    expect(md).toContain('# My notes');
    expect(md).toContain('## To be');
    expect(md).toContain('#olaa-language #english #grammar');
  });
});

describe('addWordCard', () => {
  it('adds a card once, and never a second card for the same word', () => {
    const card = { id: 'gloss:a1-1:hi', front: 'hi', back: 'chào', lessonId: 'a1-1' };
    const s1 = addWordCard(initialState(), 'en', card, '2026-11-24');
    expect(levelProgress(s1, 'en').cards['gloss:a1-1:hi']?.dueOn).toBe('2026-11-25');
    expect(addWordCard(s1, 'en', card, '2026-11-24')).toBe(s1);
    expect(addWordCard(s1, 'en', { ...card, id: 'other', front: 'Hi' }, '2026-11-24')).toBe(s1);
  });
});
