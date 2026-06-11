import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';

const QUESTIONS = [
  { q: "How many players from each team start on the pitch?", options: ["9", "10", "11", "12"], answer: 2 },
  { q: "How many points does a team get for a win in the group stage?", options: ["1", "2", "3", "4"], answer: 2 },
  { q: "Which nation has won the most men's World Cups?", options: ["Germany", "Italy", "Brazil", "Argentina"], answer: 2 },
  { q: "What do you call one player scoring three goals in a match?", options: ["A brace", "A treble", "A hat-trick", "A double"], answer: 2 },
  { q: "Offside is judged against the…", options: ["Halfway line", "Last defender only", "Second-to-last opponent", "Goalkeeper"], answer: 2 },
  { q: "A direct red card means the player is…", options: ["Cautioned", "Sent off", "Substituted", "Given a free kick"], answer: 1 },
];

export default function SignupQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState("expertise");   // "expertise" | "quiz" | "result"
  const [expertise, setExpertise] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locking, setLocking] = useState(false);
  const [shown, setShown] = useState(0);

  const score = Math.round((correct / QUESTIONS.length) * 100);
  const stars = Math.round((score / 20) * 2) / 2;

  function chooseExpertise(level) {
    setExpertise(level);
    setStep("quiz");
  }

  function answer(idx) {
    if (locking) return;
    setSelected(idx);
    setLocking(true);
    const isRight = idx === QUESTIONS[qIndex].answer;
    setTimeout(() => {
      if (isRight) setCorrect((c) => c + 1);
      if (qIndex + 1 < QUESTIONS.length) {
        setQIndex((i) => i + 1);
        setSelected(null);
        setLocking(false);
      } else {
        setStep("result");
      }
    }, 380);
  }

  // count the score up on the result screen
  useEffect(() => {
    if (step !== "result") return;
    let v = 0;
    const id = setInterval(() => {
      v += Math.ceil(score / 22);
      if (v >= score) { v = score; clearInterval(id); }
      setShown(v);
    }, 28);
    return () => clearInterval(id);
  }, [step, score]);

  function finish() {
    // REAL: await fetch('/signup/quiz', { method:'POST', body: JSON.stringify({ expertise, answers... }) })
    navigate('/predict');
  }

  return (
    <div className="gaffer-app">
      <style>{`
        .gaffer-app{
          --ink:#0B6B3A; --deep:#075E32; --bright:#16B45F; --lime:#3FE07F;
          --line:rgba(11,107,58,.14); --soft:#F3FAF5;
          --display:'Syne','Plus Jakarta Sans',sans-serif;
          min-height:100svh; width:100%; background:#fff; color:var(--ink);
          font-family:'Plus Jakarta Sans',system-ui,sans-serif;
          display:flex; flex-direction:column;
        }
        .topbar{ padding:1rem clamp(1.2rem,5vw,3rem); border-bottom:1px solid var(--line); }
        .logo{ font-family:var(--display); font-weight:800; font-size:1.3rem; color:var(--deep); cursor:pointer; }
        .logo span{ color:var(--bright); }

        .stage{ flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center;
          padding:clamp(1.5rem,6vw,3rem); max-width:640px; margin:0 auto; width:100%; }

        .step{ width:100%; animation:stepIn .45s cubic-bezier(.2,.8,.25,1); }
        @keyframes stepIn{ from{opacity:0; transform:translateY(22px);} to{opacity:1; transform:none;} }

        .kicker{ font-size:.72rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--bright); }
        .title{ font-family:var(--display); font-weight:800; font-size:clamp(1.7rem,6vw,2.5rem); letter-spacing:-.02em;
          margin:.5rem 0 1.6rem; line-height:1.05; }

        /* expertise choice */
        .choices{ display:grid; gap:1rem; }
        .choice{ text-align:left; cursor:pointer; border:1.5px solid var(--line); border-radius:18px; padding:1.4rem;
          background:#fff; transition:all .22s cubic-bezier(.2,.8,.25,1); }
        .choice:hover{ border-color:var(--bright); transform:translateY(-4px); box-shadow:0 14px 34px rgba(7,94,50,.12); }
        .choice h3{ font-family:var(--display); font-weight:700; font-size:1.3rem; margin:0 0 .25rem; color:var(--ink); }
        .choice p{ margin:0; color:var(--deep); opacity:.75; font-weight:500; }

        /* quiz */
        .qbar{ display:flex; align-items:center; gap:.8rem; margin-bottom:1.4rem; }
        .qbar .track{ flex:1; height:7px; background:var(--soft); border-radius:999px; overflow:hidden; }
        .qbar .fill{ height:100%; background:linear-gradient(90deg,var(--bright),var(--lime)); border-radius:999px;
          transition:width .4s cubic-bezier(.2,.8,.25,1); }
        .qbar .n{ font-weight:700; font-size:.8rem; color:var(--deep); }
        .options{ display:flex; flex-direction:column; gap:.7rem; }
        .opt{ position:relative; overflow:hidden; text-align:left; cursor:pointer; border:1.5px solid var(--line);
          border-radius:13px; padding:1rem 1.1rem; background:#fff; font-family:inherit; font-size:1.05rem; font-weight:600;
          color:var(--ink); transition:all .2s cubic-bezier(.2,.8,.25,1); }
        .opt:hover:not(.sel){ border-color:var(--bright); transform:translateY(-2px); }
        .opt.sel{ background:var(--bright); border-color:var(--bright); color:#fff; transform:translateY(-2px);
          box-shadow:0 8px 22px rgba(22,180,95,.4); }

        /* result */
        .result{ text-align:center; }
        .score-num{ font-family:var(--display); font-weight:800; font-size:clamp(3.4rem,16vw,5.5rem); line-height:1;
          color:var(--deep); }
        .score-num small{ font-size:.35em; opacity:.5; font-weight:700; }
        .stars-row{ display:flex; justify-content:center; gap:.25rem; margin:1rem 0 .4rem; font-size:2rem; }
        .star{ color:var(--line); opacity:0; transform:scale(.3) translateY(8px);
          animation:starPop .5s forwards cubic-bezier(.2,.7,.2,1.7); }
        .star.on{ color:var(--bright); }
        .star.half{ background:linear-gradient(90deg,var(--bright) 50%,var(--line) 50%); -webkit-background-clip:text;
          background-clip:text; color:transparent; }
        @keyframes starPop{ to{ opacity:1; transform:none; } }
        .note{ color:var(--deep); opacity:.8; font-weight:500; max-width:34ch; margin:1rem auto 2rem; line-height:1.5; }

        .cta{ border:none; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:800; font-size:1.05rem;
          color:#fff; background:var(--bright); padding:1rem 2rem; border-radius:999px; transition:all .2s ease;
          animation:glow 2.6s ease-in-out infinite; }
        .cta:hover{ transform:translateY(-3px) scale(1.03); }
        @keyframes glow{ 0%,100%{box-shadow:0 8px 24px rgba(22,180,95,.32);} 50%{box-shadow:0 10px 38px rgba(63,224,127,.6);} }

        @media (prefers-reduced-motion: reduce){
          .step,.star,.cta{ animation:none !important; opacity:1 !important; transform:none !important; }
          .choice,.opt,.fill{ transition:none !important; }
        }
      `}</style>

      <div className="topbar"><span className="logo" onClick={() => navigate('/')}>GAFF<span>ER</span></span></div>

      <div className="stage">
        {step === "expertise" && (
          <div className="step" key="expertise">
            <div className="kicker">Step 1 of 2</div>
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

        {step === "result" && (
          <div className="step result" key="result">
            <div className="kicker">Your starting rating</div>
            <div className="score-num">{shown}<small>/100</small></div>
            <div className="stars-row">
              {[0, 1, 2, 3, 4].map((i) => {
                const full = Math.floor(stars);
                const half = stars - full >= 0.5;
                const cls = i < full ? "on" : i === full && half ? "half" : "";
                return <span key={i} className={`star ${cls}`} style={{ animationDelay: `${0.3 + i * 0.12}s` }}>★</span>;
              })}
            </div>
            <p className="note">
              This is just where you start{expertise === "expert" ? ", gaffer" : ""}. Your stars rise and fall as your
              predictions actually land.
            </p>
            <button className="cta" onClick={finish}>Start predicting</button>
          </div>
        )}
      </div>
    </div>
  );
}