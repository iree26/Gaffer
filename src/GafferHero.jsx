import { useNavigate } from 'react-router-dom'
import 'flag-icons/css/flag-icons.min.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import GafferBackground from './GafferBackground'

const FLAGS = [
  "us","ca","mx","br","ar","fr","es","de","pt","nl",
  "be","hr","uy","co","jp","kr","sn","ma","gh","ng",
  "cm","au","sa","ir","ec","ch","dk","rs","pl","no",
];

const HEADLINE = [
  [{ t: "Call" }, { t: "it" }, { t: "like" }],
  [{ t: "a" }, { t: "gaffer.", accent: true }],
];

function FlagRow({ reverse, dur }) {
  const strip = [...FLAGS, ...FLAGS];
  return (
    <div className="row-bob">
      <div className="row-drift"
        style={{ animationDuration: `${dur}s`, animationDirection: reverse ? "reverse" : "normal" }}>
        {strip.map((c, i) => <span className={`fi fi-${c} flag`} key={i} />)}
      </div>
    </div>
  );
}

export default function GafferHero() {
  const navigate = useNavigate()
  let wi = 0;
  return (
    <>
      <style>{`
        .gaffer{
          position:relative; min-height:100svh; width:100%; overflow:hidden; background:transparent;
          font-family:var(--font-body); color:var(--text); isolation:isolate;
        }

        .flags-top,.flags-bottom{ position:absolute; left:0; right:0; z-index:1;
          display:flex; flex-direction:column; gap:1.1rem; opacity:0; pointer-events:none;
          animation:flagsIn 1s 3.3s cubic-bezier(.2,.7,.2,1) forwards; }
        .flags-top{ top:4vh; } .flags-bottom{ bottom:4vh; }
        @keyframes flagsIn{ from{opacity:0;transform:scale(.96);} to{opacity:.5;transform:none;} }
        .row-bob{ animation:bob 7s ease-in-out infinite; }
        .row-drift{ display:flex; gap:2.4rem; width:max-content;
          animation-name:drift; animation-timing-function:linear; animation-iteration-count:infinite; }
        .flag{ font-size:clamp(1.6rem,4.5vw,2.6rem); border-radius:4px; vertical-align:middle;
          box-shadow:0 4px 12px rgba(0,0,0,.3); }
        @keyframes drift{ from{transform:translateX(0);} to{transform:translateX(-50%);} }
        @keyframes bob{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }

        .brand{ position:absolute; top:clamp(1.4rem,4vh,2.2rem); left:clamp(1.4rem,5vw,3rem); z-index:5;
          font-family:var(--font-display); font-weight:700; font-size:clamp(1.25rem,2.8vw,1.6rem);
          letter-spacing:-.01em; color:var(--text-secondary); }
        .brand span{ color:var(--accent); }

        .stage{ position:relative; z-index:2; min-height:100svh; display:flex; flex-direction:column;
          justify-content:center; padding:14vh clamp(1.4rem,6vw,5rem); max-width:1050px; }

        .eyebrow{ align-self:flex-start; display:inline-flex; align-items:center; gap:.55rem;
          border:1.5px solid var(--border); border-radius:8px; padding:.5rem 1rem;
          font-weight:700; font-size:clamp(.66rem,1.5vw,.78rem); letter-spacing:.14em; text-transform:uppercase;
          color:var(--text-secondary); }
        .eyebrow .dot{ width:.45rem;height:.45rem;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px var(--accent-muted);}

        h1{ font-family:var(--font-display); font-weight:700; font-size:clamp(2.7rem,12vw,7rem);
          line-height:1.0; letter-spacing:-.02em; margin:1.5rem 0 0; color:var(--text); }
        .line{ display:block; overflow:hidden; padding-bottom:.1em; }
        .word{ display:inline-block; margin-right:.22em; transform:translateY(118%) rotate(4deg); opacity:0;
          animation:wordUp 1s cubic-bezier(.16,.84,.28,1) forwards; }
        @keyframes wordUp{ to{transform:translateY(0) rotate(0); opacity:1;} }
        .accent{ color:var(--accent); }

        .sub{ margin:1.6rem 0 0; max-width:32ch; font-size:clamp(1rem,2.3vw,1.25rem); font-weight:500;
          line-height:1.45; color:var(--text-secondary); }

        .row{ display:flex; flex-wrap:wrap; align-items:center; gap:1rem 1.6rem; margin-top:2.3rem; }
        .cta{ border:none; cursor:pointer; font-family:var(--font-body); font-weight:800;
          font-size:clamp(1rem,2.2vw,1.1rem); color:#000; background:var(--accent);
          padding:1rem 1.75rem; border-radius:8px;
          transition:transform .18s ease, box-shadow .18s ease; }
        .cta:hover{ transform:translateY(-3px) scale(1.02); box-shadow:0 8px 24px var(--accent-muted); }

        .trust{ display:flex; flex-direction:column; gap:.1rem; }
        .stars{ display:inline-flex; gap:.12rem; color:var(--accent); font-size:1.05rem; }
        .trust small{ color:var(--text-tertiary); font-weight:600; font-size:.8rem; }

        @media (prefers-reduced-motion: reduce){
          .row-bob,.row-drift,.accent{ animation:none !important; }
          .flags-top,.flags-bottom{ opacity:.5 !important; animation:none !important; }
          .brand,.eyebrow,.sub,.cta{ opacity:1 !important; transform:none !important; animation:none !important; }
          .word{ opacity:1 !important; transform:none !important; animation:none !important; }
          .trust small{ opacity:.8 !important; animation:none !important; }
          .accent{ color:var(--accent); }
        .signin-link{ color:var(--text-secondary); font-weight:600; font-size:.9rem; text-decoration:none;
          border:1px solid var(--border); border-radius:8px; padding:.55rem 1.2rem;
          transition:all .2s ease; display:inline-flex; align-items:center; gap:.4rem; }
        .signin-link:hover{ border-color:var(--accent); color:var(--accent); }
        }
      `}</style>

      <div className="gaffer">
        <GafferBackground />

        <div className="flags-top" aria-hidden="true">
          <FlagRow reverse={false} dur={40} />
          <FlagRow reverse={true} dur={52} />
        </div>
        <div className="flags-bottom" aria-hidden="true">
          <FlagRow reverse={true} dur={46} />
          <FlagRow reverse={false} dur={58} />
        </div>

        <div className="brand">GAFF<span>ER</span></div>

        <main className="stage">
          <span className="eyebrow"><span className="dot" />FIFA World Cup 2026 · 48 nations</span>
          <h1>
            {HEADLINE.map((line, li) => (
              <span className="line" key={li}>
                {line.map((w) => {
                  const i = wi++;
                  return (
                    <span key={i} className={`word${w.accent ? " accent" : ""}`}
                          style={{ animationDelay: `${3.65 + i * 0.09}s` }}>{w.t}</span>
                  );
                })}
              </span>
            ))}
          </h1>
          <p className="sub">Predict every match, earn your stars, and prove you read the game better than anyone.</p>
          <div className="row">
            <button className="cta" onClick={() => navigate('/signup')}>Make your first call</button>
            <a className="signin-link" onClick={() => navigate('/login')}>Already a gaffer? Sign in</a>
            <div className="trust">
              <span className="stars">
                {[0,1,2,3,4].map(n => (
                  <span key={n}>★</span>
                ))}
              </span>
              <small>Your stars rise and fall with every result.</small>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
