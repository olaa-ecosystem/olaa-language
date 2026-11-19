import { useState } from 'react';
import { MASCOTS, Mascot } from '../../components/mascots';
import { firebaseEnabled } from '../../services/firebase';
import { appStore } from '../../stores/appStore';
import { completeOnboarding, DAILY_GOAL_OPTIONS } from '../../stores/appState';
import { MASCOT_IDS, type MascotId } from '../../types';
import { AccountCard } from '../account/AccountCard';
import { COURSES, type CourseId } from '../curriculum';

type Step = 'hello' | 'course' | 'buddy' | 'goal';
const STEPS: Step[] = ['hello', 'course', 'buddy', 'goal'];

const GOAL_LABELS: Record<number, string> = {
  10: 'Casual',
  20: 'Regular',
  30: 'Serious',
  50: 'Intense',
};

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
        <div className="welcome__steps" aria-label={`Step ${stepIndex} of ${STEPS.length - 1}`}>
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
            Learn a language with <span className="brand">olaa</span> friends
          </h1>
          <p>
            Bite-sized lessons, cheerful buddies and a streak worth keeping. Free, fun and
            effective.
          </p>
          <button
            type="button"
            className="btn btn--block"
            onClick={() => setStep('course')}
            autoFocus
          >
            Get started
          </button>
          {firebaseEnabled && (
            <AccountCard intro="Already learning with Olaa? Sign in to continue where you left off." />
          )}
        </section>
      )}

      {step === 'course' && (
        <section className="welcome__panel">
          <h1>What would you like to learn?</h1>
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
            Continue
          </button>
        </section>
      )}

      {step === 'buddy' && (
        <section className="welcome__panel">
          <h1>Pick your study buddy</h1>
          <div className="buddy-hero" style={{ background: MASCOTS[buddy].tint }}>
            <Mascot id={buddy} size={150} mood="wave" key={buddy} />
            <div>
              <strong>{MASCOTS[buddy].name}</strong>
              <p>{MASCOTS[buddy].tagline}</p>
            </div>
          </div>
          <div className="buddy-grid" role="group" aria-label="Buddies">
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
            Continue
          </button>
        </section>
      )}

      {step === 'goal' && (
        <section className="welcome__panel">
          <h1>Almost there!</h1>
          <label className="field">
            <span>What should {MASCOTS[buddy].name.split(' ')[0]} call you?</span>
            <input
              value={name}
              maxLength={30}
              placeholder="Your name"
              autoComplete="given-name"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <fieldset className="field">
            <legend>Pick a daily goal</legend>
            <div className="option-list">
              {DAILY_GOAL_OPTIONS.map((xp) => (
                <button
                  key={xp}
                  type="button"
                  className={`option-card option-card--row ${goal === xp ? 'is-selected' : ''}`}
                  aria-pressed={goal === xp}
                  onClick={() => setGoal(xp)}
                >
                  <strong>{GOAL_LABELS[xp]}</strong>
                  <small>{xp} XP per day</small>
                </button>
              ))}
            </div>
          </fieldset>
          <button type="button" className="btn btn--success btn--block" onClick={finish}>
            Start learning
          </button>
        </section>
      )}

      {step !== 'hello' && (
        <button
          type="button"
          className="link-btn welcome__back"
          onClick={() => setStep(STEPS[Math.max(0, stepIndex - 1)]!)}
        >
          ← Back
        </button>
      )}
    </div>
  );
}
