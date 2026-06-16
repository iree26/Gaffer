import { useUser } from './UserContext';

export default function Avatar({ size = 34, showName = false }) {
  const { user } = useUser();
  const initial = (user.displayName || '?')[0].toUpperCase();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.55rem' }}>
      {showName && <span style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text-secondary)' }}>{user.displayName}</span>}
      <span style={{
        width: size, height: size, borderRadius: '6px', background: user.avatarColor,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.48, fontWeight: 700, color: '#fff',
        flex: 'none', userSelect: 'none', lineHeight: 1,
      }}>{initial}</span>
    </span>
  );
}
