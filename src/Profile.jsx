import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from './api'
import { useUser } from './UserContext'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function Profile() {
  const { userId: paramUserId } = useParams()
  const { user } = useUser()
  const uid = paramUserId || user.displayName
  const isOwner = !paramUserId || paramUserId === user.displayName
  const [profile, setProfile] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editBio, setEditBio] = useState('')
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [p, preds] = await Promise.all([
          api.getProfile(uid).catch(() => null),
          api.getProfilePredictions(uid).catch(() => ({}))
        ])
        setProfile(p)
        setPredictions(preds.predictions || preds.results || [])
      } catch { /* silent */ } finally { setLoading(false) }
    }
    load()
  }, [uid])

  function startEdit() {
    setEditName(profile?.display_name || uid)
    setEditBio(profile?.bio || '')
    setEditing(true)
  }

  async function saveEdit() {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await api.updateProfile(uid, editName.trim(), editBio.trim())
      setProfile((p) => ({ ...p, display_name: editName.trim(), bio: editBio.trim() }))
      setEditing(false)
    } catch (e) {
      setErr(e.message)
    } finally { setSaving(false) }
  }

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:var(--bg);color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);font-weight:500;}
        .profile-header{background:var(--card);border-bottom:1px solid var(--border);padding:1.5rem;margin-bottom:1rem;text-align:center;}
        .avatar{font-size:3.5rem;margin-bottom:.5rem;}
        .display-name{font-family:var(--font-display);font-weight:800;font-size:1.5rem;color:var(--text);}
        .username{color:var(--text-secondary);font-size:.9rem;margin-top:.2rem;}
        .stats-row{display:flex;justify-content:center;gap:2rem;margin-top:1rem;flex-wrap:wrap;}
        .stat{text-align:center;}
        .stat-val{font-family:var(--font-display);font-weight:800;font-size:1.2rem;color:var(--accent);}
        .stat-label{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);}
        .card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.9rem;margin-bottom:.6rem;}
        .card .info{font-weight:500;color:var(--text-secondary);font-size:.88rem;line-height:1.4;}
        .card .info b{color:var(--text);}
        .section-title{font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin:1rem 0 .5rem;}
        .empty{text-align:center;color:var(--text-secondary);padding:2rem 1rem;font-weight:600;}
        .edit-btn{background:var(--accent);color:#000;border:none;border-radius:8px;padding:.5rem 1.5rem;font-weight:700;cursor:pointer;font-family:var(--font-body);margin-top:1rem;}
        .edit-btn:hover{background:var(--accent-hover);}
        .edit-form{display:flex;flex-direction:column;gap:.5rem;margin-top:1rem;text-align:left;}
        .efield{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:.6rem .8rem;color:var(--text);font-family:var(--font-body);font-size:.9rem;outline:none;}
        .efield:focus{border-color:var(--accent);}
        .earea{resize:none;}
        .eactions{display:flex;gap:.5rem;}
        .esave{background:var(--accent);color:#000;border:none;border-radius:6px;padding:.5rem 1.2rem;font-weight:700;cursor:pointer;}
        .esave:disabled{opacity:.5;cursor:not-allowed;}
        .ecancel{background:var(--card);color:var(--text-secondary);border:1px solid var(--border);border-radius:6px;padding:.5rem 1.2rem;font-weight:600;cursor:pointer;}
        .eerr{color:var(--danger);font-weight:600;font-size:.85rem;}
      `}</style>

      <main className="wrap">
        {loading ? <div className="empty">Loading...</div> : (
          <>
            <div className="profile-header">
              <div className="avatar">⚽</div>
              <div className="display-name">{profile?.display_name || uid}</div>
              <div className="username">@{uid}</div>
              <div className="stats-row">
                <div className="stat"><div className="stat-val">{profile?.stars ?? profile?.score ?? 0}</div><div className="stat-label">Stars</div></div>
                <div className="stat"><div className="stat-val">{profile?.predictions_count ?? predictions.length}</div><div className="stat-label">Predictions</div></div>
                <div className="stat"><div className="stat-val">{profile?.accuracy ? (profile.accuracy * 100).toFixed(0) + '%' : '-'}</div><div className="stat-label">Accuracy</div></div>
                <div className="stat"><div className="stat-val">{profile?.streak ?? 0}</div><div className="stat-label">Streak</div></div>
              </div>
              {isOwner && !editing && <button className="edit-btn" onClick={startEdit}>Edit Profile</button>}
              {editing && (
                <div className="edit-form">
                  <input className="efield" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display name" maxLength={30} />
                  <textarea className="efield earea" value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Bio" maxLength={160} rows={3} />
                  {err && <div className="eerr">{err}</div>}
                  <div className="eactions">
                    <button className="esave" onClick={saveEdit} disabled={saving || !editName.trim()}>{saving ? 'Saving…' : 'Save'}</button>
                    <button className="ecancel" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {err && !editing && <div className="errbar" style={{background:'rgba(255,59,48,.1)',border:'1px solid rgba(255,59,48,.3)',color:'var(--danger)',fontWeight:600,borderRadius:8,padding:'.7rem 1rem',marginBottom:'1rem',fontSize:'.9rem'}}>{err}</div>}

            {profile?.bio && <div className="card" style={{cursor:'default'}}><div className="info">{profile.bio}</div></div>}

            <div className="section-title">Recent Predictions</div>
            {predictions.length === 0 ? <div className="empty">No predictions yet.</div> :
              predictions.slice(0, 10).map((p, i) => (
                <div key={i} className="card">
                  <div className="info">
                    <b>{p.market_id || p.match_id}</b>: {p.pick || p.prediction} {p.points !== undefined ? `· ${p.points} pts` : ''} {p.correct !== undefined ? (p.correct ? '✅' : '❌') : ''}
                  </div>
                </div>
              ))
            }
          </>
        )}
      </main>
    </div>
  )
}
