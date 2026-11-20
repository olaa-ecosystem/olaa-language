import { useState } from 'react';
import { MASCOTS, Mascot } from '../../components/mascots';
import { firebaseEnabled } from '../../services/firebase';
import { appStore } from '../../stores/appStore';
import { completeOnboarding, DAILY_GOAL_OPTIONS } from '../../stores/appState';
import { MASCOT_IDS, type MascotId } from '../../types';
import { AccountCard } from '../account/AccountCard';
import { COURSES, type CourseId } from '../curriculum';
import { LocalePicker } from '../../i18n/LocalePicker';
import { tr } from '../../i18n/locale';

type Step = 'hello' | 'course' | 'buddy' | 'goal';
const STEPS: Step[] = ['hello', 'course', 'buddy', 'goal'];

const goalLabel = (xp: number): string =>
  ({
    10: tr('Thong thả', 'Casual'),
    20: tr('Đều đặn', 'Regular'),
    30: tr('Nghiêm túc', 'Serious'),
    50: tr('Tăng tốc', 'Intense'),
  })[xp] ?? `${xp} XP`;

export function WelcomePage() {
  const [step, setStep] = useState<Step>('hello');
  const [courseId, setCourseId] = useState<CourseId | null>(null);
  const [buddy, setBuddy] = useState<MascotId>('bear');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<number>(20);
  const stepIndex = STEPS.indexOf(step);

  const finish = () => {
    if (!courseId) return;
    appStore.update((s) => completeOnboarding(s, { name, buddy, courseId, dailyGoalXp: goal }));
  };

  return (
    <div className="welcome">
      {step !== 'hello' && (
        <div
          className="welcome__steps"
          aria-label={tr(
            `Bước ${stepIndex}/${STEPS.length - 1}`,
            `Step ${stepIndex} of ${STEPS.length - 1}`,
          )}
        >
          {STEPS.slice(1).map((s, i) => (
            <span key={s} className={i < stepIndex ? 'is-done' : ''} />
          ))}
        </div>
      )}

      {step === 'hello' && (
        <section className="welcome__panel welcome__hello">
          <div className="mascot-parade" aria-hidden>
            {MASCOT_IDS.map((id, i) => (
              <span key={id} style={{ animationDelay: `${i * 0.12}s` }}>
                <Mascot id={id} size={i % 3 === 1 ? 92 : 76} />
              </span>
            ))}
          </div>
          <h1>
            {tr('Học ngoại ngữ cùng các bạn ', 'Learn a language with ')}
            <span className="brand">olaa</span>
            {tr('', ' friends')}
          </h1>
          <p>
            {tr(
              'Bài học ngắn, bạn đồng hành vui vẻ và chuỗi ngày học đáng giữ. Miễn phí, vui và hiệu quả.',
              'Bite-sized lessons, cheerful buddies and a streak worth keeping. Free, fun and effective.',
            )}
          </p>
          <LocalePicker />
          <button
            type="button"
            className="btn btn--block"
            onClick={() => setStep('course')}
            autoFocus
          >
            {tr('Bắt đầu', 'Get started')}
          </button>
          {firebaseEnabled && (
            <AccountCard
              intro={tr(
                'Đã học với Olaa? Đăng nhập để học tiếp từ chỗ đã dừng.',
                'Already learning with Olaa? Sign in to continue where you left off.',
              )}
            />
          )}
        </section>
      )}

      {step === 'course' && (
        <section className="welcome__panel">
          <h1>{tr('Bạn muốn học gì?', 'What would you like to learn?')}</h1>
          <div className="option-list">
            {Object.values(COURSES).map((course) => (
              <button
                key={course.id}
                type="button"
                className={`option-card ${courseId === course.id ? 'is-selected' : ''}`}
                aria-pressed={courseId === course.id}
                onClick={() => setCourseId(course.id)}
              >
                <Mascot id={course.mascot} size={80} />
                <span>
                  <strong>{course.title}</strong>
                  <small>{course.subtitle}</small>
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--block"
            disabled={!courseId}
            onClick={() => setStep('buddy')}
          >
            {tr('Tiếp tục', 'Continue')}
          </button>
        </section>
      )}

      {step === 'buddy' && (
        <section className="welcome__panel">
          <h1>{tr('Chọn bạn học cùng', 'Pick your study buddy')}</h1>
          <div className="buddy-hero" style={{ background: MASCOTS[buddy].tint }}>
            <Mascot id={buddy} size={150} mood="wave" key={buddy} />
            <div>
              <strong>{MASCOTS[buddy].name}</strong>
              <p>{MASCOTS[buddy].tagline}</p>
            </div>
          </div>
          <div className="buddy-grid" role="group" aria-label={tr('Bạn học', 'Buddies')}>
            {MASCOT_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className={`buddy-option ${buddy === id ? 'is-selected' : ''}`}
                aria-pressed={buddy === id}
                aria-label={MASCOTS[id].name}
                onClick={() => setBuddy(id)}
                style={{ background: MASCOTS[id].tint }}
              >
                <Mascot id={id} size={60} />
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--block" onClick={() => setStep('goal')}>
            {tr('Tiếp tục', 'Continue')}
          </button>
        </section>
      )}

      {step === 'goal' && (
        <section className="welcome__panel">
          <h1>{tr('Sắp xong rồi!', 'Almost there!')}</h1>
          <label className="field">
            <span>
              {tr(
                `${MASCOTS[buddy].nickname} nên gọi bạn là gì?`,
                `What should ${MASCOTS[buddy].nickname} call you?`,
              )}
            </span>
            <input
              value={name}
              maxLength={30}
              placeholder={tr('Tên của bạn', 'Your name')}
              autoComplete="given-name"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <fieldset className="field">
            <legend>{tr('Chọn mục tiêu mỗi ngày', 'Pick a daily goal')}</legend>
            <div className="option-list">
              {DAILY_GOAL_OPTIONS.map((xp) => (
                <button
                  key={xp}
                  type="button"
                  className={`option-card option-card--row ${goal === xp ? 'is-selected' : ''}`}
                  aria-pressed={goal === xp}
                  onClick={() => setGoal(xp)}
                >
                  <strong>{goalLabel(xp)}</strong>
                  <small>{tr(`${xp} XP mỗi ngày`, `${xp} XP per day`)}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <button type="button" className="btn btn--success btn--block" onClick={finish}>
            {tr('Bắt đầu học', 'Start learning')}
          </button>
        </section>
      )}

      {step !== 'hello' && (
        <button
          type="button"
          className="link-btn welcome__back"
          onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)]!)}
        >
          ← {tr('Quay lại', 'Back')}
        </button>
      )}
    </div>
  );
}
