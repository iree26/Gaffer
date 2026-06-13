import { useUser } from './UserContext';

// the emblem set — football-themed, picked at random per user
export const EMBLEMS = ["⚽","🥅","🧤","👟","🏆","🎽","📣","🚩","⭐","🔥"];

export default function Avatar({ size = 34, showName = false }) {
  const { user } = useUser();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.55rem' }}>
      {showName && <span style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--deep)' }}>{user.displayName}</span>}
      <span style={{
        width: size, height: size, borderRadius: '50%', background: user.avatarColor,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.52, boxShadow: '0 2px 8px rgba(7,94,50,.25)',
        flex: 'none', userSelect: 'none', lineHeight: 1,
      }}>{user.avatarEmblem}</span>
    </span>
  );
}