import { navigate } from '../../app/router';
import { appStore, useAppState } from '../../stores/appStore';
import { applyLevelCardReview, levelProgress } from '../../stores/appState';
import { FlashcardSession } from '../flashcards-srs/ReviewPage';
import type { CurriculumLang } from './types';

/** Spaced-repetition review of the words from finished units. */
export function LevelReviewPage({ lang }: { lang: CurriculumLang }) {
  const state = useAppState();
  return (
    <FlashcardSession
      cards={levelProgress(state, lang).cards}
      frontLang={lang}
      backLang="vi"
      buddy={state.profile?.buddy ?? 'bear'}
      soundOn={state.soundOn}
      onGrade={(cardId, grade, today) =>
        appStore.update((s) => applyLevelCardReview(s, lang, cardId, grade, today))
      }
      onExit={() => navigate({ name: 'levels' })}
    />
  );
}
