export default function GafferBackground() {
  return (
    <div className="gaffer-bg" aria-hidden="true">
      <style>{`
        .gaffer-bg { position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none; }
        .gbg-base { position:absolute; inset:0; background: var(--bg); }
        .gbg-grid { position:absolute; inset:0;
          background-image:
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
          background-size: 60px 60px; }
        .gbg-glow { position:absolute; width:50vw; height:50vw; border-radius:50%; filter:blur(120px); opacity:.3;
          background:radial-gradient(circle,rgba(245,197,24,.08),transparent 70%); }
        .gbg-glow.a { top:-20vw; right:-15vw; }
        .gbg-glow.b { bottom:-25vw; left:-18vw; background:radial-gradient(circle,rgba(29,155,240,.05),transparent 70%); }
      `}</style>
      <div className="gbg-base" />
      <div className="gbg-grid" />
      <div className="gbg-glow a" />
      <div className="gbg-glow b" />
    </div>
  );
}
