import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';

const STEP_ROUTES = {
  quiz: '/signup',
  predictions: '/predict',
  leaderboard: '/leaderboard',
  feed: '/feed',
  terraces: '/talk',
  hottakes: '/hottakes',
};

const STEP_INFO = {
  quiz: {
    title: 'Welcome to Gaffer',
    description: "Let's see what you know. Take the World Cup knowledge quiz to set your baseline. The gaffer needs to know your level.",
    emoji: '📝',
    action: 'Take the quiz',
  },
  predictions: {
    title: 'Call the Group Winners',
    description: 'Pick who tops each group. The gaffer reacts to every call. This is where your journey begins.',
    emoji: '⚽',
    action: 'Make your picks',
  },
  leaderboard: {
    title: 'The League Table',
    description: 'See where you stand against every other Gaffer. Climb the ranks by making sharp calls.',
    emoji: '🏆',
    action: 'View the table',
  },
  feed: {
    title: 'The Main Feed',
    description: 'Share your takes, react to others. Every post is a chance to prove you know ball.',
    emoji: '📢',
    action: 'See the feed',
  },
  terraces: {
    title: 'The Terraces',
    description: 'Join the general chat. Talk markets, matches, and madness with the Gaffer community.',
    emoji: '💬',
    action: 'Enter the terraces',
  },
  hottakes: {
    title: 'Hot Takes',
    description: 'Your final destination. Drop controversial opinions and see if the community agrees. Fire or ice?',
    emoji: '🔥',
    action: 'Drop a hot take',
  },
};

export default function OnboardingOverlay({ goAway } = {}) {
  const navigate = useNavigate();
  const { onboardingStep, advanceOnboarding, completeOnboarding } = useUser();

  if (!onboardingStep || onboardingStep === 'complete') return null;

  const info = STEP_INFO[onboardingStep];
  const isLast = onboardingStep === 'hottakes';

  const [dismissed, setDismissed] = useState(false);

  function handleGo() {
    setDismissed(true);
    navigate(STEP_ROUTES[onboardingStep]);
  }

  function handleSkip() {
    if (isLast) {
      completeOnboarding();
      navigate('/feed');
    } else {
      const next = advanceOnboarding();
      if (next && next !== 'complete') {
        navigate(STEP_ROUTES[next]);
      } else {
        navigate('/feed');
      }
    }
  }

  if (dismissed) return null;

  return (
    <div className="onboarding-overlay">
      <style>{`
        .onboarding-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,.85); backdrop-filter: blur(8px);
          animation: obFade .35s ease;
        }
        @keyframes obFade { from { opacity: 0; } to { opacity: 1; } }
        .ob-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: clamp(1.5rem,5vw,2.8rem);
          max-width: 440px; width: 100%; margin: 1rem;
          text-align: center; animation: obPop .5s cubic-bezier(.2,.8,.25,1);
          box-shadow: 0 24px 80px rgba(0,0,0,.6);
        }
        @keyframes obPop { from { opacity: 0; transform: translateY(24px) scale(.96); } to { opacity: 1; transform: none; } }
        .ob-emoji { font-size: 3.2rem; margin-bottom: .5rem; }
        .ob-step { font-size: .7rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); margin-bottom: .3rem; }
        .ob-title { font-family: var(--font-display); font-weight: 800; font-size: clamp(1.5rem,5vw,2rem); letter-spacing: -.02em; margin: 0 0 .8rem; color: var(--text); line-height: 1.15; }
        .ob-desc { color: var(--text-secondary); font-weight: 500; line-height: 1.55; margin-bottom: 1.5rem; font-size: .95rem; }
        .ob-primary {
          display: block; width: 100%; border: none; cursor: pointer;
          font-family: var(--font-body); font-weight: 700; font-size: 1.05rem;
          color: #000; background: var(--accent); padding: .9rem 2rem; border-radius: 8px;
          transition: all .2s ease; margin-bottom: .6rem;
        }
        .ob-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 24px rgba(245,197,24,.35); }
        .ob-skip {
          background: transparent; border: none; cursor: pointer;
          font-family: var(--font-body); font-weight: 600; font-size: .85rem;
          color: var(--text-secondary); padding: .5rem; transition: color .15s;
        }
        .ob-skip:hover { color: var(--text); }
        .ob-progress { display: flex; gap: 5px; justify-content: center; margin-bottom: 1rem; }
        .ob-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); }
        .ob-dot.active { background: var(--accent); width: 18px; border-radius: 3px; }
        .ob-dot.done { background: var(--accent-muted); }
      `}</style>

      <div className="ob-card">
        <div className="ob-progress">
          {['quiz','predictions','leaderboard','feed','terraces','hottakes'].map((s, i) => {
            const steps = ['quiz','predictions','leaderboard','feed','terraces','hottakes'];
            const idx = steps.indexOf(onboardingStep);
            let cls = 'ob-dot';
            if (i < idx) cls += ' done';
            else if (i === idx) cls += ' active';
            return <div key={s} className={cls} />;
          })}
        </div>
        <div className="ob-emoji">{info.emoji}</div>
        <div className="ob-step">Step {['quiz','predictions','leaderboard','feed','terraces','hottakes'].indexOf(onboardingStep) + 1} of 6</div>
        <h2 className="ob-title">{info.title}</h2>
        <p className="ob-desc">{info.description}</p>
        <button className="ob-primary" onClick={handleGo}>{info.action}</button>
        <button className="ob-skip" onClick={handleSkip}>
          {isLast ? 'Complete onboarding' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
