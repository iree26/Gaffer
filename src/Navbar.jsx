import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from './Avatar';

const TABS = [
  { to: '/predict', label: 'Predict', icon: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /></> },
  { to: '/leaderboard', label: 'Table', icon: <><path d="M6 4h12v3a6 6 0 0 1-12 0V4z" /><path d="M6 6H3.5v1A3 3 0 0 0 6.5 10" /><path d="M18 6h2.5v1a3 3 0 0 1-3 3" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="14" x2="12" y2="20" /></> },
  { to: '/feed', label: 'Feed', icon: <><rect x="3" y="3" width="18" height="6" rx="2" /><rect x="3" y="12" width="18" height="6" rx="2" /></> },
  { to: '/talk', label: 'Terraces', icon: <path d="M21 14a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" /> },
  { to: '/hottakes', label: 'Hot Takes', icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /> },
  { to: '/challenges', label: 'Challenges', icon: <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16l-6.4 4.8L8 14l-6-4.8h7.6z" /> },
  { to: '/groups', label: 'Groups', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
  { to: '/brackets', label: 'Brackets', icon: <path d="M4 4h6v2H4zM14 4h6v2h-6zM4 10h6v2H4zM14 10h6v2h-6zM4 16h6v2H4zM14 16h6v2h-6z" /> },
  { to: '/matchpredictions', label: 'Match Predictions', icon: <><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></> },
  { to: '/standings', label: 'Standings', icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></> },
  { to: '/gafferai', label: 'Gaffer AI', icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> },
  { to: '/notifications', label: 'Alerts', icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
  { to: '/lineups', label: 'Lineups', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const visibleTabs = TABS.slice(0, 5);
  const moreTabs = TABS.slice(5);

  return (
    <>
      <div className="nav-spacer" />
      <nav className="navbar">
        <style>{`
          .nav-spacer{ height:60px; }
          .navbar{ position:fixed; top:0; left:0; right:0; z-index:35;
            background:rgba(0,0,0,.85); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
            border-bottom:1px solid var(--border);
            display:flex; align-items:center; gap:.5rem;
            padding:0 16px; height:52px; }
          .nav-logo{ display:flex; align-items:center; gap:.4rem; cursor:pointer; flex:none;
            padding-right:16px; border-right:1px solid var(--border); margin-right:8px; }
          .nav-logo .mark{ font-family:var(--font-display); font-weight:800; font-size:1.1rem; color:var(--accent); letter-spacing:-.02em; }
          .nav-av{ margin-left:auto; flex:none; cursor:pointer; }
          .tab-row{ display:flex; gap:2px; overflow-x:auto; scrollbar-width:none; flex:1; }
          .tab-row::-webkit-scrollbar{ display:none; }
          .tab-link{ flex:none; display:flex; align-items:center; gap:.3rem; padding:.35rem .65rem; border:none;
            background:transparent; cursor:pointer; border-radius:6px; font-family:var(--font-body);
            font-weight:500; font-size:.8rem; color:var(--text-secondary); transition:all .15s ease; white-space:nowrap; }
          .tab-link svg{ width:15px; height:15px; flex:none; opacity:.65; }
          .tab-link.on{ color:var(--text); background:var(--card); }
          .tab-link.on svg{ opacity:1; color:var(--accent); }
          .tab-link:hover:not(.on){ color:var(--text); background:var(--card); }
          .more-wrap{ position:relative; }
          .more-btn{ display:flex; align-items:center; gap:.25rem; padding:.35rem .55rem; border:none;
            background:transparent; cursor:pointer; border-radius:6px; font-weight:500; font-size:.8rem;
            color:var(--text-secondary); transition:all .15s ease; }
          .more-btn:hover{ color:var(--text); background:var(--card); }
          .more-btn svg{ opacity:.65; }
          .more-btn:hover svg{ opacity:1; }
          .more-drop{ position:absolute; top:calc(100% + 4px); right:0; z-index:40;
            background:var(--surface); border:1px solid var(--border); border-radius:10px;
            padding:.4rem; min-width:190px; box-shadow:0 12px 40px rgba(0,0,0,.6);
            display:flex; flex-direction:column; gap:2px; max-height:60vh; overflow-y:auto; }
          .more-drop .tab-link{ justify-content:flex-start; padding:.45rem .75rem; border-radius:6px; font-size:.8rem; }
          @media (max-width:580px){
            .nav-logo .mark{ font-size:1rem; }
            .nav-logo{ padding-right:10px; margin-right:4px; }
            .tab-link{ padding:.3rem .45rem; font-size:.74rem; }
            .tab-link svg{ width:13px; height:13px; }
          }
        `}</style>

        <div className="nav-logo" onClick={() => navigate('/')}>
          <span className="mark">Gaffer</span>
        </div>

        <div className="tab-row">
          {visibleTabs.map((t) => (
            <button key={t.to} className={`tab-link${pathname === t.to ? ' on' : ''}`} onClick={() => { setShowMenu(false); navigate(t.to); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
              {t.label}
            </button>
          ))}
          <div className="more-wrap">
            <button className="more-btn" onClick={() => setShowMenu(!showMenu)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {showMenu && (
              <div className="more-drop">
                {moreTabs.map((t) => (
                  <button key={t.to} className={`tab-link${pathname === t.to ? ' on' : ''}`} onClick={() => { setShowMenu(false); navigate(t.to); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <span className="nav-av" onClick={() => { setShowMenu(false); navigate('/profile'); }}>
          <Avatar size={28} />
        </span>
      </nav>
    </>
  );
}
