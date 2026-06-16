import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { api } from './api';
import GafferBackground from './GafferBackground';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const u = username.trim();
    const p = password.trim();
    if (!u || !p) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.login(u, p);
      login(result);
      navigate('/talk');
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  }

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <style>{`
        .gaffer-app{
          position:relative; isolation:isolate; min-height:100svh; width:100%; background:var(--bg); color:var(--text);
          font-family:var(--font-body); display:flex; flex-direction:column;
        }
        .topbar{ position:relative; z-index:2; padding:1rem clamp(1.2rem,5vw,3rem); border-bottom:1px solid var(--border); }
        .logo{ font-family:var(--font-display); font-weight:800; font-size:1.3rem; color:var(--text); cursor:pointer; }
        .logo span{ color:var(--accent); }
        .stage{ position:relative; z-index:2; flex:1; display:flex; flex-direction:column; justify-content:center;
          align-items:center; padding:clamp(1.5rem,6vw,3rem); max-width:440px; margin:0 auto; width:100%; }
        .panel{ width:100%; background:var(--card); border:1px solid var(--border); border-radius:8px; padding:clamp(1.5rem,5vw,2.4rem); }
        .step{ width:100%; animation:stepIn .5s cubic-bezier(.2,.8,.25,1); }
        @keyframes stepIn{ from{opacity:0; transform:translateY(24px) scale(.98);} to{opacity:1; transform:none;} }
        .kicker{ font-size:.72rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); }
        .title{ font-family:var(--font-display); font-weight:800; font-size:clamp(1.7rem,6vw,2.5rem); letter-spacing:-.02em;
          margin:.5rem 0 1.6rem; line-height:1.05; color:var(--text); }
        .nameField{ width:100%; border:1.5px solid var(--border); border-radius:8px; padding:1rem 1.1rem;
          font-family:inherit; font-size:1.15rem; font-weight:600; color:var(--text); background:var(--card);
          outline:none; transition:border-color .2s; box-sizing:border-box; }
        .nameField:focus{ border-color:var(--accent); }
        .cta{ border:none; cursor:pointer; font-family:var(--font-body); font-weight:700; font-size:1.05rem;
          color:#000; background:var(--accent); padding:1rem 2rem; border-radius:8px; transition:all .2s ease; width:100%; }
        .cta:disabled{ opacity:.5; cursor:not-allowed; }
        .cta:hover:not(:disabled){ transform:translateY(-3px) scale(1.03); }
        .err{ color:#ff4444; font-weight:600; margin-bottom:.8rem; text-align:center; font-size:.9rem; }
        .foot{ text-align:center; margin-top:1.2rem; font-size:.9rem; color:var(--text-secondary); }
        .foot a{ color:var(--accent); cursor:pointer; text-decoration:underline; }
        @media (prefers-reduced-motion: reduce){
          .step,.cta{ animation:none !important; opacity:1 !important; transform:none !important; }
        }
      `}</style>

      <div className="topbar"><span className="logo" onClick={() => navigate('/')}>GAFF<span>ER</span></span></div>

      <div className="stage">
        <div className="panel">
          <div className="step" key="login">
            <div className="kicker">Welcome back</div>
            <h1 className="title">Sign in to Gaffer</h1>
            {error && <div className="err">{error}</div>}
            <input className="nameField" value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('login-pw').focus(); }}
              placeholder="Your gaffer name" maxLength={20} autoFocus />
            <input id="login-pw" className="nameField" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              placeholder="Password" style={{ marginTop: '.7rem' }} />
            <button className="cta" style={{ marginTop: '1.4rem' }} disabled={loading || !username.trim() || !password.trim()} onClick={handleLogin}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="foot">
              Don&apos;t have an account? <a onClick={() => navigate('/signup')}>Sign up</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
