"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Lecture du token depuis l'URL (évite le besoin de <Suspense> pour useSearchParams).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Lien invalide ou expiré. Refaites une demande de réinitialisation.");
      return;
    }
    if (password.length < 8) {
      setError("8 caractères minimum.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Le mot de passe doit contenir au moins une majuscule et un chiffre.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword({ token, password });
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "var(--sn-bg, #0a0c12)",
    color: "var(--sn-text, #e8edf7)",
    fontFamily: "'Satoshi', sans-serif",
  };
  const card: React.CSSProperties = {
    width: "420px",
    maxWidth: "100%",
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "18px",
    padding: "32px",
  };
  const input: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: "11px",
    padding: "13px 14px",
    color: "inherit",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div style={wrap}>
      <form style={card} onSubmit={handleSubmit} noValidate>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>
          Nouveau mot de passe
        </h1>
        <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,.55)", margin: "0 0 22px" }}>
          Choisissez un nouveau mot de passe pour votre compte Sonara.
        </p>

        {done ? (
          <div
            style={{
              background: "rgba(43,213,118,.1)",
              border: "1px solid rgba(43,213,118,.3)",
              borderRadius: "11px",
              padding: "14px 16px",
              fontSize: "13.5px",
            }}
          >
            ✓ Mot de passe réinitialisé. Redirection vers la connexion…
          </div>
        ) : (
          <>
            <label style={{ fontSize: "13px", display: "block", marginBottom: "7px" }}>
              Nouveau mot de passe
            </label>
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                style={input}
              />
            </div>

            <label style={{ fontSize: "13px", display: "block", marginBottom: "7px" }}>
              Confirmer le mot de passe
            </label>
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              style={{ ...input, marginBottom: "12px" }}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12.5px",
                color: "rgba(255,255,255,.6)",
                marginBottom: "18px",
                cursor: "pointer",
              }}
            >
              <input type="checkbox" checked={show} onChange={() => setShow((v) => !v)} />
              Afficher le mot de passe
            </label>

            {error && (
              <div
                role="alert"
                style={{
                  background: "rgba(255,92,92,.1)",
                  border: "1px solid rgba(255,92,92,.3)",
                  borderRadius: "11px",
                  padding: "11px 14px",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#0052FF",
                color: "#fff",
                border: "none",
                borderRadius: "11px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
            </button>
          </>
        )}

        <p style={{ fontSize: "13px", color: "rgba(255,255,255,.5)", marginTop: "20px", textAlign: "center" }}>
          <Link href="/login" style={{ color: "#5b9cff" }}>
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
