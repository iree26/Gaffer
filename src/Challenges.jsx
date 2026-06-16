import { useState, useEffect } from 'react'
import { api } from './api'
import { useUser } from './UserContext'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function Challenges() {
  const { user } = useUser()
  const [challenges, setChallenges] = useState([])
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('list')
  const [opponent, setOpponent] = useState('')
  const [marketId, setMarketId] = useState('m_grpA')
  const [pick, setPick] = useState('')
  const [stars, setStars] = useState(1)

  async function load() {
    try {
      const [chData, mData] = await Promise.all([
        api.getChallenges(user.displayName).catch(() => ({ challenges: [] })),
        api.getMarkets().catch(() => ({ markets: [] }))
      ])
      setChallenges(chData.challenges || [])
      setMarkets(mData.markets || [])
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [chData, mData] = await Promise.all([
          api.getChallenges(user.displayName).catch(() => ({ challenges: [] })),
          api.getMarkets().catch(() => ({ markets: [] }))
        ])
        if (!ignore) {
          setChallenges(chData.challenges || [])
          setMarkets(mData.markets || [])
        }
      } catch { /* silent */ } finally { if (!ignore) setLoading(false) }
    })();
    return () => { ignore = true; };
  }, [user])

  async function handleCreate() {
    if (!opponent.trim() || !pick.trim()) return
    try {
      await api.createChallenge(user.displayName, opponent.trim(), marketId, pick.trim(), stars)
      setOpponent(''); setPick(''); setTab('list')
      load()
    } catch (e) { alert(e.message) }
  }

  async function handleAccept(id) {
    try {
      await api.acceptChallenge(id, user.displayName, '')
      load()
    } catch (e) { alert(e.message) }
  }

  async function handleDecline(id) {
    try {
      await api.declineChallenge(id, user.displayName)
      load()
    } catch (e) { alert(e.message) }
  }

  const myChallenges = challenges.filter(c => c.challenger_id === user.displayName || c.opponent_id === user.displayName || c.opponent_name === user.displayName)
  const pending = myChallenges.filter(c => c.status === 'pending' && (c.opponent_id === user.displayName || c.opponent_name === user.displayName))

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:transparent;color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);opacity:.8;font-weight:500;}
        .tabs{display:flex;gap:.5rem;margin-bottom:1.2rem;}
        .tab{cursor:pointer;border:1.5px solid var(--border);background:var(--card);border-radius:10px;padding:.5rem 1rem;font-weight:700;font-size:.85rem;color:var(--text-secondary);transition:all .18s ease;}
        .tab.on{background:var(--accent);border-color:var(--accent);color:#fff;}
        .card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:1rem;margin-bottom:.7rem;}
        .card .info{font-weight:500;color:var(--text-secondary);line-height:1.5;margin-bottom:.6rem;}
        .card .info b{color:var(--text);}
        .badge{display:inline-block;font-size:.7rem;font-weight:800;padding:.2rem .5rem;border-radius:8px;text-transform:uppercase;}
        .badge.pending{background:#3A2E00;color:#F5C518;}
        .badge.active{background:#0D3A1E;color:#34C759;}
        .badge.completed{background:#2A2A2A;color:#8A8A8A;}
        .actions{display:flex;gap:.5rem;}
        .actions button{border:none;cursor:pointer;font-weight:700;color:#fff;padding:.4rem 1rem;border-radius:8px;font-size:.8rem;}
        .actions .accept{background:var(--accent);}
        .actions .decline{background:var(--danger);}
        .form{display:flex;flex-direction:column;gap:.8rem;}
        .form input,.form select{padding:.7rem .9rem;border:1.5px solid var(--border);border-radius:12px;font-family:inherit;font-size:.9rem;font-weight:500;color:var(--text);background:var(--card);outline:none;}
        .form input:focus,.form select:focus{border-color:var(--accent);}
        .form button{border:none;cursor:pointer;font-weight:800;color:#fff;background:var(--accent);padding:.8rem;border-radius:8px;font-size:1rem;}
        .empty{text-align:center;color:var(--text-secondary);font-weight:600;padding:3rem 1rem;}
      `}</style>

      <main className="wrap">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><h1 className="h">Challenges</h1><p className="hsub">Put your stars where your mouth is.</p></div>
          <button className="tab on" onClick={() => setTab(tab === 'list' ? 'create' : 'list')}>
            {tab === 'list' ? '+ New' : '← Back'}
          </button>
        </div>

        {tab === 'create' ? (
          <div className="card">
            <div className="form">
              <input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Opponent username" />
              <select value={marketId} onChange={(e) => setMarketId(e.target.value)}>
                {markets.filter(m => m.status === 'OPEN').map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
              <input value={pick} onChange={(e) => setPick(e.target.value)} placeholder="Your pick (e.g. Brazil)" />
              <input type="number" value={stars} onChange={(e) => setStars(Number(e.target.value))} min={1} max={5} placeholder="Stars at stake" />
              <button onClick={handleCreate}>Send Challenge</button>
            </div>
          </div>
        ) : null}

        {loading ? <div className="empty">Loading...</div> : (
          <>
            {pending.length > 0 && (
              <>
                <div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--accent)',margin:'1rem 0 .5rem'}}>
                  Pending ({pending.length})
                </div>
                {pending.map(c => (
                  <div key={c.id} className="card">
                    <div className="info"><b>{c.challenger_name}</b> challenges you on <b>{c.market_id}</b> — {c.challenger_pick} ⭐ {c.stars_at_stake}</div>
                    <div className="actions">
                      <button className="accept" onClick={() => handleAccept(c.id)}>Accept</button>
                      <button className="decline" onClick={() => handleDecline(c.id)}>Decline</button>
                    </div>
                  </div>
                ))}
              </>
            )}
            <div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--accent)',margin:'1rem 0 .5rem'}}>
              All Challenges
            </div>
            {myChallenges.length === 0 ? (
              <div className="empty">No challenges yet. Create one!</div>
            ) : myChallenges.map(c => (
              <div key={c.id} className="card">
                <div className="info">
                  <b>{c.challenger_name}</b> vs <b>{c.opponent_name}</b> on {c.market_id}<br />
                  Picks: {c.challenger_pick} vs {c.opponent_pick || '?'} · ⭐ {c.stars_at_stake}
                </div>
                <span className={`badge ${c.status}`}>{c.status}</span>
                {c.winner_id && <span style={{marginLeft:'.5rem',fontWeight:700,color:'var(--accent)'}}>Winner: {c.winner_id}</span>}
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
