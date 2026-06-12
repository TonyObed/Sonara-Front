/* ============================================================
   SONARA — Composants partagés (icônes, sidebar, topbar, charts)
   ============================================================ */

/* ---------- Icônes (style ligne, simples) ---------- */
const ICONS = {
  phone: "M3 5.5C3 14.06 9.94 21 18.5 21a2 2 0 0 0 2-1.72l.3-2.1a1.5 1.5 0 0 0-.9-1.6l-3.3-1.4a1.5 1.5 0 0 0-1.7.4l-1 1.2a13.5 13.5 0 0 1-5.4-5.4l1.2-1a1.5 1.5 0 0 0 .4-1.7L7.9 4.8a1.5 1.5 0 0 0-1.6-.9l-2.1.3A2 2 0 0 0 3 5.5Z",
  activity: "M3 12h3l3 8 5-16 3 8h4",
  layers: "M12 3 3 8l9 5 9-5-9-5ZM3 14l9 5 9-5M3 11l9 5 9-5",
  wallet: "M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2V7ZM3 9h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Zm13 4h2",
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.3-4.3",
  bell: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 20a2 2 0 0 0 4 0",
  sun: "M12 4V2M12 22v-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M4 12H2M22 12h-2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  chevL: "M15 18l-6-6 6-6", chevR: "M9 18l6-6-6-6",
  chevD: "M6 9l6 6 6-6",
  home: "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5",
  megaphone: "M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1ZM18 9a3 3 0 0 1 0 6",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 19v-1a4 4 0 0 0-3-3.8M16 4.2a3.5 3.5 0 0 1 0 6.6",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  chart: "M3 3v18h18M8 14v4M13 9v9M18 5v13",
  smile: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01",
  card: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM3 10h18",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 .9-1.4V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5.9Z",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.2 9a3 3 0 0 1 5.6 1c0 2-3 2.5-3 4M12 17h.01",
  headset: "M4 13v-1a8 8 0 0 1 16 0v1M4 13a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1v-5H4ZM20 13a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1v-5h1ZM20 18v1a3 3 0 0 1-3 3h-3",
  plus: "M12 5v14M5 12h14",
  upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
  download: "M12 4v12M7 11l5 5 5-5M5 20h14",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  play: "M7 4v16l13-8z", pause: "M8 5h3v14H8zM13 5h3v14h-3z",
  stop: "M6 6h12v12H6z",
  up: "M12 19V5M6 11l6-6 6 6", down: "M12 5v14M6 13l6 6 6-6",
  arrowR: "M5 12h14M13 6l6 6-6 6",
  check: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 12l2.5 2.5 4.5-5",
  alert: "M10.3 4.3 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
  forward: "M15 17l5-5-5-5M20 12H9a5 5 0 0 0-5 5v1",
  x: "M6 6l12 12M18 6 6 18",
  sparkles: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z",
  filter: "M3 5h18l-7 8v5l-4 2v-7L3 5Z",
  sort: "M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l3 3M17 20l-3-3",
  csv: "M14 3v5h5M7 3h8l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9 13h6M9 17h6",
  wave: "M4 12h2M8 7v10M12 4v16M16 8v8M20 11v2",
  dot: "M12 12h.01",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  calendar: "M3 9h18M7 3v3M17 3v3M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  trend: "M3 17l6-6 4 4 8-8M21 7v5h-5",
  copy: "M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h-2ZM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  ban: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM5.6 5.6l12.8 12.8",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1",
};

function Icon({ name, size }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" width={size || 18} height={size || 18} fill="none"
         stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

/* ---------- Helpers ---------- */
const fmtDur = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const SENTI = {
  pos: { c: "var(--ok)", bg: "var(--ok-ghost)", label: "Positif" },
  neu: { c: "var(--info)", bg: "var(--info-ghost)", label: "Neutre" },
  neg: { c: "var(--danger)", bg: "var(--danger-ghost)", label: "Négatif" },
};
const STATUS = {
  running: { cls: "run", label: "En cours", icon: "play" },
  paused: { cls: "paused", label: "En pause", icon: "pause" },
  scheduled: { cls: "info", label: "Programmée", icon: "clock" },
  done: { cls: "ok", label: "Terminée", icon: "check" },
};

function Avatar({ name, color, size }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const bg = color || "linear-gradient(145deg, var(--accent-bright), var(--accent-dim))";
  return <div className="mono-av" style={{ width: size, height: size, background: bg }}>{initials}</div>;
}

function Wave({ paused, bars, color }) {
  const n = bars || 18;
  return (
    <div className={"wave" + (paused ? " paused" : "")}>
      {Array.from({ length: n }).map((_, i) => (
        <i key={i} style={{
          height: `${30 + Math.abs(Math.sin(i * 1.7)) * 60}%`,
          animationDelay: `${(i % 6) * 0.11}s`,
          background: color || undefined,
        }} />
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.running;
  return <span className={"badge " + s.cls}><Icon name={s.icon} size={12} />{s.label}</span>;
}

function SentiBadge({ k }) {
  const s = SENTI[k] || SENTI.neu;
  return <span className="badge" style={{ color: s.c, background: s.bg }}><span className="bdot" style={{ background: s.c }} />{s.label}</span>;
}

function Delta({ value, dir }) {
  if (dir === "flat" || value === 0) return <span className="delta flat">—</span>;
  return (
    <span className={"delta " + (dir === "up" ? "up" : "down")}>
      <Icon name={dir === "up" ? "up" : "down"} size={12} />{Math.abs(value)}%
    </span>
  );
}

/* ---------- Sidebar ---------- */
const NAV = [
  { group: "Principal", items: [
    { id: "home", icon: "home", label: "Accueil" },
    { id: "campaigns", icon: "megaphone", label: "Campagnes", badge: 5 },
    { id: "contacts", icon: "users", label: "Contacts" },
    { id: "calls", icon: "list", label: "Appels & résultats" },
  ]},
  { group: "Analyse", items: [
    { id: "stats", icon: "chart", label: "Statistiques" },
    { id: "sentiment", icon: "smile", label: "Sentiment" },
  ]},
  { group: "Compte", items: [
    { id: "billing", icon: "card", label: "Facturation" },
    { id: "team", icon: "user", label: "Équipe" },
    { id: "settings", icon: "settings", label: "Paramètres" },
  ]},
  { group: "Support", items: [
    { id: "help", icon: "help", label: "Centre d'aide" },
    { id: "contact", icon: "headset", label: "Contacter Sonara" },
  ]},
];

function Sidebar({ route, setRoute, collapsed }) {
  const D = window.SONARA;
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Logo size={20} /></div>
        <div>
          <div className="brand-word"><b>Sonara</b></div>
          <div className="brand-sub">L'oreille que vous n'aviez pas</div>
        </div>
      </div>

      <div style={{ overflowY: "auto", overflowX: "hidden", flex: 1, margin: "0 -4px", padding: "0 4px" }}>
        {NAV.map(g => (
          <div className="nav-group" key={g.group}>
            <div className="nav-label">{g.group}</div>
            {g.items.map(it => (
              <div key={it.id}
                   className={"nav-item" + (route === it.id ? " active" : "")}
                   onClick={() => setRoute(it.id)}
                   title={it.label}>
                <Icon name={it.icon} />
                <span>{it.label}</span>
                {it.badge && <span className="badge-count">{it.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="side-foot">
        <div className="credit-card">
          <div className="credit-top">
            <span className="side-foot-txt" style={{ fontSize: 12, color: "var(--ink-3)" }}>Crédit d'appels</span>
            <b>6 410 <span style={{ color: "var(--ink-4)", fontWeight: 400 }}>/ 10k</span></b>
          </div>
          <div className="credit-bar"><i style={{ width: "64%" }} /></div>
          <button className="btn btn-primary btn-sm" style={{ justifyContent: "center" }}>
            <Icon name="plus" size={14} />Recharger
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Logo mark (onde sonore, formes simples) ---------- */
function Logo({ size }) {
  const s = size || 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="var(--accent-ink)" strokeWidth="2.1" strokeLinecap="round">
      <path d="M5 10v4" /><path d="M9.2 6.5v11" /><path d="M13.4 9v6" /><path d="M17.6 4.5v15" />
    </svg>
  );
}

/* ---------- Topbar ---------- */
function Topbar({ collapsed, setCollapsed, theme, setTheme, openNotif }) {
  const D = window.SONARA;
  return (
    <div className="topbar">
      <div className="collapse-btn" onClick={() => setCollapsed(c => !c)} title="Réduire le menu">
        <Icon name={collapsed ? "chevR" : "chevL"} size={18} />
      </div>
      <div className="search">
        <Icon name="search" size={17} />
        <input placeholder="Rechercher une campagne, un contact, un appel…" />
        <kbd>⌘K</kbd>
      </div>
      <div className="topbar-spacer" />
      <div className="select" style={{ height: 38 }}>
        <Icon name="clock" size={14} />
        <span>Plage d'appel · 08h–20h</span>
      </div>
      <div className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Thème">
        <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
      </div>
      <div className="icon-btn" onClick={openNotif} title="Notifications">
        <Icon name="bell" size={18} /><span className="dot" />
      </div>
      <div className="user-chip">
        <Avatar name={D.company.user} size={30} />
        <div className="user-meta">
          <b>{D.company.user}</b>
          <span>{D.company.name}</span>
        </div>
        <Icon name="chevD" size={15} />
      </div>
    </div>
  );
}

/* ---------- Activity bar chart ---------- */
function ActivityChart({ data }) {
  const max = Math.max(...data.map(d => d.a + d.m));
  return (
    <div>
      <div className="chart-legend">
        <div className="leg"><i style={{ background: "var(--accent)" }} />Appels aboutis</div>
        <div className="leg"><i style={{ background: "oklch(1 0 0 / 0.14)" }} />Sans réponse</div>
      </div>
      <div className="chart-wrap" style={{ paddingTop: 4 }}>
        <div className="bars">
          {data.map((d, i) => (
            <div className="bar-col" key={i} title={`${d.x} · ${d.a} aboutis, ${d.m} sans réponse`}>
              <div className="bar-stack" style={{ height: `${((d.a + d.m) / max) * 100}%` }}>
                <div className="bar-seg missed" style={{ height: `${(d.m / (d.a + d.m)) * 100}%` }} />
                <div className="bar-seg answered" style={{ height: `${(d.a / (d.a + d.m)) * 100}%` }} />
              </div>
              <div className="bar-x">{d.x}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Sentiment donut ---------- */
function SentimentDonut({ data }) {
  let acc = 0;
  const stops = data.map(d => {
    const start = acc; acc += d.v;
    return `${d.c} ${start}% ${acc}%`;
  }).join(", ");
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
        <div style={{ position: "absolute", inset: 13, borderRadius: "99px", background: "var(--panel)" }} />
        <div className="donut-center">
          <b>4,1</b><span>Note moy.</span>
        </div>
      </div>
      <div className="senti-legend">
        {data.map(d => (
          <div className="senti-row" key={d.k}>
            <i style={{ background: d.c }} />{d.k}<b>{d.v}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, Avatar, Wave, StatusBadge, SentiBadge, Delta, Sidebar, Topbar, Logo,
  ActivityChart, SentimentDonut, fmtDur, SENTI, STATUS, NAV,
});
