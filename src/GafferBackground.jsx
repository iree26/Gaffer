function Ball({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <defs><polygon id="bgp" points="0,-20 19,-6.2 11.8,16.2 -11.8,16.2 -19,-6.2" /></defs>
      <circle cx="100" cy="100" r="92" fill="#fff" stroke="#13311F" strokeWidth="6" />
      <g stroke="#13311F" strokeWidth="4" strokeLinecap="round">
        <line x1="100" y1="66" x2="100" y2="10" /><line x1="132.3" y1="89.5" x2="186" y2="72" />
        <line x1="120.1" y1="127.5" x2="153" y2="172" /><line x1="79.9" y1="127.5" x2="47" y2="172" />
        <line x1="67.7" y1="89.5" x2="14" y2="72" />
      </g>
      <use href="#bgp" transform="translate(100,100) scale(1.7)" fill="#16331F" />
      <use href="#bgp" transform="translate(137.6,48.2) rotate(36) scale(.72)" fill="#16331F" />
      <use href="#bgp" transform="translate(160.9,119.8) rotate(108) scale(.72)" fill="#16331F" />
      <use href="#bgp" transform="translate(100,164) rotate(180) scale(.72)" fill="#16331F" />
      <use href="#bgp" transform="translate(39.1,119.8) rotate(252) scale(.72)" fill="#16331F" />
      <use href="#bgp" transform="translate(62.4,48.2) rotate(324) scale(.72)" fill="#16331F" />
      <ellipse cx="72" cy="64" rx="34" ry="20" fill="#fff" opacity=".28" />
    </svg>
  );
}

export default function GafferBackground() {
  return (
    <div className="gaffer-bg" aria-hidden="true">
      <style>{`
        .gaffer-bg{ position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none; }
        .gbg-base{ position:absolute; inset:0; background:linear-gradient(160deg,#FFFFFF 0%,#E6F6EA 50%,#D2EDD9 100%); }
        .gbg-stripes{ position:absolute; inset:-5% -5%;
          background:repeating-linear-gradient(90deg,#EAF8ED 0 56px,#D2EBD8 56px 112px);
          opacity:.9; animation:gbgDrift 40s linear infinite; }
        @keyframes gbgDrift{ from{ transform:translateX(0);} to{ transform:translateX(112px);} }
        .gbg-pitch{ position:absolute; inset:0; width:100%; height:100%; opacity:.9; }
        .gbg-sweep{ position:absolute; top:-40%; left:-30%; width:60%; height:180%;
          background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,.5),rgba(255,255,255,0));
          transform:rotate(8deg); filter:blur(8px); animation:gbgSweep 14s ease-in-out infinite; }
        @keyframes gbgSweep{ 0%{ left:-40%;} 50%{ left:90%;} 100%{ left:-40%;} }
        .gbg-glow{ position:absolute; width:60vw; height:60vw; border-radius:50%; filter:blur(80px); opacity:.5;
          background:radial-gradient(circle,rgba(63,224,127,.5),rgba(63,224,127,0) 70%); animation:gbgGlow 18s ease-in-out infinite; }
        .gbg-glow.a{ top:-18vw; right:-12vw; }
        .gbg-glow.b{ bottom:-22vw; left:-15vw; animation-duration:24s; animation-direction:reverse;
          background:radial-gradient(circle,rgba(22,180,95,.45),rgba(22,180,95,0) 70%); }
        @keyframes gbgGlow{ 0%,100%{ transform:translate(0,0) scale(1);} 50%{ transform:translate(3vw,2vw) scale(1.12);} }
        .gbg-ball{ position:absolute; opacity:.22; animation:gbgRoll 28s linear infinite; }
        .gbg-ball.big{ width:42vmin; height:42vmin; right:-10vmin; top:6vh; }
        .gbg-ball.small{ width:18vmin; height:18vmin; left:-4vmin; bottom:7vh; opacity:.16; animation-duration:36s; animation-direction:reverse; }
        @keyframes gbgRoll{ to{ transform:rotate(360deg);} }
        @media (prefers-reduced-motion: reduce){ .gbg-stripes,.gbg-sweep,.gbg-glow,.gbg-ball{ animation:none !important; } }
      `}</style>
      <div className="gbg-base" />
      <div className="gbg-stripes" />
      <svg className="gbg-pitch" viewBox="0 0 1050 680" preserveAspectRatio="xMidYMid slice"
           fill="none" stroke="rgba(11,107,58,.22)" strokeWidth="3">
        <rect x="20" y="20" width="1010" height="640" />
        <line x1="525" y1="20" x2="525" y2="660" />
        <circle cx="525" cy="340" r="90" />
        <circle cx="525" cy="340" r="5" fill="rgba(11,107,58,.22)" stroke="none" />
        <rect x="20" y="138" width="165" height="403" />
        <rect x="20" y="248" width="55" height="183" />
        <path d="M185,267.5 A91,91 0 0 1 185,412.5" />
        <rect x="865" y="138" width="165" height="403" />
        <rect x="975" y="248" width="55" height="183" />
        <path d="M865,267.5 A91,91 0 0 0 865,412.5" />
      </svg>
      <div className="gbg-sweep" />
      <div className="gbg-glow a" /><div className="gbg-glow b" />
      <Ball className="gbg-ball big" /><Ball className="gbg-ball small" />
    </div>
  );
}