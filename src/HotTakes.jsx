import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './api'
import { useUser } from './UserContext'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString()
}

function Avatar({ name, size = 36 }) {
  const colors = ['#F5C518','#FF6B35','#4FC3F7','#AB47BC','#66BB6A','#EF5350','#42A5F5','#FFA726']
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  const bg = colors[Math.abs(h) % colors.length]
  const initial = name.charAt(0).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.42, color: '#000', flexShrink: 0,
    }}>{initial}</div>
  )
}

function ReplyIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>) }
function RepostIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>) }
function HeartIcon({ filled }) { return filled
  ? (<svg width="18" height="18" viewBox="0 0 24 24" fill="#F91880" stroke="#F91880" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>)
  : (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>) }
function ShareIcon() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>) }

export default function HotTakes() {
  const navigate = useNavigate()
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
        .gaffer-app{--bg:#000000;--surface:#0D0D0D;--card:#1A1A1A;--border:#2E2E2E;--text:#E7E9EA;--text-secondary:#71767B;--text-tertiary:#536471;--accent:#F5C518;--font-display:'Syne','Plus Jakarta Sans',sans-serif;--font-body:'Plus Jakarta Sans',system-ui,sans-serif;
          position:relative;isolation:isolate;min-height:100svh;width:100%;background:transparent;color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:600px;margin:0 auto;padding:0;}
        .head{position:sticky;top:0;z-index:10;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:.8rem 1rem;}
        .head h1{font-family:var(--font-display);font-weight:700;font-size:1.25rem;letter-spacing:-.02em;margin:0;color:var(--text);}
        .composer{display:flex;gap:.75rem;padding:1rem;border-bottom:1px solid var(--border);}
        .composer-in{flex:1;display:flex;flex-direction:column;gap:.5rem;}
        .composer-in textarea{width:100%;border:none;background:transparent;padding:.5rem 0;font-family:inherit;font-size:1.05rem;font-weight:400;color:var(--text);outline:none;resize:none;min-height:48px;}
        .composer-in textarea::placeholder{color:var(--text-secondary);}
        .composer-foot{display:flex;justify-content:flex-end;align-items:center;}
        .composer-foot button{border:none;cursor:pointer;font-weight:700;font-size:.92rem;color:#fff;background:var(--accent);padding:.5rem 1.2rem;border-radius:999px;transition:all .15s ease;}
        .composer-foot button:disabled{opacity:.4;cursor:not-allowed;}
        .composer-foot button:hover:not(:disabled){filter:brightness(1.1);}
        .sorts{display:flex;border-bottom:1px solid var(--border);}
        .sort{flex:1;cursor:pointer;border:none;background:transparent;padding:.8rem;font-weight:600;font-size:.92rem;color:var(--text-secondary);transition:all .15s ease;position:relative;}
        .sort:hover{background:rgba(255,255,255,.03);}
        .sort.on{color:var(--text);}
        .sort.on::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:56px;height:4px;background:var(--accent);border-radius:2px;}
        .take{display:flex;gap:.75rem;padding:.75rem 1rem;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;}
        .take:hover{background:rgba(255,255,255,.02);}
        .take-body{flex:1;min-width:0;}
        .take-meta{display:flex;align-items:center;gap:.35rem;flex-wrap:wrap;margin-bottom:.15rem;}
        .take-name{font-weight:700;font-size:.95rem;color:var(--text);white-space:nowrap;}
        .take-handle{font-weight:400;font-size:.92rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .take-dot{color:var(--text-tertiary);font-size:.6rem;}
        .take-time{font-weight:400;font-size:.92rem;color:var(--text-secondary);white-space:nowrap;}
        .take-text{font-weight:400;font-size:1.05rem;line-height:1.4;color:var(--text);word-wrap:break-word;margin-bottom:.35rem;}
        .take-text .hashtag{color:var(--accent);cursor:pointer;}
        .take-text .mention{color:var(--accent);cursor:pointer;}
        .take-actions{display:flex;justify-content:space-between;max-width:425px;margin-top:.25rem;}
        .take-actions button{border:none;background:transparent;cursor:pointer;display:flex;align-items:center;gap:.5rem;padding:.3rem .2rem;color:var(--text-secondary);font-size:.82rem;font-weight:500;transition:color .15s;border-radius:4px;}
        .take-actions button:hover{color:var(--accent);}
        .take-actions button.reply:hover{color:#1D9BF0;}
        .take-actions button.repost:hover{color:#00BA7C;}
        .take-actions button.like:hover{color:#F91880;}
        .take-actions button.like.on{color:#F91880;}
        .take-actions button.share:hover{color:var(--accent);}
        .empty{text-align:center;color:var(--text-secondary);padding:3rem 1rem;font-weight:500;}
        .loading{text-align:center;color:var(--text-secondary);padding:3rem 1rem;font-weight:500;}
        .composer textarea:focus{outline:none;}
      `}</style>

      <main className="wrap">
        <div className="head"><h1>Hot Takes</h1></div>

        <div className="composer">
          <Avatar name={user.displayName} size={40} />
          <div className="composer-in">
            <textarea value={takeText} onChange={(e) => setTakeText(e.target.value)}
              placeholder="What's happening?!" maxLength={280} />
            <div className="composer-foot">
              <button onClick={handlePost} disabled={!takeText.trim() || posting}>
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>

        <div className="sorts">
          {[
            { key: 'latest', label: 'Latest' },
            { key: 'fire', label: '🔥 Hot' },
            { key: 'controversial', label: '⚡ Controversial' },
          ].map(s => (
            <button key={s.key} className={`sort${sort === s.key ? ' on' : ''}`} onClick={() => setSort(s.key)}>
              {s.label}
            </button>
          ))}
        </div>

        {loading ? <div className="loading">Loading...</div> : takes.length === 0 ? (
          <div className="empty">No hot takes yet. Drop one!</div>
        ) : takes.map(t => {
          const displayName = t.display_name || t.user_id || 'unknown'
          const handle = `@${displayName.toLowerCase().replace(/\s+/g, '')}`
          const textWithHighlights = (t.take || '').replace(/(#[^\s#]+)/g, '<span class="hashtag">$1</span>').replace(/(@\w+)/g, '<span class="mention">$1</span>')
          return (
            <article key={t.id} className="take">
              <Avatar name={displayName} size={40} />
              <div className="take-body">
                <div className="take-meta">
                  <span className="take-name" onClick={() => navigate(`/profile/${t.user_id}`)}>{displayName}</span>
                  <span className="take-handle">{handle}</span>
                  <span className="take-dot">·</span>
                  <span className="take-time">{timeAgo(t.created_at)}</span>
                </div>
                <div className="take-text" dangerouslySetInnerHTML={{ __html: textWithHighlights }} />
                <div className="take-actions">
                  <button className="reply" title="Reply"><ReplyIcon /></button>
                  <button className="repost" title="Repost"><RepostIcon /></button>
                  <button className={`like${t.your_vote === 'fire' ? ' on' : ''}`} title="Like" onClick={() => handleVote(t.id, 'fire')}>
                    <HeartIcon filled={t.your_vote === 'fire'} /> {t.fire_count || 0}
                  </button>
                  <button className="share" title="Share"><ShareIcon /></button>
                </div>
              </div>
            </article>
          )
        })}
      </main>
    </div>
  )
}
