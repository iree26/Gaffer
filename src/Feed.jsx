import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from './UserContext'
import { api } from './api'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function Feed() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [filter, setFilter] = useState('all')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')

  const loadFeed = useCallback(async () => {
    try {
      const data = await api.getFeed(1, 50, filter, user.displayName)
      setPosts(data.posts || data || [])
    } catch { setPosts([]) }
    finally { setLoading(false) }
  }, [filter, user.displayName])

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await api.getFeed(1, 50, filter, user.displayName)
        if (!ignore) setPosts(data.posts || data || [])
      } catch { if (!ignore) setPosts([]) }
      finally { if (!ignore) setLoading(false) }
    })();
    return () => { ignore = true; };
  }, [filter, user])

  async function handlePost() {
    if (!content.trim() || posting) return
    setPosting(true)
    try {
      await api.createPost(user.displayName, content.trim())
      setContent('')
      loadFeed()
    } catch (e) { alert(e.message) }
    finally { setPosting(false) }
  }

  async function handleLike(postId) {
    try {
      await api.likePost(postId, user.displayName)
      loadFeed()
    } catch { /* silent */ }
  }

  async function handleRepost(postId) {
    try {
      await api.repostPost(postId, user.displayName)
      loadFeed()
    } catch { /* silent */ }
  }

  async function handleReply(postId) {
    if (!replyContent.trim()) return
    try {
      await api.commentOnPost(postId, user.displayName, replyContent.trim())
      setReplyContent('')
      setReplyingTo(null)
      loadFeed()
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
        .composer{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1.5rem;}
        .composer textarea{width:100%;border:1.5px solid var(--border);border-radius:8px;padding:.8rem;font-family:inherit;font-size:.95rem;font-weight:500;color:var(--text);background:var(--surface);outline:none;resize:none;min-height:80px;transition:border-color .2s;}
        .composer textarea:focus{border-color:var(--accent);}
        .composer .row{display:flex;justify-content:flex-end;margin-top:.6rem;}
        .composer button{border:none;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;color:#000;background:var(--accent);padding:.7rem 1.5rem;border-radius:8px;transition:all .18s ease;}
        .composer button:disabled{opacity:.4;cursor:not-allowed;}
        .composer button:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 22px rgba(245,197,24,.35);}
        .filters{display:flex;gap:.5rem;margin-bottom:1rem;}
        .filter{flex:none;cursor:pointer;border:1.5px solid var(--border);background:var(--card);border-radius:8px;padding:.45rem .9rem;font-weight:700;font-size:.8rem;color:var(--text-secondary);transition:all .18s ease;}
        .filter:hover{border-color:var(--accent);}
        .filter.on{background:var(--accent);border-color:var(--accent);color:#000;}
        .post{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:.8rem;transition:box-shadow .2s;}
        .post:hover{box-shadow:0 8px 24px rgba(0,0,0,.3);}
        .post-head{display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem;}
        .post-author{font-weight:800;font-size:.9rem;color:var(--text);cursor:pointer;}
        .post-author:hover{color:var(--accent);}
        .post-stars{font-size:.7rem;color:var(--accent);}
        .post-time{font-size:.7rem;color:var(--text-secondary);opacity:.5;}
        .post-content{font-weight:500;color:var(--text-secondary);line-height:1.5;margin-bottom:.6rem;}
        .post-actions{display:flex;gap:.8rem;}
        .post-actions button{border:none;background:transparent;cursor:pointer;font-family:inherit;font-weight:700;font-size:.8rem;color:var(--text-secondary);opacity:.6;display:flex;align-items:center;gap:.3rem;padding:.3rem .5rem;border-radius:8px;transition:all .15s ease;}
        .post-actions button:hover{opacity:1;background:var(--card-hover);}
        .post-actions button.liked{color:var(--accent);opacity:1;}
        .reply-box{display:flex;gap:.5rem;margin-top:.6rem;padding-top:.6rem;border-top:1px solid var(--border);}
        .reply-box input{flex:1;border:1.5px solid var(--border);border-radius:8px;padding:.5rem .8rem;font-family:inherit;font-size:.85rem;font-weight:500;color:var(--text);background:var(--surface);outline:none;}
        .reply-box input:focus{border-color:var(--accent);}
        .reply-box button{border:none;cursor:pointer;font-weight:800;color:#000;background:var(--accent);padding:.5rem 1rem;border-radius:8px;font-size:.8rem;}
        .empty{text-align:center;color:var(--text-secondary);opacity:.6;font-weight:600;padding:3rem 1rem;}
        .loading{text-align:center;color:var(--text-secondary);opacity:.7;font-weight:700;padding:3rem 1rem;}
      `}</style>

      <main className="wrap">
        <h1 className="h">Feed</h1>
        <p className="hsub">Share your takes, react to others.</p>

        <div className="composer">
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="What's your call?" maxLength={500} />
          <div className="row">
            <button onClick={handlePost} disabled={!content.trim() || posting}>
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        <div className="filters">
          {['all', 'following', 'hot'].map(f => (
            <button key={f} className={`filter${filter === f ? ' on' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <div className="loading">Loading feed...</div> : posts.length === 0 ? (
          <div className="empty">No posts yet. Be the first.</div>
        ) : posts.map((post) => (
          <article key={post.id} className="post">
            <div className="post-head">
              <span className="post-author" onClick={() => navigate(`/profile/${post.user_id}`)}>
                {post.display_name || post.user_id}
              </span>
              {post.stars != null && <span className="post-stars">★ {post.stars}</span>}
              <span className="post-time">{post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
            </div>
            <div className="post-content">{post.content}</div>
            {post.agent_reply && (
              <div style={{fontSize:'.82rem',color:'var(--text-secondary)',background:'var(--card)',padding:'.5rem .7rem',borderRadius:'8px',marginBottom:'.5rem'}}>
                🤖 {post.agent_reply}
              </div>
            )}
            <div className="post-actions">
              <button onClick={() => handleLike(post.id)} className={post.liked ? 'liked' : ''}>
                👍 {post.likes_count || 0}
              </button>
              <button onClick={() => handleRepost(post.id)}>
                🔄 {post.reposts_count || 0}
              </button>
              <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}>
                💬 {post.comments_count || 0}
              </button>
            </div>
            {replyingTo === post.id && (
              <div className="reply-box">
                <input value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..." maxLength={240}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleReply(post.id) }} />
                <button onClick={() => handleReply(post.id)}>Reply</button>
              </div>
            )}
          </article>
        ))}
      </main>
    </div>
  )
}
