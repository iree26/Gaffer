import { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { api } from './api';
import Navbar from './Navbar';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

function PitchBall({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="6" />
      <polygon points="100,66 132.3,89.5 120.1,127.5 79.9,127.5 67.7,89.5" fill="#16331F" />
      <g stroke="#13311F" strokeWidth="4" strokeLinecap="round">
        <line x1="100" y1="66" x2="100" y2="10" /><line x1="132.3" y1="89.5" x2="186" y2="72" />
        <line x1="120.1" y1="127.5" x2="153" y2="172" /><line x1="79.9" y1="127.5" x2="47" y2="172" />
        <line x1="67.7" y1="89.5" x2="14" y2="72" />
      </g>
    </svg>
  );
}
function PitchBg() {
  return (
    <div className="pitch-bg" aria-hidden="true">
      <style>{`
        .pitch-bg{ position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none; }
        .pb-base{ position:absolute; inset:0; background:linear-gradient(160deg,#FFFFFF 0%,#E6F6EA 50%,#D2EDD9 100%); }
        .pb-stripes{ position:absolute; inset:-5%; background:repeating-linear-gradient(90deg,#EAF8ED 0 56px,#D2EBD8 56px 112px);
          opacity:.9; animation:pbDrift 40s linear infinite; }
        @keyframes pbDrift{ from{transform:translateX(0);} to{transform:translateX(112px);} }
        .pb-glow{ position:absolute; width:60vw; height:60vw; border-radius:50%; filter:blur(80px); opacity:.5;
          background:radial-gradient(circle,rgba(63,224,127,.5),rgba(63,224,127,0) 70%); }
        .pb-glow.a{ top:-18vw; right:-12vw; }
        .pb-glow.b{ bottom:-22vw; left:-15vw; background:radial-gradient(circle,rgba(22,180,95,.45),rgba(22,180,95,0) 70%); }
        @media (prefers-reduced-motion: reduce){ .pb-stripes{ animation:none !important; } }
      `}</style>
      <div className="pb-base" /><div className="pb-stripes" />
      <div className="pb-glow a" /><div className="pb-glow b" />
    </div>
  );
}

function Stars({ value = 0 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="pstars">
      {[0,1,2,3,4].map((i) => (
        <span key={i} className={i < full ? "s on" : i === full && half ? "s half" : "s"}>★</span>
      ))}
    </span>
  );
}
function ballColor(name) {
  const n = name || "?";
  const h = Math.abs([...n].reduce((a, ch) => ch.charCodeAt(0) + ((a << 5) - a), 0)) % 360;
  return `hsl(${h} 55% 42%)`;
}

export default function Profile() {
  const { user } = useUser();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getProfile(user.displayName);
        if (!data || typeof data !== 'object') { setErr(true); }
        else setP(data);
      } catch (e) { setErr(true); }
      finally { setLoading(false); }
    })();
  }, [user.displayName]);

  const g = (obj, ...keys) => { for (const k of keys) if (obj && obj[k] !== undefined) return obj[k]; return undefined; };
  const stars = g(p, 'stars', 'displayStars') ?? user.displayStars ?? 0;
  const rank = g(p, 'rank') ?? user.rank ?? '—';
  const accuracy = g(p, 'accuracy') ?? '—';
  const streak = g(p, 'current_streak', 'currentStreak') ?? 0;
  const bestStreak = g(p, 'best_streak', 'bestStreak') ?? 0;
  const predictions = g(p, 'predictions_count', 'predictionsCount') ?? 0;
  const correct = g(p, 'correct_predictions', 'correctPredictions') ?? 0;
  const expertise = g(p, 'expertise') ?? user.expertise ?? '—';
  const badges = g(p, 'badges') ?? [];

  return (
    <div className="gaffer-app">
      <PitchBg />
      <Navbar />
      <style>{`
        .gaffer-app{ --ink:#0B6B3A; --deep:#075E32; --bright:#16B45F; --lime:#3FE07F; --line:rgba(11,107,58,.14); --soft:#F3FAF5;
          --display:'Syne','Plus Jakarta Sans',sans-serif;
          position:relative; isolation:isolate; min-height:100svh; width:100%; background:transparent; color:var(--ink);
          font-family:'Plus Jakarta Sans',system-ui,sans-serif; padding-bottom:4rem; }
        .wrap{ position:relative; z-index:1; max-width:680px; margin:0 auto; padding:0 clamp(1rem,5vw,2rem); }
        .loading,.errbox{ text-align:center; color:var(--deep); font-weight:600; padding:3rem 1rem; }
        .errbox b{ display:block; font-family:var(--display); font-weight:800; font-size:1.2rem; color:var(--ink); margin-bottom:.4rem; }
        .head{ display:flex; align-items:center; gap:1.1rem; margin-bottom:1.6rem; }
        .pav{ width:72px; height:72px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;
          font-size:34px; box-shadow:0 6px 18px rgba(7,94,50,.25); flex:none; }
        .who h1{ font-family:var(--display); font-weight:800; font-size:1.9rem; margin:0; letter-spacing:-.02em; }
        .who .meta{ font-weight:700; font-size:.85rem; color:var(--deep); opacity:.7; text-transform:capitalize; }
        .statgrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:.8rem; margin-bottom:1.6rem; }
        .stat{ background:rgba(255,255,255,.78); backdrop-filter:blur(8px); border:1px solid var(--line); border-radius:16px; padding:1.1rem .8rem; text-align:center; }
        .stat .v{ font-family:var(--display); font-weight:800; font-size:1.6rem; color:var(--deep); line-height:1; }
        .stat .l{ font-size:.7rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--bright); margin-top:.4rem; }
        .pstars{ display:inline-flex; gap:.1rem; font-size:1.3rem; }
        .pstars .s{ color:var(--line); } .pstars .s.on{ color:var(--bright); }
        .pstars .s.half{ background:linear-gradient(90deg,var(--bright) 50%,var(--line) 50%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .section-label{ font-size:.72rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--bright); margin:1.6rem 0 .7rem; }
        .badges{ display:flex; flex-wrap:wrap; gap:.5rem; }
        .badge{ background:rgba(255,255,255,.8); border:1px solid var(--line); border-radius:999px; padding:.5rem .9rem; font-weight:700; font-size:.85rem; color:var(--deep); }
        .empty{ color:var(--deep); opacity:.6; font-weight:600; font-size:.9rem; }
      `}</style>

      <main className="wrap">
        {loading ? (
          <div className="loading">Loading your profile…</div>
        ) : err ? (
          <div className="errbox">
            <b>Profile not ready yet</b>
            The profile data isn't coming through from the server yet.
          </div>
        ) : (
          <>
            <div className="head">
              <span className="pav" style={{ background: ballColor(user.displayName) }}>{user.avatarEmblem || '⚽'}</span>
              <div className="who">
                <h1>{user.displayName}</h1>
                <div className="meta">{expertise} · {accuracy} accuracy</div>
              </div>
            </div>

            <div className="statgrid">
              <div className="stat"><div className="v"><Stars value={stars} /></div><div className="l">Stars</div></div>
              <div className="stat"><div className="v">#{typeof rank === 'number' ? rank.toLocaleString() : rank}</div><div className="l">Rank</div></div>
              <div className="stat"><div className="v">{streak}🔥</div><div className="l">Streak</div></div>
              <div className="stat"><div className="v">{predictions}</div><div className="l">Calls made</div></div>
              <div className="stat"><div className="v">{correct}</div><div className="l">Correct</div></div>
              <div className="stat"><div className="v">{bestStreak}</div><div className="l">Best streak</div></div>
            </div>

            <div className="section-label">Badges</div>
            {badges.length ? (
              <div className="badges">
                {badges.map((b, i) => (<span className="badge" key={i}>{typeof b === 'string' ? b : (b.label || b.name)}</span>))}
              </div>
            ) : (
              <p className="empty">No badges yet. Make some calls and start earning them.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}