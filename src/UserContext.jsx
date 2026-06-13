import { createContext, useContext, useState } from 'react';

const UserCtx = createContext(null);

// deterministic colour from a name, so an avatar is consistent without any upload
function colorFromName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 55% 42%)`;
}
function initials(name) {
  const parts = name.trim().split(/[\s_.]+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    displayName: "you",
    avatarColor: colorFromName("you"),
    avatarInitials: "Y",
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
    setUser((u) => ({ ...u, displayName: name, avatarColor: colorFromName(name), avatarInitials: initials(name) }));

  return <UserCtx.Provider value={{ user, update, setName }}>{children}</UserCtx.Provider>;
}

export function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}