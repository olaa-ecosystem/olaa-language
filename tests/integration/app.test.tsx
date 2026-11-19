import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { LessonPlayer } from '../../src/features/lesson-player/LessonPlayer';
import type { Exercise } from '../../src/features/exercises';
import { appStore } from '../../src/stores/appStore';

beforeEach(() => {
  appStore.reset();
  window.location.hash = '';
});

describe('onboarding to first lesson', () => {
  it('lets a new learner pick a course and buddy, then open the first lesson', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /get started/i }));
    await user.click(screen.getByRole('button', { name: /^english/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await user.click(screen.getByRole('button', { name: 'Hop the Frog' }));
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await user.type(screen.getByPlaceholderText(/your name/i), 'Mai');
    await user.click(screen.getByRole('button', { name: /start learning/i }));

    expect(appStore.getState().profile).toEqual({ name: 'Mai', buddy: 'frog' });
    expect(screen.getByRole('heading', { name: 'First words' })).toBeInTheDocument();

    const node = screen.getByRole('button', { name: /greetings — available/i });
    await user.click(node);
    await user.click(screen.getByRole('button', { name: /start \+10 xp/i }));
    await act(async () => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(window.location.hash).toBe('#/lesson/u1-greetings');
    expect(
      await screen.findByRole('progressbar', { name: /lesson progress/i }),
    ).toBeInTheDocument();
  });

  it('keeps later lessons locked', () => {
    appStore.update((s) => ({
      ...s,
      profile: { name: 'A', buddy: 'cat' },
      activeCourseId: 'en-from-vi',
    }));
    render(<App />);
    expect(screen.getByRole('button', { name: /people — locked/i })).toBeInTheDocument();
  });
});

describe('LessonPlayer', () => {
  const exercise: Exercise = {
    id: 'l:select:cat',
    lessonId: 'l',
    kind: 'select',
    prompt: 'cat',
    promptLang: 'en',
    optionLang: 'vi',
    options: ['con chó', 'con mèo', 'con gấu', 'con ếch'],
    answer: 'con mèo',
  };

  function renderPlayer(overrides: Partial<Parameters<typeof LessonPlayer>[0]> = {}) {
    const props = {
      exercises: [exercise],
      buddy: 'bear' as const,
      targetLang: 'en' as const,
      mode: 'lesson' as const,
      hearts: 5,
      soundOn: false,
      onAnswer: vi.fn(),
      onCantListen: vi.fn(),
      onComplete: vi.fn(),
      onOutOfHearts: vi.fn(),
      onQuit: vi.fn(),
      ...overrides,
    };
    render(<LessonPlayer {...props} />);
    return props;
  }

  it('grades a correct answer and completes the session', async () => {
    const user = userEvent.setup();
    const props = renderPlayer();

    const check = screen.getByRole('button', { name: /check/i });
    expect(check).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /con mèo/ }));
    await user.click(check);

    expect(props.onAnswer).toHaveBeenCalledWith(exercise, true);
    expect(within(screen.getByRole('status')).getByRole('heading')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(props.onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ perfect: true, accuracy: 1 }),
    );
  });

  it('shows the correct answer after a mistake and supports number keys', async () => {
    const user = userEvent.setup();
    const props = renderPlayer();

    await user.keyboard('1');
    await user.click(screen.getByRole('button', { name: /check/i }));

    expect(props.onAnswer).toHaveBeenCalledWith(exercise, false);
    expect(screen.getByText(/correct answer: con mèo/i)).toBeInTheDocument();
  });

  it('stops the lesson when hearts run out', async () => {
    const user = userEvent.setup();
    const props = renderPlayer({ hearts: 0 });
    await user.click(screen.getByRole('button', { name: /con chó/ }));
    await user.click(screen.getByRole('button', { name: /check/i }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(props.onOutOfHearts).toHaveBeenCalled();
    expect(props.onComplete).not.toHaveBeenCalled();
  });
});
