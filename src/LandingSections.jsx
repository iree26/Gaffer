import { useNavigate } from 'react-router-dom';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

const STEPS = [
  { n: "1", t: "Prove yourself", d: "A quick quiz sets your baseline rating and tells the gaffer what kind of fan you are." },
  { n: "2", t: "Call the groups", d: "Pick who tops all twelve. The gaffer reacts to every call, then delivers its verdict: your boldest pick, your safest, and where it thinks you're wrong." },
  { n: "3", t: "Watch it remember", d: "As results land, your stars and rank move, and the gaffer comes back to its own past takes, owning the ones it got wrong." },
];

const FEATURES = [
  { t: "The Gaffer's Verdict", d: "Submit your card and the AI reads all twelve picks, then gives you one honest, personal take." },
  { t: "The Rewind", d: "Fast-forward the tournament and watch your rating evolve in real time as picks resolve." },
  { t: "Evolving memory", d: "Your whole history lives on Walrus. The gaffer never starts from scratch with you." },
  { t: "Expert or beginner", d: "Tell it you know ball and it'll challenge you. Tell it you're new and it'll coach you." },
  { t: "The table", d: "A live leaderboard where stars are earned by calling it right, not claimed." },
  { t: "The terraces", d: "Talk your group with other fans, your rating shown next to every word." },
];

export default function LandingSections() {
  const navigate = useNavigate();
  return (
    <section className="landing">
      <style>{`
        .landing{
          --ink:#0B6B3A; --deep:#075E32; --bright:#16B45F; --lime:#3FE07F;
          --line:rgba(11,107,58,.14); --soft:#F3FAF5;
          --display:'Syne','Plus Jakarta Sans',sans-serif;
          position:relative; z-index:2; font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--ink);
        }
        .landing .sec{ max-width:1000px; margin:0 auto; padding:clamp(3rem,9vw,6rem) clamp(1.2rem,5vw,2rem); }
        .reveal{ opacity:0; transform:translateY(28px); animation:rise .8s forwards cubic-bezier(.2,.8,.25,1); }
        @keyframes rise{ to{ opacity:1; transform:none; } }

        /* hook */
        .hook{ text-align:center; }
        .hook h2{ font-family:var(--display); font-weight:800; font-size:clamp(2rem,7vw,3.4rem); letter-spacing:-.025em; line-height:1.05; margin:0 0 1.1rem; }
        .hook h2 b{ color:var(--bright); }
        .hook p{ max-width:46ch; margin:0 auto; font-size:clamp(1rem,2.4vw,1.18rem); font-weight:500; color:var(--deep); opacity:.85; line-height:1.6; }

        /* how it works */
        .label{ text-align:center; font-size:.74rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--bright); margin-bottom:2.4rem; }
        .steps{ display:grid; grid-template-columns:repeat(3,1fr); gap:1.4rem; }
        .step{ background:rgba(255,255,255,.7); backdrop-filter:blur(10px); border:1px solid var(--line); border-radius:22px; padding:1.8rem 1.4rem; }
        .step .num{ font-family:var(--display); font-weight:800; font-size:1.4rem; color:#fff; background:linear-gradient(120deg,var(--bright),var(--lime));
          width:46px; height:46px; border-radius:14px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 20px rgba(22,180,95,.4); margin-bottom:1.1rem; }
        .step h3{ font-family:var(--display); font-weight:800; font-size:1.3rem; margin:0 0 .5rem; color:var(--ink); }
        .step p{ margin:0; font-weight:500; color:var(--deep); opacity:.8; line-height:1.55; font-size:.96rem; }

        /* features */
        .feat-head{ font-family:var(--display); font-weight:800; font-size:clamp(1.7rem,5vw,2.6rem); letter-spacing:-.02em; text-align:center; margin:0 0 2.4rem; }
        .feats{ display:grid; grid-template-columns:repeat(3,1fr); gap:1.1rem; }
        .feat{ background:rgba(255,255,255,.72); backdrop-filter:blur(10px); border:1px solid var(--line); border-radius:18px; padding:1.5rem 1.3rem;
          transition:transform .22s ease, box-shadow .22s ease; }
        .feat:hover{ transform:translateY(-5px); box-shadow:0 16px 40px rgba(7,94,50,.13); border-color:var(--bright); }
        .feat .dot{ width:.7rem; height:.7rem; border-radius:50%; background:var(--bright); box-shadow:0 0 0 5px rgba(22,180,95,.16); margin-bottom:.9rem; }
        .feat h4{ font-family:var(--display); font-weight:800; font-size:1.12rem; margin:0 0 .4rem; color:var(--ink); }
        .feat p{ margin:0; font-weight:500; color:var(--deep); opacity:.8; line-height:1.5; font-size:.9rem; }

        /* closing */
        .close{ text-align:center; }
        .close h2{ font-family:var(--display); font-weight:800; font-size:clamp(1.9rem,6vw,3rem); letter-spacing:-.02em; margin:0 0 1.6rem; }
        .cta{ border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:1.1rem; color:#fff;
          background:var(--bright); padding:1.1rem 2.4rem; border-radius:999px; transition:all .2s ease; animation:glow 2.6s ease-in-out infinite; }
        .cta:hover{ transform:translateY(-3px) scale(1.03); }
        @keyframes glow{ 0%,100%{box-shadow:0 8px 24px rgba(22,180,95,.32);} 50%{box-shadow:0 10px 38px rgba(63,224,127,.6);} }
        .foot{ text-align:center; padding:2.5rem 1rem 3rem; color:var(--deep); opacity:.6; font-size:.82rem; font-weight:600; }

        @media (max-width:760px){
          .steps{ grid-template-columns:1fr; }
          .feats{ grid-template-columns:1fr; }
        }
        @media (prefers-reduced-motion: reduce){ .reveal{ animation:none !important; opacity:1 !important; transform:none !important; } .cta{ animation:none !important; } }
      `}</style>

      <div className="sec hook reveal">
        <h2>Most prediction apps forget you. <b>This one doesn't.</b></h2>
        <p>Every call you make, every opinion the gaffer forms about you, is saved to memory that persists on Walrus. The more you play, the better it knows you.</p>
      </div>

      <div className="sec" id="how-it-works">
        <div className="label">How it works</div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step reveal" key={s.n} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="sec" id="features">
        <h2 className="feat-head reveal">Everything a real football companion should be.</h2>
        <div className="feats">
          {FEATURES.map((f, i) => (
            <div className="feat reveal" key={f.t} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="dot" />
              <h4>{f.t}</h4>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="sec close reveal">
        <h2>The tournament's coming.<br />Are your calls ready?</h2>
        <button className="cta" onClick={() => navigate('/signup')}>Start predicting</button>
      </div>

      <div className="foot">GAFFER — built for the Walrus Memory World Cup Hackathon, 2026.</div>
    </section>
  );
}