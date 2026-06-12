"use client";

import { Icon } from "./Icon";
import { NOTIFS } from "@/lib/sonara-data";

interface NotifPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotifPanel({ open, onClose }: NotifPanelProps) {
  if (!open) return null;

  return (
    <div className="db-notif-panel" onClick={onClose}>
      <div
        className="db-notif-inner"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="db-card-head">
          <h3>
            <Icon name="bell" size={16} />
            Notifications
          </h3>
          <button
            className="db-icon-btn"
            onClick={onClose}
            style={{ width: 34, height: 34 }}
            aria-label="Fermer les notifications"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
          {NOTIFS.map((n, i) => {
            return (
              <div
                key={i}
                className="db-sum-item"
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--sn-w04)",
                  background: n.unread ? "rgba(0,82,255,.03)" : "transparent",
                  transition: "background 0.2s ease"
                }}
              >
                <div
                  className="db-kpi-ico"
                  style={{
                    width: "34px",
                    height: "34px",
                    background: n.iconBg,
                    color: n.iconColor,
                    flexShrink: 0,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  {n.glyph}
                </div>
                <div className="db-sum-body" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--sn-text)" }}>{n.title}</div>
                    {n.unread && (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "var(--sn-blue2)",
                          flexShrink: 0
                        }}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--sn-w6)", marginTop: "3px", lineHeight: "1.5" }}>
                    {n.desc}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--sn-w42)",
                      marginTop: "6px",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: ".05em"
                    }}
                  >
                    {n.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
