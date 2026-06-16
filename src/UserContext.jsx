import { createContext, useContext, useState, useEffect } from 'react';
import { EMBLEMS } from './emblems';

const UserCtx = createContext(null);

const ONBOARDING_STEPS = ['quiz', 'predictions', 'leaderboard', 'feed', 'terraces', 'hottakes'];
const ONBOARDING_COMPLETE = 'complete';

function colorFromName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const colors = EMBLEMS;
  return colors[Math.abs(h) % colors.length];
}

function initFromStorage() {
  const stored = localStorage.getItem('gaffer_auth');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { /* ignore */ }
  }
  return null;
}

function initOnboarding() {
  const stored = localStorage.getItem('gaffer_onboarding');
  if (stored === ONBOARDING_COMPLETE) return ONBOARDING_COMPLETE;
  if (stored && ONBOARDING_STEPS.includes(stored)) return stored;
  return ONBOARDING_STEPS[0];
}

export function UserProvider({ children }) {
  const [authUser, setAuthUser] = useState(() => initFromStorage());
  const [token, setToken] = useState(() => localStorage.getItem('gaffer_token') || null);
  const [onboardingStep, setOnboardingStepRaw] = useState(() => initOnboarding());
  const [user, setUser] = useState(() => {
    const au = initFromStorage();
    if (au) {
      return {
        displayName: au.display_name || au.username,
        avatarColor: colorFromName(au.display_name || au.username),
        avatarEmblem: null,
        expertise: null,
        quizScore: null,
        displayStars: au.stars || 0,
        rank: au.rank || null,
        accuracy: 0,
        move: 0,
        picks: {},
      };
    }
    return {
      displayName: "you",
      avatarColor: colorFromName("you"),
      avatarEmblem: null,
      expertise: null,
      quizScore: null,
      displayStars: 0,
      rank: null,
      accuracy: 0,
      move: 0,
      picks: {},
    };
  });

  useEffect(() => {
    if (token) localStorage.setItem('gaffer_token', token);
    else localStorage.removeItem('gaffer_token');
  }, [token]);

  useEffect(() => {
    if (authUser) localStorage.setItem('gaffer_auth', JSON.stringify(authUser));
    else localStorage.removeItem('gaffer_auth');
  }, [authUser]);

  const setOnboardingStep = (step) => {
    localStorage.setItem('gaffer_onboarding', step);
    setOnboardingStepRaw(step);
  };

  const advanceOnboarding = () => {
    if (onboardingStep === ONBOARDING_COMPLETE) return;
    const idx = ONBOARDING_STEPS.indexOf(onboardingStep);
    const next = idx >= 0 && idx < ONBOARDING_STEPS.length - 1
      ? ONBOARDING_STEPS[idx + 1]
      : ONBOARDING_COMPLETE;
    setOnboardingStep(next);
    return next;
  };

  const completeOnboarding = () => {
    setOnboardingStep(ONBOARDING_COMPLETE);
  };

  const isOnboarding = onboardingStep !== ONBOARDING_COMPLETE;

  const update = (patch) => setUser((u) => ({ ...u, ...patch }));

  const setName = (name) =>
    setUser((u) => ({
      ...u,
      displayName: name,
      avatarColor: colorFromName(name),
    }));

  const login = (result) => {
    setToken(result.token);
    setAuthUser(result);
    setUser((u) => ({
      ...u,
      displayName: result.display_name || result.username,
      avatarColor: colorFromName(result.display_name || result.username),
    }));
  };

  const logout = () => {
    setToken(null);
    setAuthUser(null);
    setOnboardingStepRaw(ONBOARDING_STEPS[0]);
    localStorage.removeItem('gaffer_onboarding');
    setUser({
      displayName: "you",
      avatarColor: colorFromName("you"),
      avatarEmblem: null,
      expertise: null,
      quizScore: null,
      displayStars: 0,
      rank: null,
      accuracy: 0,
      move: 0,
      picks: {},
    });
  };

  const isAuthenticated = !!token && !!authUser;

  return (
    <UserCtx.Provider value={{
      user, update, setName, token, authUser, login, logout, isAuthenticated,
      onboardingStep, setOnboardingStep, advanceOnboarding, completeOnboarding, isOnboarding,
      ONBOARDING_STEPS, ONBOARDING_COMPLETE,
    }}>
      {children}
    </UserCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
