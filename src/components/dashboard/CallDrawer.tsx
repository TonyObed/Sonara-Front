"use client";

import { CALLS, TRANSCRIPT_FULL, CALL_STATUS } from "@/lib/sonara-data";

interface CallDrawerProps {
  callId: number | null;
  onClose: () => void;
}

export function CallDrawer({ callId, onClose }: CallDrawerProps) {
  const ac = CALLS.find((c) => c.id === callId);

  if (!ac) return null;

  const initials = ac.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const shortTranscript = [
    { ai: true, time: "00:02", text: `Bonjour, est-ce que je parle bien à ${ac.name} ?` },
    { ai: false, time: "00:05", text: "Oui, c'est moi." },
    { ai: true, time: "00:08", text: "Je suis Awa, j'appelle de la part de Banque Horizon pour un court sondage sur votre expérience en agence. Ça prend trois minutes — vous avez un moment ?" },
    { ai: false, time: "00:17", text: "D'accord, on peut faire ça." },
  ];

  const rawTranscript = ac.id === 1 ? TRANSCRIPT_FULL : shortTranscript;

  const transcript = rawTranscript.map((t) => ({
    isAi: t.ai,
    who: t.ai ? "AWA · IA" : "CLIENT",
    time: t.time,
    text: t.text,
    align: t.ai ? ("flex-start" as const) : ("flex-end" as const),
    bg: t.ai ? "rgba(0,82,255,.1)" : "var(--sn-bubble)",
    bd: t.ai ? "rgba(0,82,255,.28)" : "var(--sn-w07)",
    radius: t.ai ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
  }));

  const actionStyles = {
    ok: { c: "var(--sn-green)", bg: "rgba(43,213,118,.09)", bd: "rgba(43,213,118,.3)" },
    warn: { c: "var(--sn-amber)", bg: "rgba(255,176,46,.09)", bd: "rgba(255,176,46,.3)" },
    alert: { c: "var(--sn-red)", bg: "rgba(255,92,92,.09)", bd: "rgba(255,92,92,.3)" },
  };

  const as = actionStyles[ac.actionKind || "ok"];

  // Render static wave bars representing an audio track
  const audioBars = Array.from({ length: 44 }, (_, i) => {
    const v = Math.abs(Math.sin(i * 1.7) * Math.sin(i * 0.43 + 2));
    return {
      h: `${Math.round(5 + v * 26)}px`,
      c: i < 17 ? "linear-gradient(180deg,#0052FF,#00D4A6)" : "var(--sn-w16)",
    };
  });

  return (
    <>
      {/* Scrim background */}
      <div
        onClick={onClose}
        style={{
          display: "block",
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.55)",
          zIndex: 60,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <aside
        id="sn-drawer"
        data-screen-label="Détail appel — transcription"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "480px",
          maxWidth: "100vw",
          background: "var(--sn-drawer)",
          borderLeft: "1px solid var(--sn-w08)",
          zIndex: 61,
          transform: "translateX(0)",
          transition: "transform .32s cubic-bezier(.3,.8,.3,1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-30px 0 60px rgba(0,0,0,.45)",
        }}
      >
        <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--sn-w07)", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              minWidth: 42,
              borderRadius: "10px",
              background: "rgba(0,82,255,.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--sn-blue3)",
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "16.5px", fontWeight: 700 }}>{ac.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--sn-w45)", marginTop: 4 }}>
              {ac.phone} · {ac.city.toUpperCase()} · 10 JUIN, {ac.time}
            </div>
          </div>
          <button
            onClick={onClose}
            className="sn-hover-w05"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "var(--sn-panel2)",
              border: "1px solid var(--sn-w09)",
              color: "var(--sn-w7)",
              cursor: "pointer",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18"></path>
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--sn-w65)", background: "var(--sn-panel2)", border: "1px solid var(--sn-w08)", padding: "6px 11px", borderRadius: 16 }}>
              ⏱ {ac.dur}
            </span>
            {ac.sent !== null && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--sn-green)", background: "rgba(43,213,118,.09)", border: "1px solid rgba(43,213,118,.25)", padding: "6px 11px", borderRadius: 16 }}>
                SENTIMENT {ac.sent.toFixed(1)}/10
              </span>
            )}
            {ac.mood && (
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--sn-w65)", background: "var(--sn-panel2)", border: "1px solid var(--sn-w08)", padding: "6px 11px", borderRadius: 16 }}>
                {ac.mood}
              </span>
            )}
          </div>

          <div style={{ background: "var(--sn-panel2)", border: "1px solid var(--sn-w07)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <button
              className="sn-hover-btn-primary"
              style={{
                width: 38,
                height: 38,
                minWidth: 38,
                borderRadius: "50%",
                background: "#0052FF",
                border: "none",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4.5v15l13-7.5L7 4.5z"></path>
              </svg>
            </button>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "2.5px", height: 34 }}>
              {audioBars.map((b, i) => (
                <span key={i} style={{ flex: 1, height: b.h, background: b.c, borderRadius: 2 }}></span>
              ))}
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w5)" }}>{ac.dur}</span>
          </div>

          {ac.summary && (
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: ".14em", color: "var(--sn-w42)" }}>RÉSUMÉ IA</div>
              <div style={{ marginTop: 9, background: "rgba(0,82,255,.07)", border: "1px solid rgba(0,82,255,.22)", borderRadius: 13, padding: "15px 17px", fontSize: "13.5px", lineHeight: 1.6, color: "var(--sn-w85)" }}>
                {ac.summary}
              </div>
            </div>
          )}

          {ac.action && (
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: ".14em", color: "var(--sn-w42)" }}>ACTION RECOMMANDÉE</div>
              <div style={{ marginTop: 9, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: as.c, background: as.bg, border: `1px solid ${as.bd}`, padding: "9px 14px", borderRadius: 11 }}>
                {ac.action}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: ".14em", color: "var(--sn-w42)", marginBottom: 12 }}>TRANSCRIPTION</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {transcript.map((t, index) => (
                <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: t.align, gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {t.isAi && (
                      <img src="/assets/ear-dark.png" alt="" style={{ width: 20, height: 20, borderRadius: 6, display: "none" }} />
                    )}
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: ".1em", color: "var(--sn-w4)" }}>
                      {t.who} · {t.time}
                    </span>
                  </div>
                  <div style={{ maxWidth: "82%", background: t.bg, border: `1px solid ${t.bd}`, borderRadius: t.radius, padding: "11px 14px", fontSize: "13.5px", lineHeight: 1.55, color: "var(--sn-w88)" }}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
