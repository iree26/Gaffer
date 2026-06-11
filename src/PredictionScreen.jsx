// PredictionScreen.jsx — pick the winner of all 12 groups (A–L).
// Real 2026 group draw. Two cards per row. Heavy on the animation.
// Packages already installed: flag-icons, @fontsource/syne, @fontsource/plus-jakarta-sans, react-router-dom

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'flag-icons/css/flag-icons.min.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

// [team name, flag-icons code]. Real 2026 draw.
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

export default function PredictionScreen() {
  const navigate = useNavigate();
  const [picks, setPicks] = useState({});      // { groupId: teamIndex }
  const [submitted, setSubmitted] = useState(false);

  const done = Object.keys(picks).length;
  const complete = done === GROUPS.length;

  function pick(groupId, idx) {
    if (submitted) return;
    setPicks((p) => ({ ...p, [groupId]: idx }));
  }

  function submit() {
    if (!complete) return;
    // REAL: POST each pick to /agent/predict (one Market per group). For now just lock the UI.
    setSubmitted(true);
  }

  return (
    <div className="gaffer-app">
      <style>{`
        .gaffer-app{
          --ink:#0B6B3A; --deep:#075E32; --bright:#16B45F; --lime:#3FE07F;
          --line:rgba(11,107,58,.14); --soft:#F3FAF5;
          --display:'Syne','Plus Jakarta Sans',sans-serif;
          min-height:100svh; width:100%; background:#fff; color:var(--ink);
          font-family:'Plus Jakarta Sans',system-ui,sans-serif; padding-bottom:7rem;
        }

        /* sticky progress header */
        .topbar{ position:sticky; top:0; z-index:20; background:rgba(255,255,255,.9); backdrop-filter:blur(10px);
          border-bottom:1px solid var(--line); padding:.85rem clamp(1rem,5vw,3rem); }
        .toprow{ display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .logo{ font-family:var(--display); font-weight:800; font-size:1.3rem; color:var(--deep); cursor:pointer; letter-spacing:-.01em; }
        .logo span{ color:var(--bright); }
        .count{ font-weight:700; font-size:.85rem; color:var(--deep); }
        .count b{ color:var(--bright); }
        .bar{ height:7px; background:var(--soft); border-radius:999px; overflow:hidden; margin-top:.6rem; }
        .bar-fill{ height:100%; border-radius:999px; background:linear-gradient(90deg,var(--bright),var(--lime));
          width:0%; transition:width .55s cubic-bezier(.2,.8,.25,1); }
        .bar-fill.full{ background-size:200% 100%; animation:shimmer 1.6s linear infinite; }
        @keyframes shimmer{ to{ background-position:200% 0; } }

        .wrap{ max-width:880px; margin:0 auto; padding:clamp(1.4rem,5vw,2.5rem) clamp(1rem,5vw,2rem) 0; }
        .h{ font-family:var(--display); font-weight:800; font-size:clamp(1.8rem,6vw,2.7rem); letter-spacing:-.02em; margin:0;
          animation:fadeUp .6s both; }
        .hsub{ margin:.5rem 0 1.6rem; color:var(--deep); opacity:.8; font-weight:500; animation:fadeUp .6s .08s both; }
        @keyframes fadeUp{ from{opacity:0; transform:translateY(12px);} to{opacity:1; transform:none;} }

        /* the two-per-row grid with a 3D cascade entrance */
        .grid{ display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:1rem; perspective:1200px; }
        .card{ border:1px solid var(--line); border-radius:18px; padding:1rem; background:#fff;
          box-shadow:0 4px 20px rgba(7,94,50,.05); transform-origin:center top;
          animation:cardIn .6s both cubic-bezier(.2,.8,.25,1);
          transition:box-shadow .22s ease, transform .22s ease; }
        .card:hover{ box-shadow:0 12px 34px rgba(7,94,50,.12); transform:translateY(-4px); }
        @keyframes cardIn{ from{opacity:0; transform:translateY(38px) rotateX(-16deg) scale(.95);} to{opacity:1; transform:none;} }

        .card-head{ display:flex; align-items:baseline; justify-content:space-between; gap:.5rem; margin-bottom:.75rem; }
        .grp{ font-family:var(--display); font-weight:800; font-size:1.05rem; color:var(--ink); }
        .hint{ font-size:.72rem; font-weight:700; letter-spacing:.04em; color:var(--deep); opacity:.55; transition:color .3s, opacity .3s; }
        .card.decided .hint{ color:var(--bright); opacity:1; }

        .teams{ display:grid; grid-template-columns:repeat(2,1fr); gap:.5rem; }
        .team{ position:relative; overflow:hidden; display:flex; align-items:center; gap:.45rem;
          border:1.5px solid var(--line); border-radius:11px; padding:.55rem .6rem; background:#fff; cursor:pointer;
          font-family:inherit; text-align:left; transition:all .25s cubic-bezier(.2,.8,.25,1); }
        .team::before{ content:''; position:absolute; inset:0; z-index:0;
          background:linear-gradient(120deg,var(--bright),var(--lime)); transform:translateX(-101%);
          transition:transform .45s cubic-bezier(.5,0,.18,1); }
        .team::after{ content:''; position:absolute; left:50%; top:50%; width:10px; height:10px; border-radius:50%;
          background:rgba(255,255,255,.7); transform:translate(-50%,-50%) scale(0); opacity:0; }
        .team-flag,.team-name,.check{ position:relative; z-index:1; }
        .team-flag{ font-size:1.1rem; border-radius:3px; box-shadow:0 2px 6px rgba(7,94,50,.18); transition:transform .3s; }
        .team-name{ flex:1; font-size:.8rem; font-weight:700; line-height:1.1; color:var(--ink); transition:color .25s; }
        .check{ font-weight:800; opacity:0; transform:scale(0); transition:all .25s; color:#fff; }
        .team:hover:not(.win){ border-color:var(--bright); transform:translateY(-2px); }
        .team.win{ border-color:transparent; transform:translateY(-2px) scale(1.03); box-shadow:0 8px 22px rgba(22,180,95,.4); }
        .team.win::before{ transform:translateX(0); }
        .team.win::after{ animation:ripple .65s ease-out; }
        .team.win .team-name{ color:#fff; }
        .team.win .team-flag{ transform:scale(1.18); }
        .team.win .check{ opacity:1; transform:scale(1); transition-delay:.18s; }
        .card.decided .team:not(.win){ opacity:.4; transform:scale(.96); filter:saturate(.55); }
        @keyframes ripple{ 0%{transform:translate(-50%,-50%) scale(0); opacity:.7;} 100%{transform:translate(-50%,-50%) scale(28); opacity:0;} }

        /* sticky submit bar */
        .submitbar{ position:fixed; left:0; right:0; bottom:0; z-index:30; display:flex; align-items:center; justify-content:space-between;
          gap:1rem; padding:1rem clamp(1rem,5vw,3rem); background:rgba(255,255,255,.92); backdrop-filter:blur(12px);
          border-top:1px solid var(--line); transform:translateY(120%); animation:barUp .5s .3s forwards cubic-bezier(.2,.8,.25,1); }
        @keyframes barUp{ to{ transform:translateY(0); } }
        .submit-label{ font-weight:700; font-size:.9rem; color:var(--deep); }
        .submit-label b{ color:var(--bright); }
        .submit{ border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800;
          font-size:1rem; color:#fff; background:var(--line); padding:.85rem 1.6rem; border-radius:999px;
          transition:all .25s ease; }
        .submit.ready{ background:var(--bright); animation:pulse 2.4s ease-in-out infinite; }
        .submit.ready:hover{ transform:translateY(-2px) scale(1.03); }
        .submit.locked{ background:var(--deep); animation:none; }
        @keyframes pulse{ 0%,100%{ box-shadow:0 6px 20px rgba(22,180,95,.3);} 50%{ box-shadow:0 8px 34px rgba(63,224,127,.65);} }

        @media (max-width:560px){ .teams{ gap:.4rem; } .team-name{ font-size:.74rem; } }
        @media (prefers-reduced-motion: reduce){
          .card,.h,.hsub,.submitbar{ animation:none !important; }
          .team,.team::before,.bar-fill{ transition:none !important; }
        }
      `}</style>

      <div className="topbar">
        <div className="toprow">
          <div className="logo" onClick={() => navigate('/')}>GAFF<span>ER</span></div>
          <div className="count"><b>{done}</b>/{GROUPS.length} groups called</div>
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
            return (
              <article key={g.id} className={`card${decided ? " decided" : ""}`} style={{ animationDelay: `${gi * 0.05}s` }}>
                <div className="card-head">
                  <span className="grp">Group {g.id}</span>
                  <span className="hint">{decided ? `${g.teams[winIdx][0]} to top it` : "Pick the winner"}</span>
                </div>
                <div className="teams">
                  {g.teams.map(([name, flag], ti) => (
                    <button key={ti} className={`team${winIdx === ti ? " win" : ""}`} onClick={() => pick(g.id, ti)}>
                      <span className={`fi fi-${flag} team-flag`} />
                      <span className="team-name">{name}</span>
                      <span className="check">✓</span>
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <div className="submitbar">
        <span className="submit-label">
          {submitted ? "Calls locked. The gaffer's watching." : complete ? "Full card — lock it in." : <span><b>{done}</b> of {GROUPS.length} called</span>}
        </span>
        <button className={`submit${submitted ? " locked" : complete ? " ready" : ""}`} onClick={submit} disabled={!complete || submitted}>
          {submitted ? "Locked ✓" : "Submit my calls"}
        </button>
      </div>
    </div>
  );
}