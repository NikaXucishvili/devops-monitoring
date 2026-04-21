import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:3001";
const HISTORY_MAX = 40; // how many 3-second snapshots to keep client-side

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:     #020510;
    --panel:  rgba(5, 16, 44, 0.80);
    --border: rgba(0, 200, 255, 0.16);
    --cyan:   #00d4ff;
    --green:  #00ff9d;
    --yellow: #ffe033;
    --red:    #ff3c5a;
    --violet: #b06cff;
    --dim:    rgba(200, 220, 255, 0.32);
    --glow-c: 0 0 10px rgba(0,212,255,0.7),  0 0 28px rgba(0,212,255,0.2);
    --glow-g: 0 0 10px rgba(0,255,157,0.7),  0 0 28px rgba(0,255,157,0.2);
    --glow-r: 0 0 10px rgba(255,60,90,0.8),   0 0 28px rgba(255,60,90,0.25);
    --glow-y: 0 0 10px rgba(255,224,51,0.7),  0 0 28px rgba(255,224,51,0.2);
  }

  html, body { background: var(--bg); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,200,255,0.25); border-radius: 2px; }

  #particle-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }

  .scanlines {
    position: fixed; inset: 0; pointer-events: none; z-index: 2;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px
    );
  }

  .dash {
    position: relative; z-index: 1;
    min-height: 100vh;
    padding: 28px 32px 40px;
    font-family: 'Share Tech Mono', monospace;
    color: #ddf4ff;
  }

  /* ── Header ── */
  .hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:32px; }
  .hdr-left .eyebrow { font-size:10px; letter-spacing:.22em; color:var(--cyan); opacity:.6; margin-bottom:6px; }
  .hdr-title {
    font-family:'Orbitron',sans-serif; font-weight:900;
    font-size: clamp(18px,2.4vw,26px); letter-spacing:.1em;
    background:linear-gradient(90deg,var(--cyan),var(--green));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  }
  .hdr-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
  .live-pill { display:flex; align-items:center; gap:7px; font-size:10px; letter-spacing:.18em; color:var(--green); }
  .live-dot {
    width:7px; height:7px; border-radius:50%;
    background:var(--green); box-shadow:var(--glow-g);
    animation: blink 1.4s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.7);opacity:.5;} }
  .uptime-text { font-size:10px; color:var(--dim); letter-spacing:.1em; }

  /* ── Grid ── */
  .row   { display:grid; gap:18px; margin-bottom:18px; }
  .row-3 { grid-template-columns: repeat(3,1fr); }
  .row-21{ grid-template-columns: 2fr 1fr; }
  .row-12{ grid-template-columns: 1fr 2fr; }
  .row-2 { grid-template-columns: 1fr 1fr; }

  /* ── Panel ── */
  .panel {
    background:var(--panel); border:1px solid var(--border);
    border-radius:14px; padding:20px 22px;
    backdrop-filter:blur(20px);
    position:relative; overflow:hidden;
    transition: border-color .3s, box-shadow .3s;
    animation: fadein .45s ease both;
  }
  .panel:hover { border-color:rgba(0,212,255,.38); box-shadow:0 0 24px rgba(0,212,255,.07); }
  @keyframes fadein { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:none;} }
  .panel::before,.panel::after {
    content:''; position:absolute; width:11px; height:11px;
    border-color:var(--cyan); border-style:solid; opacity:.5;
  }
  .panel::before { top:5px;    left:5px;    border-width:1px 0 0 1px; }
  .panel::after  { bottom:5px; right:5px;   border-width:0 1px 1px 0; }

  /* ── Label / stat ── */
  .lbl { font-size:10px; letter-spacing:.2em; color:var(--cyan); opacity:.65; text-transform:uppercase; margin-bottom:8px; }
  .big { font-family:'Orbitron',sans-serif; font-size:clamp(28px,3.5vw,44px); font-weight:700; line-height:1; }
  .big-unit { font-size:.38em; opacity:.55; margin-left:3px; }
  .status-tag { font-size:10px; margin-top:5px; letter-spacing:.12em; }

  /* ── Bar ── */
  .bar-track { background:rgba(255,255,255,0.06); border-radius:5px; height:7px; margin-top:12px; overflow:hidden; }
  .bar-fill  { height:100%; border-radius:5px; position:relative; transition:width .6s cubic-bezier(.4,0,.2,1); }
  .bar-fill::after {
    content:''; position:absolute; right:0; top:50%; transform:translateY(-50%);
    width:2px; height:12px; border-radius:2px; background:white; opacity:.7;
  }

  /* ── Ring ── */
  .ring-wrap { display:flex; flex-direction:column; align-items:center; gap:8px; }
  .ring-track { fill:none; stroke:rgba(255,255,255,0.06); }
  .ring-arc   { fill:none; stroke-linecap:round; transition:stroke-dashoffset .8s cubic-bezier(.4,0,.2,1); }

  /* ── Sparkline ── */
  .sparkline-svg { width:100%; overflow:visible; display:block; }

  /* ── Alerts ── */
  .alert {
    display:flex; align-items:flex-start; gap:10px;
    padding:9px 11px; border-radius:7px; margin-bottom:7px;
    font-size:11px; border-left:2px solid; line-height:1.5;
    animation: slide-in .25s ease both;
  }
  @keyframes slide-in { from{opacity:0;transform:translateX(-6px);} to{opacity:1;transform:none;} }
  .alert-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-top:3px; }
  .a-crit { background:rgba(255,60,90,.1);   border-color:var(--red);    color:var(--red);    }
  .a-warn { background:rgba(255,224,51,.08); border-color:var(--yellow); color:var(--yellow); }
  .a-ok   { background:rgba(0,255,157,.07);  border-color:var(--green);  color:var(--green);  }

  /* ── Event log ── */
  .log-wrap { max-height:160px; overflow-y:auto; }
  .log-entry {
    display:flex; gap:10px; align-items:baseline;
    padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.04);
    font-size:10px; animation: log-pop .2s ease both;
  }
  @keyframes log-pop { from{opacity:0;} to{opacity:1;} }
  .log-time { color:var(--dim); flex-shrink:0; }
  .log-msg  { flex:1; }
  .log-crit { color:var(--red);    }
  .log-warn { color:var(--yellow); }
  .log-ok   { color:var(--green);  }
  .log-info { color:var(--cyan);   }

  /* ── Network ── */
  .net-row { display:flex; gap:16px; margin-top:6px; }
  .net-box {
    flex:1; background:rgba(0,0,0,.25); border-radius:8px;
    padding:10px 14px; border:1px solid var(--border); text-align:center;
  }
  .net-val { font-family:'Orbitron',sans-serif; font-size:18px; font-weight:700; }
  .net-sub { font-size:9px; color:var(--dim); margin-top:3px; letter-spacing:.12em; }

  /* ── Services ── */
  .svc-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:4px; }
  .svc-chip {
    display:flex; align-items:center; gap:8px;
    padding:8px 12px; border-radius:8px; font-size:11px;
    background:rgba(0,212,255,0.05); border:1px solid var(--border);
    letter-spacing:.06em;
  }
  .svc-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .svc-info { display:flex; flex-direction:column; gap:1px; }
  .svc-name { font-size:11px; }
  .svc-status { font-size:9px; color:var(--dim); }

  /* ── Loading ── */
  .loading {
    min-height:100vh; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:20px;
    font-family:'Orbitron',sans-serif; color:var(--cyan); letter-spacing:.2em;
  }
  .loading-ring {
    width:56px; height:56px; border-radius:50%;
    border:2px solid rgba(0,212,255,.12); border-top-color:var(--cyan);
    animation:spin 1s linear infinite; box-shadow:var(--glow-c);
  }
  @keyframes spin { to{transform:rotate(360deg);} }

  @media(max-width:860px){
    .row-3,.row-21,.row-12,.row-2 { grid-template-columns:1fr; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const metricColor = v => v > 80 ? "var(--red)" : v > 60 ? "var(--yellow)" : "var(--cyan)";
const metricGlow  = v => v > 80 ? "var(--glow-r)" : v > 60 ? "var(--glow-y)" : "var(--glow-c)";

function fmtBytes(b = 0) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + " GB/s";
  if (b >= 1e6) return (b / 1e6).toFixed(1) + " MB/s";
  if (b >= 1e3) return (b / 1e3).toFixed(1) + " KB/s";
  return b.toFixed(0) + " B/s";
}

function fmtUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function nowStr() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO ALERTS  (Web Audio API — no files needed)
// ─────────────────────────────────────────────────────────────────────────────
function useAudioAlert() {
  const ctxRef = useRef(null);

  // Lazily create AudioContext on first use (satisfies browser autoplay policy)
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playTone = useCallback((type) => {
    try {
      const ctx  = getCtx();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      if (type === "crit") {
        // Two-pulse harsh blip — red alert
        [0, 0.18].forEach(delay => {
          const osc = ctx.createOscillator();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + delay + 0.12);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.18, ctx.currentTime + delay);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.14);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.15);
        });
      } else if (type === "warn") {
        // Single soft ping — yellow caution
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.23);
      } else if (type === "ok") {
        // Soft ascending chime — all-clear
        [0, 0.12].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = i === 0 ? 523 : 784;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.09, ctx.currentTime + delay);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.26);
        });
      }
    } catch (_) { /* AudioContext blocked — silent fail */ }
  }, [getCtx]);

  return playTone;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext("2d");
    let W, H, pts, raf;
    const N = 70;
    const init = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      pts = Array.from({ length: N }, () => ({
        x: Math.random()*W, y: Math.random()*H,
        vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25,
        r: Math.random()*1.1+.3, a: Math.random()*.6+.2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x<0) p.x=W; if (p.x>W) p.x=0;
        if (p.y<0) p.y=H; if (p.y>H) p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(0,200,255,${p.a*.35})`; ctx.fill();
      }
      for (let i=0;i<N;i++) for (let j=i+1;j<N;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
        const d=Math.hypot(dx,dy);
        if (d<110) {
          ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(0,200,255,${(1-d/110)*.055})`; ctx.lineWidth=.5; ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    init(); draw();
    window.addEventListener("resize",init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize",init); };
  }, []);
  return <canvas id="particle-canvas" ref={ref} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED NUMBER
// ─────────────────────────────────────────────────────────────────────────────
function AnimNum({ value, decimals = 1 }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start=prev.current, end=value, dur=500, t0=performance.now();
    const step=now => {
      const p=Math.min((now-t0)/dur,1);
      const e=1-Math.pow(1-p,3);
      setDisp(start+(end-start)*e);
      if (p<1) requestAnimationFrame(step); else prev.current=end;
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{disp.toFixed(decimals)}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// RING GAUGE
// ─────────────────────────────────────────────────────────────────────────────
function Ring({ value=0, label, size=108 }) {
  const r=41, circ=2*Math.PI*r;
  const offset = circ*(1-Math.min(value,100)/100);
  const color  = metricColor(value);
  return (
      <div className="ring-wrap">
        <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow:'visible'}}>
          <circle className="ring-track" cx="50" cy="50" r={r} strokeWidth="7"/>
          <circle className="ring-arc" cx="50" cy="50" r={r} strokeWidth="7"
                  stroke={color} strokeDasharray={circ} strokeDashoffset={offset}
                  transform="rotate(-90 50 50)"
                  style={{filter:`drop-shadow(0 0 5px ${color})`}}
          />
          <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
                style={{fontFamily:"Orbitron,sans-serif",fontSize:15,fontWeight:700,fill:color}}>
            {value.toFixed(0)}
          </text>
          <text x="50" y="60" textAnchor="middle" dominantBaseline="middle"
                style={{fontSize:9,fill:'rgba(200,220,255,0.4)'}}>%</text>
        </svg>
        <span style={{fontSize:9,letterSpacing:'.16em',color:'var(--dim)',textTransform:'uppercase'}}>{label}</span>
      </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-LINE SPARKLINE  (CPU = cyan, RAM = violet)
//
// HOW IT WORKS (no backend needed):
//   Every 3 s the dashboard polls /alerts and receives { cpu, ram, disk }.
//   We append { ts, cpu, ram, disk } to a React state array capped at
//   HISTORY_MAX entries. This component renders that array as two SVG
//   polylines. Refreshing the page resets the buffer — it is purely
//   in-memory for the current browser session.
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ history }) {
  const VW=600, VH=100, PAD=4;

  if (!history.length) return (
      <svg className="sparkline-svg" viewBox={`0 0 ${VW} ${VH}`} style={{height:VH}}>
        <text x={VW/2} y={VH/2} textAnchor="middle"
              style={{fill:'var(--dim)',fontSize:11,fontFamily:'Share Tech Mono,monospace'}}>
          Awaiting data…
        </text>
      </svg>
  );

  const xs = i => PAD + (i / Math.max(history.length-1,1)) * (VW-PAD*2);
  const ys = v => PAD + (1 - Math.min(v,100)/100) * (VH-PAD*2);

  const renderLine = (key, color) => {
    const pts  = history.map((h,i)=>`${xs(i)},${ys(h[key]||0)}`).join(" ");
    const area = [
      `M ${xs(0)},${VH}`,
      ...history.map((h,i)=>`L ${xs(i)},${ys(h[key]||0)}`),
      `L ${xs(history.length-1)},${VH}`, "Z",
    ].join(" ");
    const last = history[history.length-1];
    return (
        <g key={key}>
          <defs>
            <linearGradient id={`g-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity=".2"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#g-${key})`}/>
          <polyline points={pts} fill="none" stroke={color} strokeWidth="1.7"
                    style={{filter:`drop-shadow(0 0 4px ${color})`}}/>
          <circle
              cx={xs(history.length-1)} cy={ys(last[key]||0)}
              r="3.5" fill={color}
              style={{filter:`drop-shadow(0 0 5px ${color})`}}
          />
        </g>
    );
  };

  const guides = [25,50,75,100].map(v=>(
      <g key={v}>
        <line x1={PAD} y1={ys(v)} x2={VW-PAD} y2={ys(v)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4"/>
        <text x={VW-PAD+5} y={ys(v)} dominantBaseline="middle"
              style={{fontSize:8,fill:'var(--dim)',fontFamily:'Share Tech Mono,monospace'}}>{v}</text>
      </g>
  ));

  return (
      <svg className="sparkline-svg" viewBox={`0 0 ${VW} ${VH}`} style={{height:VH}}>
        {guides}
        {renderLine("cpu",  "var(--cyan)")}
        {renderLine("ram",  "var(--violet)")}
      </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data,      setData]    = useState(null);
  const [history,   setHistory] = useState([]);
  const [events,    setEvents]  = useState([]);
  const [tick,      setTick]    = useState(0);
  const [uptimeSec, setUptime]  = useState(0);
  const [soundOn,   setSoundOn] = useState(true);
  const [audioReady, setAudioReady] = useState(false); // tracks if user has unlocked audio
  const prevRef  = useRef({});
  const startRef = useRef(Date.now());
  const playTone = useAudioAlert();

  // uptime ticker
  useEffect(() => {
    const iv = setInterval(()=>setUptime(Math.floor((Date.now()-startRef.current)/1000)), 1000);
    return () => clearInterval(iv);
  }, []);

  const addEvent = useCallback((msg, kind="info") => {
    setEvents(e => [{ t: nowStr(), msg, kind }, ...e].slice(0, 100));
  }, []);

  const soundOnRef = useRef(true);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  // detect threshold crossings and log them
  const checkThresholds = useCallback((d) => {
    const checks = [
      { key:"cpu",  label:"CPU"  },
      { key:"ram",  label:"RAM"  },
      { key:"disk", label:"Disk" },
    ];
    for (const { key, label } of checks) {
      const val  = d[key] || 0;
      const prev = prevRef.current[key] || 0;
      if (val > 80 && prev <= 80) {
        addEvent(`${label} CRITICAL — ${val.toFixed(1)}%`, "crit");
        if (soundOnRef.current) playTone("crit");
      } else if (val > 60 && prev <= 60) {
        addEvent(`${label} elevated — ${val.toFixed(1)}%`, "warn");
        if (soundOnRef.current) playTone("warn");
      } else if (val <= 60 && prev > 60) {
        addEvent(`${label} normalised — ${val.toFixed(1)}%`, "ok");
        if (soundOnRef.current) playTone("ok");
      }
    }
    prevRef.current = { cpu: d.cpu, ram: d.ram, disk: d.disk };
  }, [addEvent, playTone]);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/alerts`);
      const d   = res.data;
      setData(d);
      setTick(t => t+1);
      // append snapshot to client-side history buffer
      setHistory(h => [
        ...h,
        { ts: nowStr(), cpu: d.cpu||0, ram: d.ram||0, disk: d.disk||0 },
      ].slice(-HISTORY_MAX));
      checkThresholds(d);
    } catch (err) {
      addEvent(`API unreachable — ${err.message}`, "crit");
    }
  }, [checkThresholds, addEvent]);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = STYLE;
    document.head.appendChild(s);
    addEvent("Dashboard initialised", "info");
    load();
    const iv = setInterval(load, 3000);
    return () => { clearInterval(iv); document.head.removeChild(s); };
  }, [load, addEvent]);

  // ── loading state ──────────────────────────────────────────────────────────
  if (!data) return (
      <>
        <ParticleCanvas/>
        <div className="loading">
          <div className="loading-ring"/>
          <span style={{fontSize:11}}>INITIALIZING TELEMETRY</span>
        </div>
      </>
  );

  const { cpu=0, ram=0, disk=0, alerts=[], jenkins, network={} } = data;
  const netIn  = network.rx_bytes_per_sec || network.in  || 0;
  const netOut = network.tx_bytes_per_sec || network.out || 0;

  const services = [
    { name:"Jenkins",    status: jenkins || "online" },
    { name:"Prometheus", status:"online" },
    { name:"Docker",     status:"online" },
    { name:"Node",       status:"online" },
  ];

  const metricCards = [
    { value:cpu,  label:"CPU",  sub:"processor load" },
    { value:ram,  label:"RAM",  sub:"memory usage"   },
    { value:disk, label:"DISK", sub:"storage usage"  },
  ];

  // session averages from client-side history
  const avg = key => history.length
      ? history.reduce((s,h)=>s+(h[key]||0),0)/history.length
      : 0;
  const peak = key => history.length
      ? Math.max(...history.map(h=>h[key]||0))
      : 0;

  return (
      <>
        <ParticleCanvas/>
        <div className="scanlines"/>

        {/* ── AUDIO UNLOCK OVERLAY — dismissed on first click ── */}
        {!audioReady && (
            <div
                onClick={() => { playTone("ok"); setAudioReady(true); }}
                style={{
                  position:"fixed", inset:0, zIndex:999,
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  gap:18, cursor:"pointer",
                  background:"rgba(2,5,16,0.82)", backdropFilter:"blur(6px)",
                }}
            >
              <div style={{
                border:"1px solid rgba(0,212,255,0.35)", borderRadius:16,
                padding:"36px 52px", textAlign:"center",
                background:"rgba(5,16,44,0.9)", boxShadow:"0 0 40px rgba(0,212,255,0.1)",
                fontFamily:"'Orbitron',sans-serif",
              }}>
                <div style={{fontSize:32, marginBottom:14}}>◉</div>
                <div style={{
                  fontSize:14, letterSpacing:".2em", color:"var(--cyan)",
                  textShadow:"var(--glow-c)", marginBottom:8,
                }}>ACTIVATE AUDIO ALERTS</div>
                <div style={{fontSize:10, letterSpacing:".14em", color:"var(--dim)", marginBottom:22}}>
                  CLICK ANYWHERE TO ENABLE SOUND
                </div>
                <div style={{
                  fontSize:9, color:"rgba(0,212,255,0.4)", letterSpacing:".1em",
                  borderTop:"1px solid rgba(0,212,255,0.12)", paddingTop:14,
                }}>
                  browsers require a user gesture before playing audio
                </div>
              </div>
            </div>
        )}

        <div className="dash">

          {/* ── HEADER ── */}
          <div className="hdr">
            <div className="hdr-left">
              <div className="eyebrow">SYS · INFRA · MONITOR</div>
              <div className="hdr-title">NEXUS OPS COMMAND</div>
            </div>
            <div className="hdr-right">
              <div className="live-pill">
                <div className="live-dot"/>
                LIVE · POLL 3s · #{tick}
              </div>
              <div className="uptime-text">SESSION {fmtUptime(uptimeSec)}</div>
              <button
                  onClick={() => setSoundOn(s => !s)}
                  title={soundOn ? "Mute alert sounds" : "Unmute alert sounds"}
                  style={{
                    background: soundOn ? "rgba(0,212,255,0.08)" : "rgba(255,60,90,0.08)",
                    border: `1px solid ${soundOn ? "rgba(0,212,255,0.25)" : "rgba(255,60,90,0.25)"}`,
                    borderRadius: "6px",
                    color: soundOn ? "var(--cyan)" : "var(--red)",
                    cursor: "pointer",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: ".14em",
                    padding: "4px 10px",
                    transition: "all .2s",
                  }}
              >
                {soundOn ? "◉ SOUND ON" : "◎ SOUND OFF"}
              </button>
            </div>
          </div>

          {/* ── ROW 1: three metric cards ── */}
          <div className="row row-3">
            {metricCards.map(({ value, label, sub }, i) => (
                <div className="panel" key={label} style={{animationDelay:`${i*.08}s`}}>
                  <div className="lbl">{sub}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
                    <div>
                      <div className="big" style={{color:metricColor(value),textShadow:metricGlow(value)}}>
                        <AnimNum value={value}/><span className="big-unit">%</span>
                      </div>
                      <div className="status-tag" style={{
                        color: value>80?"var(--red)":value>60?"var(--yellow)":"var(--green)"
                      }}>
                        {value>80?"⚠ CRITICAL":value>60?"◈ ELEVATED":"✓ NOMINAL"}
                      </div>
                    </div>
                    <Ring value={value} label={label}/>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{
                      width:`${Math.min(value,100)}%`,
                      background:`linear-gradient(90deg,${metricColor(value)}99,${metricColor(value)})`,
                      boxShadow: metricGlow(value),
                    }}/>
                  </div>
                </div>
            ))}
          </div>

          {/* ── ROW 2: dual-line sparkline ── */}
          <div className="row" style={{gridTemplateColumns:'1fr'}}>
            <div className="panel" style={{animationDelay:'.22s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div className="lbl" style={{marginBottom:0}}>
                  cpu &amp; ram history · {history.length}/{HISTORY_MAX} samples · 3 s interval
                </div>
                <div style={{display:'flex',gap:14,fontSize:10,letterSpacing:'.1em'}}>
                  <span style={{color:'var(--cyan)'}}>▬ CPU</span>
                  <span style={{color:'var(--violet)'}}>▬ RAM</span>
                </div>
              </div>
              <Sparkline history={history}/>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:9,color:'var(--dim)'}}>
                <span>← OLDEST</span>
                <span>LATEST →</span>
              </div>
            </div>
          </div>

          {/* ── ROW 3: alerts + event log ── */}
          <div className="row row-21">
            {/* Alerts */}
            <div className="panel" style={{animationDelay:'.3s'}}>
              <div className="lbl">active alerts</div>
              {alerts.length===0 ? (
                  <div className="alert a-ok">
                    <div className="alert-dot" style={{background:'var(--green)',boxShadow:'var(--glow-g)'}}/>
                    <span>ALL SYSTEMS NOMINAL</span>
                  </div>
              ) : alerts.map((a,i)=>(
                  <div key={i} className={`alert ${a.type==="CRITICAL"?"a-crit":"a-warn"}`}>
                    <div className="alert-dot" style={{
                      background: a.type==="CRITICAL"?"var(--red)":"var(--yellow)",
                      boxShadow:  a.type==="CRITICAL"?"var(--glow-r)":"var(--glow-y)",
                    }}/>
                    <div><strong>{a.type}</strong> — {a.metric}: {a.value?.toFixed(1)}%</div>
                  </div>
              ))}
            </div>

            {/* Event log */}
            <div className="panel" style={{animationDelay:'.34s'}}>
              <div className="lbl">event log</div>
              <div className="log-wrap">
                {events.length===0
                    ? <div className="log-entry"><span className="log-info">Initialising…</span></div>
                    : events.map((e,i)=>(
                        <div key={i} className="log-entry">
                          <span className="log-time">{e.t}</span>
                          <span className={`log-msg log-${e.kind}`}>{e.msg}</span>
                        </div>
                    ))
                }
              </div>
            </div>
          </div>

          {/* ── ROW 4: network I/O + services ── */}
          <div className="row row-12">

            {/* Network + disk averages */}
            <div className="panel" style={{animationDelay:'.4s'}}>
              <div className="lbl">network i/o</div>
              <div className="net-row">
                <div className="net-box">
                  <div className="net-val" style={{color:'var(--cyan)',textShadow:'var(--glow-c)'}}>
                    {fmtBytes(netIn)}
                  </div>
                  <div className="net-sub">↓ INBOUND</div>
                </div>
                <div className="net-box">
                  <div className="net-val" style={{color:'var(--violet)',textShadow:'0 0 10px rgba(176,108,255,.7)'}}>
                    {fmtBytes(netOut)}
                  </div>
                  <div className="net-sub">↑ OUTBOUND</div>
                </div>
              </div>

              {history.length > 1 && (
                  <div style={{marginTop:16}}>
                    <div className="lbl" style={{marginBottom:8}}>session peaks</div>
                    {metricCards.map(({ label }) => {
                      const key = label.toLowerCase();
                      const p   = peak(key);
                      return (
                          <div key={key} style={{marginBottom:9}}>
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--dim)',marginBottom:3}}>
                              <span>{label} peak</span>
                              <span style={{color:metricColor(p)}}>{p.toFixed(1)}%</span>
                            </div>
                            <div className="bar-track">
                              <div className="bar-fill" style={{
                                width:`${p}%`,
                                background:`linear-gradient(90deg,${metricColor(p)}77,${metricColor(p)})`,
                              }}/>
                            </div>
                          </div>
                      );
                    })}
                  </div>
              )}
            </div>

            {/* Services + session averages */}
            <div className="panel" style={{animationDelay:'.46s'}}>
              <div className="lbl">service health</div>
              <div className="svc-grid">
                {services.map(({ name, status }) => {
                  const ok = /online|up|healthy/i.test(status);
                  return (
                      <div className="svc-chip" key={name}>
                        <div className="svc-dot" style={{
                          background: ok?"var(--green)":"var(--red)",
                          boxShadow:  ok?"var(--glow-g)":"var(--glow-r)",
                          animation:  ok?"blink 2s ease-in-out infinite":"none",
                        }}/>
                        <div className="svc-info">
                          <span className="svc-name">{name}</span>
                          <span className="svc-status" style={{color:ok?"var(--green)":"var(--red)"}}>
                        {ok?"● ONLINE":"○ OFFLINE"}
                      </span>
                        </div>
                      </div>
                  );
                })}
              </div>

              {history.length > 0 && (
                  <div style={{marginTop:16}}>
                    <div className="lbl" style={{marginBottom:8}}>session averages</div>
                    {[
                      { key:"cpu",  label:"CPU",  color:"var(--cyan)"   },
                      { key:"ram",  label:"RAM",  color:"var(--violet)" },
                      { key:"disk", label:"DISK", color:"var(--green)"  },
                    ].map(({ key, label, color }) => {
                      const a = avg(key);
                      return (
                          <div key={key} style={{marginBottom:9}}>
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--dim)',marginBottom:3}}>
                              <span>{label}</span>
                              <span style={{color}}>{a.toFixed(1)}%</span>
                            </div>
                            <div className="bar-track">
                              <div className="bar-fill" style={{
                                width:`${a}%`,
                                background:`linear-gradient(90deg,${color}66,${color})`,
                              }}/>
                            </div>
                          </div>
                      );
                    })}
                  </div>
              )}
            </div>
          </div>

        </div>
      </>
  );
}