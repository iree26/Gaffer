import { useState, useEffect } from 'react'
import { api } from './api'
import Navbar from './Navbar'
import GafferBackground from './GafferBackground'

export default function Standings() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getGroupStandings().then(d => {
      setGroups(d.groups || [])
    }).catch(() => { setGroups([]) }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="gaffer-app">
      <GafferBackground />
      <Navbar />
      <style>{`
        .gaffer-app{position:relative;isolation:isolate;min-height:100svh;width:100%;background:transparent;color:var(--text);font-family:var(--font-body);padding-bottom:6rem;}
        .wrap{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:0 clamp(1rem,5vw,1.6rem);}
        .h{font-family:var(--font-display);font-weight:800;font-size:clamp(1.7rem,6vw,2.5rem);letter-spacing:-.02em;margin:0;}
        .hsub{margin:.4rem 0 1.2rem;color:var(--text-secondary);font-weight:500;}
        .group-card{background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:1.2rem;}
        .group-header{font-family:var(--font-display);font-weight:800;font-size:1.1rem;padding:.8rem 1rem .4rem;color:var(--text);}
        .tbl{width:100%;border-collapse:collapse;font-size:.85rem;}
        .tbl th{text-align:left;padding:.5rem 1rem;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-secondary);border-bottom:1px solid var(--border);}
        .tbl td{padding:.5rem 1rem;color:var(--text-secondary);font-weight:500;border-bottom:1px solid var(--border);}
        .tbl tr:last-child td{border-bottom:none;}
        .tbl .pos{font-weight:800;color:var(--accent);width:1.5rem;}
        .tbl .team{color:var(--text);font-weight:600;}
        .tbl .pts{font-weight:800;color:var(--accent);text-align:center;}
        .empty{text-align:center;color:var(--text-secondary);padding:2rem 1rem;font-weight:600;}
      `}</style>

      <main className="wrap">
        <h1 className="h">Group Standings</h1>
        <p className="hsub">Live group stage tables from the tournament.</p>

        {loading ? <div className="empty">Loading...</div> : groups.length === 0 ? (
          <div className="empty">No standings available yet.</div>
        ) : groups.map(g => (
          <div key={g.group_name || g.name} className="group-card">
            <div className="group-header">{g.group_name || g.name}</div>
            <table className="tbl">
              <thead>
                <tr><th className="pos">#</th><th>Team</th><th>Pld</th><th>W</th><th>D</th><th>L</th><th>GD</th><th className="pts">Pts</th></tr>
              </thead>
              <tbody>
                {(g.teams || g.standings || []).map((t, i) => (
                  <tr key={i}>
                    <td className="pos">{i + 1}</td>
                    <td className="team">{t.team || t.name || t.country}</td>
                    <td>{t.played ?? t.pld ?? '-'}</td>
                    <td>{t.wins ?? t.w ?? '-'}</td>
                    <td>{t.draws ?? t.d ?? '-'}</td>
                    <td>{t.losses ?? t.l ?? '-'}</td>
                    <td>{t.goal_diff ?? t.gd ?? '-'}</td>
                    <td className="pts">{t.points ?? t.pts ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </main>
    </div>
  )
}
