import { useState, useEffect } from 'react'
import { api } from './api'
import { useUser } from './UserContext'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function Brackets() {
  const { user } = useUser()
  const [brackets, setBrackets] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('leaderboard')
  const [name, setName] = useState('')
  const [picks, setPicks] = useState('{}')

  async function load() {
    try {
      const [bl, lb] = await Promise.all([
        api.getBracketLeaderboard().catch(() => ({ leaderboard: [] })),
        api.getBrackets(user.displayName).catch(() => ({ brackets: [] }))
      ])
      setLeaderboard(bl.leaderboard || [])
      setBrackets(lb.brackets || [])
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [bl, lb] = await Promise.all([
          api.getBracketLeaderboard().catch(() => ({ leaderboard: [] })),
          api.getBrackets(user.displayName).catch(() => ({ brackets: [] }))
        ])
        if (!ignore) {
          setLeaderboard(bl.leaderboard || [])
          setBrackets(lb.brackets || [])
        }
      } catch { /* silent */ } finally { if (!ignore) setLoading(false) }
    })();
    return () => { ignore = true; };
  }, [user])

  async function handleCreate() {
    if (!name.trim()) return
    try {
      let parsed
      try { parsed = JSON.parse(picks) } catch { alert('Picks must be valid JSON'); return }
      await api.submitBracket(user.displayName, name.trim(), parsed)
      setName(''); setPicks('{}')
      load()
    } catch (e) { alert(e.message) }
  }

  const groupPicks = (p) => {
    try { return typeof p === 'string' ? JSON.parse(p) : p } catch { return {} }
  }

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:var(--bg);color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;color:var(--text);}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);font-weight:500;}
        .tabs{display:flex;gap:.5rem;margin-bottom:1rem;}
        .tab{cursor:pointer;border:1px solid var(--border);background:var(--card);border-radius:8px;padding:.45rem .9rem;font-weight:700;font-size:.8rem;color:var(--text-secondary);transition:all .18s ease;}
        .tab:hover{background:var(--card-hover);border-color:var(--border-hover);}
        .tab.on{background:var(--accent-muted);border-color:var(--accent);color:var(--accent);}
        .card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:.7rem;}
        .card h3{font-family:var(--font-display);font-weight:700;font-size:1.05rem;margin:0 0 .2rem;color:var(--text);}
        .card .info{font-size:.85rem;color:var(--text-secondary);line-height:1.5;}
        .card .picks{font-size:.78rem;color:var(--text-secondary);margin-top:.4rem;}
        .pick-tag{display:inline-block;background:var(--accent-muted);padding:.15rem .5rem;border-radius:6px;margin:.15rem;font-weight:600;font-size:.75rem;color:var(--accent);}
        .rank{font-weight:800;font-size:1.2rem;font-family:var(--font-display);color:var(--text);}
        .form{display:flex;flex-direction:column;gap:.7rem;}
        .form input,.form textarea{padding:.7rem .9rem;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:500;color:var(--text);background:var(--card);outline:none;}
        .form input:focus,.form textarea:focus{border-color:var(--accent);}
        .form textarea{font-family:monospace;}
        .form button{border:none;cursor:pointer;font-weight:800;color:#000;background:var(--accent);padding:.7rem;border-radius:8px;transition:background .18s ease;}
        .form button:hover{background:var(--accent-hover);}
        .empty{text-align:center;color:var(--text-secondary);padding:2rem 1rem;font-weight:600;}
      `}</style>

      <main className="wrap">
        <h1 className="h">Brackets</h1>
        <p className="hsub">Submit your knockout bracket and track entries.</p>

        <div className="tabs">
          <button className={`tab${tab === 'leaderboard' ? ' on' : ''}`} onClick={() => setTab('leaderboard')}>Leaderboard</button>
          <button className={`tab${tab === 'my' ? ' on' : ''}`} onClick={() => setTab('my')}>My Brackets</button>
          <button className={`tab${tab === 'create' ? ' on' : ''}`} onClick={() => setTab('create')}>Submit</button>
        </div>

        {loading ? <div className="empty">Loading...</div> : tab === 'leaderboard' ? (
          <>
            <div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--accent)',marginBottom:'.5rem'}}>Bracket Leaderboard</div>
            {leaderboard.length === 0 ? <div className="empty">No entries yet.</div> :
              leaderboard.map((e,i) => (
                <div key={i} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div><span className="rank">#{i + 1}</span> <strong>{e.display_name || e.user_id}</strong></div>
                  <span style={{fontWeight:800,color:'var(--accent)'}}>{e.score} pts</span>
                </div>
              ))
            }
          </>
        ) : tab === 'my' ? (
          <>
            <div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--accent)',marginBottom:'.5rem'}}>My Brackets</div>
            {brackets.length === 0 ? <div className="empty">No brackets submitted.</div> :
              brackets.map(b => (
                <div key={b.id} className="card">
                  <h3>{b.name}</h3>
                  <div className="info">Score: <strong>{b.score ?? 0}</strong> · {b.picks_count || 0} picks</div>
                  <div className="picks">
                    {Object.entries(groupPicks(b.picks)).map(([k, v]) => (
                      <span key={k} className="pick-tag">{k}: {v}</span>
                    ))}
                  </div>
                </div>
              ))
            }
          </>
        ) : (
          <div className="card" style={{cursor:'default'}}>
            <div className="form">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bracket name" />
              <textarea value={picks} onChange={(e) => setPicks(e.target.value)} rows={5}
                placeholder={'{"groupA":"Brazil","groupB":"France",...}'} />
              <button onClick={handleCreate}>Submit Bracket</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
