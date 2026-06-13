import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

/* ---- baked-in pitch background ---- */
function PitchBall({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs><polygon id="lbp" points="0,-20 19,-6.2 11.8,16.2 -11.8,16.2 -19,-6.2" /></defs>
      <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="6" />
      <g stroke="#13311F" strokeWidth="4" strokeLinecap="round">
        <line x1="100" y1="66" x2="100" y2="10" /><line x1="132.3" y1="89.5" x2="186" y2="72" />
        <line x1="120.1" y1="127.5" x2="153" y2="172" /><line x1="79.9" y1="127.5" x2="47" y2="172" />
        <line x1="67.7" y1="89.5" x2="14" y2="72" />
      </g>
      <use href="#lbp" transform="translate(100,100) scale(1.7)" fill="#16331F" />
      <use href="#lbp" transform="translate(137.6,48.2) rotate(36) scale(.72)" fill="#16331F" />
      <use href="#lbp" transform="translate(160.9,119.8) rotate(108) scale(.72)" fill="#16331F" />
      <use href="#lbp" transform="translate(100,164) rotate(180) scale(.72)" fill="#16331F" />
      <use href="#lbp" transform="translate(39.1,119.8) rotate(252) scale(.72)" fill="#16331F" />
      <use href="#lbp" transform="translate(62.4,48.2) rotate(324) scale(.72)" fill="#16331F" />
      <ellipse cx="72" cy="64" rx="34" ry="20" fill="#fff" opacity=".28" />
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
        .pb-pitch{ position:absolute; inset:0; width:100%; height:100%; opacity:.9; }
        .pb-sweep{ position:absolute; top:-40%; left:-30%; width:60%; height:180%;
          background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,.5),rgba(255,255,255,0));
          transform:rotate(8deg); filter:blur(8px); animation:pbSweep 14s ease-in-out infinite; }
        @keyframes pbSweep{ 0%{left:-40%;} 50%{left:90%;} 100%{left:-40%;} }
        .pb-glow{ position:absolute; width:60vw; height:60vw; border-radius:50%; filter:blur(80px); opacity:.5;
          background:radial-gradient(circle,rgba(63,224,127,.5),rgba(63,224,127,0) 70%); animation:pbGlow 18s ease-in-out infinite; }
        .pb-glow.a{ top:-18vw; right:-12vw; }
        .pb-glow.b{ bottom:-22vw; left:-15vw; animation-duration:24s; animation-direction:reverse;
          background:radial-gradient(circle,rgba(22,180,95,.45),rgba(22,180,95,0) 70%); }
        @keyframes pbGlow{ 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(3vw,2vw) scale(1.12);} }
        .pb-ball{ position:absolute; opacity:.22; animation:pbRoll 28s linear infinite; }
        .pb-ball.big{ width:42vmin; height:42vmin; right:-10vmin; top:6vh; }
        .pb-ball.small{ width:18vmin; height:18vmin; left:-4vmin; bottom:7vh; opacity:.16; animation-duration:36s; animation-direction:reverse; }
        @keyframes pbRoll{ to{transform:rotate(360deg);} }
        @media (prefers-reduced-motion: reduce){ .pb-stripes,.pb-sweep,.pb-glow,.pb-ball{ animation:none !important; } }
      `}</style>
      <div className="pb-base" /><div className="pb-stripes" />
      <svg className="pb-pitch" viewBox="0 0 1050 680" preserveAspectRatio="xMidYMid slice"
           fill="none" stroke="rgba(11,107,58,.22)" strokeWidth="3">
        <rect x="20" y="20" width="1010" height="640" /><line x1="525" y1="20" x2="525" y2="660" />
        <circle cx="525" cy="340" r="90" /><circle cx="525" cy="340" r="5" fill="rgba(11,107,58,.22)" stroke="none" />
        <rect x="20" y="138" width="165" height="403" /><rect x="20" y="248" width="55" height="183" />
        <path d="M185,267.5 A91,91 0 0 1 185,412.5" />
        <rect x="865" y="138" width="165" height="403" /><rect x="975" y="248" width="55" height="183" />
        <path d="M865,267.5 A91,91 0 0 0 865,412.5" />
      </svg>
      <div className="pb-sweep" /><div className="pb-glow a" /><div className="pb-glow b" />
      <PitchBall className="pb-ball big" /><PitchBall className="pb-ball small" />
    </div>
  );
}

const TOP = [
  { rank: 1, name: "adrian_picks", stars: 5.0, accuracy: 92, move: 0 },
  { rank: 2, name: "thegaffer_og", stars: 4.5, accuracy: 88, move: 2 },
  { rank: 3, name: "mootilateral", stars: 4.5, accuracy: 86, move: -1 },
  { rank: 4, name: "kola_calls", stars: 4.0, accuracy: 81, move: 1 },
  { rank: 5, name: "zara.b", stars: 4.0, accuracy: 79, move: -2 },
  { rank: 6, name: "the_oracle", stars: 4.0, accuracy: 78, move: 3 },
  { rank: 7, name: "muktar_m", stars: 3.5, accuracy: 74, move: 0 },
];

const BOTTOM = [
  { rank: 5010, name: "coinflip_kev", stars: 1.5, accuracy: 24, move: -4 },
  { rank: 5011, name: "always_wrong", stars: 1.0, accuracy: 19, move: 1 },
  { rank: 5012, name: "vibes_only", stars: 1.0, accuracy: 15, move: -2 },
];

function Stars({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={i < full ? "s on" : i === full && half ? "s half" : "s"}>★</span>
      ))}
    </span>
  );
}

function Move({ n }) {
  if (n === 0) return <span className="move same">—</span>;
  if (n > 0) return <span className="move up">▲{n}</span>;
  return <span className="move down">▼{Math.abs(n)}</span>;
}

function Row({ p, you }) {
  return (
    <div className={`row${you ? " you" : ""}`}>
      <span className="rk">{p.rank.toLocaleString()}</span>
      <span className="nm">{p.name}{p.rank === 1 && <span className="crown">♔</span>}</span>
      <Stars value={p.stars} />
      <span className="acc">{p.accuracy ? `${p.accuracy}%` : "—"}</span>
      <Move n={p.move} />
    </div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useUser();

  const YOU = {
    rank: user.rank ?? 248,
    name: `${user.displayName} (you)`,
    stars: user.displayStars || 0,
    accuracy: user.accuracy ?? 0,
    move: user.move ?? 0,
  };

  const podium = TOP.slice(0, 3);
  const rest = TOP.slice(3);

  return (
    <div className="gaffer-app">
      <PitchBg />
      <style>{`
        .gaffer-app{
          --ink:#0B6B3A; --deep:#075E32; --bright:#16B45F; --lime:#3FE07F;
          --line:rgba(11,107,58,.14); --soft:#F3FAF5; --down:#D6553F;
          --display:'Syne','Plus Jakarta Sans',sans-serif;
          position:relative; isolation:isolate; min-height:100svh; width:100%; background:transparent; color:var(--ink);
          font-family:'Plus Jakarta Sans',system-ui,sans-serif; padding-bottom:4rem;
        }
        .topbar{ position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between;
          background:rgba(255,255,255,.82); backdrop-filter:blur(12px); border-bottom:1px solid var(--line);
          padding:.85rem clamp(1rem,5vw,3rem); }
        .logo{ font-family:var(--display); font-weight:800; font-size:1.3rem; color:var(--deep); cursor:pointer; }
        .logo span{ color:var(--bright); }
        .nav{ font-weight:700; font-size:.85rem; color:var(--bright); cursor:pointer; }

        .wrap{ position:relative; z-index:1; max-width:720px; margin:0 auto; padding:clamp(1.4rem,5vw,2.5rem) clamp(1rem,5vw,2rem) 0; }
        .h{ font-family:var(--display); font-weight:800; font-size:clamp(1.8rem,6vw,2.7rem); letter-spacing:-.02em; margin:0; animation:fadeUp .6s both; }
        .hsub{ margin:.5rem 0 1.8rem; color:var(--deep); opacity:.8; font-weight:500; animation:fadeUp .6s .08s both; }
        @keyframes fadeUp{ from{opacity:0; transform:translateY(12px);} to{opacity:1; transform:none;} }

        .podium{ display:grid; grid-template-columns:1fr 1.15fr 1fr; gap:.7rem; align-items:end; margin-bottom:1.6rem; }
        .pod{ background:rgba(255,255,255,.82); backdrop-filter:blur(8px); border:1px solid var(--line); border-radius:18px;
          padding:1rem .7rem; text-align:center; box-shadow:0 8px 26px rgba(7,94,50,.08);
          opacity:0; transform:translateY(24px) scale(.95); animation:podPop .6s forwards cubic-bezier(.2,.7,.2,1.3); }
        .pod.first{ padding-top:1.5rem; border-color:var(--bright); box-shadow:0 14px 36px rgba(22,180,95,.22); }
        .pod:nth-child(1){ animation-delay:.15s; } .pod:nth-child(2){ animation-delay:.05s; } .pod:nth-child(3){ animation-delay:.25s; }
        @keyframes podPop{ to{ opacity:1; transform:none; } }
        .medal{ font-size:1.5rem; line-height:1; }
        .pod.first .medal{ font-size:1.9rem; animation:bobCrown 2.4s ease-in-out infinite; }
        @keyframes bobCrown{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-5px); } }
        .pod .pname{ font-family:var(--display); font-weight:700; font-size:.92rem; margin:.4rem 0 .15rem; color:var(--ink);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .pod .pacc{ font-size:.72rem; font-weight:700; color:var(--deep); opacity:.7; }

        .section-label{ font-size:.72rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--bright); margin:1.4rem 0 .6rem; }

        .list{ display:flex; flex-direction:column; gap:.4rem; }
        .row{ display:grid; grid-template-columns:2.6rem 1fr auto 2.6rem 2.2rem; align-items:center; gap:.6rem;
          background:rgba(255,255,255,.74); backdrop-filter:blur(8px); border:1px solid var(--line); border-radius:13px;
          padding:.7rem .9rem; transition:transform .18s ease, box-shadow .18s ease;
          opacity:0; transform:translateY(12px); animation:rowIn .45s forwards; }
        .list .row:nth-child(1){ animation-delay:.04s; } .list .row:nth-child(2){ animation-delay:.09s; }
        .list .row:nth-child(3){ animation-delay:.14s; } .list .row:nth-child(4){ animation-delay:.19s; }
        .list .row:nth-child(5){ animation-delay:.24s; }
        @keyframes rowIn{ to{ opacity:1; transform:none; } }
        .row:hover{ transform:translateY(-2px); box-shadow:0 8px 22px rgba(7,94,50,.1); }
        .row.you{ border-color:var(--bright); background:rgba(22,180,95,.1); }
        .rk{ font-weight:800; font-size:.85rem; color:var(--deep); opacity:.75; }
        .nm{ font-weight:700; font-size:.92rem; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .crown{ color:var(--bright); margin-left:.35rem; }
        .stars{ display:inline-flex; gap:.05rem; }
        .stars .s{ color:var(--line); font-size:.85rem; }
        .stars .s.on{ color:var(--bright); }
        .stars .s.half{ background:linear-gradient(90deg,var(--bright) 50%,var(--line) 50%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .acc{ font-size:.82rem; font-weight:700; color:var(--deep); text-align:right; }
        .move{ font-size:.78rem; font-weight:800; text-align:right; }
        .move.up{ color:var(--bright); } .move.down{ color:var(--down); } .move.same{ color:var(--line); }

        @media (prefers-reduced-motion: reduce){
          .h,.hsub,.pod,.row{ animation:none !important; opacity:1 !important; transform:none !important; }
          .pod.first .medal{ animation:none !important; }
        }
      `}</style>

      <div className="topbar">
        <span className="logo" onClick={() => navigate('/')}>GAFF<span>ER</span></span>
        <span className="nav" onClick={() => navigate('/predict')}>Predictions →</span>
      </div>

      <main className="wrap">
        <h1 className="h">The table</h1>
        <p className="hsub">Stars are earned, not claimed. Climb by calling it right.</p>

        <div className="podium">
          {[podium[1], podium[0], podium[2]].map((p) => (
            <div key={p.rank} className={`pod${p.rank === 1 ? " first" : ""}`}>
              <div className="medal">{p.rank === 1 ? "♔" : p.rank === 2 ? "🥈" : "🥉"}</div>
              <div className="pname">{p.name}</div>
              <Stars value={p.stars} />
              <div className="pacc">{p.accuracy}%</div>
            </div>
          ))}
        </div>

        <div className="section-label">Top callers</div>
        <div className="list">
          {rest.map((p) => <Row key={p.rank} p={p} />)}
          <Row p={YOU} you />
        </div>

        <div className="section-label">Bottom of the table</div>
        <div className="list">
          {BOTTOM.map((p) => <Row key={p.rank} p={p} />)}
        </div>
      </main>
    </div>
  );
}