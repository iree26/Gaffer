import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { api } from './api';
import Navbar from './Navbar';
import GafferBackground from './GafferBackground';
import 'flag-icons/css/flag-icons.min.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

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

const FALLBACK_GROUPS = [
  { id: "m_grpA", category: "GROUP_WINNER", title: "Group A", options: [
    {id:"a0",label:"Mexico",flag:"mx"},{id:"a1",label:"S. Korea",flag:"kr"},{id:"a2",label:"S. Africa",flag:"za"},{id:"a3",label:"Czechia",flag:"cz"}] },
  { id: "m_grpB", category:"GROUP_WINNER", title:"Group B", options:[
    {id:"b0",label:"Canada",flag:"ca"},{id:"b1",label:"Switzerland",flag:"ch"},{id:"b2",label:"Qatar",flag:"qa"},{id:"b3",label:"Bosnia",flag:"ba"}] },
];

// Creative, matchup-aware reaction the gaffer gives the moment you pick.
// Banter + a real football observation, varied by whether you backed the favourite or an upset.
function localReaction(group, optIndex, expertise) {
  const teams = group.options.map((o) => o.label);
  const pick = teams[optIndex];
  const fav = teams[0];
  const rival = teams[1] || teams[0];
  const exp = expertise === "expert";
  const FAV_LINES = [
    `${pick} to top ${group.title}. Safe hands, but ${rival} won't roll over.`,
    `Hard to argue ${pick} in ${group.title}. Just don't sleep on ${rival}.`,
    `${pick}, the obvious call. ${exp ? "I expected more nerve from you." : "Solid, sensible, no notes."}`,
    `Backing ${pick}? The bookies agree. ${rival}'s the banana skin though.`,
  ];
  const UPSET_LINES = [
    `${pick} over ${fav} in ${group.title}? Bold. I respect a gambler.`,
    `Ooh, ${pick} to upset ${fav}. ${exp ? "You see something I don't?" : "Brave, I like it."}`,
    `${pick} winning ${group.title} means ${fav} go home early. Spicy.`,
    `Calling ${pick} ahead of ${fav}, that's a statement. The table will remember it.`,
  ];
  const pool = optIndex === 0 ? FAV_LINES : UPSET_LINES;
  // deterministic pick so it stays stable per group, not random each render
  const seed = group.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + optIndex;
  return pool[seed % pool.length];
}

export default function PredictionScreen() {
  const navigate = useNavigate();
  const { user, update } = useUser();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState({});
  const [pickIndex, setPickIndex] = useState({});
  const [agentReplies, setAgentReplies] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [revealed, setRevealed] = useState(0);
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMarkets();
        const list = (data.markets || data || []).filter((m) => m.category === "GROUP_WINNER" || /group/i.test(m.title));
        setGroups(list.length ? list : FALLBACK_GROUPS);
      } catch {
        setGroups(FALLBACK_GROUPS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const done = Object.keys(picks).length;
  const complete = groups.length > 0 && done === groups.length;
  const resolving = phase === "rewind" || phase === "callback";

  async function pick(market, option, optIndex) {
    if (submitted) return;
    setPicks((p) => ({ ...p, [market.id]: option.id }));
    setPickIndex((p) => ({ ...p, [market.id]: optIndex }));
    setAgentReplies((r) => ({ ...r, [market.id]: { text: "", loading: true } }));
    try {
      const res = await api.agentPredict(user.displayName, market.id, option.id, "");
      const live = res.agentReply || res.reply || "";
      // use the live reply; if it's empty or the generic repeated line, fall back to a creative local one
      const generic = /interesting pick|what is your reasoning/i.test(live);
      const text = (!live || generic) ? localReaction(market, optIndex, user.expertise) : live;
      setAgentReplies((r) => ({ ...r, [market.id]: { text, loading: false } }));
      if (res.user) update({ displayStars: res.user.displayStars ?? user.displayStars, rank: res.user.rank ?? user.rank });
    } catch {
      setAgentReplies((r) => ({ ...r, [market.id]: { text: localReaction(market, optIndex, user.expertise), loading: false } }));
    }
  }

  function generateVerdict() {
    const exp = user.expertise === "expert";
    let boldG = null, boldName = "", safeName = "", upsets = 0, disG = null, disName = "", disFav = "";
    for (const g of groups) {
      const ti = pickIndex[g.id];
      if (ti === undefined) continue;
      const label = g.options[ti]?.label;
      if (ti > 0) { upsets++; if (!boldG) { boldG = g; boldName = label; } if (!disG) { disG = g; disName = label; disFav = g.options[0]?.label; } }
      if (ti === 0 && !safeName) safeName = label;
    }
    const headline = upsets === 0 ? (exp ? "Safe as houses." : "Playing it safe.") : upsets <= 3 ? "Calculated." : upsets <= 6 ? "Brave card." : "Chaos merchant.";
    const rows = [
      { label: "Boldest call", txt: boldName ? `${boldName} to top ${boldG.title}. Brave.` : "You backed every favourite. Bold? No." },
      { label: "Safest call", txt: safeName ? `${safeName} — can't argue with that one.` : "Not one favourite backed. All-in on chaos." },
      { label: "Where I'd disagree", txt: disName ? `You've got ${disName} over ${disFav} in ${disG.title}. I'm backing ${disFav}.` : "Honestly? Can't fault one." },
    ];
    const closing = exp ? "I've logged all twelve. When results drop, I'm coming back to see if you really know ball."
                        : "I've saved your card. As results come in, I'll show you how you're tracking.";
    return { headline, rows, closing, disG, disName, disFav };
  }

  function submit() {
    if (!complete) return;
    setSubmitted(true);
    setVerdict(generateVerdict());
    setPhase("thinking");
    setTimeout(() => setPhase("verdict"), 1700);
  }

  // REAL rewind: trigger resolution on the backend, then read true stars/rank from /user.
  async function startRewind() {
    // build the results map the demo will resolve with.
    // CONFIRM AGAINST /docs: backend expects { marketId: winningOptionId }.
    // For the demo we declare the favourite (option 0) the winner of each group.
    const results = {};
    groups.forEach((g) => { results[g.id] = g.options[0]?.id; });

    setPhase("rewind"); setRevealed(0);

    // fire the real resolution (don't block the reveal animation on it)
    const resolvePromise = api.resolveMarketsBulk(results).catch(() => null);

    // compute the per-card hit/miss display from the same results we sent
    const hits = {};
    let correct = 0;
    groups.forEach((g) => {
      const ti = pickIndex[g.id];
      const winnerId = results[g.id];
      const h = g.options[ti]?.id === winnerId;
      hits[g.id] = { hit: h, winnerLabel: g.options.find((o) => o.id === winnerId)?.label };
      if (h) correct++;
    });

    const baseline = user.displayStars || 0;
    const prevRank = user.rank ?? 248;

    // animate the reveal
    let n = 0;
    const id = setInterval(async () => {
      n++; setRevealed(n);
      if (n >= groups.length) {
        clearInterval(id);
        await resolvePromise;
        // pull TRUE stars/rank from the backend so it matches the leaderboard
        let newStars, newRank;
        try {
          const me = await api.getUser(user.displayName);
          newStars = me.displayStars ?? me.stars;
          newRank = me.rank;
        } catch { /* fall through to local */ }
        if (newStars === undefined) {
          const accuracy = correct / groups.length;
          newStars = Math.max(0.5, Math.round(accuracy * 5 * 2) / 2);
          newRank = Math.max(1, Math.round((5 - newStars) * 900) + 12);
        }
        const v = verdict;
        let callback;
        if (v?.disG) {
          const h = hits[v.disG.id]?.hit;
          callback = h ? `${v.disG.title}: I backed ${v.disFav}, you stuck with ${v.disName}. You were right — and I don't forget that.`
                       : `${v.disG.title}: I told you ${v.disFav} over ${v.disName}. I was right. Told you I'd remember.`;
        } else callback = `${correct} from ${groups.length}. The table will judge you.`;

        setOutcome({ hits, correct, newStars, newRank, baseline, prevRank, callback });
        update({ displayStars: newStars, rank: newRank, accuracy: Math.round((correct/groups.length)*100), move: prevRank - newRank });
        setTimeout(() => setPhase("callback"), 800);
      }
    }, 240);
  }

  if (loading) {
    return (
      <div className="gaffer-app"><GafferBackground />
        <style>{`.gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-family:var(--font-body);}
          .ld{font-family:var(--font-display);font-weight:800;color:var(--text);font-size:1.2rem;text-align:center;}
          .ld svg{width:70px;height:70px;display:block;margin:0 auto 1rem;animation:s 2.4s linear infinite;}@keyframes s{to{transform:rotate(360deg);}}`}</style>
        <div className="ld"><PitchBall /> Waking the gaffer…</div>
      </div>
    );
  }

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{
          position:relative; isolation:isolate; min-height:100svh; width:100%; background:var(--bg); color:var(--text);
          font-family:var(--font-body); padding-bottom:7rem;
        }
        .wrap{ position:relative; z-index:1; max-width:880px; margin:0 auto; padding:0 clamp(1rem,5vw,2rem); }
        .h{ font-family:var(--font-display); font-weight:800; font-size:clamp(1.8rem,6vw,2.7rem); letter-spacing:-.02em; margin:0; }
        .hsub{ margin:.5rem 0 1.2rem; color:var(--text-secondary); opacity:.8; font-weight:500; }
        .pbar{ height:7px; background:var(--border); border-radius:8px; overflow:hidden; margin:0 0 .5rem; }
        .pbar i{ display:block; height:100%; border-radius:8px; background:var(--accent); transition:width .55s cubic-bezier(.2,.8,.25,1); }
        .pcount{ margin:0 0 1.4rem; font-weight:700; font-size:.85rem; color:var(--text-secondary); }
        .pcount b{ color:var(--accent); }
        .grid{ display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:1rem; perspective:1200px; }
        .card{ border:1px solid var(--border); border-radius:8px; padding:1rem; background:var(--card);
          transition:box-shadow .22s ease, transform .22s ease, background .3s; }
        .card:hover{ box-shadow:0 8px 24px rgba(0,0,0,.3); transform:translateY(-4px); }
        .card.res-hit{ background:var(--accent-muted); border-color:var(--accent); }
        .card.res-miss{ background:rgba(255,59,48,.08); border-color:rgba(255,59,48,.35); }
        .card-head{ display:flex; align-items:baseline; justify-content:space-between; gap:.5rem; margin-bottom:.75rem; }
        .grp{ font-family:var(--font-display); font-weight:800; font-size:1.05rem; color:var(--text); }
        .hint{ font-size:.72rem; font-weight:700; color:var(--text-secondary); opacity:.55; transition:color .3s, opacity .3s; }
        .card.res-miss .hint{ color:var(--danger); opacity:1; }
        .teams{ display:grid; grid-template-columns:repeat(2,1fr); gap:.5rem; }
        .team{ position:relative; overflow:hidden; display:flex; align-items:center; gap:.45rem; border:1.5px solid var(--border);
          border-radius:8px; padding:.55rem .6rem; background:var(--surface); cursor:pointer; font-family:inherit; text-align:left; transition:all .25s cubic-bezier(.2,.8,.25,1); }
        .team::before{ content:''; position:absolute; inset:0; z-index:0; background:var(--accent); transform:translateX(-101%); transition:transform .45s cubic-bezier(.5,0,.18,1); }
        .team-flag,.team-name,.check,.wontag{ position:relative; z-index:1; }
        .team-flag{ font-size:1.1rem; border-radius:3px; transition:transform .3s; }
        .team-name{ flex:1; font-size:.8rem; font-weight:700; line-height:1.1; color:var(--text); transition:color .25s; }
        .check{ font-weight:800; opacity:0; transform:scale(0); transition:all .25s; color:#fff; }
        .team:hover:not(.win):not(.miss):not(.actual){ border-color:var(--accent); transform:translateY(-2px); }
        .team.win{ border-color:var(--accent); transform:translateY(-2px) scale(1.03); box-shadow:0 8px 22px rgba(245,197,24,.4); }
        .team.win::before{ transform:translateX(0); } .team.win .team-name{ color:#fff; } .team.win .team-flag{ transform:scale(1.18); }
        .team.win .check{ opacity:1; transform:scale(1); transition-delay:.18s; }
        .team.miss{ border-color:var(--danger); background:linear-gradient(120deg,var(--danger),rgba(255,59,48,.8)); box-shadow:0 6px 18px rgba(255,59,48,.35); }
        .team.miss .team-name{ color:#fff; }
        .team.actual{ border-color:var(--accent); box-shadow:0 0 0 2px var(--accent); }
        .wontag{ position:absolute; right:.4rem; top:50%; transform:translateY(-50%); font-size:.55rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#fff; background:var(--accent); padding:.12rem .4rem; border-radius:4px; }
        .agent{ margin-top:.7rem; display:flex; gap:.5rem; align-items:flex-start; background:var(--card); border-radius:8px; padding:.6rem .7rem; animation:aIn .35s ease; }
        @keyframes aIn{ from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:none;} }
        .agent .dot{ flex:none; width:.6rem; height:.6rem; border-radius:50%; background:var(--accent); margin-top:.3rem; box-shadow:0 0 0 4px var(--accent-muted); }
        .agent .atext{ font-size:.82rem; font-weight:600; color:var(--text-secondary); line-height:1.4; }
        .agent .atext i{ animation:blink 1.2s infinite; font-style:normal; } .agent .atext i:nth-child(2){animation-delay:.2s;} .agent .atext i:nth-child(3){animation-delay:.4s;}
        @keyframes blink{0%,100%{opacity:.2;}50%{opacity:1;}}
        .chatlink{ display:block; margin-top:.5rem; border:none; background:transparent; cursor:pointer; font:inherit;
          font-weight:800; font-size:.74rem; letter-spacing:.03em; color:var(--accent); padding:0; }
        .chatlink:hover{ text-decoration:underline; }
        .submitbar{ position:fixed; left:50%; transform:translateX(-50%); bottom:14px; z-index:30; width:min(720px, calc(100% - 20px));
          display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.8rem 1rem .8rem 1.3rem;
          background:var(--surface); border:1px solid var(--border); border-radius:8px; }
        .submit-label{ font-weight:700; font-size:.88rem; color:var(--text-secondary); } .submit-label b{ color:var(--accent); }
        .submit{ border:none; cursor:pointer; font-family:var(--font-body); font-weight:700; font-size:1rem; color:#000; background:var(--accent); padding:.8rem 1.5rem; border-radius:8px; transition:all .25s ease; }
        .submit.ready{ background:var(--accent-hover); animation:pulse 2.4s ease-in-out infinite; } .submit.ready:hover{ transform:translateY(-2px) scale(1.03); } .submit.locked{ background:var(--text-tertiary); animation:none; }
        @keyframes pulse{ 0%,100%{ box-shadow:0 6px 20px rgba(245,197,24,.3);} 50%{ box-shadow:0 8px 34px rgba(245,197,24,.65);} }
        .vbackdrop{ position:fixed; inset:0; z-index:40; display:flex; align-items:center; justify-content:center; padding:1.2rem; background:rgba(0,0,0,.72); animation:vfade .4s; }
        @keyframes vfade{ from{opacity:0;} to{opacity:1;} }
        .verdict{ width:100%; max-width:560px; text-align:center; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:clamp(1.5rem,5vw,2.4rem); animation:vpop .5s cubic-bezier(.2,.8,.25,1); }
        @keyframes vpop{ from{opacity:0; transform:translateY(20px) scale(.97);} to{opacity:1; transform:none;} }
        .v-ball{ width:78px; height:78px; margin:0 auto; display:block; animation:vspin 3s linear infinite; } @keyframes vspin{ to{ transform:rotate(360deg); } }
        .v-think{ font-family:var(--font-display); font-weight:800; font-size:1.2rem; color:var(--text); margin-top:1rem; }
        .v-kicker{ font-size:.72rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); }
        .v-headline{ font-family:var(--font-display); font-weight:800; font-size:clamp(1.8rem,6vw,2.6rem); letter-spacing:-.02em; margin:.3rem 0 1.3rem; color:var(--text); }
        .v-rows{ display:flex; flex-direction:column; gap:.6rem; text-align:left; }
        .v-row{ background:var(--card); border:1px solid var(--border); border-radius:8px; padding:.8rem .9rem; opacity:0; transform:translateX(-14px); animation:vrow .5s forwards cubic-bezier(.2,.8,.25,1); }
        .v-row b{ display:block; font-size:.66rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--accent); margin-bottom:.15rem; }
        .v-row span{ font-weight:600; color:var(--text-secondary); line-height:1.4; font-size:.92rem; }
        @keyframes vrow{ to{ opacity:1; transform:none; } }
        .v-closing{ margin:1.2rem 0 0; padding:.9rem 1rem; background:var(--accent-muted); border-radius:8px; color:var(--text-secondary); font-weight:600; line-height:1.45; font-size:.92rem; text-align:left; opacity:0; animation:vrow .6s .85s forwards; }
        .v-closing .remembers{ display:inline-block; font-size:.62rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--accent); background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:.18rem .5rem; margin-right:.5rem; }
        .v-actions{ display:flex; gap:.8rem; justify-content:center; margin-top:1.4rem; flex-wrap:wrap; opacity:0; animation:vrow .6s 1.05s forwards; }
        .v-primary{ border:none; cursor:pointer; font-family:var(--font-body); font-weight:700; font-size:1rem; color:#000; background:var(--accent); padding:.9rem 1.7rem; border-radius:8px; transition:all .2s ease; }
        .v-primary:hover{ transform:translateY(-2px) scale(1.03); }
        .v-ghost{ border:1.5px solid var(--border); cursor:pointer; font-weight:700; font-size:1rem; color:var(--text-secondary); background:transparent; padding:.9rem 1.4rem; border-radius:8px; }
        .delta{ display:flex; flex-direction:column; gap:.5rem; align-items:center; margin-bottom:1.2rem; }
        .d-stars{ display:flex; align-items:center; gap:.7rem; font-family:var(--font-display); font-weight:800; font-size:1.5rem; }
        .d-stars .old{ color:var(--border); } .d-stars .arrow{ color:var(--text-secondary); opacity:.5; } .d-stars .new.up{ color:var(--accent); } .d-stars .new.down{ color:var(--danger); }
        .d-rank{ font-weight:700; font-size:.9rem; color:var(--text-secondary); } .d-rank b.up{ color:var(--accent); } .d-rank b.down{ color:var(--danger); }
        @media (max-width:620px){
            .grid{ grid-template-columns:1fr; gap:.85rem; }
            .wrap{ padding:0 1rem; }
            .h{ font-size:1.9rem; }
            .card{ padding:.9rem; }
            .grp{ font-size:1rem; }
            .teams{ gap:.5rem; }
            .team{ padding:.6rem .65rem; }
            .team-name{ font-size:.82rem; white-space:normal; }
            .submitbar{ bottom:10px; padding:.7rem .8rem .7rem 1rem; }
            .submit-label{ font-size:.8rem; }
            .submit{ padding:.7rem 1.1rem; font-size:.9rem; }
            }
      `}</style>

      <main className="wrap">
        <div className="pbar"><i style={{ width: `${(done / groups.length) * 100}%` }} /></div>
        <p className="pcount"><b>{done}</b>/{groups.length} groups called</p>
        <h1 className="h">Call your group winners</h1>
        <p className="hsub">Pick who tops each group. The gaffer reacts to every call.</p>
        <div className="grid">
          {groups.map((g) => {
            const pickedId = picks[g.id];
            const ti = pickIndex[g.id];
            const decided = pickedId !== undefined;
            const reply = agentReplies[g.id];
            const shown = phase === "callback" || (phase === "rewind" && groups.indexOf(g) < revealed);
            const resolvedCard = resolving && shown && outcome;
            const res = outcome?.hits[g.id];
            return (
              <article key={g.id} className={`card${resolvedCard ? (res?.hit ? " res-hit" : " res-miss") : ""}`}>
                <div className="card-head">
                  <span className="grp">{g.title}</span>
                  <span className="hint">
                    {resolvedCard ? (res?.hit ? "✓ Called it" : `Won by ${res?.winnerLabel}`)
                      : decided ? `${g.options[ti]?.label} to top it` : "Pick the winner"}
                  </span>
                </div>
                <div className="teams">
                  {g.options.map((o, oi) => {
                    let cls = "";
                    if (pickedId === o.id) cls = resolvedCard ? (res?.hit ? "win" : "miss") : "win";
                    else if (resolvedCard && res && !res.hit && o.label === res.winnerLabel) cls = "actual";
                    return (
                      <button key={o.id} className={`team ${cls}`} onClick={() => pick(g, o, oi)} disabled={submitted}>
                        <span className={`fi fi-${o.flag} team-flag`} />
                        <span className="team-name">{o.label}</span>
                        <span className="check">✓</span>
                        {resolvedCard && res && !res.hit && o.label === res.winnerLabel && <span className="wontag">won</span>}
                      </button>
                    );
                  })}
                </div>
                {reply && !resolving && (
                  <div className="agent">
                    <span className="dot" />
                    <div style={{ flex: 1 }}>
                      <span className="atext">{reply.loading ? <><i>.</i><i>.</i><i>.</i></> : reply.text}</span>
                      {!reply.loading && reply.text && (
                        <button className="chatlink" onClick={() => navigate('/talk', { state: { marketId: g.id } })}>
                          Talk about {g.title} →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>

      <div className="submitbar">
        <span className="submit-label">
          {submitted ? "Calls locked. The gaffer's watching." : complete ? "Full card — lock it in." : <span><b>{done}</b> of {groups.length} called</span>}
        </span>
        <button className={`submit${submitted ? " locked" : complete ? " ready" : ""}`} onClick={submit} disabled={!complete || submitted}>
          {submitted ? "Locked ✓" : "Submit my calls"}
        </button>
      </div>

      {phase && phase !== "rewind" && (
        <div className="vbackdrop">
          <div className="verdict">
            {phase === "thinking" && (<><PitchBall className="v-ball" /><div className="v-think">The gaffer's reading your card…</div></>)}
            {phase === "verdict" && (
              <>
                <div className="v-kicker">The Gaffer's Verdict</div>
                <h2 className="v-headline">{verdict.headline}</h2>
                <div className="v-rows">
                  {verdict.rows.map((r, i) => (<div className="v-row" key={i} style={{ animationDelay: `${0.15 + i * 0.18}s` }}><b>{r.label}</b><span>{r.txt}</span></div>))}
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
                <h2 className="v-headline">{outcome.correct} from {groups.length}.</h2>
                <div className="delta">
                  <div className="d-stars">
                    <span className="old">★ {outcome.baseline.toFixed(1)}</span><span className="arrow">→</span>
                    <span className={`new ${outcome.newStars >= outcome.baseline ? "up" : "down"}`}>★ {outcome.newStars.toFixed(1)}</span>
                  </div>
                  <div className="d-rank">Rank #{outcome.prevRank.toLocaleString()} → #{outcome.newRank.toLocaleString()}{" "}
                    <b className={outcome.newRank < outcome.prevRank ? "up" : "down"}>{outcome.newRank < outcome.prevRank ? `▲${(outcome.prevRank-outcome.newRank).toLocaleString()}` : `▼${(outcome.newRank-outcome.prevRank).toLocaleString()}`}</b>
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
