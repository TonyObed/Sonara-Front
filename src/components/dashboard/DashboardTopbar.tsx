"use client";

import { useState } from "react";
import Link from "next/link";
import { NOTIFS } from "@/lib/sonara-data";

interface DashboardTopbarProps {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  onOpenMenu: () => void;
  onOpenCall: (id: number) => void;
}

export function DashboardTopbar({ theme, setTheme, onOpenMenu, onOpenCall }: DashboardTopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFS);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const markAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotifClick = (title: string) => {
    setNotifOpen(false);
    if (title.includes("Transfert")) {
      // Open Jean-Marc Kouamé call (id 4)
      onOpenCall(4);
    } else if (title.includes("terminée")) {
      // Open Aya Traoré call (id 1)
      onOpenCall(1);
    }
  };

  const isDark = theme === "dark";
  const themeLabel = theme === "light" ? "Thème clair" : "Thème sombre";
  const themeTrackBg = theme === "light" ? "#0052FF" : "var(--sn-w14)";
  const themeKnobLeft = theme === "light" ? "18px" : "2px";

  const hasUnread = notifs.some((n) => n.unread);

  return (
    <header
      id="sn-topbar"
      style={{
        height: "64px",
        minHeight: "64px",
        borderBottom: "1px solid var(--sn-w06)",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "0 28px",
        background: "var(--sn-topbar)",
        position: "relative",
      }}
    >
      {/* Burger menu for mobile */}
      <button
        id="sn-burger"
        onClick={onOpenMenu}
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: "var(--sn-panel2)",
          border: "1px solid var(--sn-w08)",
          color: "var(--sn-text)",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <path d="M4 7h16M4 12h16M4 17h10"></path>
        </svg>
      </button>

      {/* Search Bar */}
      <div
        id="sn-search"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "var(--sn-panel)",
          border: "1px solid var(--sn-w07)",
          borderRadius: "11px",
          padding: "0 14px",
          height: "40px",
          width: "340px",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--sn-w4)", flexShrink: 0 }} strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5"></circle>
          <path d="M20 20l-4-4"></path>
        </svg>
        <input
          type="text"
          placeholder="Rechercher une campagne, un contact…"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--sn-text)",
            fontFamily: "'Satoshi', sans-serif",
            fontSize: "13.5px",
          }}
        />
      </div>

      <div style={{ flex: 1 }}></div>

      {/* Live Monitoring Badge */}
      <Link href="/dashboard/live" style={{ textDecoration: "none" }}>
        <div
          id="sn-livechip"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11.5px",
            color: "var(--sn-green)",
            background: "rgba(43,213,118,.08)",
            border: "1px solid rgba(43,213,118,.22)",
            padding: "7px 13px",
            borderRadius: "20px",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--sn-green)",
              animation: "snPulse 1.8s infinite",
            }}
          ></span>
          <span>4 appels en cours</span>
        </div>
      </Link>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        title="Changer de thème"
        className="sn-hover-w05"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: "var(--sn-panel2)",
          border: "1px solid var(--sn-w08)",
          color: "var(--sn-w75)",
          cursor: "pointer",
        }}
      >
        {!isDark ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"></path>
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="4.2"></circle>
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19"></path>
          </svg>
        )}
      </button>

      {/* Notifications Popover */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => {
            setNotifOpen(!notifOpen);
            setProfileOpen(false);
          }}
          className="sn-hover-w05"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "var(--sn-panel2)",
            border: "1px solid var(--sn-w08)",
            color: "var(--sn-w75)",
            cursor: "pointer",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5z"></path>
            <path d="M10 18.5a2.1 2.1 0 0 0 4 0"></path>
          </svg>
          {hasUnread && (
            <span
              style={{
                position: "absolute",
                top: "9px",
                right: "10px",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#0052FF",
                border: "2px solid var(--sn-panel2)",
              }}
            ></span>
          )}
        </button>

        {notifOpen && (
          <>
            <div
              onClick={() => setNotifOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 65 }}
            />
            <div
              style={{
                position: "absolute",
                top: "47px",
                right: 0,
                width: "370px",
                maxWidth: "86vw",
                background: "var(--sn-panel)",
                border: "1px solid var(--sn-w12)",
                borderRadius: "16px",
                boxShadow: "0 24px 60px rgba(0,0,0,.35)",
                zIndex: 70,
                overflow: "hidden",
                animation: "snFadeUp .22s ease both",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "15px 18px", borderBottom: "1px solid var(--sn-w06)" }}>
                <span style={{ fontSize: "14.5px", fontWeight: 700 }}>Notifications</span>
                <span
                  onClick={markAllRead}
                  className="sn-hover-support-faq"
                  style={{ fontSize: "12px", fontWeight: 600, color: "var(--sn-blue2)", cursor: "pointer" }}
                >
                  Tout marquer lu
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", maxHeight: "380px", overflowY: "auto" }}>
                {notifs.map((n, index) => (
                  <div
                    key={index}
                    onClick={() => handleNotifClick(n.title)}
                    className="sn-hover-w03"
                    style={{ display: "flex", gap: "12px", padding: "13px 18px", borderBottom: "1px solid var(--sn-w04)", cursor: "pointer" }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        minWidth: "34px",
                        borderRadius: "10px",
                        background: n.iconBg,
                        color: n.iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    >
                      {n.glyph}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{n.title}</div>
                      <div style={{ fontSize: "12.5px", color: "var(--sn-w55)", marginTop: "3px", lineHeight: 1.45 }}>{n.desc}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: ".08em", color: "var(--sn-w4)", marginTop: "6px" }}>
                        {n.time}
                      </div>
                    </div>
                    {n.unread && (
                      <span style={{ width: "7px", height: "7px", minWidth: "7px", borderRadius: "50%", background: "#0052FF", marginTop: "5px" }}></span>
                    )}
                  </div>
                ))}
              </div>
              <div
                className="sn-hover-text"
                style={{ padding: "12px 18px", textAlign: "center", fontSize: "12.5px", fontWeight: 600, color: "var(--sn-w55)", cursor: "pointer" }}
              >
                Voir toutes les notifications
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile Popover */}
      <div style={{ position: "relative" }}>
        <div
          onClick={() => {
            setProfileOpen(!profileOpen);
            setNotifOpen(false);
          }}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #0052FF, #00D4A6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          AK
        </div>

        {profileOpen && (
          <>
            <div
              onClick={() => setProfileOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 65 }}
            />
            <div
              style={{
                position: "absolute",
                top: "47px",
                right: 0,
                width: "290px",
                background: "var(--sn-panel)",
                border: "1px solid var(--sn-w12)",
                borderRadius: "16px",
                boxShadow: "0 24px 60px rgba(0,0,0,.35)",
                zIndex: 70,
                overflow: "hidden",
                animation: "snFadeUp .22s ease both",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px", borderBottom: "1px solid var(--sn-w06)" }}>
                <div style={{ width: "42px", height: "42px", minWidth: "42px", borderRadius: "10px", background: "linear-gradient(135deg, #0052FF, #00D4A6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "14px" }}>
                  AK
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>Aminata Koné</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w45)", marginTop: "3px" }}>
                    a.kone@banquehorizon.ci
                  </div>
                </div>
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--sn-blue2)", background: "rgba(0,82,255,.13)", padding: "4px 9px", borderRadius: "11px" }}>
                  Admin
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", padding: "8px" }}>
                <div className="sn-hover-w04" style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 11px", borderRadius: "9px", cursor: "pointer", fontSize: "13.5px", fontWeight: 500, color: "var(--sn-w75)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="8" r="3.4"></circle>
                    <path d="M5.5 19.5c.8-3.3 3.3-5 6.5-5s5.7 1.7 6.5 5"></path>
                  </svg>
                  Mon profil
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setProfileOpen(false)}
                  className="sn-hover-w04"
                  style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 11px", borderRadius: "9px", cursor: "pointer", fontSize: "13.5px", fontWeight: 500, color: "var(--sn-w75)", textDecoration: "none" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="3.2"></circle>
                    <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"></path>
                  </svg>
                  Paramètres
                </Link>
                <div
                  onClick={toggleTheme}
                  className="sn-hover-w04"
                  style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 11px", borderRadius: "9px", cursor: "pointer", fontSize: "13.5px", fontWeight: 500, color: "var(--sn-w75)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    {!isDark ? (
                      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"></path>
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="4.2"></circle>
                        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19"></path>
                      </>
                    )}
                  </svg>
                  <span style={{ flex: 1 }}>{themeLabel}</span>
                  <span
                    style={{
                      width: "36px",
                      height: "20px",
                      borderRadius: "11px",
                      background: themeTrackBg,
                      position: "relative",
                      transition: "background .2s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "2px",
                        left: themeKnobLeft,
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left .2s",
                      }}
                    ></span>
                  </span>
                </div>
                <div style={{ height: "1px", background: "var(--sn-w06)", margin: "7px 4px" }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 11px", borderRadius: "9px", cursor: "pointer", fontSize: "13.5px", fontWeight: 500, color: "var(--sn-red)", background: "rgba(255,92,92,.02)" }} className="sn-hover-w03">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9"></path>
                    <path d="M15 8l4 4-4 4M19 12H9"></path>
                  </svg>
                  Se déconnecter
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
