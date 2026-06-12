"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardSidebarProps {
  theme: "dark" | "light";
  menuOpen: boolean;
  onCloseMenu: () => void;
}

export function DashboardSidebar({ theme, menuOpen, onCloseMenu }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const navStyle = (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "14.5px",
    textDecoration: "none",
    background: active ? "rgba(0,82,255,.16)" : "transparent",
    color: active ? "var(--sn-text)" : "var(--sn-w62)",
  });

  return (
    <nav
      id="sn-sidebar"
      style={{
        width: "248px",
        minWidth: "248px",
        height: "100%",
        background: "var(--sn-side)",
        borderRight: "1px solid var(--sn-w06)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        transform: menuOpen ? "translateX(0)" : undefined,
        transition: "transform .28s ease",
      }}
    >
      <div style={{ padding: "22px 22px 18px 22px" }}>
        {theme === "light" ? (
          <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--sn-text)" }}>
            Sonara<span style={{ color: "#0052FF" }}>.</span>
          </span>
        ) : (
          <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--sn-text)" }}>
            Sonara<span style={{ color: "#00D4A6" }}>.</span>
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 12px", display: "flex", flexDirection: "column", gap: "22px" }}>
        {/* VUE D'ENSEMBLE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w36)", padding: "8px 12px" }}>
            VUE D'ENSEMBLE
          </div>
          <Link href="/dashboard" onClick={onCloseMenu} style={navStyle(isActive("/dashboard"))} className="sn-hover-w05">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M3 10.5 12 3l9 7.5"></path>
              <path d="M5 9.5V21h14V9.5"></path>
              <path d="M9.5 21v-6h5v6"></path>
            </svg>
            <span>Accueil</span>
          </Link>
          <Link href="/dashboard/campaigns" onClick={onCloseMenu} style={navStyle(isActive("/dashboard/campaigns"))} className="sn-hover-w05">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M3 11l14-5v12L3 13v-2z"></path>
              <path d="M7 13.5V18a2 2 0 0 0 4 0v-3"></path>
              <path d="M20 9.5a3 3 0 0 1 0 5"></path>
            </svg>
            <span>Campagnes</span>
          </Link>
          <Link href="/dashboard/contacts" onClick={onCloseMenu} style={navStyle(isActive("/dashboard/contacts"))} className="sn-hover-w05">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="9" cy="8" r="3.2"></circle>
              <path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5S13.8 16 14.5 19"></path>
              <path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.2"></path>
              <path d="M17.5 14.8c1.7.7 2.7 2.1 3 4.2"></path>
            </svg>
            <span>Contacts</span>
          </Link>
          <Link href="/dashboard/reports" onClick={onCloseMenu} style={navStyle(isActive("/dashboard/reports"))} className="sn-hover-w05">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M4 20V10"></path>
              <path d="M10 20V4"></path>
              <path d="M16 20v-7"></path>
              <path d="M21 20H3"></path>
            </svg>
            <span>Rapports</span>
          </Link>
        </div>

        {/* TEMPS RÉEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w36)", padding: "8px 12px" }}>
            TEMPS RÉEL
          </div>
          <Link href="/dashboard/live" onClick={onCloseMenu} style={navStyle(isActive("/dashboard/live"))} className="sn-hover-w05">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M2.5 12h3l2.5-6 4 12 2.5-6h7"></path>
            </svg>
            <span style={{ flex: 1 }}>Live monitoring</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10.5px",
                color: "var(--sn-green)",
                background: "rgba(43,213,118,.1)",
                padding: "2px 8px",
                borderRadius: "20px",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "var(--sn-green)",
                  animation: "snPulse 1.8s infinite",
                }}
              ></span>
              4
            </span>
          </Link>
        </div>

        {/* COMPTE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w36)", padding: "8px 12px" }}>
            COMPTE
          </div>
          <Link href="/dashboard/settings" onClick={onCloseMenu} style={navStyle(isActive("/dashboard/settings"))} className="sn-hover-w05">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="3.2"></circle>
              <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"></path>
            </svg>
            <span style={{ flex: 1 }}>Paramètres</span>
          </Link>
          <Link href="/dashboard/support" onClick={onCloseMenu} style={navStyle(isActive("/dashboard/support"))} className="sn-hover-w05">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="8.6"></circle>
              <path d="M9.4 9.2a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.2-2.6 3.6"></path>
              <circle cx="12" cy="17" r=".4" fill="currentColor"></circle>
            </svg>
            <span style={{ flex: 1 }}>Aide &amp; support</span>
          </Link>
        </div>
      </div>

      {/* Credit Section */}
      <div style={{ padding: "14px" }}>
        <div style={{ background: "var(--sn-panel2)", border: "1px solid var(--sn-w07)", borderRadius: "14px", padding: "16px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w42)" }}>
            CRÉDIT RESTANT
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "8px" }}>
            <span style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-.01em" }}>12 450</span>
            <span style={{ fontSize: "12px", color: "var(--sn-w45)" }}>appels</span>
          </div>
          <div style={{ height: "5px", background: "var(--sn-w08)", borderRadius: "4px", marginTop: "12px", overflow: "hidden" }}>
            <div style={{ width: "62%", height: "100%", borderRadius: "4px", background: "linear-gradient(90deg, #0052FF, #00D4A6)" }}></div>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)", marginTop: "8px" }}>
            ≈ 9 jours d&apos;autonomie
          </div>
        </div>
      </div>
    </nav>
  );
}
