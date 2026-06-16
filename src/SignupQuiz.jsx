import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';
import { api, knowledgeRating } from './api';
import GafferBackground from './GafferBackground';

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
  const [step, setStep] = useState("name");
  const [nameInput, setNameInput] = useState("");
  const [expertise, setExpertise] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locking, setLocking] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const totalQ = questions.length;
  const done = qIndex + (selected !== null ? 1 : 0);
  const localPct = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
  const score = result?.score ?? result?.percentage ?? localPct;
  const stars = Math.round((score / 20) * 2) / 2 || 0.5;
  const tier = tierOf(stars);
  const rating = knowledgeRating(score);
  const note = expertise === "expert" && stars < 3.5
    ? "You told me you knew your football. The table will be the judge of that."
    : COPY[tier].n;

  const [shown, setShown] = useState(0);

  function submitName() {
    const n = nameInput.trim();
    if (!n) return;
    setName(n);
    setStep("expertise");
  }

  async function chooseExpertise(level) {
    setExpertise(level);
    try {
      await api.register(user.displayName, level);
    } catch { /* user may already exist */ }
    setStep("quiz");
    startServerQuiz(level);
  }

  async function startServerQuiz(level) {
    try {
      const data = await api.startQuiz(user.displayName, level === 'expert' ? 'hard' : 'easy', 'football', 10);
      setQuestions(data.questions || []);
    } catch {
      setStep("result");
      setResult({ score: 0, percentage: 0 });
    }
  }

  async function answer(idx) {
    if (locking || !questions[qIndex]) return;
    setSelected(idx);
    setLocking(true);

    const q = questions[qIndex];
    const isRight = idx === (q.correct_answer ?? q.answer);
    const answerText = (q.options || q.choices || [])[idx];
    setCorrect(c => isRight ? c + 1 : c);

    await api.answerQuiz(user.displayName, q.id, answerText).catch(() => {});

    setTimeout(() => {
      if (qIndex + 1 < totalQ) {
        setQIndex(i => i + 1);
        setSelected(null);
        setLocking(false);
      } else {
        finishQuiz();
      }
    }, 360);
  }

  async function finishQuiz() {
    setSubmitting(true);
    try {
      const data = await api.getQuizResult(user.displayName);
      setResult(data);
    } catch {
      setResult({ score: localPct, percentage: localPct });
    }
    setSubmitting(false);
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

  const q = questions[qIndex];

  function finish() {
    update({ expertise, quizScore: score, displayStars: stars });
    navigate('/predict');
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
          align-items:center; padding:clamp(1.5rem,6vw,3rem); max-width:660px; margin:0 auto; width:100%; }
        .panel{ width:100%; background:var(--card); border:1px solid var(--border); border-radius:8px; padding:clamp(1.5rem,5vw,2.4rem); }
        .step{ width:100%; animation:stepIn .5s cubic-bezier(.2,.8,.25,1); }
        @keyframes stepIn{ from{opacity:0; transform:translateY(24px) scale(.98);} to{opacity:1; transform:none;} }
        .kicker{ font-size:.72rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); }
        .title{ font-family:var(--font-display); font-weight:800; font-size:clamp(1.7rem,6vw,2.5rem); letter-spacing:-.02em;
          margin:.5rem 0 1.6rem; line-height:1.05; color:var(--text); }
        .nameField{ width:100%; border:1.5px solid var(--border); border-radius:8px; padding:1rem 1.1rem;
          font-family:inherit; font-size:1.15rem; font-weight:600; color:var(--text); background:var(--card);
          outline:none; transition:border-color .2s; }
        .nameField:focus{ border-color:var(--accent); }
        .choices{ display:grid; gap:1rem; }
        .choice{ text-align:left; cursor:pointer; border:1px solid var(--border); border-radius:8px; padding:1.3rem;
          background:var(--card); transition:all .22s cubic-bezier(.2,.8,.25,1);
          opacity:0; transform:translateY(16px); animation:cardUp .55s forwards; }
        .choice:nth-child(1){ animation-delay:.12s; } .choice:nth-child(2){ animation-delay:.22s; }
        @keyframes cardUp{ to{ opacity:1; transform:none; } }
        .choice:hover{ border-color:var(--accent); }
        .choice h3{ font-family:var(--font-display); font-weight:700; font-size:1.3rem; margin:0 0 .25rem; color:var(--text); }
        .choice p{ margin:0; color:var(--text-secondary); font-weight:500; }
        .qbar{ display:flex; align-items:center; gap:.8rem; margin-bottom:1.4rem; }
        .qbar .track{ flex:1; height:7px; background:var(--border); border-radius:8px; overflow:hidden; }
        .qbar .fill{ height:100%; background:var(--accent); border-radius:8px;
          transition:width .4s cubic-bezier(.2,.8,.25,1); }
        .qbar .n{ font-weight:700; font-size:.8rem; color:var(--text-secondary); }
        .options{ display:flex; flex-direction:column; gap:.7rem; }
        .opt{ text-align:left; cursor:pointer; border:1.5px solid var(--border); border-radius:8px; padding:1rem 1.1rem;
          background:var(--card); font-family:inherit; font-size:1.05rem; font-weight:600; color:var(--text);
          transition:all .2s cubic-bezier(.2,.8,.25,1); opacity:0; transform:translateY(14px); animation:cardUp .45s forwards; }
        .opt:nth-child(1){ animation-delay:.05s; } .opt:nth-child(2){ animation-delay:.12s; }
        .opt:nth-child(3){ animation-delay:.19s; } .opt:nth-child(4){ animation-delay:.26s; }
        .opt:hover:not(.sel){ border-color:var(--accent); transform:translateY(-2px); }
        .opt.sel{ background:var(--accent-muted); border-color:var(--accent); color:var(--accent); transform:translateY(-2px); }
        .submitting{ text-align:center; }
        .submitting p{ font-family:var(--font-display); font-weight:800; font-size:1.1rem; color:var(--text); }
        .result{ text-align:center; }
        .ratingpill{ display:inline-flex; align-items:center; gap:.4rem; font-weight:800; font-size:.8rem;
          letter-spacing:.04em; color:var(--text-secondary); background:var(--card); border:1px solid var(--border);
          padding:.35rem .8rem; border-radius:8px; margin-bottom:.6rem; }
        .score-num{ font-family:var(--font-display); font-weight:800; font-size:clamp(3rem,14vw,4.6rem); line-height:1; color:var(--text); }
        .score-num small{ font-size:.35em; opacity:.5; font-weight:700; }
        .rtitle{ font-family:var(--font-display); font-weight:800; font-size:clamp(1.5rem,5vw,2.1rem); margin:.3rem 0 .2rem; color:var(--text); }
        .stars-row{ display:flex; justify-content:center; gap:.25rem; margin:.6rem 0 .4rem; font-size:1.8rem; }
        .star{ color:var(--border); opacity:0; transform:scale(.3) translateY(8px); animation:starPop .5s forwards cubic-bezier(.2,.7,.2,1.7); }
        .star.on{ color:var(--accent); }
        .star.half{ background:linear-gradient(90deg,var(--accent) 50%,var(--border) 50%); -webkit-background-clip:text; background-clip:text; color:transparent; }
        @keyframes starPop{ to{ opacity:1; transform:none; } }
        .note{ color:var(--text-secondary); font-weight:500; max-width:36ch; margin:.6rem auto 1.6rem; line-height:1.5; }
        .cta{ border:none; cursor:pointer; font-family:var(--font-body); font-weight:700; font-size:1.05rem;
          color:#000; background:var(--accent); padding:1rem 2rem; border-radius:8px; transition:all .2s ease; }
        .cta:disabled{ opacity:.5; cursor:not-allowed; }
        .cta:hover:not(:disabled){ transform:translateY(-3px) scale(1.03); }
        .loader{ width:32px; height:32px; margin:0 auto 1rem; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin .7s linear infinite; display:block; }
        @keyframes spin{ to{ transform:rotate(360deg); } }
        @media (prefers-reduced-motion: reduce){
          .step,.choice,.opt,.star,.cta{ animation:none !important; opacity:1 !important; transform:none !important; }
          .fill{ transition:none !important; }
          .loader{ animation:none !important; }
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
              {q ? (
                <>
                  <div className="qbar">
                    <div className="track"><div className="fill" style={{ width: `${(done / totalQ) * 100}%` }} /></div>
                    <span className="n">{done}/{totalQ}</span>
                  </div>
                  <h1 className="title">{q.question || q.q}</h1>
                  <div className="options">
                    {(q.options || q.choices || []).map((o, i) => (
                      <button key={i} className={`opt${selected === i ? " sel" : ""}`} onClick={() => answer(i)}>{o}</button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="step submitting" key="loading-q">
                  <div className="loader" />
                  <p>Loading questions from the gaffer…</p>
                </div>
              )}
            </div>
          )}

          {step === "result" && submitting && (
            <div className="step submitting" key="submitting">
              <div className="loader" />
              <p>The gaffer's marking your answers…</p>
            </div>
          )}

          {step === "result" && !submitting && (
            <div className="step result" key="result">
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
