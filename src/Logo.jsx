import { useNavigate } from 'react-router-dom';

export default function Logo({ size = 26 }) {
  const navigate = useNavigate();
  return (
    <span
      onClick={() => navigate('/')}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}
    >
      <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true"
        style={{ animation: 'logoSpin 6s linear infinite', flex: 'none' }}>
        <defs><polygon id="logop" points="0,-20 19,-6.2 11.8,16.2 -11.8,16.2 -19,-6.2" /></defs>
        <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="8" />
        <g stroke="#13311F" strokeWidth="5" strokeLinecap="round">
          <line x1="100" y1="66" x2="100" y2="12" /><line x1="132.3" y1="89.5" x2="184" y2="73" />
          <line x1="120.1" y1="127.5" x2="152" y2="170" /><line x1="79.9" y1="127.5" x2="48" y2="170" />
          <line x1="67.7" y1="89.5" x2="16" y2="73" />
        </g>
        <use href="#logop" transform="translate(100,100) scale(1.7)" fill="#16331F" />
        <use href="#logop" transform="translate(137.6,48.2) rotate(36) scale(.72)" fill="#16331F" />
        <use href="#logop" transform="translate(160.9,119.8) rotate(108) scale(.72)" fill="#16331F" />
        <use href="#logop" transform="translate(100,164) rotate(180) scale(.72)" fill="#16331F" />
        <use href="#logop" transform="translate(39.1,119.8) rotate(252) scale(.72)" fill="#16331F" />
        <use href="#logop" transform="translate(62.4,48.2) rotate(324) scale(.72)" fill="#16331F" />
      </svg>
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.3rem', color: 'var(--deep)', letterSpacing: '-.01em' }}>
        GAFF<span style={{ color: 'var(--bright)' }}>ER</span>
      </span>
      <style>{`@keyframes logoSpin{ to{ transform:rotate(360deg); } }`}</style>
    </span>
  );
}