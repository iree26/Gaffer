import { useState, useRef, useEffect } from 'react'
import { api } from './api'
import { useUser } from './UserContext'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function GafferAI() {
  const { user } = useUser()
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Ask me anything about the tournament...' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('chat')
  const [scenario, setScenario] = useState('')
  const [scenarioResult, setScenarioResult] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const d = await api.gafferChat(user.displayName, text)
      const reply = d.response || d.message || 'No response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not reach Gaffer right now.' }])
    } finally { setLoading(false) }
  }

  async function handleScenario() {
    if (!scenario.trim()) return
    try {
      const d = await api.gafferScenario(user.displayName, scenario.trim())
      setScenarioResult(d)
    } catch { setScenarioResult({ error: 'Failed to simulate.' }) }
  }

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:transparent;color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);opacity:.8;font-weight:500;}
        .tabs{display:flex;gap:.5rem;margin-bottom:1rem;}
        .tab{cursor:pointer;border:1.5px solid var(--border);background:var(--card);border-radius:8px;padding:.45rem .9rem;font-weight:700;font-size:.8rem;color:var(--text-secondary);transition:all .18s ease;}
        .tab.on{background:var(--accent);border-color:var(--accent);color:#000;}
        .chat-area{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1rem;min-height:400px;max-height:500px;overflow-y:auto;display:flex;flex-direction:column;gap:.8rem;margin-bottom:1rem;}
        .msg{max-width:80%;padding:.6rem 1rem;border-radius:14px;font-weight:500;font-size:.9rem;line-height:1.5;}
        .msg.user{align-self:flex-end;background:var(--accent);color:#000;border-bottom-right-radius:4px;}
        .msg.assistant{align-self:flex-start;background:var(--card);color:var(--text);border-bottom-left-radius:4px;border:1px solid var(--border);}
        .input-row{display:flex;gap:.5rem;}
        .input-row input{flex:1;padding:.7rem .9rem;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:500;color:var(--text);background:var(--card);outline:none;}
        .input-row input:focus{border-color:var(--accent);}
        .input-row button{border:none;cursor:pointer;font-weight:800;color:#000;background:var(--accent);padding:.7rem 1.2rem;border-radius:8px;}
        .input-row button:disabled{opacity:.4;}
        .scenario-area{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1rem;}
        .scenario-area textarea{width:100%;padding:.7rem .9rem;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.9rem;color:var(--text);background:var(--card);outline:none;resize:vertical;min-height:80px;box-sizing:border-box;}
        .scenario-area textarea:focus{border-color:var(--accent);}
        .scenario-area button{border:none;cursor:pointer;font-weight:800;color:#000;background:var(--accent);padding:.7rem 1.2rem;border-radius:8px;margin-top:.5rem;}
        .result-box{margin-top:1rem;padding:1rem;background:var(--card);border-radius:8px;border:1px solid var(--border);font-size:.9rem;color:var(--text-secondary);line-height:1.5;}
        .typing{color:var(--text-secondary);opacity:.5;align-self:flex-start;}
      `}</style>

      <main className="wrap">
        <h1 className="h">Gaffer AI</h1>
        <p className="hsub">Your AI football oracle. Chat or simulate scenarios.</p>

        <div className="tabs">
          <button className={`tab${mode === 'chat' ? ' on' : ''}`} onClick={() => setMode('chat')}>Chat</button>
          <button className={`tab${mode === 'scenario' ? ' on' : ''}`} onClick={() => setMode('scenario')}>Scenario Sim</button>
        </div>

        {mode === 'chat' ? (
          <>
            <div className="chat-area">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>{m.content}</div>
              ))}
              {loading && <div className="msg assistant typing">Gaffer is thinking...</div>}
              <div ref={bottomRef} />
            </div>
            <div className="input-row">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Gaffer about teams, players, predictions..."
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }} />
              <button onClick={handleSend} disabled={!input.trim() || loading}>Send</button>
            </div>
          </>
        ) : (
          <div className="scenario-area">
            <textarea value={scenario} onChange={(e) => setScenario(e.target.value)}
              placeholder="Describe a scenario, e.g. &#10;'Brazil vs France semi-final, Brazil scores first, what happens?'" />
            <button onClick={handleScenario}>Simulate</button>
            {scenarioResult && (
              <div className="result-box">
                {scenarioResult.error ? <div>{scenarioResult.error}</div> : (
                  <div style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(scenarioResult, null, 2)}</div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
