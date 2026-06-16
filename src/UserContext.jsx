import { createContext, useContext, useState } from 'react';
import { EMBLEMS } from './emblems';

const UserCtx = createContext(null);

function colorFromName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const colors = EMBLEMS;
  return colors[Math.abs(h) % colors.length];
}

export function UserProvider({ children }) {
  const [user, setUser] = useState({
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

  const update = (patch) => setUser((u) => ({ ...u, ...patch }));

  const setName = (name) =>
    setUser((u) => ({
      ...u,
      displayName: name,
      avatarColor: colorFromName(name),
    }));

  return <UserCtx.Provider value={{ user, update, setName }}>{children}</UserCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
