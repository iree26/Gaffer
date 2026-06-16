import { useState, useEffect } from 'react'
import { api } from './api'
import { useUser } from './UserContext'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function MatchPredictions() {
  const { user } = useUser()
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState([])
  const [myPreds, setMyPreds] = useState({})
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const [m, p, mp] = await Promise.all([
        api.getMatches().catch(() => ({ matches: [] })),
        api.getAllPredictions().catch(() => ({ predictions: [] })),
        api.getMyPredictions(user.displayName).catch(() => ({}))
      ])
      setMatches(m.matches || [])
      setPredictions(p.predictions || [])
      setMyPreds(mp.predictions || {})
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [m, p, mp] = await Promise.all([
          api.getMatches().catch(() => ({ matches: [] })),
          api.getAllPredictions().catch(() => ({ predictions: [] })),
          api.getMyPredictions(user.displayName).catch(() => ({}))
        ])
        if (!ignore) {
          setMatches(m.matches || [])
          setPredictions(p.predictions || [])
          setMyPreds(mp.predictions || {})
        }
      } catch { /* silent */ } finally { if (!ignore) setLoading(false) }
    })();
    return () => { ignore = true; };
  }, [user])

  async function handlePredict(matchId, score1, score2) {
    try {
      await api.submitPrediction(user.displayName, matchId, score1, score2)
      load()
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:transparent;color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);opacity:.8;font-weight:500;}
        .match-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:.7rem;}
        .match-teams{display:flex;justify-content:space-between;align-items:center;gap:.5rem;}
        .team{flex:1;font-weight:800;font-size:1rem;color:var(--text);}
        .team.home{text-align:left;}
        .team.away{text-align:right;}
        .vs{font-weight:700;font-size:.78rem;color:var(--text-secondary);opacity:.6;}
        .match-meta{display:flex;justify-content:center;gap:1rem;font-size:.78rem;color:var(--text-secondary);opacity:.7;margin:.4rem 0;}
        .pred-row{display:flex;gap:.4rem;justify-content:center;margin-top:.6rem;align-items:center;}
        .pred-row input{width:50px;text-align:center;padding:.4rem;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-weight:700;color:var(--text);background:var(--card);outline:none;}
        .pred-row input:focus{border-color:var(--accent);}
        .pred-row button{border:none;cursor:pointer;font-weight:700;color:#000;background:var(--accent);padding:.4rem .9rem;border-radius:8px;font-size:.8rem;}
        .pred-row button:disabled{opacity:.4;}
        .badge{font-size:.72rem;font-weight:700;padding:.2rem .5rem;border-radius:6px;}
        .badge.open{background:var(--accent-muted);color:var(--accent);}
        .badge.closed{background:var(--surface);color:var(--text-tertiary);}
        .my-pred{font-size:.82rem;font-weight:600;color:var(--accent);text-align:center;margin-top:.4rem;}
        .aggr{font-size:.75rem;color:var(--text-secondary);opacity:.6;text-align:center;margin-top:.3rem;}
        .empty{text-align:center;color:var(--text-secondary);opacity:.6;padding:2rem 1rem;font-weight:600;}
      `}</style>

      <main className="wrap">
        <h1 className="h">Match Predictions</h1>
        <p className="hsub">Predict scores and see community picks.</p>

        {loading ? <div className="empty">Loading...</div> : matches.length === 0 ? (
          <div className="empty">No matches available.</div>
        ) : matches.map(m => {
          const myP = myPreds[m.id]
          const matchPreds = predictions.filter(p => p.match_id === m.id)
          const avg1 = matchPreds.length ? (matchPreds.reduce((s,p) => s + (p.home_score || 0), 0) / matchPreds.length).toFixed(1) : '-'
          const avg2 = matchPreds.length ? (matchPreds.reduce((s,p) => s + (p.away_score || 0), 0) / matchPreds.length).toFixed(1) : '-'

          return (
            <div key={m.id} className="match-card">
              <div className="match-meta">
                <span className={`badge ${m.status === 'SCHEDULED' ? 'open' : 'closed'}`}>{m.status || 'SCHEDULED'}</span>
              </div>
              <div className="match-teams">
                <div className="team home">{m.home_team}</div>
                <div className="vs">vs</div>
                <div className="team away">{m.away_team}</div>
              </div>
              {m.status !== 'CLOSED' ? (
                <div className="pred-row">
                  <input type="number" min={0} placeholder="0"
                    defaultValue={myP ? myP.home_score : ''}
                    ref={(el) => { if (myP && el && !el.dataset.set) { el.value = myP.home_score; el.dataset.set = '1' } }} />
                  <span style={{fontWeight:800,color:'var(--text-secondary)'}}>-</span>
                  <input type="number" min={0} placeholder="0"
                    defaultValue={myP ? myP.away_score : ''}
                    ref={(el) => { if (myP && el && !el.dataset.set) { el.value = myP.away_score; el.dataset.set = '1' } }} />
                  <button onClick={() => {
                    const inputs = document.querySelectorAll(`[data-match="${m.id}"]`)
                    handlePredict(m.id, parseInt(inputs[0].value) || 0, parseInt(inputs[1].value) || 0)
                  }}>{myP ? 'Update' : 'Predict'}</button>
                </div>
              ) : null}
              {myP && <div className="my-pred">Your pick: {myP.home_score}–{myP.away_score} {myP.points !== undefined ? `· ${myP.points} pts` : ''}</div>}
              <div className="aggr">Community avg: {avg1}–{avg2} ({matchPreds.length} predictions)</div>
            </div>
          )
        })}
      </main>
    </div>
  )
}