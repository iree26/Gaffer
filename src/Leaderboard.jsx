import { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { api } from './api';
import Navbar from './Navbar';
import GafferBackground from './GafferBackground';

const FALLBACK_TOP = [
  { rank: 1, displayName: "adrian_picks", displayStars: 5.0 },
  { rank: 2, displayName: "thegaffer_og", displayStars: 4.5 },
  { rank: 3, displayName: "mootilateral", displayStars: 4.5 },
  { rank: 4, displayName: "kola_calls", displayStars: 4.0 },
  { rank: 5, displayName: "zara.b", displayStars: 4.0 },
  { rank: 6, displayName: "the_oracle", displayStars: 4.0 },
  { rank: 7, displayName: "muktar_m", displayStars: 3.5 },
];
const FALLBACK_BOTTOM = [
  { rank: 5010, displayName: "coinflip_kev", displayStars: 1.5 },
  { rank: 5011, displayName: "always_wrong", displayStars: 1.0 },
  { rank: 5012, displayName: "vibes_only", displayStars: 1.0 },
];

function Stars({ value = 0 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="stars">
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
function Row({ p, you }) {
  return (
    <div className={`row${you ? " you" : ""}`}>
      <span className="rk">{(p.rank ?? 0).toLocaleString()}</span>
      <span className="avi" style={{ background: ballColor(p.displayName || p.user_id) }}>⚽</span>
      <span className="nm">{p.displayName || p.user_id}{p.rank === 1 && <span className="crown">♔</span>}</span>
      <Stars value={(p.displayStars || p.stars || 0)} />
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useUser();
  const [tab, setTab] = useState('stars');
  const [top, setTop] = useState(null);
  const [bottom, setBottom] = useState(null);
  const [predLeaderboard, setPredLeaderboard] = useState([]);
  const [streaks, setStreaks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, predData, streakData] = await Promise.all([
          api.getLeaderboard().catch(() => ({ top: FALLBACK_TOP, bottom: FALLBACK_BOTTOM })),
          api.getPredictionsLeaderboard().catch(() => ({ leaderboard: [] })),
          api.getStreaks(user.displayName).catch(() => null),
        ]);
        setTop(data.top || FALLBACK_TOP);
        setBottom(data.bottom || FALLBACK_BOTTOM);
        setPredLeaderboard(predData.leaderboard || predData.predictions || []);
        setStreaks(streakData);
      } catch { /* silent */ } finally { setLoading(false); }
    })();
    api.getUser(user.displayName).then(setMe).catch(() => {});
  }, [user.displayName]);

  const YOU = {
    rank: me?.rank ?? user.rank ?? 248,
    displayName: `${user.displayName} (you)`,
    displayStars: me?.displayStars ?? user.displayStars ?? 0,
  };

  const list = top || [];
  const podium = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{
          position:relative; isolation:isolate; min-height:100svh; width:100%; background:var(--bg); color:var(--text);
          font-family:var(--font-body); padding-bottom:4rem;
        }
        .wrap{ position:relative; z-index:1; max-width:720px; margin:0 auto; padding:0 clamp(1rem,5vw,2rem); }
        .h{ font-family:var(--font-display); font-weight:800; font-size:clamp(1.8rem,6vw,2.7rem); letter-spacing:-.02em; margin:0; }
        .hsub{ margin:.5rem 0 1.2rem; color:var(--text-secondary); opacity:.8; font-weight:500; }
        .tabs{ display:flex; gap:.5rem; margin-bottom:1.5rem; }
        .tab{ cursor:pointer; border:1.5px solid var(--border); background:var(--card);
          border-radius:12px; padding:.5rem 1rem; font-weight:700; font-size:.85rem; color:var(--text-secondary); transition:all .18s ease; }
        .tab.on{ background:var(--accent); border-color:var(--accent); color:#000; }
        .loading{ text-align:center; color:var(--text-secondary); opacity:.7; font-weight:700; padding:3rem 1rem; }
        .podium{ display:grid; grid-template-columns:1fr 1.15fr 1fr; gap:.7rem; align-items:end; margin-bottom:1.6rem; }
        .pod{ background:var(--card); border:1px solid var(--border); border-radius:18px;
          padding:1rem .7rem; text-align:center; }
        .pod.first{ padding-top:1.5rem; border-color:var(--accent); box-shadow:0 0 0 1px var(--accent-muted); }
        .medal{ font-size:1.5rem; line-height:1; }
        .pod.first .medal{ font-size:1.9rem; }
        .pod .pname{ font-family:var(--font-display); font-weight:700; font-size:.92rem; margin:.4rem 0 .15rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .section-label{ font-size:.72rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); margin:1.4rem 0 .6rem; }
        .list{ display:flex; flex-direction:column; gap:.4rem; }
        .row{ display:grid; grid-template-columns:2.4rem 2rem 1fr auto; align-items:center; gap:.6rem;
          background:var(--card); border-bottom:1px solid var(--border);
          border-radius:13px; padding:.6rem .9rem; transition:transform .18s ease, box-shadow .18s ease; }
        .row:hover{ transform:translateY(-2px); box-shadow:0 8px 22px rgba(0,0,0,.3); }
        .row.you{ border-bottom-color:var(--accent); background:var(--accent-muted); }
        .rk{ font-weight:800; font-size:.85rem; color:var(--accent); }
        .avi{ width:30px; height:30px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 2px 6px rgba(0,0,0,.3); }
        .nm{ font-weight:700; font-size:.92rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .crown{ color:var(--accent); margin-left:.35rem; }
        .stars{ display:inline-flex; gap:.05rem; }
        .stars .s{ color:var(--border); font-size:.85rem; }
        .stars .s.on{ color:var(--accent); }
        .stars .s.half{ background:linear-gradient(90deg,var(--accent) 50%,var(--border) 50%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .streak-card{ background:var(--card); border:1px solid var(--border); border-radius:16px; padding:1.5rem; text-align:center; }
        .streak-num{ font-family:var(--font-display); font-weight:800; font-size:3rem; color:var(--accent); line-height:1; }
        .streak-label{ font-size:.8rem; font-weight:600; color:var(--text-secondary); opacity:.7; margin:.4rem 0; }
        .streak-stat{ display:flex; justify-content:center; gap:1.5rem; margin-top:1rem; }
        .streak-stat div{ text-align:center; }
        .streak-stat .val{ font-family:var(--font-display); font-weight:800; font-size:1.2rem; color:var(--text); }
        .streak-stat .lbl{ font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; color:var(--text-secondary); opacity:.6; }
        .empty{ text-align:center; color:var(--text-secondary); opacity:.6; font-weight:600; padding:3rem 1rem; }
      `}</style>

      <main className="wrap">
        <h1 className="h">The table</h1>
        <p className="hsub">Stars, predictions, and streaks — see where you stand.</p>

        <div className="tabs">
          <button className={`tab${tab === 'stars' ? ' on' : ''}`} onClick={() => setTab('stars')}>Stars</button>
          <button className={`tab${tab === 'predictions' ? ' on' : ''}`} onClick={() => setTab('predictions')}>Predictions</button>
          <button className={`tab${tab === 'streaks' ? ' on' : ''}`} onClick={() => setTab('streaks')}>My Streak</button>
        </div>

        {loading ? <div className="loading">Loading the table…</div> : tab === 'stars' ? (
          <>
            {podium.length === 3 && (
              <div className="podium">
                {[podium[1], podium[0], podium[2]].map((p) => (
                  <div key={p.rank} className={`pod${p.rank === 1 ? " first" : ""}`}>
                    <div className="medal">{p.rank === 1 ? "♔" : p.rank === 2 ? "🥈" : "🥉"}</div>
                    <div className="pname">{p.displayName}</div>
                    <Stars value={p.displayStars} />
                  </div>
                ))}
              </div>
            )}
            <div className="section-label">Top callers</div>
            <div className="list">
              {rest.map((p) => <Row key={p.rank} p={p} />)}
              <Row p={YOU} you />
            </div>
            <div className="section-label">Bottom of the table</div>
            <div className="list">
              {(bottom || []).map((p) => <Row key={p.rank} p={p} />)}
            </div>
          </>
        ) : tab === 'predictions' ? (
          <>
            <div className="section-label">Prediction Accuracy Leaderboard</div>
            {predLeaderboard.length === 0 ? <div className="empty">No prediction data yet.</div> :
              <div className="list">
                {predLeaderboard.map((p, i) => (
                  <div key={i} className="row">
                    <span className="rk">#{i + 1}</span>
                    <span className="avi" style={{ background: ballColor(p.displayName || p.user_id) }}>⚽</span>
                    <span className="nm">{p.displayName || p.user_id}</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '.85rem' }}>
                      {p.accuracy ? `${(p.accuracy * 100).toFixed(0)}%` : `${p.correct ?? 0}/${p.total ?? 0}`}
                    </span>
                  </div>
                ))}
              </div>
            }
          </>
        ) : (
          <>
            <div className="section-label">Your Streak</div>
            {streaks ? (
              <div className="streak-card">
                <div className="streak-num">{streaks.current_streak ?? streaks.streak ?? 0}</div>
                <div className="streak-label">Current streak</div>
                <div className="streak-stat">
                  <div><div className="val">{streaks.best_streak ?? streaks.longest ?? 0}</div><div className="lbl">Best</div></div>
                  <div><div className="val">{streaks.predictions_count ?? streaks.total ?? 0}</div><div className="lbl">Total</div></div>
                  <div><div className="val">{streaks.accuracy ? `${(streaks.accuracy * 100).toFixed(0)}%` : '-'}</div><div className="lbl">Accuracy</div></div>
                </div>
              </div>
            ) : <div className="empty">Start predicting to build a streak!</div>}
          </>
        )}
      </main>
    </div>
  );
}
