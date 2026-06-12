import { createContext, useContext, useState } from 'react';

const UserCtx = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    displayName: "you",
    expertise: null,
    quizScore: null,
    displayStars: 0,
    rank: null,
    picks: {},
  });
  const update = (patch) => setUser((u) => ({ ...u, ...patch }));
  return <UserCtx.Provider value={{ user, update }}>{children}</UserCtx.Provider>;
}

export function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}