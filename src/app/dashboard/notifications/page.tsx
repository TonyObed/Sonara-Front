"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "../DashboardContext";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifFilter,
    setNotifFilter,
  } = useDashboard();
  const [notifications, setNotifications] = useState<Array<{ id: string; group: string; kind: "ok" | "warn" | "alert" | "info"; title: string; desc: string; time: string; target: string | null }>>([]);
  const [notifUnread, setNotifUnread] = useState<string[]>([]);
  const markRead = (ids: string[]) => fetch("/api/notifications", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }).catch(() => {});
  useEffect(() => { let mounted = true; fetch("/api/notifications", { credentials: "include" }).then((r) => r.json()).then((payload) => { if (!mounted || !payload.success) return; const rows = payload.data.map((item: { id: string; type: string; title: string; message: string; readAt: string | null; createdAt: string }) => { const text = `${item.title} ${item.message}`.toLowerCase(); const target = text.includes("rapport") ? "reports" : item.type === "CALL" ? "campaigns" : item.type === "CREDIT" ? "billing" : item.type === "SECURITY" ? "settings" : null; return { id: item.id, group: new Date(item.createdAt).toLocaleDateString("fr-FR"), kind: item.type === "CREDIT" ? "warn" : item.type === "SECURITY" ? "alert" : item.type === "CALL" ? "ok" : "info", title: item.title, desc: item.message, time: new Date(item.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), target }; }); setNotifications(rows); setNotifUnread(payload.data.filter((item: { readAt: string | null }) => !item.readAt).map((item: { id: string }) => item.id)); }).catch(() => {}); return () => { mounted = false; }; }, []);

  const handleNotifClick = (id: string, target: string | null) => {
    // Mark as read
    setNotifUnread((prev) => prev.filter((unreadId) => unreadId !== id));
    markRead([id]);

    // Route to target page/tab
    if (target === "billing") {
      router.push("/dashboard/billing");
    } else if (target === "contacts") {
      router.push("/dashboard/contacts");
    } else if (target === "reports") {
      router.push("/dashboard/reports");
    } else if (target === "campaigns") {
      router.push("/dashboard/campaigns");
    } else if (target === "settings") {
      router.push("/dashboard/settings");
    }
  };

  const visibleNotifs = notifFilter === "unread"
    ? notifications.filter((n) => notifUnread.includes(n.id))
    : notifications;

  // Group notifications chronologically, keeping original list order
  const uniqueGroups = Array.from(new Set(visibleNotifs.map((n) => n.group)));

  const getGlyph = (kind: string) => {
    switch (kind) {
      case "alert":
        return "!";
      case "ok":
        return "✓";
      case "warn":
        return "◔";
      case "info":
        return "↧";
      default:
        return "▤";
    }
  };

  const getIconStyles = (kind: string) => {
    switch (kind) {
      case "alert":
        return { bg: "rgba(255,92,92,.11)", color: "var(--sn-red)" };
      case "ok":
        return { bg: "rgba(43,213,118,.11)", color: "var(--sn-green)" };
      case "warn":
        return { bg: "rgba(255,176,46,.11)", color: "var(--sn-amber)" };
      case "info":
        return { bg: "rgba(0,82,255,.13)", color: "var(--sn-blue2)" };
      default:
        return { bg: "var(--sn-w07)", color: "var(--sn-w75)" };
    }
  };

  const tabStyle = (active: boolean) => ({
    fontSize: "13px",
    fontWeight: active ? 600 : 500,
    padding: "8px 16px",
    borderRadius: "20px",
    background: active ? "rgba(0,82,255,.16)" : "var(--sn-panel)",
    color: active ? "var(--sn-blue3)" : "var(--sn-w6)",
    border: active ? "1px solid rgba(0,82,255,.4)" : "1px solid var(--sn-w08)",
    cursor: "pointer",
  });

  const unreadCount = notifUnread.length;
  const totalCount = notifications.length;

  const headerSubText = unreadCount > 0
    ? `${unreadCount} NON LUE${unreadCount > 1 ? "S" : ""} SUR ${totalCount} NOTIFICATIONS`
    : `TOUT EST LU — ${totalCount} NOTIFICATIONS`;

  return (
    <div data-screen-label="Toutes les notifications" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both", maxWidth: "760px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>Notifications</h1>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
            {headerSubText}
          </div>
        </div>
        <button onClick={() => { markRead(notifUnread); setNotifUnread([]); }} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--sn-panel2)", color: "var(--sn-text)", border: "1px solid var(--sn-w12)", borderRadius: "11px", padding: "10px 16px", fontFamily: "'Satoshi', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer" }} className="sn-hover-border">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 7 8.5 17 4 12.5"></path><path d="M21.5 10.5 13 19.5"></path></svg>
          Tout marquer lu
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button style={tabStyle(notifFilter === "all")} onClick={() => setNotifFilter("all")}>
          Toutes ({totalCount})
        </button>
        <button style={tabStyle(notifFilter === "unread")} onClick={() => setNotifFilter("unread")}>
          Non lues ({unreadCount})
        </button>
      </div>

      {visibleNotifs.length === 0 ? (
        <div style={{ background: "var(--sn-panel)", border: "1px dashed var(--sn-w14)", borderRadius: "16px", padding: "54px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--sn-w7)" }}>Tout est lu ✓</div>
          <div style={{ fontSize: "13px", color: "var(--sn-w4)", marginTop: "6px" }}>Aucune notification non lue pour le moment.</div>
        </div>
      ) : (
        uniqueGroups.map((groupLabel) => {
          const groupItems = visibleNotifs.filter((n) => n.group === groupLabel);
          return (
            <div key={groupLabel} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w36)" }}>
                {groupLabel}
              </div>
              <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", overflow: "hidden" }}>
                {groupItems.map((n) => {
                  const isUnread = notifUnread.includes(n.id);
                  const iconStyle = getIconStyles(n.kind);
                  const glyph = getGlyph(n.kind);

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n.id, n.target)}
                      style={{ display: "flex", gap: "14px", padding: "16px 20px", borderBottom: "1px solid var(--sn-w04)", cursor: "pointer" }}
                      className="sn-hover-w03"
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          minWidth: "38px",
                          borderRadius: "11px",
                          background: iconStyle.bg,
                          color: iconStyle.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {glyph}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600 }}>{n.title}</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: ".08em", color: "var(--sn-w4)" }}>
                            {n.time}
                          </span>
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--sn-w55)", marginTop: "4px", lineHeight: "1.5" }}>
                          {n.desc}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            minWidth: "8px",
                            borderRadius: "50%",
                            background: isUnread ? "#0052FF" : "transparent",
                          }}
                        ></span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--sn-w35)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6"></path>
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
