import { useNavigate } from 'react-router-dom'
import 'flag-icons/css/flag-icons.min.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import GafferBackground from './GafferBackground'


// ISO 3166-1 alpha-2 codes (lowercase) for flag-icons.
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
          --ink:#0B6B3A; --deep:#075E32; --bright:#16B45F; --lime:#3FE07F; --pitch:#15924D;
          --display:'Syne','Plus Jakarta Sans',sans-serif;
          position:relative; min-height:100svh; width:100%; overflow:hidden; background:transparent;
          font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--ink); isolation:isolate;
        }

        /* ---- flag slideshow (now sits above the shared pitch) ---- */
        .flags-top,.flags-bottom{ position:absolute; left:0; right:0; z-index:1;
          display:flex; flex-direction:column; gap:1.1rem; opacity:0; pointer-events:none;
          animation:flagsIn 1s 3.3s cubic-bezier(.2,.7,.2,1) forwards; }
        .flags-top{ top:4vh; } .flags-bottom{ bottom:4vh; }
        @keyframes flagsIn{ from{opacity:0;transform:scale(.96);} to{opacity:.5;transform:none;} }
        .row-bob{ animation:bob 7s ease-in-out infinite; }
        .row-drift{ display:flex; gap:2.4rem; width:max-content;
          animation-name:drift; animation-timing-function:linear; animation-iteration-count:infinite; }
        .flag{ font-size:clamp(1.6rem,4.5vw,2.6rem); border-radius:4px; vertical-align:middle;
          box-shadow:0 4px 12px rgba(7,94,50,.12); }
        @keyframes drift{ from{transform:translateX(0);} to{transform:translateX(-50%);} }
        @keyframes bob{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }

        /* ---- intro: green → stadium → ball → kick → reveal ---- */
        .intro{ position:absolute; inset:0; z-index:50; background:var(--pitch);
          animation:introOut .5s 3.5s forwards; }
        @keyframes introOut{ to{opacity:0; visibility:hidden;} }

        .scene{ position:absolute; inset:0; width:100%; height:100%; transform-origin:50% 52%;
          opacity:0; animation:scene 1.8s .2s ease forwards; }
        @keyframes scene{
          0%{ opacity:0; transform:scale(1.05); }
          20%{ opacity:1; transform:scale(1); }
          62%{ opacity:1; transform:scale(1); }
          100%{ opacity:0; transform:scale(2.7); }
        }

        .ball-wrap{ position:absolute; top:52%; left:50%; width:230px; height:230px;
          opacity:0; transform:translate(-50%,-50%) scale(.2);
          animation:ballKick 2.4s 1.55s cubic-bezier(.4,.05,.25,1) forwards; }
        @keyframes ballKick{
          0%  { opacity:0; transform:translate(-50%,-50%) scale(.2)  rotate(0deg); }
          10% { opacity:1; transform:translate(-50%,-50%) scale(1)   rotate(30deg); }
          28% { transform:translate(-50%,-53%) scale(1)   rotate(80deg); }
          46% { transform:translate(-50%,-50%) scale(1)   rotate(120deg); }
          56% { transform:translate(-50%,-66%) scale(1)   rotate(150deg); }
          66% { transform:translate(-50%,-50%) scale(1)   rotate(178deg); }
          78% { transform:translate(-58%,-42%) scale(.95) rotate(190deg); }
          86% { opacity:1; }
          100%{ opacity:0; transform:translate(75%,-165%) scale(1.18) rotate(900deg); }
        }

        .brand{ position:absolute; top:clamp(1.4rem,4vh,2.2rem); left:clamp(1.4rem,5vw,3rem); z-index:5;
          font-family:var(--display); font-weight:700; font-size:clamp(1.25rem,2.8vw,1.6rem);
          letter-spacing:-.01em; color:var(--deep);
          opacity:0; transform:translateX(-28px);
          animation:brandBounce .9s 3.55s cubic-bezier(.2,.7,.2,1) forwards; }
        .brand span{ color:var(--bright); }
        @keyframes brandBounce{
          0%{opacity:0; transform:translateX(-28px);}
          55%{opacity:1; transform:translateX(8px);}
          75%{transform:translateX(-4px);}
          90%{transform:translateX(2px);}
          100%{opacity:1; transform:translateX(0);}
        }

        .stage{ position:relative; z-index:2; min-height:100svh; display:flex; flex-direction:column;
          justify-content:center; padding:14vh clamp(1.4rem,6vw,5rem); max-width:1050px; }

        .eyebrow{ align-self:flex-start; display:inline-flex; align-items:center; gap:.55rem;
          border:1.5px solid rgba(11,107,58,.22); border-radius:999px; padding:.5rem 1rem;
          font-weight:700; font-size:clamp(.66rem,1.5vw,.78rem); letter-spacing:.14em; text-transform:uppercase;
          color:var(--ink); opacity:0; transform:translateY(-26px) scale(.9);
          animation:eyebrowDrop .85s 3.7s cubic-bezier(.18,.7,.25,1) forwards; }
        .eyebrow .dot{ width:.45rem;height:.45rem;border-radius:50%;background:var(--bright);box-shadow:0 0 0 4px rgba(22,180,95,.22);}
        @keyframes eyebrowDrop{
          0%{opacity:0; transform:translateY(-26px) scale(.9);}
          55%{opacity:1; transform:translateY(8px) scale(1);}
          74%{transform:translateY(-4px);}
          88%{transform:translateY(2px);}
          100%{opacity:1; transform:translateY(0) scale(1);}
        }

        h1{ font-family:var(--display); font-weight:700; font-size:clamp(2.7rem,12vw,7rem);
          line-height:1.0; letter-spacing:-.02em; margin:1.5rem 0 0; color:var(--ink); }
        .line{ display:block; overflow:hidden; padding-bottom:.1em; }
        .word{ display:inline-block; margin-right:.22em; transform:translateY(118%) rotate(4deg); opacity:0;
          animation:wordUp 1s cubic-bezier(.16,.84,.28,1) forwards; }
        @keyframes wordUp{ to{transform:translateY(0) rotate(0); opacity:1;} }
        .accent{ background:linear-gradient(100deg,var(--deep) 0 38%,var(--lime) 50%,var(--deep) 62% 100%);
          background-size:250% 100%; -webkit-background-clip:text; background-clip:text; color:transparent;
          animation:wordUp 1s cubic-bezier(.16,.84,.28,1) forwards, shine 4s 4.4s linear infinite; }
        @keyframes shine{ 0%{background-position:140% 0;} 100%{background-position:-140% 0;} }

        .sub{ margin:1.6rem 0 0; max-width:32ch; font-size:clamp(1rem,2.3vw,1.25rem); font-weight:500;
          line-height:1.45; color:var(--deep); opacity:0; transform:translateY(28px);
          animation:subBounce .9s 4.0s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes subBounce{
          0%{opacity:0; transform:translateY(28px);}
          55%{opacity:1; transform:translateY(-7px);}
          76%{transform:translateY(3px);}
          100%{opacity:1; transform:translateY(0);}
        }

        .row{ display:flex; flex-wrap:wrap; align-items:center; gap:1rem 1.6rem; margin-top:2.3rem; }
        .cta{ border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700;
          font-size:clamp(1rem,2.2vw,1.1rem); color:#fff; background:var(--bright);
          padding:1rem 1.75rem; border-radius:999px; opacity:0; transform:scale(.8);
          transition:transform .18s ease, box-shadow .18s ease;
          animation:ctaThump .8s 4.2s cubic-bezier(.2,.7,.2,1) forwards, glow 2.8s 5.0s ease-in-out infinite; }
        .cta:hover{ transform:translateY(-3px) scale(1.02); }
        @keyframes ctaThump{
          0%{opacity:0; transform:scale(.7) translateY(18px);}
          50%{opacity:1; transform:scale(1.06) translateY(-4px);}
          72%{transform:scale(.97) translateY(2px);}
          88%{transform:scale(1.02);}
          100%{opacity:1; transform:scale(1) translateY(0);}
        }
        @keyframes glow{ 0%,100%{box-shadow:0 8px 24px rgba(22,180,95,.32);} 50%{box-shadow:0 10px 38px rgba(63,224,127,.6);} }

        .trust{ display:flex; flex-direction:column; gap:.1rem; }
        .stars{ display:inline-flex; gap:.12rem; color:var(--bright); font-size:1.05rem; }
        .st{ display:inline-block; opacity:0; transform:scale(.2) translateY(6px);
          animation:starPop .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes starPop{
          0%{opacity:0; transform:scale(.2) translateY(6px);}
          55%{opacity:1; transform:scale(1.35) translateY(-3px);}
          78%{transform:scale(.92) translateY(1px);}
          100%{opacity:1; transform:scale(1) translateY(0);}
        }
        .trust small{ color:var(--deep); font-weight:600; opacity:0; font-size:.8rem;
          animation:fadeUp .7s 4.8s ease forwards; }
        @keyframes fadeUp{ from{opacity:0;transform:translateY(8px);} to{opacity:.8;transform:none;} }

        @media (prefers-reduced-motion: reduce){
          .intro{ display:none; }
          .row-bob,.row-drift,.accent{ animation:none !important; }
          .flags-top,.flags-bottom{ opacity:.5 !important; animation:none !important; }
          .brand,.eyebrow,.sub,.cta,.st{ opacity:1 !important; transform:none !important; clip-path:none !important; animation:none !important; }
          .word{ opacity:1 !important; transform:none !important; animation:none !important; }
          .trust small{ opacity:.8 !important; animation:none !important; }
          .accent{ color:var(--deep); -webkit-text-fill-color:var(--deep); }
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

        {/* INTRO */}
        <div className="intro" aria-hidden="true">
          <svg className="scene" viewBox="0 0 600 380" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#A9DEFB" /><stop offset="1" stopColor="#E9F7FF" />
              </linearGradient>
              <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3CB463" /><stop offset="1" stopColor="#198A45" />
              </linearGradient>
            </defs>

            <rect width="600" height="205" fill="url(#sky)" />
            <g fill="#fff" opacity=".85">
              <ellipse cx="120" cy="52" rx="48" ry="18" /><ellipse cx="165" cy="44" rx="34" ry="15" />
              <ellipse cx="470" cy="38" rx="52" ry="18" /><ellipse cx="430" cy="46" rx="30" ry="13" />
            </g>

            <path d="M0,150 Q300,72 600,150 L600,188 Q300,128 0,188 Z" fill="#9aa6ad" />
            <path d="M0,176 Q300,120 600,176 L600,206 Q300,158 0,206 Z" fill="#79858d" />

            <g fill="#5c6870">
              <rect x="74" y="96" width="5" height="42" />
              <g transform="translate(60,84) rotate(-8)"><rect width="40" height="20" rx="3" fill="#46525a" />
                <g fill="#FFF6C9"><circle cx="8" cy="6" r="2.4"/><circle cx="16" cy="6" r="2.4"/><circle cx="24" cy="6" r="2.4"/><circle cx="32" cy="6" r="2.4"/>
                <circle cx="8" cy="14" r="2.4"/><circle cx="16" cy="14" r="2.4"/><circle cx="24" cy="14" r="2.4"/><circle cx="32" cy="14" r="2.4"/></g></g>
              <rect x="521" y="96" width="5" height="42" />
              <g transform="translate(500,84) rotate(8)"><rect width="40" height="20" rx="3" fill="#46525a" />
                <g fill="#FFF6C9"><circle cx="8" cy="6" r="2.4"/><circle cx="16" cy="6" r="2.4"/><circle cx="24" cy="6" r="2.4"/><circle cx="32" cy="6" r="2.4"/>
                <circle cx="8" cy="14" r="2.4"/><circle cx="16" cy="14" r="2.4"/><circle cx="24" cy="14" r="2.4"/><circle cx="32" cy="14" r="2.4"/></g></g>
            </g>

            <rect x="0" y="188" width="600" height="192" fill="#147437" />
            <polygon points="178,196 422,196 650,380 -50,380" fill="url(#turf)" />
            <g opacity=".5">
              <polygon points="178,196 222,196 122,380 -50,380" fill="#34A95B" />
              <polygon points="266,196 310,196 386,380 254,380" fill="#34A95B" />
              <polygon points="354,196 398,196 650,380 518,380" fill="#34A95B" />
            </g>
            <g fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round">
              <polygon points="178,196 422,196 650,380 -50,380" />
              <polygon points="246,196 354,196 386,236 214,236" />
              <ellipse cx="300" cy="300" rx="78" ry="26" />
            </g>
            <ellipse cx="300" cy="300" rx="4" ry="2" fill="#fff" />
            {/* goal with net */}
            <g>
              <g stroke="#fff" strokeWidth="1" opacity=".55">
                <line x1="252" y1="160" x2="252" y2="196" /><line x1="262" y1="160" x2="262" y2="196" />
                <line x1="272" y1="160" x2="272" y2="196" /><line x1="282" y1="160" x2="282" y2="196" />
                <line x1="292" y1="160" x2="292" y2="196" /><line x1="300" y1="160" x2="300" y2="196" />
                <line x1="308" y1="160" x2="308" y2="196" /><line x1="318" y1="160" x2="318" y2="196" />
                <line x1="328" y1="160" x2="328" y2="196" /><line x1="338" y1="160" x2="338" y2="196" /><line x1="348" y1="160" x2="348" y2="196" />
                <line x1="248" y1="168" x2="352" y2="168" /><line x1="248" y1="176" x2="352" y2="176" />
                <line x1="248" y1="184" x2="352" y2="184" /><line x1="248" y1="192" x2="352" y2="192" />
              </g>
              <g stroke="#fff" strokeWidth="3.5" fill="none" strokeLinejoin="round" strokeLinecap="round">
                <rect x="248" y="158" width="104" height="38" />
              </g>
            </g>
          </svg>

          <div className="ball-wrap">
            <svg viewBox="0 0 200 200" width="100%" height="100%">
              <defs><polygon id="pent" points="0,-20 19,-6.2 11.8,16.2 -11.8,16.2 -19,-6.2" /></defs>
              <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="6" />
              <g stroke="#13311F" strokeWidth="4" strokeLinecap="round">
                <line x1="100" y1="66" x2="100" y2="10" /><line x1="132.3" y1="89.5" x2="186" y2="72" />
                <line x1="120.1" y1="127.5" x2="153" y2="172" /><line x1="79.9" y1="127.5" x2="47" y2="172" />
                <line x1="67.7" y1="89.5" x2="14" y2="72" />
              </g>
              <use href="#pent" transform="translate(100,100) scale(1.7)" fill="#16331F" />
              <use href="#pent" transform="translate(137.6,48.2) rotate(36) scale(.72)" fill="#16331F" />
              <use href="#pent" transform="translate(160.9,119.8) rotate(108) scale(.72)" fill="#16331F" />
              <use href="#pent" transform="translate(100,164) rotate(180) scale(.72)" fill="#16331F" />
              <use href="#pent" transform="translate(39.1,119.8) rotate(252) scale(.72)" fill="#16331F" />
              <use href="#pent" transform="translate(62.4,48.2) rotate(324) scale(.72)" fill="#16331F" />
              <ellipse cx="72" cy="64" rx="34" ry="20" fill="#fff" opacity=".28" />
            </svg>
          </div>
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
            <div className="trust">
              <span className="stars">
                {[0,1,2,3,4].map(n => (
                  <span className="st" key={n} style={{ animationDelay: `${4.35 + n * 0.1}s` }}>★</span>
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