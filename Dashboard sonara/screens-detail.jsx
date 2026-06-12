/* ============================================================
   SONARA — Détail campagne, vue par appel, notifications, placeholders
   ============================================================ */

/* ============ DÉTAIL CAMPAGNE (onglets G3) ============ */
function CampaignDetail({ camp, back, openCall }) {
  const D = window.SONARA;
  const [tab, setTab] = React.useState("overview");
  const pct = camp.total ? Math.round((camp.done / camp.total) * 100) : 0;

  const calls = D.summaries.concat(D.summaries.map((s, i) => ({ ...s, id: s.id + "-b", name: ["Yao Brou", "Awa Sylla", "Moussa Diarra", "Léa Konan"][i], when: "il y a " + (i + 1) + " h" })));

  const detKpis = [
    { label: "Appels traités", value: camp.done.toLocaleString("fr-FR"), sub: `objectif ${camp.total.toLocaleString("fr-FR")}`, icon: "phone", tone: "accent" },
    { label: "Taux de réponse", value: camp.rate + "%", sub: "moyenne 67%", icon: "activity", tone: "ok" },
    { label: "Note de satisfaction", value: "★ " + (camp.sentiment || 0).toFixed(1), sub: "sur 5", icon: "smile", tone: "violet" },
    { label: "Durée moy. d'appel", value: "2:38", sub: "min:sec", icon: "clock", tone: "warn" },
  ];
  const kt = { accent: "var(--accent)", ok: "var(--ok)", violet: "var(--violet)", warn: "var(--warn)" };
  const kb = { accent: "var(--accent-ghost)", ok: "var(--ok-ghost)", violet: "var(--violet-ghost)", warn: "var(--warn-ghost)" };

  return (
    <div className="content fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontSize: 13, color: "var(--ink-3)" }}>
        <span className="link-more" onClick={back} style={{ color: "var(--ink-3)" }}><Icon name="chevL" size={14} />Campagnes</span>
        <span style={{ color: "var(--ink-4)" }}>/</span>
        <span style={{ color: "var(--ink)" }}>{camp.name}</span>
      </div>

      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="mono-av" style={{ width: 52, height: 52, fontSize: 18, borderRadius: 14, background: `linear-gradient(145deg, ${camp.color}, color-mix(in oklch, ${camp.color}, black 30%))` }}>
            {camp.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="page-title" style={{ fontSize: 24 }}>{camp.name}</div>
              <StatusBadge status={camp.status} />
            </div>
            <div className="page-sub" style={{ marginTop: 4 }}>{camp.id} · {camp.sector} · {camp.client} · créée le {camp.created}</div>
          </div>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost"><Icon name="copy" size={15} />Dupliquer</button>
          {camp.status === "running"
            ? <button className="btn btn-ghost"><Icon name="pause" size={15} />Mettre en pause</button>
            : <button className="btn btn-primary"><Icon name="play" size={15} />Reprendre</button>}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        {[["overview", "Vue générale"], ["calls", "Appels"], ["contacts", "Contacts"], ["settings", "Paramètres"]].map(([k, l]) => (
          <div key={k} className={"tab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>{l}</div>
        ))}
      </div>

      {tab === "overview" && (
        <div className="fade-in">
          <div className="kpi-grid stagger" style={{ marginBottom: 20 }}>
            {detKpis.map((k, i) => (
              <div className="kpi" key={i}>
                <div className="kpi-top">
                  <div>
                    <div className="kpi-label">{k.label}</div>
                    <div className="kpi-val" style={{ fontSize: 26 }}>{k.value}</div>
                  </div>
                  <div className="kpi-ico" style={{ background: kb[k.tone], color: kt[k.tone] }}><Icon name={k.icon} size={18} /></div>
                </div>
                <div className="kpi-foot"><span className="muted">{k.sub}</span></div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-head"><h3><Icon name="activity" size={17} />Progression de la campagne</h3><span className="sub mono-num">{pct}%</span></div>
              <div className="card-pad">
                <div className="prog" style={{ marginBottom: 18 }}>
                  <div className="prog-bar" style={{ height: 10 }}><i style={{ width: pct + "%", background: `linear-gradient(90deg, color-mix(in oklch, ${camp.color}, black 20%), ${camp.color})` }} /></div>
                  <span className="prog-txt" style={{ fontSize: 13 }}>{camp.done.toLocaleString("fr-FR")} / {camp.total.toLocaleString("fr-FR")}</span>
                </div>
                <ActivityChart data={D.activity} />
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3><Icon name="sparkles" size={16} />Brief de l'IA</h3></div>
              <div className="card-pad">
                <div style={{ background: "var(--accent-ghost)", border: "1px solid var(--accent-ghost-2)", borderRadius: "var(--r)", padding: 16, fontSize: 13, lineHeight: 1.6, color: "var(--ink)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: "var(--accent-bright)", fontWeight: 600, fontSize: 12 }}>
                    <Icon name="headset" size={14} />Persona : Awa — enquêtrice
                  </div>
                  « Tu es Awa, chargée de relation client à la Banque Atlantique. Tu appelles {camp.client.toLowerCase()} pour recueillir leur avis sur l'accueil en agence et les services. Sois chaleureuse, parle un français ivoirien naturel, rebondis sur les remarques et propose l'app mobile si l'occasion se présente. »
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                  {[["Plage horaire", "08h – 20h"], ["Tentatives max", "3"], ["Durée max", "5 min"], ["Voix", "ElevenLabs · Féminine CI"]].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "calls" && (
        <div className="card fade-in">
          <div className="card-head">
            <h3><Icon name="list" size={17} />Appels traités</h3>
            <button className="btn btn-ghost btn-sm"><Icon name="download" size={14} />Export Excel</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Contact</th><th>Statut</th><th>Sentiment</th><th>Durée</th><th>Résumé</th><th>Quand</th><th></th></tr></thead>
              <tbody>
                {calls.map(c => (
                  <tr key={c.id} onClick={() => openCall(D.transcript)}>
                    <td><div className="cell-flex"><Avatar name={c.name} size={30} color={`linear-gradient(145deg, ${SENTI[c.sentiment].c}, color-mix(in oklch, ${SENTI[c.sentiment].c}, black 25%))`} /><span className="cell-strong">{c.name}</span></div></td>
                    <td><span className="badge ok"><Icon name="check" size={12} />Abouti</span></td>
                    <td><SentiBadge k={c.sentiment} /></td>
                    <td className="mono-num cell-muted">{fmtDur(c.dur)}</td>
                    <td style={{ maxWidth: 360, color: "var(--ink-2)", fontSize: 12.5 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.text}</div></td>
                    <td className="cell-muted" style={{ fontSize: 12.5 }}>{c.when}</td>
                    <td><span className="link-more">Écouter <Icon name="play" size={12} /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "contacts" && <ContactsTable inline />}
      {tab === "settings" && (
        <div className="card fade-in card-pad">
          <div className="empty"><Icon name="settings" size={28} /><div style={{ marginTop: 10 }}>Paramètres de la campagne — programmation, règles d'appel, liste noire, équipe assignée.</div></div>
        </div>
      )}
    </div>
  );
}

/* ============ VUE PAR APPEL (modal transcription — G4) ============ */
function CallModal({ data, close }) {
  if (!data) return null;
  const D = window.SONARA;
  const s = SENTI[data.sentiment];
  return (
    <div className="modal-scrim" onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <Avatar name={data.name} size={42} color={`linear-gradient(145deg, ${s.c}, color-mix(in oklch, ${s.c}, black 25%))`} />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>{data.name}</div>
              <div className="mono-num" style={{ fontSize: 12, color: "var(--ink-4)" }}>{data.callId} · {data.phone}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn btn-ghost btn-sm"><Icon name="download" size={14} />Export</button>
            <div className="icon-btn" onClick={close} style={{ width: 36, height: 36 }}><Icon name="x" size={17} /></div>
          </div>
        </div>

        <div className="modal-body">
          {/* méta + lecteur */}
          <div style={{ display: "flex", gap: 10, padding: "16px 22px", flexWrap: "wrap", borderBottom: "1px solid var(--line)" }}>
            <span className="badge ok"><Icon name="check" size={12} />Abouti</span>
            <SentiBadge k={data.sentiment} />
            <span className="badge violet"><Icon name="smile" size={12} />Note {data.rate}</span>
            <span className="badge paused"><Icon name="megaphone" size={12} />{data.campaign}</span>
            <span className="badge paused"><Icon name="clock" size={12} />{fmtDur(data.dur)}</span>
            <span className="badge paused"><Icon name="calendar" size={12} />{data.date}</span>
          </div>

          {/* lecteur audio simulé */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", background: "var(--panel-2)", borderBottom: "1px solid var(--line)" }}>
            <div className="icon-btn" style={{ background: "var(--accent)", color: "var(--accent-ink)", border: "none", width: 40, height: 40 }}><Icon name="play" size={18} /></div>
            <Wave bars={40} />
            <span className="mono-num" style={{ fontSize: 12, color: "var(--ink-3)" }}>0:00 / {fmtDur(data.dur)}</span>
          </div>

          {/* résumé IA */}
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, color: "var(--accent-bright)", fontWeight: 600, fontSize: 12.5 }}>
              <Icon name="sparkles" size={15} />Résumé automatique
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)" }}>{data.summary}</div>
          </div>

          {/* transcription */}
          <div style={{ padding: "8px 22px 4px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 600 }}>Transcription complète</div>
          <div className="transcript">
            {data.turns.map((t, i) => (
              <div key={i} className={"turn " + t.who}>
                <div className="who">{t.who === "ai" ? "AI" : data.name[0]}</div>
                <div>
                  <div className="turn-name">{t.name}</div>
                  <div className="bubble">{t.t}</div>
                  <div className="turn-meta">{t.at}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Contacts (table simple) ============ */
function ContactsTable({ inline }) {
  const D = window.SONARA;
  const contacts = [
    { name: "Kouadio Yao", phone: "+225 07 48 22 12", status: "appelé", sentiment: "pos", attempts: 1 },
    { name: "Mariam Touré", phone: "+225 05 06 77 90", status: "à appeler", sentiment: null, attempts: 0 },
    { name: "Ibrahim Bamba", phone: "+225 01 22 39 04", status: "appelé", sentiment: "pos", attempts: 1 },
    { name: "Aya N'Guessan", phone: "+225 07 77 04 33", status: "transfert", sentiment: "neg", attempts: 2 },
    { name: "Seydou Coulibaly", phone: "+225 05 41 88 17", status: "sans réponse", sentiment: null, attempts: 3 },
    { name: "Fatou Diabaté", phone: "+225 07 12 55 80", status: "liste noire", sentiment: null, attempts: 0 },
    { name: "Adama Ouattara", phone: "+225 05 90 31 24", status: "appelé", sentiment: "pos", attempts: 1 },
    { name: "Grace Aka", phone: "+225 01 67 42 09", status: "à appeler", sentiment: null, attempts: 0 },
  ];
  const stMap = {
    "appelé": "ok", "à appeler": "info", "transfert": "warn", "sans réponse": "paused", "liste noire": "danger",
  };
  const body = (
    <div style={{ overflowX: "auto" }}>
      <table className="tbl">
        <thead><tr><th>Nom</th><th>Numéro</th><th>Statut</th><th>Tentatives</th><th>Sentiment</th><th></th></tr></thead>
        <tbody>
          {contacts.map((c, i) => (
            <tr key={i}>
              <td><div className="cell-flex"><Avatar name={c.name} size={30} /><span className="cell-strong">{c.name}</span></div></td>
              <td className="mono-num cell-muted">{c.phone}</td>
              <td><span className={"badge " + stMap[c.status]}>{c.status === "liste noire" && <Icon name="ban" size={12} />}{c.status}</span></td>
              <td className="mono-num cell-muted">{c.attempts}/3</td>
              <td>{c.sentiment ? <SentiBadge k={c.sentiment} /> : <span className="cell-muted">—</span>}</td>
              <td><span className="link-more"><Icon name="more" size={16} /></span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  if (inline) return <div className="card fade-in">
    <div className="card-head"><h3><Icon name="users" size={17} />Contacts de la campagne</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-ghost btn-sm"><Icon name="csv" size={14} />Modèle CSV</button>
        <button className="btn btn-ghost btn-sm"><Icon name="upload" size={14} />Importer</button>
      </div>
    </div>{body}</div>;
  return body;
}

/* ============ Notifications (panneau) ============ */
function NotifPanel({ open, close }) {
  const D = window.SONARA;
  if (!open) return null;
  const ico = { done: { i: "check", c: "var(--ok)", b: "var(--ok-ghost)" }, transfer: { i: "forward", c: "var(--warn)", b: "var(--warn-ghost)" }, warn: { i: "alert", c: "var(--danger)", b: "var(--danger-ghost)" } };
  return (
    <div className="modal-scrim" style={{ alignItems: "flex-start", justifyContent: "flex-end", padding: 0 }} onClick={close}>
      <div onClick={e => e.stopPropagation()} className="card" style={{ width: 380, height: "100vh", borderRadius: 0, borderRight: "none", borderTop: "none", animation: "none", display: "flex", flexDirection: "column" }}>
        <div className="card-head"><h3><Icon name="bell" size={16} />Notifications</h3><div className="icon-btn" onClick={close} style={{ width: 34, height: 34 }}><Icon name="x" size={16} /></div></div>
        <div style={{ overflowY: "auto" }}>
          {D.notifications.map(n => {
            const t = ico[n.type];
            return (
              <div key={n.id} className="sum-item">
                <div className="kpi-ico" style={{ width: 34, height: 34, background: t.b, color: t.c, flex: "none" }}><Icon name={t.i} size={16} /></div>
                <div className="sum-body">
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 3, lineHeight: 1.5 }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 6 }}>{n.when}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============ Placeholder pour écrans non détaillés ============ */
function Placeholder({ route }) {
  const map = {
    contacts: ["users", "Contacts", "Importez vos listes (CSV), normalisez les numéros ivoiriens, gérez les statuts et la liste noire."],
    calls: ["list", "Appels & résultats", "Tous les appels traités, leurs transcriptions, résumés IA et exports Excel/CSV."],
    stats: ["chart", "Statistiques", "Tendances d'appels, taux de réponse, performances par campagne et par secteur."],
    sentiment: ["smile", "Sentiment", "Analyse de sentiment et intentions détectées sur l'ensemble des conversations."],
    billing: ["card", "Facturation", "Forfait Business, crédits d'appels, factures et paiement (Wave CI, virement)."],
    team: ["user", "Équipe", "Invitez vos collaborateurs, gérez les rôles et les accès au dashboard."],
    settings: ["settings", "Paramètres", "Voix de l'IA, numéros d'appel, plages horaires, conformité ARTCI."],
    help: ["help", "Centre d'aide", "Guides, FAQ et bonnes pratiques pour vos campagnes vocales."],
    contact: ["headset", "Contacter Sonara", "Notre équipe à Abidjan est joignable pour vous accompagner."],
  };
  const [icon, title, sub] = map[route] || ["home", "Bientôt", ""];
  if (route === "contacts") return <div className="content fade-in"><div className="page-head"><div><div className="page-title">Contacts</div><div className="page-sub">Listes importées et statuts d'appel.</div></div><div className="head-actions"><button className="btn btn-ghost"><Icon name="csv" size={16} />Modèle CSV</button><button className="btn btn-primary"><Icon name="upload" size={16} />Importer un CSV</button></div></div><ContactsTable inline /></div>;
  return (
    <div className="content fade-in">
      <div className="page-head"><div><div className="page-title">{title}</div><div className="page-sub">{sub}</div></div></div>
      <div className="card card-pad"><div className="empty" style={{ padding: 80 }}>
        <div className="kpi-ico" style={{ width: 56, height: 56, margin: "0 auto 16px", background: "var(--accent-ghost)", color: "var(--accent)" }}><Icon name={icon} size={26} /></div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--ink-2)", fontWeight: 600 }}>{title}</div>
        <div style={{ marginTop: 8, maxWidth: 420, margin: "8px auto 0" }}>{sub}</div>
        <div style={{ marginTop: 18 }}><span className="badge run"><Icon name="sparkles" size={12} />Module P1 · prévu MVP</span></div>
      </div></div>
    </div>
  );
}

Object.assign(window, { CampaignDetail, CallModal, ContactsTable, NotifPanel, Placeholder });
