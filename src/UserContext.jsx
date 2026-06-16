import { createContext, useContext, useState, useEffect } from 'react';
import { EMBLEMS } from './emblems';

const UserCtx = createContext(null);

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

export function UserProvider({ children }) {
  const [authUser, setAuthUser] = useState(() => initFromStorage());
  const [token, setToken] = useState(() => localStorage.getItem('gaffer_token') || null);
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
    <UserCtx.Provider value={{ user, update, setName, token, authUser, login, logout, isAuthenticated }}>
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
