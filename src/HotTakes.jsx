import { useState, useEffect } from 'react'
import { api } from './api'
import { useUser } from './UserContext'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function HotTakes() {
  const { user } = useUser()
  const [takes, setTakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [takeText, setTakeText] = useState('')
  const [posting, setPosting] = useState(false)
  const [sort, setSort] = useState('latest')

  async function load() {
    try {
      const data = await api.getHotTakes(sort)
      setTakes(data.hot_takes || data || [])
    } catch { setTakes([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await api.getHotTakes(sort)
        if (!ignore) setTakes(data.hot_takes || data || [])
      } catch { if (!ignore) setTakes([]) }
      finally { if (!ignore) setLoading(false) }
    })();
    return () => { ignore = true; };
  }, [sort])

  async function handlePost() {
    if (!takeText.trim() || posting) return
    setPosting(true)
    try {
      await api.createHotTake(user.displayName, takeText.trim())
      setTakeText('')
      load()
    } catch (e) { alert(e.message) }
    finally { setPosting(false) }
  }

  async function handleVote(takeId, vote) {
    try {
      await api.voteHotTake(takeId, user.displayName, vote)
      load()
    } catch { /* silent */ }
  }

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{--bg:#000000;--surface:#0D0D0D;--card:#1A1A1A;--card-hover:#222222;--border:#2E2E2E;--border-hover:#3A3A3A;--text:#F0F0F0;--text-secondary:#8A8A8A;--text-tertiary:#5E5E5E;--accent:#F5C518;--accent-hover:#FFD633;--accent-muted:rgba(245,197,24,0.12);--danger:#FF3B30;--font-display:'Syne','Plus Jakarta Sans',sans-serif;--font-body:'Plus Jakarta Sans',system-ui,sans-serif;
          position:relative;isolation:isolate;min-height:100svh;width:100%;background:transparent;color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);opacity:.8;font-weight:500;}
        .composer{display:flex;gap:.6rem;margin-bottom:1.5rem;}
        .composer input{flex:1;border:1.5px solid var(--border);border-radius:8px;padding:.8rem 1rem;font-family:inherit;font-size:.95rem;font-weight:500;color:var(--text);background:var(--card);outline:none;}
        .composer input:focus{border-color:var(--accent);}
        .composer button{border:none;cursor:pointer;font-weight:800;color:#000;background:var(--accent);padding:.8rem 1.5rem;border-radius:8px;transition:all .18s ease;}
        .composer button:disabled{opacity:.4;}
        .composer button:hover:not(:disabled){transform:translateY(-2px);}
        .sorts{display:flex;gap:.5rem;margin-bottom:1rem;}
        .sort{cursor:pointer;border:1.5px solid var(--border);background:var(--card);border-radius:8px;padding:.4rem .8rem;font-weight:700;font-size:.78rem;color:var(--text-secondary);transition:all .18s ease;}
        .sort.on{background:var(--accent);border-color:var(--accent);color:#000;}
        .take{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:.7rem;}
        .take-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem;}
        .take-author{font-weight:800;font-size:.88rem;color:var(--text);}
        .take-verdict{font-size:.75rem;color:var(--text-secondary);opacity:.6;}
        .take-text{font-weight:500;color:var(--text-secondary);line-height:1.5;margin:.5rem 0;}
        .take-votes{display:flex;gap:.6rem;}
        .take-votes button{border:1.5px solid var(--border);background:transparent;border-radius:8px;padding:.4rem .9rem;font-weight:700;font-size:.82rem;color:var(--text-secondary);cursor:pointer;transition:all .15s ease;display:flex;align-items:center;gap:.3rem;}
        .take-votes button:hover{border-color:var(--accent);}
        .take-votes button.fire.on{background:#FF6B35;border-color:#FF6B35;color:#fff;}
        .take-votes button.ice.on{background:#4FC3F7;border-color:#4FC3F7;color:#fff;}
        .empty{text-align:center;color:var(--text-secondary);opacity:.6;font-weight:600;padding:3rem 1rem;}
        .loading{text-align:center;color:var(--text-secondary);opacity:.7;padding:3rem 1rem;font-weight:700;}
      `}</style>

      <main className="wrap">
        <h1 className="h">Hot Takes</h1>
        <p className="hsub">Drop a spicy opinion. Let the crowd decide 🔥🧊</p>

        <div className="composer">
          <input value={takeText} onChange={(e) => setTakeText(e.target.value)}
            placeholder="Your hot take..." maxLength={200}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePost() }} />
          <button onClick={handlePost} disabled={!takeText.trim() || posting}>Post</button>
        </div>

        <div className="sorts">
          {['latest', 'fire', 'controversial'].map(s => (
            <button key={s} className={`sort${sort === s ? ' on' : ''}`} onClick={() => setSort(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <div className="loading">Loading...</div> : takes.length === 0 ? (
          <div className="empty">No hot takes yet. Drop one!</div>
        ) : takes.map(t => (
          <div key={t.id} className="take">
            <div className="take-head">
              <span className="take-author">{t.display_name || t.user_id}</span>
              <span className="take-verdict">{t.agent_verdict}</span>
            </div>
            <div className="take-text">{t.take}</div>
            <div className="take-votes">
              <button className={`fire${t.your_vote === 'fire' ? ' on' : ''}`} onClick={() => handleVote(t.id, 'fire')}>
                🔥 {t.fire_count || 0}
              </button>
              <button className={`ice${t.your_vote === 'ice' ? ' on' : ''}`} onClick={() => handleVote(t.id, 'ice')}>
                🧊 {t.ice_count || 0}
              </button>
              {t.controversy_score > 0 && <span style={{fontSize:'.75rem',color:'var(--text-secondary)',opacity:.6,alignSelf:'center'}}>⚡ {t.controversy_score}</span>}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
