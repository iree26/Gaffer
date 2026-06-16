import { useState, useEffect } from 'react'
import { api } from './api'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function Lineups() {
  const [matches, setMatches] = useState([])
  const [lineups, setLineups] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const m = await api.getMatches().catch(() => ({ matches: [] }))
        const ms = m.matches || []
        if (ignore) return;
        setMatches(ms)
        if (ms.length > 0) {
          const lu = {}
          for (const match of ms) {
            const d = await api.getMatchLineup(match.id).catch(() => null)
            if (d) lu[match.id] = d
          }
          if (!ignore) setLineups(lu)
        }
      } catch { /* silent */ } finally { if (!ignore) setLoading(false) }
    })();
    return () => { ignore = true; };
  }, [])

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:transparent;color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);opacity:.8;font-weight:500;}
        .match-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:.6rem;cursor:pointer;transition:all .15s ease;}
        .match-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.3);}
        .match-card.active{border-color:var(--accent);}
        .match-title{font-weight:800;font-size:1rem;color:var(--text);}
        .match-status{font-size:.78rem;color:var(--text-secondary);opacity:.6;}
        .lineup-content{padding:.5rem 0 0;}
        .lineup-team{margin-bottom:1rem;}
        .lineup-team h3{font-family:var(--font-display);font-weight:700;font-size:.95rem;color:var(--text);margin:0 0 .4rem;}
        .lineup-team .formation{font-size:.78rem;color:var(--text-secondary);opacity:.6;margin-bottom:.4rem;}
        .player{display:flex;align-items:center;gap:.5rem;padding:.25rem 0;font-size:.85rem;color:var(--text-secondary);font-weight:500;border-bottom:1px solid var(--border);}
        .player:last-child{border-bottom:none;}
        .player .number{font-weight:800;color:var(--text);width:1.5rem;text-align:center;}
        .player .pos{font-size:.7rem;text-transform:uppercase;font-weight:700;color:var(--accent);width:1.8rem;}
        .empty{text-align:center;color:var(--text-secondary);opacity:.6;padding:2rem 1rem;font-weight:600;}
      `}</style>

      <main className="wrap">
        <h1 className="h">Lineups</h1>
        <p className="hsub">Matchday squads and formations.</p>

        {loading ? <div className="empty">Loading...</div> : matches.length === 0 ? (
          <div className="empty">No matches available.</div>
        ) : matches.map(m => {
          const lu = lineups[m.id]
          const homePlayers = lu?.home?.starting_xi || lu?.home?.players || []
          const awayPlayers = lu?.away?.starting_xi || lu?.away?.players || []
          return (
            <div key={m.id} className={`match-card${selectedMatch === m.id ? ' active' : ''}`}
              onClick={() => setSelectedMatch(selectedMatch === m.id ? null : m.id)}>
              <div className="match-title">{m.home_team} vs {m.away_team}</div>
              <div className="match-status">{m.status || 'SCHEDULED'} {lu ? `· ${homePlayers.length + awayPlayers.length} players` : '· No lineups yet'}</div>

              {selectedMatch === m.id && (
                <div className="lineup-content">
                  <div className="lineup-team">
                    <h3>{m.home_team}</h3>
                    <div className="formation">{lu?.home?.formation ? `Formation: ${lu.home.formation}` : ''}</div>
                    {homePlayers.length === 0 ? <div className="empty">No lineup data</div> :
                      homePlayers.map((p, i) => (
                        <div key={i} className="player">
                          <span className="number">{p.number || p.jersey_number || i + 1}</span>
                          <span className="pos">{p.position || p.pos || ''}</span>
                          <span>{p.name || p.player}</span>
                        </div>
                      ))
                    }
                  </div>
                  <div className="lineup-team">
                    <h3>{m.away_team}</h3>
                    <div className="formation">{lu?.away?.formation ? `Formation: ${lu.away.formation}` : ''}</div>
                    {awayPlayers.length === 0 ? <div className="empty">No lineup data</div> :
                      awayPlayers.map((p, i) => (
                        <div key={i} className="player">
                          <span className="number">{p.number || p.jersey_number || i + 1}</span>
                          <span className="pos">{p.position || p.pos || ''}</span>
                          <span>{p.name || p.player}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </main>
    </div>
  )
}
