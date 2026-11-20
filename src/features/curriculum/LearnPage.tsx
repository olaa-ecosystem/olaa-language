import { useState } from 'react';
import { navigate } from '../../app/router';
import { CheckIcon, LockIcon, StarIcon } from '../../components/Icons';
import { Mascot } from '../../components/mascots';
import { useAppState } from '../../stores/appStore';
import { courseProgress } from '../../stores/appState';
import { DailyGoalCard } from '../learning-progress/DailyGoalCard';
import { lessonStatuses, nextLessonId } from './path';
import { MAX_LESSON_LEVEL, type Course } from './types';
import { tr } from '../../i18n/locale';

/** Horizontal offsets that make the path wind left and right. */
const OFFSETS = [0, 64, 0, -64];

/** Lesson state in words, for screen readers. */
function statusLabel(status: string): string {
  if (status === 'locked') return tr('chưa mở', 'locked');
  if (status === 'completed') return tr('đã học', 'completed');
  return tr('đang mở', 'available');
}

export function LearnPage({ course }: { course: Course }) {
  const state = useAppState();
  const progress = courseProgress(state, course.id);
  const statuses = lessonStatuses(course, progress.lessonLevels);
  const next = nextLessonId(course, progress.lessonLevels);
  const [open, setOpen] = useState<string | null>(null);
  const buddy = state.profile?.buddy ?? course.mascot;
  let index = 0;

  return (
    <div className="page page--path">
      <div className="only-narrow">
        <DailyGoalCard />
      </div>

      {course.units.map((unit, unitIndex) => (
        <section
          key={unit.id}
          className={`unit unit--${unitIndex % 3}`}
          aria-labelledby={`${unit.id}-title`}
        >
          <header className="unit__banner">
            <div>
              <p className="unit__eyebrow">
                {tr(`Chương ${unitIndex + 1}`, `Unit ${unitIndex + 1}`)}
              </p>
              <h2 id={`${unit.id}-title`}>{unit.title}</h2>
              <p>{unit.description}</p>
            </div>
            <Mascot id={unit.guide} size={92} />
          </header>

          <ol className="path">
            {unit.lessons.map((lesson, i) => {
              const offset = OFFSETS[index++ % OFFSETS.length] ?? 0;
              const status = statuses[lesson.id] ?? 'locked';
              const level = progress.lessonLevels[lesson.id] ?? 0;
              const isNext = lesson.id === next;
              const isOpen = open === lesson.id;
              return (
                <li
                  key={lesson.id}
                  className="path__row"
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  {isNext && (
                    <span className="path__start" aria-hidden>
                      {tr('Bắt đầu', 'Start')}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`node node--${status} ${isNext ? 'node--next' : ''}`}
                    aria-expanded={isOpen}
                    aria-label={`${lesson.title}: ${statusLabel(status)}${level ? tr(`, cấp ${level}`, `, level ${level}`) : ''}`}
                    onClick={() => setOpen(isOpen ? null : lesson.id)}
                  >
                    <span className="node__face">
                      {status === 'locked' ? (
                        <LockIcon size={30} />
                      ) : level >= MAX_LESSON_LEVEL ? (
                        <StarIcon size={34} />
                      ) : status === 'completed' ? (
                        <CheckIcon size={34} />
                      ) : (
                        <span className="node__emoji">{lesson.icon}</span>
                      )}
                    </span>
                  </button>
                  {level > 0 && (
                    <span className="node__level" aria-hidden>
                      {Array.from({ length: MAX_LESSON_LEVEL }, (_, k) => (
                        <StarIcon key={k} size={12} className={k < level ? 'on' : 'off'} />
                      ))}
                    </span>
                  )}
                  {isNext && (
                    <span className={`path__buddy ${offset >= 0 ? 'is-left' : 'is-right'}`}>
                      <Mascot id={buddy} size={84} mood="wave" />
                    </span>
                  )}
                  {i === 1 && !isNext && (
                    <span
                      className={`path__guide ${offset > 0 ? 'is-left' : 'is-right'}`}
                      aria-hidden
                    >
                      <Mascot id={unit.guide} size={96} />
                    </span>
                  )}
                  {isOpen && (
                    <div
                      className={`node-pop node-pop--${status}`}
                      role="dialog"
                      aria-label={lesson.title}
                    >
                      <h3>{lesson.title}</h3>
                      {status === 'locked' ? (
                        <p>
                          {tr(
                            'Học xong các bài phía trên để mở bài này.',
                            'Finish the lessons above to unlock this one.',
                          )}
                        </p>
                      ) : (
                        <>
                          <p>
                            {level >= MAX_LESSON_LEVEL
                              ? tr(
                                  'Huyền thoại! Luyện lúc nào cũng được.',
                                  'Legendary! Practise any time.',
                                )
                              : tr(
                                  `Cấp ${level}/${MAX_LESSON_LEVEL}`,
                                  `Level ${level} of ${MAX_LESSON_LEVEL}`,
                                )}
                          </p>
                          <button
                            type="button"
                            className="btn btn--block"
                            onClick={() => navigate({ name: 'lesson', lessonId: lesson.id })}
                            autoFocus
                          >
                            {status === 'completed'
                              ? tr('Luyện lại +10 XP', 'Practise +10 XP')
                              : tr('Bắt đầu +10 XP', 'Start +10 XP')}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <div className="path-end">
        <Mascot id="whale" size={110} />
        <p>
          {tr(
            'Các chương mới đang trên đường tới. Giữ chuỗi ngày học nhé!',
            'More units are on the way. Keep your streak swimming!',
          )}
        </p>
      </div>
    </div>
  );
}
