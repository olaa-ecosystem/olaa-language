import { useState } from 'react';
import { AppTile } from '../components/ui';
import { Icon } from '../components/Icon';
import { CURRICULUM_LANGS, languageName, levelsOf } from '../features/levels/load';
import type { CurriculumLang } from '../features/levels/types';
import { pick, setLocale, tr, useLocale } from '../i18n/locale';
import { appStore } from '../stores/appStore';
import { completeOnboarding, DAILY_GOAL_OPTIONS } from '../stores/appState';

export const LANG_SHORT: Record<CurriculumLang, string> = { en: 'EN', es: 'ES', zh: '中' };
export const GOAL_NAMES: Record<number, [string, string]> = {
  10: ['Thong thả', 'Casual'],
  20: ['Đều đặn', 'Regular'],
  30: ['Nghiêm túc', 'Serious'],
  50: ['Tăng tốc', 'Intense'],
};

export function WelcomePage() {
  const locale = useLocale();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [lang, setLang] = useState<CurriculumLang>('en');
  const [goal, setGoal] = useState(20);

  const finish = () => appStore.update((s) => completeOnboarding(s, { name, lang, dailyGoalXp: goal }));

  return (
    <div className="welcome page" key={step}>
      {step > 0 && (
        <button type="button" className="back" onClick={() => setStep(step - 1)} style={{ justifySelf: 'start' }}>
          <Icon name="back" size="sm" /> {tr('Quay lại', 'Back')}
        </button>
      )}
      {step === 0 && (
        <>
          <AppTile app="lang" size="lg" />
          <p className="eyebrow">Olaa Language</p>
          <h1>{tr('Học ngoại ngữ theo lộ trình rõ ràng, từng bước nhỏ.', 'Learn a language on a clear path, one small step at a time.')}</h1>
          <p className="muted">
            {tr(
              'Tiếng Anh và tiếng Tây Ban Nha từ A1 đến C2, tiếng Trung từ HSK1 đến HSK6. 182 bài học, hơn 3.700 câu luyện, 15 chủ đề đời sống, từ điển 20.000 mục và luyện phát âm.',
              'English and Spanish from A1 to C2, Chinese from HSK1 to HSK6. 182 units, over 3,700 practice questions, 15 real-life topics, a 20,000-entry glossary and pronunciation drills.',
            )}
          </p>
          <div className="card appcard">
            <AppTile app="habit" size="lg" />
            <b>{tr('Đi cùng Olaa Habits và Olaa Note', 'Works with Olaa Habits and Olaa Note')}</b>
            <p>
              {tr(
                'Xong mục tiêu ngày, Habits tự đánh dấu thói quen học. Từ và quy tắc bạn lưu được gửi sang Note.',
                'Meet your daily goal and Habits ticks your study habit. Words and rules you save go to Note.',
              )}
            </p>
          </div>
          <div className="chips" role="radiogroup" aria-label={tr('Ngôn ngữ giao diện', 'Interface language')}>
            <button type="button" className="chip" role="radio" aria-checked={locale === 'vi'} onClick={() => setLocale('vi')}>
              Tiếng Việt
            </button>
            <button type="button" className="chip" role="radio" aria-checked={locale === 'en'} onClick={() => setLocale('en')}>
              English
            </button>
          </div>
          <button type="button" className="btn btn--block" onClick={() => setStep(1)} autoFocus>
            {tr('Bắt đầu', 'Get started')}
          </button>
        </>
      )}
      {step === 1 && (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <h1>{tr('Bạn tên là gì?', 'What should we call you?')}</h1>
          <label className="field-label">
            {tr('Tên', 'Name')}
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus autoComplete="given-name" />
          </label>
          <button type="submit" className="btn btn--block">
            {tr('Tiếp tục', 'Continue')}
          </button>
          <button type="button" className="btn btn--text" onClick={() => setStep(2)}>
            {tr('Bỏ qua', 'Skip')}
          </button>
        </form>
      )}
      {step === 2 && (
        <>
          <h1>{tr('Bạn muốn học tiếng gì?', 'Which language do you want to learn?')}</h1>
          <div className="choice-cards" role="radiogroup">
            {CURRICULUM_LANGS.map((l) => {
              const levels = levelsOf(l);
              return (
                <button key={l} type="button" className="choice-card" role="radio" aria-checked={lang === l} onClick={() => setLang(l)}>
                  <span className="lang-badge zh">{LANG_SHORT[l]}</span>
                  <span>
                    <b>{pick(languageName(l))}</b>
                    <small>
                      {levels[0]?.code}–{levels[levels.length - 1]?.code} · {levels.map((x) => x.exam.split(' ')[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="small muted">{tr('Đổi ngôn ngữ bất cứ lúc nào; tiến độ từng ngôn ngữ được giữ riêng.', 'Switch any time; each language keeps its own progress.')}</p>
          <button type="button" className="btn btn--block" onClick={() => setStep(3)}>
            {tr('Tiếp tục', 'Continue')}
          </button>
        </>
      )}
      {step === 3 && (
        <>
          <h1>{tr('Mỗi ngày bạn học bao lâu?', 'How much each day?')}</h1>
          <div className="choice-cards" role="radiogroup">
            {DAILY_GOAL_OPTIONS.map((g) => (
              <button key={g} type="button" className="choice-card" role="radio" aria-checked={goal === g} onClick={() => setGoal(g)}>
                <span className="lang-badge" style={{ background: 'var(--block-yellow)' }}>{g}</span>
                <span>
                  <b>{tr(...GOAL_NAMES[g]!)}</b>
                  <small>{tr(`${g} XP · khoảng ${g} phút mỗi ngày`, `${g} XP · about ${g} minutes a day`)}</small>
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--block" onClick={finish}>
            {tr('Bắt đầu học', 'Start learning')}
          </button>
        </>
      )}
    </div>
  );
}
