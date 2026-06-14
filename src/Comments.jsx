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
      <defs><polygon id="cbp" points="0,-20 19,-6.2 11.8,16.2 -11.8,16.2 -19,-6.2" /></defs>
      <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="6" />
      <g stroke="#13311F" strokeWidth="4" strokeLinecap="round">
        <line x1="100" y1="66" x2="100" y2="10" /><line x1="132.3" y1="89.5" x2="186" y2="72" />
        <line x1="120.1" y1="127.5" x2="153" y2="172" /><line x1="79.9" y1="127.5" x2="47" y2="172" />
        <line x1="67.7" y1="89.5" x2="14" y2="72" />
      </g>
      <use href="#cbp" transform="translate(100,100) scale(1.7)" fill="#16331F" />
      <use href="#cbp" transform="translate(137.6,48.2) rotate(36) scale(.72)" fill="#16331F" />
      <use href="#cbp" transform="translate(160.9,119.8) rotate(108) scale(.72)" fill="#16331F" />
      <use href="#cbp" transform="translate(100,164) rotate(180) scale(.72)" fill="#16331F" />
      <use href="#cbp" transform="translate(39.1,119.8) rotate(252) scale(.72)" fill="#16331F" />
      <use href="#cbp" transform="translate(62.4,48.2) rotate(324) scale(.72)" fill="#16331F" />
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
        @media (prefers-reduced-motion: reduce){ .pb-stripes,.pb-glow,.pb-ball{ animation:none !important; } }
      `}</style>
      <div className="pb-base" /><div className="pb-stripes" />
      <svg className="pb-pitch" viewBox="0 0 1050 680" preserveAspectRatio="xMidYMid slice"
           fill="none" stroke="rgba(11,107,58,.22)" strokeWidth="3">
        <rect x="20" y="20" width="1010" height="640" /><line x1="525" y1="20" x2="525" y2="660" />
        <circle cx="525" cy="340" r="90" /><circle cx="525" cy="340" r="5" fill="rgba(11,107,58,.22)" stroke="none" />
        <rect x="20" y="138" width="165" height="403" /><rect x="20" y="248" width="55" height="183" />
        <rect x="865" y="138" width="165" height="403" /><rect x="975" y="248" width="55" height="183" />
      </svg>
      <div className="pb-glow a" /><div className="pb-glow b" />
      <PitchBall className="pb-ball big" /><PitchBall className="pb-ball small" />
    </div>
  );
}

function Stars({ value = 0 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="cstars">
      {[0,1,2,3,4].map((i) => (
        <span key={i} className={i < full ? "s on" : i === full && half ? "s half" : "s"}>★</span>
      ))}
    </span>
  );
}
function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}
function ballColor(name) {
  const n = name || "?";
  const h = Math.abs([...n].reduce((a, ch) => ch.charCodeAt(0) + ((a << 5) - a), 0)) % 360;
  return `hsl(${h} 55% 42%)`;
}

export default function Comments() {
  const { user } = useUser();
  const [markets, setMarkets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMarkets();
        const list = data.markets || data || [];
        setMarkets(list);
        if (list.length) setActiveId(list[0].id);
      } catch (e) {
        setErr("Couldn't reach the server. It may be waking up — try again in a moment.");
      } finally { setLoadingMarkets(false); }
    })();
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setLoadingComments(true);
    (async () => {
      try {
        const data = await api.getComments(activeId);
        setComments(data.comments || data || []);
      } catch (e) { setComments([]); }
      finally { setLoadingComments(false); }
    })();
  }, [activeId]);

  async function send() {
    const t = text.trim();
    if (!t || posting || !activeId) return;
    setPosting(true);
    const optimistic = { userId: user.displayName, displayName: user.displayName, displayStars: user.displayStars, text: t, createdAt: new Date().toISOString(), _local: true };
    setComments((c) => [...c, optimistic]);
    setText("");
    try {
      await api.postComment(activeId, user.displayName, t);
      const data = await api.getComments(activeId);
      setComments(data.comments || data || []);
    } catch (e) { setErr("That comment didn't send — server may be waking up."); }
    finally { setPosting(false); }
  }

  const activeMarket = markets.find((m) => m.id === activeId);

  return (
    <div className="gaffer-app">
      <PitchBg />
      <Navbar />
      <style>{`
        .gaffer-app{
          --ink:#0B6B3A; --deep:#075E32; --bright:#16B45F; --lime:#3FE07F; --line:rgba(11,107,58,.14); --soft:#F3FAF5;
          --display:'Syne','Plus Jakarta Sans',sans-serif;
          position:relative; isolation:isolate; min-height:100svh; width:100%; background:transparent; color:var(--ink);
          font-family:'Plus Jakarta Sans',system-ui,sans-serif; padding-bottom:6rem;
        }
        .wrap{ position:relative; z-index:1; max-width:680px; margin:0 auto; padding:0 clamp(1rem,5vw,1.6rem); }
        .h{ font-family:var(--display); font-weight:800; font-size:clamp(1.7rem,6vw,2.5rem); letter-spacing:-.02em; margin:0; }
        .hsub{ margin:.4rem 0 1.2rem; color:var(--deep); opacity:.8; font-weight:500; }
        .chips{ display:flex; gap:.5rem; overflow-x:auto; padding:.2rem 0 1rem; scrollbar-width:none; }
        .chips::-webkit-scrollbar{ display:none; }
        .chip{ flex:none; cursor:pointer; border:1.5px solid var(--line); background:rgba(255,255,255,.7);
          border-radius:999px; padding:.5rem .9rem; font-weight:700; font-size:.82rem; color:var(--deep);
          white-space:nowrap; transition:all .18s ease; }
        .chip:hover{ border-color:var(--bright); }
        .chip.on{ background:var(--bright); border-color:var(--bright); color:#fff; }
        .thread{ display:flex; flex-direction:column; gap:.7rem; min-height:30vh; }
        .empty,.loading{ text-align:center; color:var(--deep); opacity:.65; font-weight:600; padding:2.5rem 1rem; }
        .cmt{ display:flex; gap:.7rem; background:rgba(255,255,255,.78); backdrop-filter:blur(8px);
          border:1px solid var(--line); border-radius:16px; padding:.85rem 1rem; align-items:flex-start;
          animation:cIn .35s cubic-bezier(.2,.8,.25,1); }
        @keyframes cIn{ from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:none;} }
        .cav{ flex:none; width:34px; height:34px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;
          font-size:18px; color:#fff; box-shadow:0 2px 8px rgba(7,94,50,.25); }
        .cbody{ flex:1; min-width:0; }
        .cmeta{ display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; margin-bottom:.15rem; }
        .cname{ font-weight:800; font-size:.9rem; color:var(--ink); }
        .cstars{ display:inline-flex; gap:.02rem; font-size:.72rem; }
        .cstars .s{ color:var(--line); } .cstars .s.on{ color:var(--bright); }
        .cstars .s.half{ background:linear-gradient(90deg,var(--bright) 50%,var(--line) 50%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .ctime{ font-size:.72rem; color:var(--deep); opacity:.55; font-weight:600; }
        .ctext{ font-size:.95rem; font-weight:500; color:var(--deep); line-height:1.45; word-wrap:break-word; }
        .composer{ position:fixed; left:50%; transform:translateX(-50%); bottom:14px; z-index:30; width:min(680px, calc(100% - 20px));
          display:flex; gap:.6rem; align-items:center; padding:.6rem .7rem .6rem 1rem;
          background:rgba(255,255,255,.78); backdrop-filter:blur(16px); border:1px solid var(--line); border-radius:20px; box-shadow:0 14px 44px rgba(7,94,50,.18); }
        .composer .field{ flex:1; border:none; background:transparent; padding:.55rem .2rem;
          font-family:inherit; font-size:1rem; font-weight:500; color:var(--ink); outline:none; }
        .composer .field::placeholder{ color:var(--deep); opacity:.5; }
        .composer .send{ flex:none; border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800;
          color:#fff; background:var(--bright); padding:.7rem 1.25rem; border-radius:999px; transition:all .18s ease; }
        .composer .send:disabled{ opacity:.45; cursor:not-allowed; }
        .composer .send:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 8px 22px rgba(22,180,95,.45); }
        .errbar{ background:rgba(214,85,63,.1); border:1px solid rgba(214,85,63,.3); color:#A8392A; font-weight:600;
          border-radius:12px; padding:.7rem 1rem; margin-bottom:1rem; font-size:.9rem; }
      `}</style>

      <main className="wrap">
        <h1 className="h">The terraces</h1>
        <p className="hsub">Talk your group. Your stars show next to every word.</p>

        {err && <div className="errbar">{err}</div>}

        {loadingMarkets ? (
          <div className="loading">Loading groups…</div>
        ) : (
          <>
            <div className="chips">
              {markets.map((m) => (
                <button key={m.id} className={`chip${activeId === m.id ? " on" : ""}`} onClick={() => setActiveId(m.id)}>
                  {m.title}
                </button>
              ))}
            </div>

            <div className="thread">
              {loadingComments ? (
                <div className="loading">Loading the chat…</div>
              ) : comments.length === 0 ? (
                <div className="empty">No one's spoken on {activeMarket?.title || "this group"} yet. Break the ice.</div>
              ) : (
                comments.map((c, i) => (
                  <div className="cmt" key={c.id || i}>
                    <span className="cav" style={{ background: ballColor(c.displayName || c.userId) }}>⚽</span>
                    <div className="cbody">
                      <div className="cmeta">
                        <span className="cname">{c.displayName || c.userId}</span>
                        <Stars value={c.displayStars || 0} />
                        <span className="ctime">{timeAgo(c.createdAt)}</span>
                      </div>
                      <div className="ctext">{c.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      <div className="composer">
        <input className="field" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={activeMarket ? `Say something about ${activeMarket.title}…` : "Pick a group…"}
          disabled={!activeId || posting} maxLength={240} />
        <button className="send" onClick={send} disabled={!text.trim() || posting || !activeId}>
          {posting ? "…" : "Post"}
        </button>
      </div>
    </div>
  );
}