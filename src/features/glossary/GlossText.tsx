/**
 * Tap-to-translate text: every word or phrase that is in the unit glossary can be tapped to see
 * its sound and meaning, listen to it, add it to flashcards or save it as a note.
 */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/Icon';
import { SpeakButton, toast, useAsync } from '../../components/ui';
import { pick, tr } from '../../i18n/locale';
import { appStore, useAppState } from '../../stores/appStore';
import { addWordCard, levelProgress } from '../../stores/appState';
import { toDayKey } from '../../utils/date';
import type { CurriculumLang } from '../levels/types';
import { addNote, defaultTags, hasNote, notesStore } from '../notes/notes';
import { glossCardId, loadGlossary, tokenizeForGloss, type GlossEntry } from './glossary';

export function useGlossary(lang: CurriculumLang) {
  return useAsync(() => loadGlossary(lang), lang);
}

export function meaningOf(entry: GlossEntry): string {
  return pick([entry.vi, entry.en]);
}

export function addGlossCard(lang: CurriculumLang, entry: GlossEntry): boolean {
  const before = appStore.getState();
  appStore.update((s) =>
    addWordCard(
      s,
      lang,
      {
        id: glossCardId(entry),
        front: entry.word,
        back: entry.sound ? `${entry.vi} · ${entry.sound}` : entry.vi,
        lessonId: entry.unitId,
      },
      toDayKey(new Date()),
    ),
  );
  return appStore.getState() !== before;
}

export function saveWordNote(lang: CurriculumLang, entry: GlossEntry): void {
  notesStore.set((notes) =>
    addNote(
      notes,
      {
        lang,
        source: { kind: 'word', ref: `${lang}/${entry.unitId}`, title: entry.word },
        title: entry.word,
        body: [entry.sound, `${entry.vi}${entry.en ? ` — ${entry.en}` : ''}`].filter(Boolean).join('\n'),
        tags: defaultTags(lang, 'word'),
      },
      Date.now(),
    ),
  );
}

/** The actions for one glossary word (used in the popover and in search results). */
export function WordActions({ lang, entry }: { lang: CurriculumLang; entry: GlossEntry }) {
  const state = useAppState();
  const notes = notesStore.use();
  const inDeck = useMemo(() => {
    const front = entry.word.trim().toLowerCase();
    return Object.values(levelProgress(state, lang).cards).some((c) => c.front.trim().toLowerCase() === front);
  }, [state, lang, entry.word]);
  const saved = hasNote(notes, `${lang}/${entry.unitId}`, entry.word);
  return (
    <div className="row">
      <SpeakButton text={entry.word} lang={lang} />
      <button
        type="button"
        className="btn btn--sm btn--ghost"
        disabled={inDeck}
        onClick={() => {
          addGlossCard(lang, entry);
          toast(tr('Đã thêm vào thẻ từ, ôn từ ngày mai', 'Added to your cards, review from tomorrow'));
        }}
      >
        <Icon name={inDeck ? 'check' : 'plus'} size="sm" />
        {inDeck ? tr('Đã có thẻ', 'In your cards') : tr('Thẻ từ', 'Add card')}
      </button>
      <button
        type="button"
        className="btn btn--sm btn--ghost"
        disabled={saved}
        onClick={() => {
          saveWordNote(lang, entry);
          toast(tr('Đã lưu ghi chú (chờ gửi sang Olaa Note)', 'Note saved (waiting to send to Olaa Note)'));
        }}
      >
        <Icon name={saved ? 'check' : 'note'} size="sm" />
        {saved ? tr('Đã lưu', 'Saved') : tr('Ghi chú', 'Note')}
      </button>
    </div>
  );
}

export function GlossText({ text, lang, unitId, className }: { text: string; lang: CurriculumLang; unitId?: string; className?: string }) {
  const glossary = useGlossary(lang);
  const [open, setOpen] = useState<{ i: number; entry: GlossEntry; x: number; y: number } | null>(null);
  const tokens = useMemo(
    () => (glossary.status === 'ready' ? tokenizeForGloss(glossary.data, text, unitId) : null),
    [glossary, text, unitId],
  );
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e.target instanceof Element && e.target.closest('.popover, .gloss-tok')) return;
      setOpen(null);
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  if (!tokens) return <span className={className} lang={lang}>{text}</span>;
  return (
    <span className={className} lang={lang}>
      {tokens.map((t, i) =>
        t.entry ? (
          <button
            key={i}
            type="button"
            className="gloss-tok"
            aria-expanded={open?.i === i}
            aria-label={tr(`${t.text}: xem nghĩa`, `${t.text}: show meaning`)}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const x = Math.max(12, Math.min(window.innerWidth - 332, r.left));
              const below = r.bottom + 200 < window.innerHeight;
              setOpen(open?.i === i ? null : { i, entry: t.entry!, x, y: below ? r.bottom + 8 : r.top - 8 });
            }}
            style={{ font: 'inherit', color: 'inherit', display: 'inline' }}
          >
            {t.text}
          </button>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
      {open && createPortal(
        <span
          className="popover"
          role="dialog"
          aria-label={open.entry.word}
          style={{ left: open.x, top: open.y, transform: open.y < (window.innerHeight * 2) / 3 ? undefined : 'translateY(-100%)', display: 'block' }}
        >
          <b lang={lang}>{open.entry.word}</b> {open.entry.sound && <span className="muted small">{open.entry.sound}</span>}
          <span className="muted" style={{ display: 'block', marginTop: 4 }}>{meaningOf(open.entry)}</span>
          <WordActions lang={lang} entry={open.entry} />
        </span>,
        document.body,
      )}
    </span>
  );
}
