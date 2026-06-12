/* ============================================================
   SONARA — Écrans (Accueil, Campagnes, Détail, Vue appel)
   ============================================================ */

/* ============ ACCUEIL (page d'atterrissage) ============ */
function HomeScreen({ goCampaign, openCall, setRoute }) {
  const D = window.SONARA;
  const [live, setLive] = React.useState(D.liveCalls);

  // Faire avancer les durées d'appel en direct (effet "temps réel")
  React.useEffect(() => {
    const t = setInterval(() => {
      setLive(prev => prev.map(c => c.state === "transfer" ? c : { ...c, dur: c.dur + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const kpiIcoTone = { accent: "var(--accent)", ok: "var(--ok)", violet: "var(--violet)", warn: "var(--warn)" };
  const kpiIcoBg = { accent: "var(--accent-ghost)", ok: "var(--ok-ghost)", violet: "var(--violet-ghost)", warn: "var(--warn-ghost)" };

  return (
    <div className="content fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Bonjour, Awa 👋</div>
          <div className="page-sub">Voici ce qui se passe sur vos campagnes en ce moment — mardi 7 juin, 14h32.</div>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={() => setRoute("contacts")}><Icon name="upload" size={16} />Importer des contacts</button>
          <button className="btn btn-primary"><Icon name="plus" size={16} />Nouvelle campagne</button>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-grid stagger">
        {D.kpis.map(k => (
          <div className="kpi" key={k.id}>
            <div className="kpi-top">
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-val">{k.value}{k.suffix && <small>{k.suffix}</small>}</div>
              </div>
              <div className="kpi-ico" style={{ background: kpiIcoBg[k.tone], color: kpiIcoTone[k.tone] }}>
                <Icon name={k.icon} size={19} />
              </div>
            </div>
            <div className="kpi-foot">
              <Delta value={k.delta} dir={k.dir} />
              <span className="muted">{k.foot}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live + Sentiment */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3><span className="live-head-badge"><span className="live-dot" />EN DIRECT</span> Appels en cours</h3>
              <div className="sub">{live.length} conversations IA actives · pilotées par Awa & Koffi</div>
            </div>
            <span className="link-more" onClick={() => setRoute("calls")}>Tout voir <Icon name="arrowR" size={14} /></span>
          </div>
          <div>
            {live.map(c => (
              <div className="live-row" key={c.id} onClick={() => openCall(D.transcript)}>
                <Wave paused={c.state === "transfer"} bars={14} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="cell-strong">{c.name}</span>
                    <span className="mono-num" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>{c.phone}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>{c.campaign}</div>
                </div>
                {c.state === "transfer"
                  ? <span className="badge warn"><Icon name="forward" size={12} />Transfert demandé</span>
                  : <SentiBadge k={c.sentiment} />}
                <span className="mono-num" style={{ width: 52, textAlign: "right", color: "var(--ink-2)", fontSize: 13 }}>{fmtDur(c.dur)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3><Icon name="smile" size={17} />Sentiment global</h3>
            <span className="sub">7 jours</span>
          </div>
          <SentimentDonut data={D.sentiment} />
          <div className="divider" />
          <div className="card-pad" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="kpi-ico" style={{ background: "var(--ok-ghost)", color: "var(--ok)", width: 34, height: 34 }}><Icon name="trend" size={16} /></div>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>
              Le sentiment positif a progressé de <b style={{ color: "var(--ok)" }}>+6 pts</b> depuis la semaine dernière.
            </div>
          </div>
        </div>
      </div>

      {/* Activité + Résumés */}
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3><Icon name="activity" size={17} />Activité d'appel aujourd'hui</h3>
              <div className="sub">1 284 appels lancés · 67% de taux de réponse</div>
            </div>
            <div className="seg">
              <button className="on">Aujourd'hui</button>
              <button>7 jours</button>
              <button>30 jours</button>
            </div>
          </div>
          <ActivityChart data={D.activity} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3><Icon name="sparkles" size={16} />Derniers résumés IA</h3>
              <div className="sub">Générés automatiquement après chaque appel</div>
            </div>
            <span className="link-more" onClick={() => setRoute("calls")}>Voir tout <Icon name="arrowR" size={14} /></span>
          </div>
          <div className="sum-list">
            {D.summaries.map(s => (
              <div className="sum-item" key={s.id} onClick={() => openCall(D.transcript)}>
                <Avatar name={s.name} size={36} color={`linear-gradient(145deg, ${SENTI[s.sentiment].c}, color-mix(in oklch, ${SENTI[s.sentiment].c}, black 25%))`} />
                <div className="sum-body">
                  <div className="sum-top">
                    <span className="sum-name">{s.name}</span>
                    <SentiBadge k={s.sentiment} />
                    <span className="sum-camp" style={{ marginLeft: "auto" }}>{s.when}</span>
                  </div>
                  <div className="sum-text">{s.text}</div>
                  <div className="sum-meta">
                    <span className="sector-chip"><Icon name="megaphone" size={12} />{s.campaign}</span>
                    <span className="mono-num"><Icon name="clock" size={11} /> {fmtDur(s.dur)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campagnes actives */}
      <div className="card">
        <div className="card-head">
          <div>
            <h3><Icon name="megaphone" size={17} />Vos campagnes</h3>
            <div className="sub">5 actives · 2 terminées récemment</div>
          </div>
          <span className="link-more" onClick={() => setRoute("campaigns")}>Gérer les campagnes <Icon name="arrowR" size={14} /></span>
        </div>
        <CampaignTable rows={D.campaigns.slice(0, 5)} goCampaign={goCampaign} compact />
      </div>
    </div>
  );
}

/* ============ Tableau de campagnes (réutilisable) ============ */
function CampaignTable({ rows, goCampaign, compact }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Campagne</th>
            <th>Secteur</th>
            <th>Statut</th>
            <th style={{ minWidth: 150 }}>Progression</th>
            <th>Réponse</th>
            {!compact && <th>Sentiment</th>}
            <th>Maj</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(c => (
            <tr key={c.id} onClick={() => goCampaign(c)}>
              <td>
                <div className="cell-flex">
                  <div className="mono-av" style={{ width: 30, height: 30, fontSize: 11, background: `linear-gradient(145deg, ${c.color}, color-mix(in oklch, ${c.color}, black 28%))` }}>
                    {c.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
                  </div>
                  <div>
                    <div className="cell-strong">{c.name}</div>
                    <div className="mono-num" style={{ fontSize: 11, color: "var(--ink-4)" }}>{c.id} · {c.client}</div>
                  </div>
                </div>
              </td>
              <td><span className="sector-chip"><span className="bdot" style={{ width: 8, height: 8, borderRadius: 99, background: c.color, display: "inline-block" }} />{c.sector}</span></td>
              <td><StatusBadge status={c.status} /></td>
              <td>
                <div className="prog">
                  <div className="prog-bar"><i style={{ width: `${(c.done / c.total) * 100}%`, background: `linear-gradient(90deg, color-mix(in oklch, ${c.color}, black 20%), ${c.color})` }} /></div>
                  <span className="prog-txt">{(c.done / 1000).toFixed(1)}k/{(c.total / 1000).toFixed(1)}k</span>
                </div>
              </td>
              <td className="mono-num cell-muted">{c.rate ? c.rate + "%" : "—"}</td>
              {!compact && <td>{c.sentiment ? <span className="mono-num cell-muted">★ {c.sentiment.toFixed(1)}</span> : <span className="cell-muted">—</span>}</td>}
              <td className="cell-muted" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{c.updated}</td>
              <td><span className="link-more">Détails <Icon name="arrowR" size={13} /></span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============ CAMPAGNES (liste) ============ */
function CampaignsScreen({ goCampaign }) {
  const D = window.SONARA;
  const [filter, setFilter] = React.useState("all");
  const counts = {
    all: D.campaigns.length,
    running: D.campaigns.filter(c => c.status === "running").length,
    paused: D.campaigns.filter(c => c.status === "paused").length,
    scheduled: D.campaigns.filter(c => c.status === "scheduled").length,
    done: D.campaigns.filter(c => c.status === "done").length,
  };
  const rows = filter === "all" ? D.campaigns : D.campaigns.filter(c => c.status === filter);

  const tabs = [
    ["all", "Toutes"], ["running", "En cours"], ["paused", "En pause"], ["scheduled", "Programmées"], ["done", "Terminées"],
  ];

  return (
    <div className="content fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Campagnes</div>
          <div className="page-sub">Créez, programmez et suivez vos enquêtes vocales automatisées.</div>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost"><Icon name="download" size={16} />Exporter</button>
          <button className="btn btn-primary"><Icon name="plus" size={16} />Nouvelle campagne</button>
        </div>
      </div>

      <div className="filters">
        <div className="tabs">
          {tabs.map(([k, l]) => (
            <div key={k} className={"tab" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>
              {l} <span style={{ opacity: 0.6, fontFamily: "var(--font-mono)", fontSize: 11 }}>{counts[k]}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="select"><Icon name="filter" size={14} />Secteur <Icon name="chevD" size={13} /></div>
        <div className="select"><Icon name="sort" size={14} />Récentes <Icon name="chevD" size={13} /></div>
      </div>

      <div className="card">
        <CampaignTable rows={rows} goCampaign={goCampaign} />
      </div>
    </div>
  );
}

window.CampaignTable = CampaignTable;
window.HomeScreen = HomeScreen;
window.CampaignsScreen = CampaignsScreen;
