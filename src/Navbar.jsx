import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from './Avatar';

const TABS = [
  { to: '/predict', label: 'Predict',
    icon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /></> },
  { to: '/leaderboard', label: 'Table',
    icon: <><path d="M6 4h12v3a6 6 0 0 1-12 0V4z" /><path d="M6 6H3.5v1A3 3 0 0 0 6.5 10" /><path d="M18 6h2.5v1a3 3 0 0 1-3 3" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="14" x2="12" y2="20" /></> },
  { to: '/talk', label: 'Terraces',
    icon: <path d="M21 14a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" /> },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = Math.max(0, TABS.findIndex((t) => t.to === pathname));

  return (
    <>
      <div className="nav-spacer" />
      <nav className="navbar">
        <style>{`
          .nav-spacer{ height:150px; }
          .navbar{ position:fixed; top:12px; left:50%; transform:translateX(-50%); z-index:35;
            width:min(720px, calc(100% - 20px)); display:flex; flex-wrap:wrap; align-items:center; gap:.55rem;
            background:rgba(255,255,255,.7); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
            border:1px solid rgba(11,107,58,.14); border-radius:22px; padding:.55rem .7rem;
            box-shadow:0 14px 44px rgba(7,94,50,.16);
            animation:navDrop .55s cubic-bezier(.2,.8,.25,1); }
          @keyframes navDrop{ from{opacity:0; transform:translateX(-50%) translateY(-18px);} to{opacity:1; transform:translateX(-50%) translateY(0);} }
          .nav-logo{ order:1; display:flex; align-items:center; gap:.45rem; cursor:pointer; }
          .nav-logo .ball{ width:28px; height:28px; flex:none; animation:navSpin 6s linear infinite; }
          @keyframes navSpin{ to{ transform:rotate(360deg); } }
          .nav-logo .wm{ font-family:'Syne',sans-serif; font-weight:800; font-size:1.15rem; color:#075E32; letter-spacing:-.01em; }
          .nav-logo .wm i{ color:#16B45F; font-style:normal; }
          .nav-av{ order:2; margin-left:auto; }
          .seg{ order:3; flex-basis:100%; position:relative; display:grid; grid-template-columns:repeat(3,1fr);
            background:rgba(11,107,58,.06); border-radius:14px; padding:4px; }
          .seg .puck{ position:absolute; top:4px; bottom:4px; left:4px; width:calc((100% - 8px)/3); border-radius:11px;
            background:linear-gradient(120deg,#16B45F,#3FE07F); box-shadow:0 6px 16px rgba(22,180,95,.45);
            transform:translateX(calc(var(--i) * 100%)); transition:transform .4s cubic-bezier(.34,1.45,.4,1); }
          .seg .tab{ position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:.4rem;
            padding:.62rem .2rem; border:none; background:transparent; cursor:pointer;
            font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:.86rem; color:#0B6B3A; transition:color .28s; }
          .seg .tab svg{ width:17px; height:17px; flex:none; }
          .seg .tab.on{ color:#fff; }
          .seg .tab:hover:not(.on){ color:#075E32; }
          @media (min-width:660px){
            .nav-spacer{ height:86px; }
            .navbar{ flex-wrap:nowrap; padding:.5rem .8rem; }
            .seg{ order:2; flex-basis:auto; width:360px; margin:0 auto; }
            .nav-av{ order:3; }
          }
          @media (prefers-reduced-motion: reduce){ .navbar,.nav-logo .ball,.seg .puck{ animation:none !important; transition:none !important; } }
        `}</style>

        <div className="nav-logo" onClick={() => navigate('/')}>
          <svg className="ball" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="10" />
            <polygon points="100,66 132.3,89.5 120.1,127.5 79.9,127.5 67.7,89.5" fill="#16331F" />
            <g stroke="#13311F" strokeWidth="6" strokeLinecap="round">
              <line x1="100" y1="66" x2="100" y2="14" /><line x1="132.3" y1="89.5" x2="182" y2="74" />
              <line x1="120.1" y1="127.5" x2="150" y2="168" /><line x1="79.9" y1="127.5" x2="50" y2="168" />
              <line x1="67.7" y1="89.5" x2="18" y2="74" />
            </g>
          </svg>
          <span className="wm">GAFF<i>ER</i></span>
        </div>

        <span className="nav-av"><Avatar size={32} /></span>

        <div className="seg" style={{ '--i': active }}>
          <span className="puck" />
          {TABS.map((t) => (
            <button key={t.to} className={`tab${pathname === t.to ? ' on' : ''}`} onClick={() => navigate(t.to)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}