import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { api, letterFor, knowledgeRating } from './api';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

/* ---- baked-in pitch background ---- */
function PitchBall({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs><polygon id="pbq" points="0,-20 19,-6.2 11.8,16.2 -11.8,16.2 -19,-6.2" /></defs>
      <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="6" />
      <g stroke="#13311F" strokeWidth="4" strokeLinecap="round">
        <line x1="100" y1="66" x2="100" y2="10" /><line x1="132.3" y1="89.5" x2="186" y2="72" />
        <line x1="120.1" y1="127.5" x2="153" y2="172" /><line x1="79.9" y1="127.5" x2="47" y2="172" />
        <line x1="67.7" y1="89.5" x2="14" y2="72" />
      </g>
      <use href="#pbq" transform="translate(100,100) scale(1.7)" fill="#16331F" />
      <use href="#pbq" transform="translate(137.6,48.2) rotate(36) scale(.72)" fill="#16331F" />
      <use href="#pbq" transform="translate(160.9,119.8) rotate(108) scale(.72)" fill="#16331F" />
      <use href="#pbq" transform="translate(100,164) rotate(180) scale(.72)" fill="#16331F" />
      <use href="#pbq" transform="translate(39.1,119.8) rotate(252) scale(.72)" fill="#16331F" />
      <use href="#pbq" transform="translate(62.4,48.2) rotate(324) scale(.72)" fill="#16331F" />
      <ellipse cx="72" cy="64" rx="34" ry="20" fill="#fff" opacity=".28" />
    </svg>
  );
}
function PitchBg() {
  return (
    <div className="pitch-bg" aria-hidden="true">
      <style>{`
        .pitch-bg{ position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none; }
        .pb-base{ position:absolute; inset:0; background:linear-gradient(160deg,#FFFFFF 0%,#E6F6EA 50%,#D2EDD9 100%); }
        .pb-stripes{ position:absolute; inset:-5%; background:repeating-linear-gradient(90deg,#EAF8ED 0 56px,#D2EBD8 56px 112px);
          opacity:.9; animation:pbDrift 40s linear infinite; }
        @keyframes pbDrift{ from{transform:translateX(0);} to{transform:translateX(112px);} }
        .pb-pitch{ position:absolute; inset:0; width:100%; height:100%; opacity:.9; }
        .pb-sweep{ position:absolute; top:-40%; left:-30%; width:60%; height:180%;
          background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,.5),rgba(255,255,255,0));
          transform:rotate(8deg); filter:blur(8px); animation:pbSweep 14s ease-in-out infinite; }
        @keyframes pbSweep{ 0%{left:-40%;} 50%{left:90%;} 100%{left:-40%;} }
        .pb-glow{ position:absolute; width:60vw; height:60vw; border-radius:50%; filter:blur(80px); opacity:.5;
          background:radial-gradient(circle,rgba(63,224,127,.5),rgba(63,224,127,0) 70%); animation:pbGlow 18s ease-in-out infinite; }
        .pb-glow.a{ top:-18vw; right:-12vw; }
        .pb-glow.b{ bottom:-22vw; left:-15vw; animation-duration:24s; animation-direction:reverse;
          background:radial-gradient(circle,rgba(22,180,95,.45),rgba(22,180,95,0) 70%); }
        @keyframes pbGlow{ 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(3vw,2vw) scale(1.12);} }
        .pb-ball{ position:absolute; opacity:.22; animation:pbRoll 28s linear infinite; }
        .pb-ball.big{ width:42vmin; height:42vmin; right:-10vmin; top:6vh; }
        .pb-ball.small{ width:18vmin; height:18vmin; left:-4vmin; bottom:7vh; opacity:.16; animation-duration:36s; animation-direction:reverse; }
        @keyframes pbRoll{ to{transform:rotate(360deg);} }
        @media (prefers-reduced-motion: reduce){ .pb-stripes,.pb-sweep,.pb-glow,.pb-ball{ animation:none !important; } }
      `}</style>
      <div className="pb-base" /><div className="pb-stripes" />
      <svg className="pb-pitch" viewBox="0 0 1050 680" preserveAspectRatio="xMidYMid slice"
           fill="none" stroke="rgba(11,107,58,.22)" strokeWidth="3">
        <rect x="20" y="20" width="1010" height="640" /><line x1="525" y1="20" x2="525" y2="660" />
        <circle cx="525" cy="340" r="90" /><circle cx="525" cy="340" r="5" fill="rgba(11,107,58,.22)" stroke="none" />
        <rect x="20" y="138" width="165" height="403" /><rect x="20" y="248" width="55" height="183" />
        <path d="M185,267.5 A91,91 0 0 1 185,412.5" />
        <rect x="865" y="138" width="165" height="403" /><rect x="975" y="248" width="55" height="183" />
        <path d="M865,267.5 A91,91 0 0 0 865,412.5" />
      </svg>
      <div className="pb-sweep" /><div className="pb-glow a" /><div className="pb-glow b" />
      <PitchBall className="pb-ball big" /><PitchBall className="pb-ball small" />
    </div>
  );
}

const QUESTIONS = [
  { q: "How many players from each team start on the pitch?", options: ["9","10","11","12"], answer: 2 },
  { q: "How many points does a team get for a win in the group stage?", options: ["1","2","3","4"], answer: 2 },
  { q: "Which nation has won the most men's World Cups?", options: ["Germany","Italy","Brazil","Argentina"], answer: 2 },
  { q: "What's one player scoring three goals in a match called?", options: ["A brace","A treble","A hat-trick","A double"], answer: 2 },
  { q: "Offside is judged against the…", options: ["Halfway line","Last defender","Second-to-last opponent","Goalkeeper"], answer: 2 },
  { q: "A direct red card means the player is…", options: ["Cautioned","Sent off","Substituted","Given a free kick"], answer: 1 },
  { q: "How many teams play at the 2026 World Cup?", options: ["32","40","48","64"], answer: 2 },
  { q: "How long is a match, excluding stoppage time?", options: ["80 min","90 min","100 min","120 min"], answer: 1 },
  { q: "Who won the 2022 World Cup?", options: ["France","Brazil","Argentina","Germany"], answer: 2 },
  { q: "A penalty shootout decides a knockout match when…", options: ["Level after 90","Level after extra time","A red card is shown","Never"], answer: 1 },
];

function Ball({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs><polygon id="cqp" points="0,-20 19,-6.2 11.8,16.2 -11.8,16.2 -19,-6.2" /></defs>
      <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="6" />
      <g stroke="#13311F" strokeWidth="4" strokeLinecap="round">
        <line x1="100" y1="66" x2="100" y2="10" /><line x1="132.3" y1="89.5" x2="186" y2="72" />
        <line x1="120.1" y1="127.5" x2="153" y2="172" /><line x1="79.9" y1="127.5" x2="47" y2="172" />
        <line x1="67.7" y1="89.5" x2="14" y2="72" />
      </g>
      <use href="#cqp" transform="translate(100,100) scale(1.7)" fill="#16331F" />
      <use href="#cqp" transform="translate(137.6,48.2) rotate(36) scale(.72)" fill="#16331F" />
      <use href="#cqp" transform="translate(160.9,119.8) rotate(108) scale(.72)" fill="#16331F" />
      <use href="#cqp" transform="translate(100,164) rotate(180) scale(.72)" fill="#16331F" />
      <use href="#cqp" transform="translate(39.1,119.8) rotate(252) scale(.72)" fill="#16331F" />
      <use href="#cqp" transform="translate(62.4,48.2) rotate(324) scale(.72)" fill="#16331F" />
      <ellipse cx="72" cy="64" rx="34" ry="20" fill="#fff" opacity=".28" />
    </svg>
  );
}

function tierOf(stars) {
  if (stars >= 4.5) return "elite";
  if (stars >= 3.5) return "sharp";
  if (stars >= 2.5) return "learning";
  return "rookie";
}

const COPY = {
  elite:    { t: "Gaffer material.", n: "You read the game like a pro. Expect me to push back hard on every call you make." },
  sharp:    { t: "Sharp eye.", n: "Strong start — you're a few good calls from the top table." },
  learning: { t: "Promising.", n: "You've got the basics. Predict well and you'll climb fast." },
  rookie:   { t: "Welcome, rookie.", n: "Everyone starts somewhere. I'll coach you through your picks." },
};

export default function SignupQuiz() {
  const navigate = useNavigate();
  const { user, update, setName } = useUser();
  const [step, setStep] = useState("name");        // name | expertise | quiz | submitting | result
  const [nameInput, setNameInput] = useState("");
  const [expertise, setExpertise] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answersLog, setAnswersLog] = useState([]);   // letters, to send to backend
  const [selected, setSelected] = useState(null);
  const [locking, setLocking] = useState(false);
  const [shown, setShown] = useState(0);

  // local score for the instant animation; backend result overrides if it comes back
  const localScore = Math.round((correct / QUESTIONS.length) * 100);
  const [score, setScore] = useState(0);
  const stars = Math.round((score / 20) * 2) / 2 || 0.5;
  const tier = tierOf(stars);
  const rating = knowledgeRating(score);

  const note = expertise === "expert" && stars < 3.5
    ? "You told me you knew your football. The table will be the judge of that."
    : COPY[tier].n;

  function submitName() {
    const n = nameInput.trim();
    if (!n) return;
    setName(n);
    setStep("expertise");
  }
  function chooseExpertise(level) { setExpertise(level); setStep("quiz"); }

  function answer(idx) {
    if (locking) return;
    setSelected(idx);
    setLocking(true);
    const isRight = idx === QUESTIONS[qIndex].answer;
    const letter = letterFor(idx);
    setTimeout(() => {
      if (isRight) setCorrect((c) => c + 1);
      const log = [...answersLog, letter];
      setAnswersLog(log);
      if (qIndex + 1 < QUESTIONS.length) {
        setQIndex((i) => i + 1); setSelected(null); setLocking(false);
      } else {
        finishQuiz(log);
      }
    }, 360);
  }

  async function finishQuiz(log) {
    setStep("submitting");
    const localPct = Math.round((correct + (selected === QUESTIONS[qIndex].answer ? 1 : 0)) / QUESTIONS.length * 100);
    try {
      await api.submitQuiz(user.displayName, expertise, log);
      const result = await api.getQuizResult(user.displayName);
      // use backend score if present, else fall back to local
      const backendPct = result?.score ?? result?.percentage ?? localPct;
      setScore(backendPct);
    } catch (e) {
      // backend asleep or error — never block the demo
      setScore(localPct);
    }
    setStep("result");
  }

  useEffect(() => {
    if (step !== "result") return;
    let v = 0;
    const id = setInterval(() => {
      v += Math.max(2, Math.ceil(score / 22));
      if (v >= score) { v = score; clearInterval(id); }
      setShown(v);
    }, 28);
    return () => clearInterval(id);
  }, [step, score]);

  function finish() {
    update({ expertise, quizScore: score, displayStars: stars });
    navigate('/predict');
  }

  function Celebration() {
    if (tier === "elite") {
      return (
        <div className="cel goal">
          <svg className="cel-net" viewBox="0 0 300 200" aria-hidden="true">
            <g stroke="rgba(11,107,58,.3)" strokeWidth="1.2">
              {[66,78,90,102,114,126,138,150,162,174,186,198,210,222,234].map((x)=>(<line key={x} x1={x} y1="40" x2={x} y2="150" />))}
              {[52,64,76,88,100,112,124,136,148].map((y)=>(<line key={y} x1="60" y1={y} x2="240" y2={y} />))}
            </g>
            <path d="M60,150 L60,40 L240,40 L240,150" stroke="#075E32" strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <Ball className="cel-ball-shot" />
        </div>
      );
    }
    if (tier === "sharp") {
      return (
        <div className="cel burst">
          <Ball className="cel-ball-spin" />
          {[0,1,2,3,4,5].map((i)=>(<span key={i} className="spark" style={{ "--a": `${i*60}deg`, animationDelay:`${0.3+i*0.05}s` }}>★</span>))}
        </div>
      );
    }
    return (
      <div className="cel bounce">
        <Ball className="cel-ball-bounce" />
        <div className="shadow" />
      </div>
    );
  }

  return (
    <div className="gaffer-app">
      <PitchBg />
      <style>{`
        .gaffer-app{
          --ink:#0B6B3A; --deep:#075E32; --bright:#16B45F; --lime:#3FE07F;
          --line:rgba(11,107,58,.14); --soft:#F3FAF5;
          --display:'Syne','Plus Jakarta Sans',sans-serif;
          position:relative; isolation:isolate; min-height:100svh; width:100%; background:transparent; color:var(--ink);
          font-family:'Plus Jakarta Sans',system-ui,sans-serif; display:flex; flex-direction:column;
        }
        .topbar{ position:relative; z-index:2; padding:1rem clamp(1.2rem,5vw,3rem); border-bottom:1px solid var(--line); }
        .logo{ font-family:var(--display); font-weight:800; font-size:1.3rem; color:var(--deep); cursor:pointer; }
        .logo span{ color:var(--bright); }
        .stage{ position:relative; z-index:2; flex:1; display:flex; flex-direction:column; justify-content:center;
          align-items:center; padding:clamp(1.5rem,6vw,3rem); max-width:660px; margin:0 auto; width:100%; }
        .panel{ width:100%; background:rgba(255,255,255,.8); backdrop-filter:blur(14px);
          border:1px solid var(--line); border-radius:24px; padding:clamp(1.5rem,5vw,2.4rem);
          box-shadow:0 20px 60px rgba(7,94,50,.12); }
        .step{ width:100%; animation:stepIn .5s cubic-bezier(.2,.8,.25,1); }
        @keyframes stepIn{ from{opacity:0; transform:translateY(24px) scale(.98);} to{opacity:1; transform:none;} }
        .kicker{ font-size:.72rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--bright); }
        .title{ font-family:var(--display); font-weight:800; font-size:clamp(1.7rem,6vw,2.5rem); letter-spacing:-.02em;
          margin:.5rem 0 1.6rem; line-height:1.05; }
        .nameField{ width:100%; border:1.5px solid var(--line); border-radius:14px; padding:1rem 1.1rem;
          font-family:inherit; font-size:1.15rem; font-weight:600; color:var(--ink); background:rgba(255,255,255,.85);
          outline:none; transition:border-color .2s; }
        .nameField:focus{ border-color:var(--bright); }
        .choices{ display:grid; gap:1rem; }
        .choice{ text-align:left; cursor:pointer; border:1.5px solid var(--line); border-radius:18px; padding:1.3rem;
          background:rgba(255,255,255,.6); transition:all .22s cubic-bezier(.2,.8,.25,1);
          opacity:0; transform:translateY(16px); animation:cardUp .55s forwards; }
        .choice:nth-child(1){ animation-delay:.12s; } .choice:nth-child(2){ animation-delay:.22s; }
        @keyframes cardUp{ to{ opacity:1; transform:none; } }
        .choice:hover{ border-color:var(--bright); transform:translateY(-4px); box-shadow:0 14px 34px rgba(7,94,50,.14); }
        .choice h3{ font-family:var(--display); font-weight:700; font-size:1.3rem; margin:0 0 .25rem; color:var(--ink); }
        .choice p{ margin:0; color:var(--deep); opacity:.75; font-weight:500; }
        .qbar{ display:flex; align-items:center; gap:.8rem; margin-bottom:1.4rem; }
        .qbar .track{ flex:1; height:7px; background:var(--soft); border-radius:999px; overflow:hidden; }
        .qbar .fill{ height:100%; background:linear-gradient(90deg,var(--bright),var(--lime)); border-radius:999px;
          transition:width .4s cubic-bezier(.2,.8,.25,1); }
        .qbar .n{ font-weight:700; font-size:.8rem; color:var(--deep); }
        .options{ display:flex; flex-direction:column; gap:.7rem; }
        .opt{ text-align:left; cursor:pointer; border:1.5px solid var(--line); border-radius:13px; padding:1rem 1.1rem;
          background:rgba(255,255,255,.7); font-family:inherit; font-size:1.05rem; font-weight:600; color:var(--ink);
          transition:all .2s cubic-bezier(.2,.8,.25,1); opacity:0; transform:translateY(14px); animation:cardUp .45s forwards; }
        .opt:nth-child(1){ animation-delay:.05s; } .opt:nth-child(2){ animation-delay:.12s; }
        .opt:nth-child(3){ animation-delay:.19s; } .opt:nth-child(4){ animation-delay:.26s; }
        .opt:hover:not(.sel){ border-color:var(--bright); transform:translateY(-2px); }
        .opt.sel{ background:var(--bright); border-color:var(--bright); color:#fff; transform:translateY(-2px);
          box-shadow:0 8px 22px rgba(22,180,95,.4); }
        .submitting{ text-align:center; }
        .submitting .v-ball{ width:78px; height:78px; margin:0 auto 1rem; display:block; animation:spin 2.4s linear infinite; }
        .submitting p{ font-family:var(--display); font-weight:800; font-size:1.1rem; color:var(--ink); }
        .result{ text-align:center; }
        .ratingpill{ display:inline-flex; align-items:center; gap:.4rem; font-weight:800; font-size:.8rem;
          letter-spacing:.04em; color:var(--deep); background:var(--soft); border:1px solid var(--line);
          padding:.35rem .8rem; border-radius:999px; margin-bottom:.6rem; }
        .score-num{ font-family:var(--display); font-weight:800; font-size:clamp(3rem,14vw,4.6rem); line-height:1; color:var(--deep); }
        .score-num small{ font-size:.35em; opacity:.5; font-weight:700; }
        .rtitle{ font-family:var(--display); font-weight:800; font-size:clamp(1.5rem,5vw,2.1rem); margin:.3rem 0 .2rem; color:var(--ink); }
        .stars-row{ display:flex; justify-content:center; gap:.25rem; margin:.6rem 0 .4rem; font-size:1.8rem; }
        .star{ color:var(--line); opacity:0; transform:scale(.3) translateY(8px); animation:starPop .5s forwards cubic-bezier(.2,.7,.2,1.7); }
        .star.on{ color:var(--bright); }
        .star.half{ background:linear-gradient(90deg,var(--bright) 50%,var(--line) 50%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        @keyframes starPop{ to{ opacity:1; transform:none; } }
        .note{ color:var(--deep); opacity:.85; font-weight:500; max-width:36ch; margin:.6rem auto 1.6rem; line-height:1.5; }
        .cta{ border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:1.05rem;
          color:#fff; background:var(--bright); padding:1rem 2rem; border-radius:999px; transition:all .2s ease; animation:glow 2.6s ease-in-out infinite; }
        .cta:disabled{ opacity:.5; cursor:not-allowed; animation:none; }
        .cta:hover:not(:disabled){ transform:translateY(-3px) scale(1.03); }
        @keyframes glow{ 0%,100%{box-shadow:0 8px 24px rgba(22,180,95,.32);} 50%{box-shadow:0 10px 38px rgba(63,224,127,.6);} }
        @keyframes spin{ to{ transform:rotate(360deg); } }
        .cel{ position:relative; width:230px; height:170px; margin:0 auto 1rem; }
        .cel-net{ position:absolute; inset:0; width:100%; height:100%; transform-box:fill-box; transform-origin:center; animation:netRipple .55s 1.05s ease; }
        @keyframes netRipple{ 0%,100%{ transform:scale(1); } 45%{ transform:scale(1.04,1.06); } }
        .cel-ball-shot{ position:absolute; left:50%; bottom:-4%; width:54px; height:54px; transform:translateX(-50%);
          animation:shot 1.05s .3s forwards cubic-bezier(.35,.1,.25,1); }
        @keyframes shot{
          0%{ bottom:-12%; transform:translateX(-50%) scale(1.3) rotate(0); opacity:0; }
          15%{ opacity:1; }
          60%{ bottom:46%; transform:translateX(-50%) scale(.6) rotate(420deg); }
          74%{ bottom:40%; transform:translateX(-50%) scale(.62) rotate(520deg); }
          100%{ bottom:43%; transform:translateX(-50%) scale(.61) rotate(560deg); }
        }
        .cel.burst{ display:flex; align-items:center; justify-content:center; }
        .cel-ball-spin{ width:90px; height:90px; animation:spin 5s linear infinite; }
        .spark{ position:absolute; left:50%; top:50%; color:var(--bright); font-size:1.3rem; opacity:0;
          transform:translate(-50%,-50%) rotate(var(--a)) translateY(0); animation:spark .8s forwards ease-out; }
        @keyframes spark{ 0%{opacity:0; transform:translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(.3);}
          60%{opacity:1;} 100%{opacity:0; transform:translate(-50%,-50%) rotate(var(--a)) translateY(-70px) scale(1);} }
        .cel.bounce{ display:flex; align-items:flex-end; justify-content:center; }
        .cel-ball-bounce{ width:80px; height:80px; animation:bnc 1.3s .2s cubic-bezier(.5,.05,.3,1) 2; }
        @keyframes bnc{ 0%{ transform:translateY(-90px) rotate(0); } 50%{ transform:translateY(0) rotate(180deg); } 70%{ transform:translateY(-26px); } 100%{ transform:translateY(0) rotate(360deg); } }
        .cel.bounce .shadow{ position:absolute; bottom:6px; left:50%; transform:translateX(-50%); width:60px; height:10px;
          background:rgba(11,107,58,.18); border-radius:50%; filter:blur(3px); }
        @media (prefers-reduced-motion: reduce){
          .step,.choice,.opt,.star,.cta{ animation:none !important; opacity:1 !important; transform:none !important; }
          .cel-ball-shot,.cel-net,.spark,.cel-ball-bounce,.cel-ball-spin,.v-ball{ animation:none !important; }
          .fill{ transition:none !important; }
        }
      `}</style>

      <div className="topbar"><span className="logo" onClick={() => navigate('/')}>GAFF<span>ER</span></span></div>

      <div className="stage">
        <div className="panel">
          {step === "name" && (
            <div className="step" key="name">
              <div className="kicker">Welcome to Gaffer</div>
              <h1 className="title">What should we call you?</h1>
              <input className="nameField" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitName(); }} placeholder="Your gaffer name" maxLength={20} autoFocus />
              <button className="cta" style={{ marginTop: '1.4rem' }} disabled={!nameInput.trim()} onClick={submitName}>Continue</button>
            </div>
          )}

          {step === "expertise" && (
            <div className="step" key="expertise">
              <div className="kicker">Step 2 of 3</div>
              <h1 className="title">How well do you know your football?</h1>
              <div className="choices">
                <button className="choice" onClick={() => chooseExpertise("expert")}>
                  <h3>I know my football</h3>
                  <p>Challenge me. I want the gaffer pushing back on my calls.</p>
                </button>
                <button className="choice" onClick={() => chooseExpertise("beginner")}>
                  <h3>I'm here for the fun</h3>
                  <p>Ease me in. Help me understand the picks as I go.</p>
                </button>
              </div>
            </div>
          )}

          {step === "quiz" && (
            <div className="step" key={qIndex}>
              <div className="qbar">
                <div className="track"><div className="fill" style={{ width: `${(qIndex / QUESTIONS.length) * 100}%` }} /></div>
                <span className="n">{qIndex + 1}/{QUESTIONS.length}</span>
              </div>
              <h1 className="title">{QUESTIONS[qIndex].q}</h1>
              <div className="options">
                {QUESTIONS[qIndex].options.map((o, i) => (
                  <button key={i} className={`opt${selected === i ? " sel" : ""}`} onClick={() => answer(i)}>{o}</button>
                ))}
              </div>
            </div>
          )}

          {step === "submitting" && (
            <div className="step submitting" key="submitting">
              <PitchBall className="v-ball" />
              <p>The gaffer's marking your answers…</p>
            </div>
          )}

          {step === "result" && (
            <div className="step result" key="result">
              <Celebration />
              <div className="ratingpill">{rating.emoji} {rating.label}</div>
              <h1 className="rtitle">{COPY[tier].t}</h1>
              <div className="score-num">{shown}<small>/100</small></div>
              <div className="stars-row">
                {[0,1,2,3,4].map((i) => {
                  const full = Math.floor(stars);
                  const half = stars - full >= 0.5;
                  const cls = i < full ? "on" : i === full && half ? "half" : "";
                  return <span key={i} className={`star ${cls}`} style={{ animationDelay: `${0.4 + i * 0.12}s` }}>★</span>;
                })}
              </div>
              <p className="note">{note}</p>
              <button className="cta" onClick={finish}>Start predicting</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}