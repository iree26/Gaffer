import { useState, useEffect } from 'react'
import { api } from './api'
import { useUser } from './UserContext'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function Notifications() {
  const { user } = useUser()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const d = await api.getNotifications(user.displayName)
      setNotifs(d.notifications || [])
    } catch { setNotifs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const d = await api.getNotifications(user.displayName)
        if (!ignore) setNotifs(d.notifications || [])
      } catch { if (!ignore) setNotifs([]) }
      finally { if (!ignore) setLoading(false) }
    })();
    return () => { ignore = true; };
  }, [user])

  async function handleMarkRead(id) {
    try {
      await api.markNotificationRead(id)
      load()
    } catch { /* silent */ }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead(user.displayName)
      load()
    } catch { /* silent */ }
  }

  const typeIcon = { challenge: '🏆', prediction: '⚽', comment: '💬', system: '🔔', reward: '⭐' }

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:transparent;color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);font-weight:500;}
        .card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.9rem 1rem;margin-bottom:.6rem;display:flex;align-items:flex-start;gap:.7rem;cursor:pointer;transition:all .15s ease;}
        .card:hover{box-shadow:0 4px 12px rgba(0,0,0,.2);}
        .card.unread{border-left:3px solid var(--accent);}
        .icon{font-size:1.3rem;line-height:1;width:1.8rem;text-align:center;}
        .body{flex:1;}
        .msg{font-weight:500;color:var(--text);font-size:.9rem;line-height:1.4;}
        .time{font-size:.72rem;color:var(--text-tertiary);margin-top:.2rem;}
        .actions{display:flex;gap:.5rem;margin-top:.8rem;}
        .actions button{border:none;cursor:pointer;font-weight:700;color:var(--accent);background:none;padding:0;font-size:.8rem;}
        .mark-all{float:right;border:none;cursor:pointer;font-weight:700;color:var(--accent);background:none;font-size:.8rem;margin-top:.2rem;}
        .empty{text-align:center;color:var(--text-secondary);padding:3rem 1rem;font-weight:600;}
      `}</style>

      <main className="wrap">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><h1 className="h">Notifications</h1><p className="hsub">Your alerts and updates.</p></div>
          <button className="mark-all" onClick={handleMarkAllRead}>Mark all read</button>
        </div>

        {loading ? <div className="empty">Loading...</div> : notifs.length === 0 ? (
          <div className="empty">No notifications yet.</div>
        ) : notifs.map(n => (
          <div key={n.id} className={`card${n.read ? '' : ' unread'}`} onClick={() => { if (!n.read) handleMarkRead(n.id) }}>
            <span className="icon">{typeIcon[n.type] || '🔔'}</span>
            <div className="body">
              <div className="msg">{n.message}</div>
              <div className="time">{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</div>
              {!n.read && (
                <div className="actions">
                  <button onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id) }}>Mark read</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
