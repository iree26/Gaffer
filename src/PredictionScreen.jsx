import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import 'flag-icons/css/flag-icons.min.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import Avatar from './Avatar';


function PitchBall({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs><polygon id="pbq2" points="0,-20 19,-6.2 11.8,16.2 -11.8,16.2 -19,-6.2" /></defs>
      <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="6" />
      <g stroke="#13311F" strokeWidth="4" strokeLinecap="round">
        <line x1="100" y1="66" x2="100" y2="10" /><line x1="132.3" y1="89.5" x2="186" y2="72" />
        <line x1="120.1" y1="127.5" x2="153" y2="172" /><line x1="79.9" y1="127.5" x2="47" y2="172" />
        <line x1="67.7" y1="89.5" x2="14" y2="72" />
      </g>
      <use href="#pbq2" transform="translate(100,100) scale(1.7)" fill="#16331F" />
      <use href="#pbq2" transform="translate(137.6,48.2) rotate(36) scale(.72)" fill="#16331F" />
      <use href="#pbq2" transform="translate(160.9,119.8) rotate(108) scale(.72)" fill="#16331F" />
      <use href="#pbq2" transform="translate(100,164) rotate(180) scale(.72)" fill="#16331F" />
      <use href="#pbq2" transform="translate(39.1,119.8) rotate(252) scale(.72)" fill="#16331F" />
      <use href="#pbq2" transform="translate(62.4,48.2) rotate(324) scale(.72)" fill="#16331F" />
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

// index 0 = seeded favourite, so the gaffer can judge bold vs safe.
const GROUPS = [
  { id: "A", teams: [["Mexico","mx"],["S. Africa","za"],["S. Korea","kr"],["Czechia","cz"]] },
  { id: "B", teams: [["Canada","ca"],["Switzerland","ch"],["Qatar","qa"],["Bosnia","ba"]] },
  { id: "C", teams: [["Brazil","br"],["Morocco","ma"],["Scotland","gb-sct"],["Haiti","ht"]] },
  { id: "D", teams: [["USA","us"],["Paraguay","py"],["Australia","au"],["Türkiye","tr"]] },
  { id: "E", teams: [["Germany","de"],["Ecuador","ec"],["Ivory Coast","ci"],["Curaçao","cw"]] },
  { id: "F", teams: [["Netherlands","nl"],["Japan","jp"],["Sweden","se"],["Tunisia","tn"]] },
  { id: "G", teams: [["Belgium","be"],["Egypt","eg"],["Iran","ir"],["New Zealand","nz"]] },
  { id: "H", teams: [["Spain","es"],["Uruguay","uy"],["Saudi Arabia","sa"],["Cape Verde","cv"]] },
  { id: "I", teams: [["France","fr"],["Senegal","sn"],["Norway","no"],["Iraq","iq"]] },
  { id: "J", teams: [["Argentina","ar"],["Algeria","dz"],["Austria","at"],["Jordan","jo"]] },
  { id: "K", teams: [["Portugal","pt"],["Colombia","co"],["Uzbekistan","uz"],["DR Congo","cd"]] },
  { id: "L", teams: [["England","gb-eng"],["Croatia","hr"],["Ghana","gh"],["Panama","pa"]] },
];

// Mock final results (team index that won each group). 8 favourites, 4 upsets — a believable spread.
const RESULTS = { A:0, B:1, C:0, D:0, E:0, F:1, G:0, H:0, I:1, J:0, K:1, L:0 };

function generateVerdict(picks, expertise) {
  const byId = Object.fromEntries(GROUPS.map((g) => [g.id, g]));
  const name = (gid, ti) => byId[gid].teams[ti][0];
  const flag = (gid, ti) => byId[gid].teams[ti][1];
  const exp = expertise === "expert";

  let boldG = null, boldTi = -1, safeG = null, disG = null, upsets = 0;
  for (const [gid, ti] of Object.entries(picks)) {
    if (ti > boldTi && ti > 0) { boldTi = ti; boldG = gid; }
    if (ti === 0 && !safeG) safeG = gid;
    if (ti !== 0 && !disG) disG = gid;
    if (ti >= 2) upsets++;
  }

  let headline;
  if (upsets === 0) headline = exp ? "Safe as houses." : "Playing it safe.";
  else if (upsets <= 3) headline = "Calculated.";
  else if (upsets <= 6) headline = "Brave card.";
  else headline = "Chaos merchant.";

  const bold = boldG
    ? { label: "Boldest call", flag: flag(boldG, boldTi),
        txt: exp ? `${name(boldG, boldTi)} to win Group ${boldG}. Nobody else has that. Brave.`
                 : `${name(boldG, boldTi)} to top Group ${boldG} — a real gamble, but I like the nerve.` }
    : { label: "Boldest call", flag: null,
        txt: exp ? "Not one upset. You backed every favourite. Bold? No." : "You stuck with the favourites everywhere — safe and sensible." };

  const safe = safeG
    ? { label: "Safest call", flag: flag(safeG, 0),
        txt: exp ? `${name(safeG, 0)} in Group ${safeG}. Can't argue, they should stroll it.`
                 : `${name(safeG, 0)} in Group ${safeG} — strong pick, they're favourites for a reason.` }
    : { label: "Safest call", flag: null, txt: "Not a single favourite backed. You're all-in on upsets." };

  const disagree = disG
    ? { label: "Where I'd disagree", flag: flag(disG, 0),
        txt: exp ? `You've got ${name(disG, picks[disG])} over ${name(disG, 0)} in Group ${disG}. I'm backing ${name(disG, 0)}.`
                 : `In Group ${disG} I'd lean ${name(disG, 0)} over your ${name(disG, picks[disG])} — but prove me wrong.` }
    : { label: "Where I'd disagree", flag: null,
        txt: exp ? "Honestly? Can't fault one. You backed the favourite in every group." : "Nothing to argue with — you matched my picks across the board." };

  const closing = exp
    ? "I've logged all twelve. When the results drop, I'm coming back to see if you really know ball."
    : "I've saved your card. As results come in, I'll show you exactly how you're tracking.";

  return { headline, rows: [bold, safe, disagree], closing, disG };
}

export default function PredictionScreen() {
  const navigate = useNavigate();
  const { user, update } = useUser();
  const [picks, setPicks] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState(null);     // null | thinking | verdict | rewind | callback
  const [verdict, setVerdict] = useState(null);
  const [revealed, setRevealed] = useState(0);
  const [outcome, setOutcome] = useState(null);

  const done = Object.keys(picks).length;
  const complete = done === GROUPS.length;
  const resolving = phase === "rewind" || phase === "callback";
  const revealedCorrect = outcome ? GROUPS.slice(0, revealed).filter((g) => outcome.hits[g.id]).length : 0;

  function pick(groupId, idx) { if (submitted) return; setPicks((p) => ({ ...p, [groupId]: idx })); }

  function submit() {
    if (!complete) return;
    setSubmitted(true);
    setVerdict(generateVerdict(picks, user.expertise));
    setPhase("thinking");
    // REAL: const v = await fetch('/agent/verdict',{method:'POST',body:JSON.stringify({picks})}).then(r=>r.json());
    setTimeout(() => setPhase("verdict"), 1900);
  }

  function startRewind() {
    const hits = {};
    let correct = 0;
    for (const [gid, ti] of Object.entries(picks)) {
      const h = RESULTS[gid] === ti; hits[gid] = h; if (h) correct++;
    }
    const accuracy = correct / GROUPS.length;
    const newStars = Math.round(accuracy * 5 * 2) / 2;       // n=12 resolved → rating is fully real performance
    const baseline = user.displayStars || 0;
    const prevRank = user.rank ?? 248;
    const newRank = Math.max(1, Math.round((5 - newStars) * 900) + 12);

    const exp = user.expertise === "expert";
    const dg = verdict?.disG;
    let callback;
    if (dg && picks[dg] !== undefined) {
      const g = GROUPS.find((x) => x.id === dg);
      const userPick = g.teams[picks[dg]][0];
      const fav = g.teams[0][0];
      if (hits[dg]) callback = exp
        ? `Group ${dg}: I backed ${fav}, you stuck with ${userPick}. You were right — and I don't forget that.`
        : `Group ${dg}: I doubted your ${userPick} call. You were right. Respect, I've noted it.`;
      else callback = exp
        ? `Group ${dg}: I told you ${fav} over ${userPick}. I was right. Told you I'd remember.`
        : `Group ${dg}: I leaned ${fav} over your ${userPick}, and it landed that way. We learn.`;
    } else {
      callback = correct >= 8 ? `${correct} from 12. The table is going to like you.` : `${correct} from 12. We've got work to do — together.`;
    }

    setOutcome({ hits, correct, newStars, baseline, prevRank, newRank, callback });
    setPhase("rewind");
    setRevealed(0);
    let n = 0;
    const id = setInterval(() => {
      n += 1; setRevealed(n);
      if (n >= GROUPS.length) {
        clearInterval(id);
        update({ displayStars: newStars, rank: newRank, accuracy: Math.round(accuracy * 100), move: prevRank - newRank, picks });
        setTimeout(() => setPhase("callback"), 800);
      }
    }, 260);
  }

  return (
    <div className="gaffer-app">
      <PitchBg />
      <style>{`
        .gaffer-app{
          --ink:#0B6B3A; --deep:#075E32; --bright:#16B45F; --lime:#3FE07F; --down:#D6553F;
          --line:rgba(11,107,58,.14); --soft:#F3FAF5;
          --display:'Syne','Plus Jakarta Sans',sans-serif;
          position:relative; isolation:isolate; min-height:100svh; width:100%; background:transparent; color:var(--ink);
          font-family:'Plus Jakarta Sans',system-ui,sans-serif; padding-bottom:7rem;
        }
        .topbar{ position:sticky; top:0; z-index:20; background:rgba(255,255,255,.82); backdrop-filter:blur(12px);
          border-bottom:1px solid var(--line); padding:.85rem clamp(1rem,5vw,3rem); }
        .toprow{ display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .logo{ font-family:var(--display); font-weight:800; font-size:1.3rem; color:var(--deep); cursor:pointer; letter-spacing:-.01em; }
        .logo span{ color:var(--bright); }
        .topnav{ display:flex; align-items:center; gap:1.2rem; }
        .count{ font-weight:700; font-size:.85rem; color:var(--deep); } .count b{ color:var(--bright); }
        .tablelink{ font-weight:700; font-size:.85rem; color:var(--bright); cursor:pointer; }
        .bar{ height:7px; background:var(--soft); border-radius:999px; overflow:hidden; margin-top:.6rem; }
        .bar-fill{ height:100%; border-radius:999px; background:linear-gradient(90deg,var(--bright),var(--lime));
          width:0%; transition:width .55s cubic-bezier(.2,.8,.25,1); }
        .bar-fill.full{ background-size:200% 100%; animation:shimmer 1.6s linear infinite; }
        @keyframes shimmer{ to{ background-position:200% 0; } }

        .wrap{ position:relative; z-index:1; max-width:880px; margin:0 auto; padding:clamp(1.4rem,5vw,2.5rem) clamp(1rem,5vw,2rem) 0; }
        .h{ font-family:var(--display); font-weight:800; font-size:clamp(1.8rem,6vw,2.7rem); letter-spacing:-.02em; margin:0; animation:fadeUp .6s both; }
        .hsub{ margin:.5rem 0 1.6rem; color:var(--deep); opacity:.8; font-weight:500; animation:fadeUp .6s .08s both; }
        @keyframes fadeUp{ from{opacity:0; transform:translateY(12px);} to{opacity:1; transform:none;} }

        .grid{ display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:1rem; perspective:1200px; }
        .card{ border:1px solid var(--line); border-radius:18px; padding:1rem; background:rgba(255,255,255,.82);
          backdrop-filter:blur(8px); box-shadow:0 4px 20px rgba(7,94,50,.06); transform-origin:center top;
          animation:cardIn .6s both cubic-bezier(.2,.8,.25,1); transition:box-shadow .22s ease, transform .22s ease, background .3s; }
        .card:hover{ box-shadow:0 12px 34px rgba(7,94,50,.13); transform:translateY(-4px); }
        @keyframes cardIn{ from{opacity:0; transform:translateY(38px) rotateX(-16deg) scale(.95);} to{opacity:1; transform:none;} }
        .card.res-hit{ background:rgba(22,180,95,.12); border-color:var(--bright); }
        .card.res-miss{ background:rgba(214,85,63,.08); border-color:rgba(214,85,63,.35); }
        .card-head{ display:flex; align-items:baseline; justify-content:space-between; gap:.5rem; margin-bottom:.75rem; }
        .grp{ font-family:var(--display); font-weight:800; font-size:1.05rem; color:var(--ink); }
        .hint{ font-size:.72rem; font-weight:700; letter-spacing:.04em; color:var(--deep); opacity:.55; transition:color .3s, opacity .3s; }
        .card.decided .hint{ color:var(--bright); opacity:1; }
        .card.res-miss .hint{ color:var(--down); opacity:1; }
        .teams{ display:grid; grid-template-columns:repeat(2,1fr); gap:.5rem; }
        .team{ position:relative; overflow:hidden; display:flex; align-items:center; gap:.45rem;
          border:1.5px solid var(--line); border-radius:11px; padding:.55rem .6rem; background:#fff; cursor:pointer;
          font-family:inherit; text-align:left; transition:all .3s cubic-bezier(.2,.8,.25,1); }
        .team::before{ content:''; position:absolute; inset:0; z-index:0;
          background:linear-gradient(120deg,var(--bright),var(--lime)); transform:translateX(-101%);
          transition:transform .45s cubic-bezier(.5,0,.18,1); }
        .team::after{ content:''; position:absolute; left:50%; top:50%; width:10px; height:10px; border-radius:50%;
          background:rgba(255,255,255,.7); transform:translate(-50%,-50%) scale(0); opacity:0; }
        .team-flag,.team-name,.check,.wontag{ position:relative; z-index:1; }
        .team-flag{ font-size:1.1rem; border-radius:3px; box-shadow:0 2px 6px rgba(7,94,50,.18); transition:transform .3s; }
        .team-name{ flex:1; font-size:.8rem; font-weight:700; line-height:1.1; color:var(--ink); transition:color .25s; }
        .check{ font-weight:800; opacity:0; transform:scale(0); transition:all .25s; color:#fff; }
        .team:hover:not(.win):not(.miss):not(.actual){ border-color:var(--bright); transform:translateY(-2px); }
        .team.win{ border-color:transparent; transform:translateY(-2px) scale(1.03); box-shadow:0 8px 22px rgba(22,180,95,.4); }
        .team.win::before{ transform:translateX(0); }
        .team.win .team-name{ color:#fff; }
        .team.win .team-flag{ transform:scale(1.18); }
        .team.win .check{ opacity:1; transform:scale(1); transition-delay:.18s; }
        .team.hit{ animation:hitPulse .6s ease; }
        @keyframes hitPulse{ 0%,100%{ box-shadow:0 8px 22px rgba(22,180,95,.4); } 50%{ box-shadow:0 0 0 6px rgba(22,180,95,.35); } }
        .team.miss{ border-color:var(--down); background:linear-gradient(120deg,#E0735C,#D6553F); transform:translateY(0) scale(1); box-shadow:0 6px 18px rgba(214,85,63,.35); }
        .team.miss .team-name{ color:#fff; } .team.miss .team-flag{ transform:scale(1); }
        .team.actual{ border-color:var(--bright); box-shadow:0 0 0 2px var(--bright); }
        .wontag{ position:absolute; right:.4rem; top:50%; transform:translateY(-50%); font-size:.55rem; font-weight:800;
          letter-spacing:.08em; text-transform:uppercase; color:#fff; background:var(--bright); padding:.12rem .4rem; border-radius:999px; }
        .card.decided .team:not(.win):not(.actual):not(.miss){ opacity:.4; transform:scale(.96); filter:saturate(.55); }
        @keyframes ripple{ 0%{transform:translate(-50%,-50%) scale(0); opacity:.7;} 100%{transform:translate(-50%,-50%) scale(28); opacity:0;} }

        .submitbar{ position:fixed; left:0; right:0; bottom:0; z-index:30; display:flex; align-items:center; justify-content:space-between;
          gap:1rem; padding:1rem clamp(1rem,5vw,3rem); background:rgba(255,255,255,.9); backdrop-filter:blur(12px);
          border-top:1px solid var(--line); transform:translateY(120%); animation:barUp .5s .3s forwards cubic-bezier(.2,.8,.25,1); }
        @keyframes barUp{ to{ transform:translateY(0); } }
        .submit-label{ font-weight:700; font-size:.9rem; color:var(--deep); } .submit-label b{ color:var(--bright); }
        .submit{ border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800;
          font-size:1rem; color:#fff; background:var(--line); padding:.85rem 1.6rem; border-radius:999px; transition:all .25s ease; }
        .submit.ready{ background:var(--bright); animation:pulse 2.4s ease-in-out infinite; }
        .submit.ready:hover{ transform:translateY(-2px) scale(1.03); }
        .submit.locked{ background:var(--deep); animation:none; }
        @keyframes pulse{ 0%,100%{ box-shadow:0 6px 20px rgba(22,180,95,.3);} 50%{ box-shadow:0 8px 34px rgba(63,224,127,.65);} }

        .vbackdrop{ position:fixed; inset:0; z-index:40; display:flex; align-items:center; justify-content:center; padding:1.2rem;
          background:rgba(236,248,239,.72); backdrop-filter:blur(10px); animation:vfade .4s; }
        @keyframes vfade{ from{opacity:0;} to{opacity:1;} }
        .verdict{ width:100%; max-width:560px; text-align:center; background:rgba(255,255,255,.95); border:1px solid var(--line);
          border-radius:26px; padding:clamp(1.5rem,5vw,2.4rem); box-shadow:0 30px 90px rgba(7,94,50,.22); animation:vpop .5s cubic-bezier(.2,.8,.25,1); }
        @keyframes vpop{ from{opacity:0; transform:translateY(20px) scale(.97);} to{opacity:1; transform:none;} }
        .v-ball{ width:78px; height:78px; margin:0 auto; display:block; animation:vspin 3s linear infinite; }
        @keyframes vspin{ to{ transform:rotate(360deg); } }
        .v-think{ font-family:var(--display); font-weight:800; font-size:1.2rem; color:var(--ink); margin-top:1rem; }
        .v-think i{ animation:blink 1.2s infinite; font-style:normal; }
        .v-think i:nth-child(2){ animation-delay:.2s; } .v-think i:nth-child(3){ animation-delay:.4s; }
        @keyframes blink{ 0%,100%{ opacity:.2; } 50%{ opacity:1; } }
        .v-kicker{ font-size:.72rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--bright); }
        .v-headline{ font-family:var(--display); font-weight:800; font-size:clamp(1.8rem,6vw,2.6rem); letter-spacing:-.02em; margin:.3rem 0 1.3rem; color:var(--ink); }
        .v-rows{ display:flex; flex-direction:column; gap:.6rem; text-align:left; }
        .v-row{ display:flex; gap:.7rem; align-items:flex-start; background:var(--soft); border:1px solid var(--line);
          border-radius:14px; padding:.8rem .9rem; opacity:0; transform:translateX(-14px); animation:vrow .5s forwards cubic-bezier(.2,.8,.25,1); }
        .v-flag{ flex:none; font-size:1.2rem; border-radius:3px; box-shadow:0 2px 6px rgba(7,94,50,.18); margin-top:.1rem; }
        .v-flag.none{ color:var(--bright); }
        .v-text{ font-weight:600; color:var(--deep); line-height:1.4; font-size:.92rem; }
        .v-text b{ display:block; font-size:.66rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--bright); margin-bottom:.15rem; }
        @keyframes vrow{ to{ opacity:1; transform:none; } }
        .v-closing{ margin:1.2rem 0 0; padding:.9rem 1rem; background:rgba(22,180,95,.08); border-radius:14px;
          color:var(--deep); font-weight:600; line-height:1.45; font-size:.92rem; text-align:left; opacity:0; animation:vrow .6s .85s forwards; }
        .v-closing .remembers{ display:inline-block; font-size:.62rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
          color:var(--bright); background:#fff; border:1px solid var(--line); border-radius:999px; padding:.18rem .5rem; margin-right:.5rem; }
        .v-actions{ display:flex; gap:.8rem; justify-content:center; margin-top:1.4rem; flex-wrap:wrap; opacity:0; animation:vrow .6s 1.05s forwards; }
        .v-primary{ border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:1rem;
          color:#fff; background:var(--bright); padding:.9rem 1.7rem; border-radius:999px; transition:all .2s ease; }
        .v-primary:hover{ transform:translateY(-2px) scale(1.03); box-shadow:0 10px 30px rgba(63,224,127,.5); }
        .v-ghost{ border:1.5px solid var(--line); cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700;
          font-size:1rem; color:var(--deep); background:transparent; padding:.9rem 1.4rem; border-radius:999px; }

        /* callback star/rank delta */
        .delta{ display:flex; flex-direction:column; gap:.5rem; align-items:center; margin-bottom:1.2rem; }
        .d-stars{ display:flex; align-items:center; gap:.7rem; font-family:var(--display); font-weight:800; font-size:1.5rem; }
        .d-stars .old{ color:var(--line); }
        .d-stars .arrow{ color:var(--deep); opacity:.5; }
        .d-stars .new.up{ color:var(--bright); } .d-stars .new.down{ color:var(--down); }
        .d-rank{ font-weight:700; font-size:.9rem; color:var(--deep); }
        .d-rank b.up{ color:var(--bright); } .d-rank b.down{ color:var(--down); }

        @media (max-width:560px){ .teams{ gap:.4rem; } .team-name{ font-size:.74rem; } }
        @media (prefers-reduced-motion: reduce){
          .card,.h,.hsub,.submitbar,.verdict,.v-row,.v-closing,.v-actions{ animation:none !important; opacity:1 !important; transform:none !important; }
          .team,.team::before,.bar-fill{ transition:none !important; } .v-ball,.team.hit{ animation:none !important; }
        }
      `}</style>

      <div className="topbar">
        <div style={{ display:'flex', alignItems:'center', gap:'1.1rem' }}>
             <span className="nav" onClick={() => navigate('/predict')}>Predictions →</span>
            <Avatar size={32} />
        </div>
        <div className="toprow">
          <div className="logo" onClick={() => navigate('/')}>GAFF<span>ER</span></div>
          <div className="topnav">
            <span className="count"><b>{done}</b>/{GROUPS.length} called</span>
            <span className="tablelink" onClick={() => navigate('/leaderboard')}>Table →</span>
            <Avatar size={32} />
          </div>
        </div>
        <div className="bar"><div className={`bar-fill${complete ? " full" : ""}`} style={{ width: `${(done / GROUPS.length) * 100}%` }} /></div>
      </div>

      <main className="wrap">
        <h1 className="h">Call your group winners</h1>
        <p className="hsub">Twelve groups. Pick who tops each one. The gaffer remembers every call.</p>
        <div className="grid">
          {GROUPS.map((g, gi) => {
            const winIdx = picks[g.id];
            const decided = winIdx !== undefined;
            const shown = phase === "callback" || (phase === "rewind" && gi < revealed);
            const resolvedCard = resolving && shown && outcome;
            const actualTi = RESULTS[g.id];
            const hit = outcome && outcome.hits[g.id];
            return (
              <article key={g.id}
                className={`card${decided ? " decided" : ""}${resolvedCard ? (hit ? " res-hit" : " res-miss") : ""}`}
                style={{ animationDelay: `${gi * 0.05}s` }}>
                <div className="card-head">
                  <span className="grp">Group {g.id}</span>
                  <span className="hint">
                    {resolvedCard ? (hit ? "✓ Called it" : `Won by ${g.teams[actualTi][0]}`)
                      : decided ? `${g.teams[winIdx][0]} to top it` : "Pick the winner"}
                  </span>
                </div>
                <div className="teams">
                  {g.teams.map(([name, flag], ti) => {
                    let cls = "";
                    if (winIdx === ti) cls = resolvedCard ? (hit ? "win hit" : "miss") : "win";
                    else if (resolvedCard && actualTi === ti) cls = "actual";
                    return (
                      <button key={ti} className={`team ${cls}`} onClick={() => pick(g.id, ti)} disabled={submitted}>
                        <span className={`fi fi-${flag} team-flag`} />
                        <span className="team-name">{name}</span>
                        <span className="check">✓</span>
                        {resolvedCard && actualTi === ti && winIdx !== ti && <span className="wontag">won</span>}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <div className="submitbar">
        <span className="submit-label">
          {phase === "rewind" ? <span>Results coming in… <b>{revealedCorrect}</b> right</span>
            : submitted ? "Calls locked. The gaffer's watching."
            : complete ? "Full card — lock it in."
            : <span><b>{done}</b> of {GROUPS.length} called</span>}
        </span>
        <button className={`submit${submitted ? " locked" : complete ? " ready" : ""}`} onClick={submit} disabled={!complete || submitted}>
          {submitted ? "Locked ✓" : "Submit my calls"}
        </button>
      </div>

      {phase && phase !== "rewind" && (
        <div className="vbackdrop">
          <div className="verdict">
            {phase === "thinking" && (
              <>
                <PitchBall className="v-ball" />
                <div className="v-think">The gaffer's reading your card<span><i>.</i><i>.</i><i>.</i></span></div>
              </>
            )}
            {phase === "verdict" && (
              <>
                <div className="v-kicker">The Gaffer's Verdict</div>
                <h2 className="v-headline">{verdict.headline}</h2>
                <div className="v-rows">
                  {verdict.rows.map((r, i) => (
                    <div className="v-row" key={i} style={{ animationDelay: `${0.15 + i * 0.18}s` }}>
                      {r.flag ? <span className={`fi fi-${r.flag} v-flag`} /> : <span className="v-flag none">⚑</span>}
                      <span className="v-text"><b>{r.label}</b>{r.txt}</span>
                    </div>
                  ))}
                </div>
                <p className="v-closing"><span className="remembers">remembers</span>{verdict.closing}</p>
                <div className="v-actions">
                  <button className="v-primary" onClick={startRewind}>⏩ Fast-forward the tournament</button>
                  <button className="v-ghost" onClick={() => setPhase(null)}>Back to my card</button>
                </div>
              </>
            )}
            {phase === "callback" && outcome && (
              <>
                <div className="v-kicker">The Gaffer Remembers</div>
                <h2 className="v-headline">{outcome.correct} from 12.</h2>
                <div className="delta">
                  <div className="d-stars">
                    <span className="old">★ {outcome.baseline.toFixed(1)}</span>
                    <span className="arrow">→</span>
                    <span className={`new ${outcome.newStars >= outcome.baseline ? "up" : "down"}`}>★ {outcome.newStars.toFixed(1)}</span>
                  </div>
                  <div className="d-rank">
                    Rank #{outcome.prevRank.toLocaleString()} → #{outcome.newRank.toLocaleString()}{" "}
                    <b className={outcome.newRank < outcome.prevRank ? "up" : "down"}>
                      {outcome.newRank < outcome.prevRank ? `▲${(outcome.prevRank - outcome.newRank).toLocaleString()}` : `▼${(outcome.newRank - outcome.prevRank).toLocaleString()}`}
                    </b>
                  </div>
                </div>
                <p className="v-closing"><span className="remembers">remembers</span>{outcome.callback}</p>
                <div className="v-actions">
                  <button className="v-primary" onClick={() => navigate('/leaderboard')}>See the table</button>
                  <button className="v-ghost" onClick={() => setPhase(null)}>Review my card</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}