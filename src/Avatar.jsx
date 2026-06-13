import { useUser } from './UserContext';

export default function Avatar({ size = 34, showName = false }) {
  const { user } = useUser();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.55rem' }}>
      {showName && <span style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--deep)' }}>{user.displayName}</span>}
      <span style={{
        width: size, height: size, borderRadius: '50%', background: user.avatarColor, color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: size * 0.4, fontFamily: "'Syne', sans-serif",
        boxShadow: '0 2px 8px rgba(7,94,50,.25)', flex: 'none', userSelect: 'none',
      }}>{user.avatarInitials}</span>
    </span>
  );
}