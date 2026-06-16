import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from './api'
import { useUser } from './UserContext'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'


export default function Groups() {
  const { groupId: paramGroupId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [tab, setTab] = useState(paramGroupId ? 'detail' : 'my')
  const [myGroups, setMyGroups] = useState([])
  const [groupDetail, setGroupDetail] = useState(null)
  const [groupFeed, setGroupFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [postContent, setPostContent] = useState('')

  useEffect(() => {
    if (paramGroupId) {
      loadGroup(paramGroupId);
    } else {
      loadMy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramGroupId])

  async function loadMy() {
    try {
      const d = await api.getMyGroups(user.displayName)
      setMyGroups(d.groups || [])
    } catch { setMyGroups([]) }
    finally { setLoading(false) }
  }

  async function loadGroup(id) {
    setTab('detail')
    setLoading(true)
    try {
      const [d, f] = await Promise.all([
        api.getGroup(id),
        api.getGroupFeed(id).catch(() => ({ posts: [] }))
      ])
      setGroupDetail(d)
      setGroupFeed(f.posts || [])
    } catch { setGroupDetail(null) }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    if (!name.trim()) return
    try {
      const d = await api.createGroup(user.displayName, name.trim(), desc.trim())
      alert(`Created! Invite code: ${d.invite_code}`)
      setName(''); setDesc(''); setTab('my')
      loadMy()
    } catch (e) { alert(e.message) }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return
    try {
      await api.joinGroup(user.displayName, inviteCode.trim())
      setInviteCode('')
      loadMy()
    } catch (e) { alert(e.message) }
  }

  async function handlePost() {
    if (!postContent.trim() || !groupDetail) return
    try {
      await api.postInGroup(groupDetail.id, user.displayName, postContent.trim())
      setPostContent('')
      loadGroup(groupDetail.id)
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:var(--bg);color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);opacity:.8;font-weight:500;}
        .tabs{display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap;}
        .tab{cursor:pointer;border:1.5px solid var(--border);background:var(--card);border-radius:8px;padding:.45rem .9rem;font-weight:700;font-size:.8rem;color:var(--text-secondary);transition:all .18s ease;}
        .tab.on{background:var(--accent);border-color:var(--accent);color:#000;}
        .card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:.7rem;cursor:pointer;transition:box-shadow .2s;}
        .card:hover{box-shadow:0 8px 24px rgba(0,0,0,.3);}
        .card h3{font-family:var(--font-display);font-weight:700;font-size:1.1rem;margin:0 0 .2rem;color:var(--text);}
        .card p{margin:0;font-size:.85rem;color:var(--text-secondary);}
        .card .meta{font-size:.72rem;color:var(--text-tertiary);margin-top:.4rem;}
        .form{display:flex;flex-direction:column;gap:.7rem;}
        .form input,.form textarea{padding:.7rem .9rem;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:500;color:var(--text);background:var(--card);outline:none;}
        .form input:focus,.form textarea:focus{border-color:var(--accent);}
        .form button{border:none;cursor:pointer;font-weight:700;color:#000;background:var(--accent);padding:.7rem;border-radius:8px;}
        .join-row{display:flex;gap:.5rem;margin-bottom:1.5rem;}
        .join-row input{flex:1;padding:.7rem .9rem;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem;outline:none;color:var(--text);background:var(--card);}
        .join-row input:focus{border-color:var(--accent);}
        .join-row button{border:none;cursor:pointer;font-weight:700;color:#000;background:var(--accent);padding:.7rem 1.2rem;border-radius:8px;}
        .post{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:.8rem;margin-bottom:.6rem;}
        .post-author{font-weight:800;font-size:.85rem;color:var(--text);}
        .post-content{font-weight:500;color:var(--text-secondary);margin-top:.3rem;line-height:1.4;}
        .post-agent{font-size:.78rem;color:var(--text);background:var(--card);padding:.4rem .6rem;border-radius:8px;margin-top:.4rem;}
        .composer{display:flex;gap:.5rem;margin-bottom:1rem;}
        .composer input{flex:1;padding:.7rem .9rem;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:500;color:var(--text);background:var(--card);outline:none;}
        .composer input:focus{border-color:var(--accent);}
        .composer button{border:none;cursor:pointer;font-weight:700;color:#000;background:var(--accent);padding:.7rem 1.2rem;border-radius:8px;}
        .empty{text-align:center;color:var(--text-secondary);opacity:.6;padding:2rem 1rem;font-weight:600;}
        .back{font-size:.8rem;cursor:pointer;color:var(--accent);font-weight:700;border:none;background:none;padding:0;margin-bottom:.5rem;display:block;}
      `}</style>

      <main className="wrap">
        {tab === 'detail' && groupDetail ? (
          <>
            <button className="back" onClick={() => navigate('/groups')}>← Back to groups</button>
            <h1 className="h">{groupDetail.name}</h1>
            <p className="hsub">{groupDetail.description} · {groupDetail.member_count} members</p>

            <div className="composer">
              <input value={postContent} onChange={(e) => setPostContent(e.target.value)}
                placeholder="Post in group..." maxLength={300}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePost() }} />
              <button onClick={handlePost}>Post</button>
            </div>

            {groupFeed.map(p => (
              <div key={p.id} className="post">
                <span className="post-author">{p.display_name || p.user_id}</span>
                <div className="post-content">{p.content}</div>
                {p.agent_reply && <div className="post-agent">🤖 {p.agent_reply}</div>}
              </div>
            ))}
            {groupFeed.length === 0 && <div className="empty">No posts yet.</div>}
          </>
        ) : (
          <>
            <h1 className="h">Groups</h1>
            <p className="hsub">Create or join a private prediction group.</p>

            <div className="tabs">
              <button className={`tab${tab === 'my' ? ' on' : ''}`} onClick={() => { setTab('my'); loadMy() }}>My Groups</button>
              <button className={`tab${tab === 'create' ? ' on' : ''}`} onClick={() => setTab('create')}>Create</button>
            </div>

            {tab === 'create' ? (
              <div className="card" style={{cursor:'default'}}>
                <div className="form">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" rows={2} />
                  <button onClick={handleCreate}>Create Group</button>
                </div>
              </div>
            ) : (
              <>
                <div className="join-row">
                  <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter invite code" />
                  <button onClick={handleJoin}>Join</button>
                </div>

                {loading ? <div className="empty">Loading...</div> : myGroups.length === 0 ? (
                  <div className="empty">Not in any groups. Create or join one!</div>
                ) : myGroups.map(g => (
                  <div key={g.id} className="card" onClick={() => { setTab('detail'); loadGroup(g.id) }}>
                    <h3>{g.name}</h3>
                    <p>{g.description || 'No description'}</p>
                    <div className="meta">{g.member_count} members{g.is_private ? ' · Private' : ' · Public'} · Code: {g.invite_code}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
