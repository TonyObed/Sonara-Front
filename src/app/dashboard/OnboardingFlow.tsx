"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const choices = {
  acquisition: ["Recommandation", "Réseaux sociaux", "Recherche Google", "Événement / démo", "Autre"],
  jobRole: ["Dirigeant(e)", "Marketing / communication", "Relation client", "Études / qualité", "Commercial", "Autre"],
  primaryGoal: ["Mesurer la satisfaction", "Qualifier des prospects", "Relancer des clients", "Mener une étude", "Autre"],
  contactVolume: ["Moins de 100", "100 à 500", "500 à 2 000", "Plus de 2 000"],
};

type Answers = { acquisition: string; jobRole: string; primaryGoal: string; contactVolume: string };
const initialAnswers: Answers = { acquisition: "", jobRole: "", primaryGoal: "", contactVolume: "" };

export function OnboardingFlow() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { let active = true; fetch("/api/company/onboarding", { credentials: "include" }).then((response) => response.json()).then((payload) => { if (active && payload.success && payload.data.shouldShow) setVisible(true); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!visible) return null;

  const steps = [
    { key: "acquisition" as const, title: "Comment avez-vous connu Sonara ?", subtitle: "Cela nous aide à comprendre les canaux qui vous apportent de la valeur." },
    { key: "jobRole" as const, title: "Quel est votre rôle ?", subtitle: "Nous adapterons les conseils affichés dans votre espace." },
    { key: "primaryGoal" as const, title: "Quel est votre objectif principal ?", subtitle: "Sonara peut servir à différents types de campagnes." },
    { key: "contactVolume" as const, title: "Quel volume de contacts prévoyez-vous ?", subtitle: "Une estimation suffit, elle ne vous engage à rien." },
  ];
  const current = steps[step];
  const value = answers[current.key];
  const select = (next: string) => setAnswers((previous) => ({ ...previous, [current.key]: next }));
  const skip = async () => { setSaving(true); try { await fetch("/api/company/onboarding", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skipped: true }) }); setVisible(false); } finally { setSaving(false); } };
  const finish = async () => {
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/company/onboarding", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...answers, tutorialSeen: true }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Enregistrement impossible.");
      setStep(4);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  };

  return <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,8,16,.74)", backdropFilter: "blur(7px)", display: "grid", placeItems: "center", padding: "20px" }}>
    <div style={{ width: "min(560px, 100%)", background: "var(--sn-panel)", border: "1px solid var(--sn-w12)", borderRadius: "20px", boxShadow: "0 32px 90px rgba(0,0,0,.55)", padding: "28px", animation: "snFadeUp .3s ease both" }}>
      {step < 4 ? <>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}><span style={{ color: "var(--sn-blue3)", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: ".12em" }}>BIENVENUE SUR SONARA</span><button onClick={() => { void skip(); }} disabled={saving} style={{ background: "transparent", border: "none", color: "var(--sn-w45)", cursor: "pointer", fontSize: "12px" }}>Passer</button></div>
        <div style={{ display: "flex", gap: "6px", marginTop: "20px" }}>{steps.map((_, index) => <span key={index} style={{ height: "4px", flex: 1, borderRadius: "5px", background: index <= step ? "#0052FF" : "var(--sn-w10)" }} />)}</div>
        <h2 style={{ margin: "26px 0 8px", fontSize: "23px", lineHeight: 1.2 }}>{current.title}</h2><p style={{ margin: 0, color: "var(--sn-w55)", fontSize: "14px", lineHeight: 1.55 }}>{current.subtitle}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px", marginTop: "24px" }}>{choices[current.key].map((choice) => <button key={choice} onClick={() => select(choice)} style={{ textAlign: "left", padding: "13px 14px", borderRadius: "11px", border: `1px solid ${value === choice ? "rgba(0,82,255,.75)" : "var(--sn-w10)"}`, background: value === choice ? "rgba(0,82,255,.14)" : "var(--sn-inset)", color: value === choice ? "var(--sn-blue3)" : "var(--sn-text)", fontWeight: 600, cursor: "pointer" }}>{choice}</button>)}</div>
        {error && <p style={{ color: "var(--sn-red)", fontSize: "12px", margin: "15px 0 0" }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", gap: "10px" }}><button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || saving} style={{ border: "1px solid var(--sn-w14)", background: "transparent", color: "var(--sn-w7)", borderRadius: "10px", padding: "11px 15px", cursor: "pointer", opacity: step === 0 ? .4 : 1 }}>Retour</button><button onClick={() => step === steps.length - 1 ? void finish() : setStep((value) => value + 1)} disabled={!value || saving} style={{ border: "none", background: "#0052FF", color: "#fff", borderRadius: "10px", padding: "11px 18px", fontWeight: 700, cursor: "pointer", opacity: !value || saving ? .55 : 1 }}>{saving ? "Enregistrement…" : step === steps.length - 1 ? "Continuer" : "Suivant"}</button></div>
      </> : <>
        <span style={{ color: "var(--sn-green)", fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: ".12em" }}>CONFIGURATION TERMINÉE</span>
        <h2 style={{ margin: "22px 0 8px", fontSize: "24px" }}>Votre premier appel est à quelques étapes.</h2><p style={{ margin: 0, color: "var(--sn-w55)", lineHeight: 1.6, fontSize: "14px" }}>1. Créez une campagne. 2. Importez vos contacts CSV. 3. Lancez un appel test. 4. Consultez les résultats et votre rapport.</p>
        <div style={{ marginTop: "22px", padding: "15px", borderRadius: "12px", background: "rgba(0,82,255,.09)", color: "var(--sn-w75)", fontSize: "13px", lineHeight: 1.55 }}>Conseil : commencez par une petite liste et un appel test, pour valider votre brief et la voix avant le lancement.</div>
        <button onClick={() => { setVisible(false); router.push("/dashboard/campaigns/new"); }} style={{ marginTop: "26px", width: "100%", border: "none", background: "#0052FF", color: "#fff", borderRadius: "10px", padding: "13px 18px", fontWeight: 700, cursor: "pointer" }}>Créer ma première campagne</button>
      </>}
    </div>
  </div>;
}
