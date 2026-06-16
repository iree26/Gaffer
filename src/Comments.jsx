import { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { api } from './api';
import Navbar from './Navbar';
import GafferBackground from './GafferBackground';

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
  const [tab, setTab] = useState('markets');
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
      } catch {
        setErr("Couldn't reach the server. It may be waking up — try again in a moment.");
      } finally { setLoadingMarkets(false); }
    })();
  }, []);

  useEffect(() => {
    if (!activeId || tab !== 'markets') return;
    (async () => {
      setLoadingComments(true);
      try {
        const data = await api.getMarketComments(activeId);
        setComments(data.comments || data || []);
      } catch { setComments([]); }
      finally { setLoadingComments(false); }
    })();
  }, [activeId, tab]);

  async function send() {
    const t = text.trim();
    if (!t || posting || !activeId) return;
    setPosting(true);
    if (tab === 'terraces') {
      try {
        await api.terraceGeneral(user.displayName, t);
        setText("");
      } catch { setErr("Couldn't send to the terraces."); }
      setPosting(false);
      return;
    }
    const optimistic = { userId: user.displayName, displayName: user.displayName, displayStars: user.displayStars, text: t, createdAt: new Date().toISOString(), _local: true };
    setComments((c) => [...c, optimistic]);
    setText("");
    try {
      await api.postMarketComment(activeId, user.displayName, t);
      const data = await api.getMarketComments(activeId);
      setComments(data.comments || data || []);
    } catch { setErr("That comment didn't send — server may be waking up."); }
    finally { setPosting(false); }
  }

  const activeMarket = markets.find((m) => m.id === activeId);

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{
          position:relative; isolation:isolate; min-height:100svh; width:100%; background:var(--bg); color:var(--text);
          font-family:var(--font-body); padding-bottom:6rem;
        }
        .wrap{ position:relative; z-index:1; max-width:680px; margin:0 auto; padding:0 clamp(1rem,5vw,1.6rem); }
        .h{ font-family:var(--font-display); font-weight:800; font-size:clamp(1.7rem,6vw,2.5rem); letter-spacing:-.02em; margin:0; color:var(--text); }
        .hsub{ margin:.4rem 0 1.2rem; color:var(--text-secondary); font-weight:500; }
        .tabs{ display:flex; gap:.5rem; margin-bottom:1rem; }
        .tab{ cursor:pointer; border:1px solid var(--border); background:var(--card);
          border-radius:8px; padding:.5rem 1rem; font-weight:700; font-size:.8rem; color:var(--text-secondary); transition:all .18s ease; }
        .tab.on{ background:var(--accent); border-color:var(--accent); color:#000; }
        .chips{ display:flex; gap:.5rem; overflow-x:auto; padding:.2rem 0 1rem; scrollbar-width:none; }
        .chips::-webkit-scrollbar{ display:none; }
        .chip{ flex:none; cursor:pointer; border:1px solid var(--border); background:var(--card);
          border-radius:8px; padding:.5rem 1rem; font-weight:700; font-size:.82rem; color:var(--text-secondary);
          white-space:nowrap; transition:all .18s ease; }
        .chip:hover{ border-color:var(--accent); }
        .chip.on{ background:var(--accent); border-color:var(--accent); color:#000; }
        .thread{ display:flex; flex-direction:column; gap:.7rem; min-height:30vh; }
        .empty,.loading{ text-align:center; color:var(--text-secondary); opacity:.65; font-weight:600; padding:2.5rem 1rem; }
        .cmt{ display:flex; gap:.7rem; background:var(--card);
          border:1px solid var(--border); border-radius:8px; padding:.85rem 1rem; align-items:flex-start; }
        .cav{ flex:none; width:34px; height:34px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;
          font-size:18px; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,.3); }
        .cbody{ flex:1; min-width:0; }
        .cmeta{ display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; margin-bottom:.15rem; }
        .cname{ font-weight:800; font-size:.9rem; color:var(--text); }
        .cstars{ display:inline-flex; gap:.02rem; font-size:.72rem; }
        .cstars .s{ color:var(--border); }
        .cstars .s.on{ color:var(--accent); }
        .cstars .s.half{ background:linear-gradient(90deg,var(--accent) 50%,var(--border) 50%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .ctime{ font-size:.72rem; color:var(--text-tertiary); font-weight:600; }
        .ctext{ font-size:.95rem; font-weight:500; color:var(--text-secondary); line-height:1.45; word-wrap:break-word; }
        .composer{ position:fixed; left:50%; transform:translateX(-50%); bottom:14px; z-index:30; width:min(680px, calc(100% - 20px));
          display:flex; gap:.6rem; align-items:center; padding:.6rem .7rem .6rem 1rem;
          background:var(--card); border:1px solid var(--border); border-radius:8px; box-shadow:0 8px 32px rgba(0,0,0,.4); }
        .composer .field{ flex:1; border:none; background:var(--surface); padding:.55rem .75rem;
          font-family:inherit; font-size:1rem; font-weight:500; color:var(--text); outline:none; border-radius:6px; }
        .composer .field::placeholder{ color:var(--text-tertiary); }
        .composer .send{ flex:none; border:none; cursor:pointer; font-family:var(--font-body); font-weight:700;
          color:#000; background:var(--accent); padding:.65rem 1.25rem; border-radius:8px; transition:all .18s ease; }
        .composer .send:disabled{ opacity:.45; cursor:not-allowed; }
        .composer .send:hover:not(:disabled){ background:var(--accent-hover); }
        .errbar{ background:rgba(255,59,48,.1); border:1px solid rgba(255,59,48,.3); color:var(--danger); font-weight:600;
          border-radius:8px; padding:.7rem 1rem; margin-bottom:1rem; font-size:.9rem; }
      `}</style>

      <main className="wrap">
        <h1 className="h">The terraces</h1>
        <p className="hsub">Talk markets or the general chat — your stars show next to every word.</p>

        <div className="tabs">
          <button className={`tab${tab === 'markets' ? ' on' : ''}`} onClick={() => setTab('markets')}>Markets</button>
          <button className={`tab${tab === 'terraces' ? ' on' : ''}`} onClick={() => setTab('terraces')}>General</button>
        </div>

        {err && <div className="errbar">{err}</div>}

        {tab === 'terraces' ? (
          <div className="empty">Send a message to the general terrace below!</div>
        ) : loadingMarkets ? (
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
          placeholder={tab === 'terraces' ? "Shout into the terraces…" : activeMarket ? `Say something about ${activeMarket.title}…` : "Pick a group…"}
          disabled={!activeId && tab !== 'terraces' || posting} maxLength={240} />
        <button className="send" onClick={send} disabled={!text.trim() || posting || (!activeId && tab !== 'terraces')}>
          {posting ? "…" : "Post"}
        </button>
      </div>
    </div>
  );
}
