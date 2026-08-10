"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const choices = {
  acquisition: ["Recommandation", "Réseaux sociaux", "Recherche Google", "Événement / démo", "Autre"],
  jobRole: ["Dirigeant(e)", "Marketing / communication", "Relation client", "Études / qualité", "Commercial", "Autre"],
  primaryGoal: ["Mesurer la satisfaction", "Qualifier des prospects", "Relancer des clients", "Mener une étude", "Autre"],
  contactVolume: ["Moins de 100", "100 à 500", "500 à 2 000", "Plus de 2 000"],
};
type Answers = { acquisition: string; jobRole: string; primaryGoal: string; contactVolume: string };
const empty: Answers = { acquisition: "", jobRole: "", primaryGoal: "", contactVolume: "" };

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/company/onboarding", { credentials: "include" }).then((r) => r.json()).then((payload) => { if (!payload.success || !payload.data.shouldShow) router.replace("/dashboard"); else setReady(true); }).catch(() => router.replace("/dashboard")); }, [router]);
  const steps = [
    { key: "acquisition" as const, label: "Découverte", title: "Comment avez-vous connu Sonara ?", sub: "Une réponse rapide pour mieux comprendre ce qui vous aide." },
    { key: "jobRole" as const, label: "Votre rôle", title: "Quel est votre rôle dans l'entreprise ?", sub: "Nous adapterons les recommandations de départ." },
    { key: "primaryGoal" as const, label: "Objectif", title: "Que voulez-vous accomplir en premier ?", sub: "Votre espace sera orienté vers ce premier cas d'usage." },
    { key: "contactVolume" as const, label: "Volume", title: "Quelle taille de liste prévoyez-vous ?", sub: "C'est une estimation, elle ne limite pas votre compte." },
  ];
  const current = steps[step];
  const value = answers[current?.key];
  const skip = async () => { setSaving(true); await fetch("/api/company/onboarding", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skipped: true }) }).catch(() => {}); router.replace("/dashboard"); };
  const finish = async () => { setSaving(true); setError(null); try { const response = await fetch("/api/company/onboarding", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...answers, tutorialSeen: true }) }); const payload = await response.json(); if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Enregistrement impossible."); setStep(4); } catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible."); } finally { setSaving(false); } };
  if (!ready) return <main style={{ minHeight: "100vh", background: "#090b11" }} />;

  return <main style={{ minHeight: "100vh", background: "radial-gradient(circle at 78% 12%, rgba(0,82,255,.16), transparent 27%), #090b11", color: "#f5f7fb", display: "flex", flexDirection: "column" }}>
    <header style={{ height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(22px, 5vw, 72px)", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
      <Image src="/Branding bard sonara/Sonara_Logo_Variante_01.png" alt="Sonara" width={126} height={31} priority />
      {step < 4 && <button onClick={() => { void skip(); }} disabled={saving} style={{ background: "transparent", border: 0, color: "rgba(255,255,255,.56)", fontSize: "13px", cursor: "pointer" }}>Configurer plus tard</button>}
    </header>
    <section style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(300px,.75fr)", alignItems: "stretch" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 28px" }}>
        <div style={{ width: "min(610px, 100%)" }}>
          {step < 4 ? <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: "monospace", fontSize: "11px", color: "#75a0ff", letterSpacing: ".1em" }}><span>CONFIGURATION DE VOTRE ESPACE</span><span style={{ color: "rgba(255,255,255,.35)" }}>0{step + 1}/04</span></div>
            <div style={{ display: "flex", gap: "7px", marginTop: "18px" }}>{steps.map((item, index) => <div key={item.key} style={{ height: "4px", flex: 1, borderRadius: "9px", background: index <= step ? "#276bff" : "rgba(255,255,255,.1)" }} />)}</div>
            <h1 style={{ fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.08, margin: "38px 0 13px", letterSpacing: "-.035em" }}>{current.title}</h1><p style={{ color: "rgba(255,255,255,.6)", fontSize: "16px", margin: 0, lineHeight: 1.55 }}>{current.sub}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))", gap: "12px", marginTop: "34px" }}>{choices[current.key].map((choice) => <button key={choice} onClick={() => setAnswers((previous) => ({ ...previous, [current.key]: choice }))} style={{ textAlign: "left", padding: "17px", minHeight: "60px", background: value === choice ? "rgba(39,107,255,.2)" : "rgba(255,255,255,.035)", color: "#fff", border: `1px solid ${value === choice ? "#3c7aff" : "rgba(255,255,255,.1)"}`, borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>{choice}</button>)}</div>
            {error && <p style={{ color: "#ff7d7d", fontSize: "13px" }}>{error}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "35px" }}><button onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0 || saving} style={{ background: "transparent", border: 0, color: "rgba(255,255,255,.6)", cursor: "pointer", opacity: step === 0 ? .35 : 1 }}>← Retour</button><button disabled={!value || saving} onClick={() => step === 3 ? void finish() : setStep((n) => n + 1)} style={{ border: 0, background: "#276bff", color: "#fff", borderRadius: "10px", padding: "13px 20px", fontWeight: 700, cursor: "pointer", opacity: !value || saving ? .55 : 1 }}>{saving ? "Enregistrement…" : step === 3 ? "Terminer" : "Continuer →"}</button></div>
          </> : <><span style={{ color: "#44d48a", fontFamily: "monospace", fontSize: "11px", letterSpacing: ".1em" }}>VOTRE ESPACE EST PRÊT</span><h1 style={{ fontSize: "clamp(32px,4vw,48px)", lineHeight: 1.08, margin: "27px 0 14px", letterSpacing: "-.035em" }}>Votre première campagne peut commencer.</h1><p style={{ color: "rgba(255,255,255,.6)", fontSize: "16px", lineHeight: 1.6 }}>Vous êtes prêt à tester Sonara avec une petite liste de contacts. Le dashboard vous accompagnera à chaque étape.</p><div style={{ marginTop: "31px", display: "grid", gap: "10px" }}>{["Créer une campagne", "Importer un fichier CSV", "Recevoir un appel test", "Lire les résultats et le rapport"].map((item, index) => <div key={item} style={{ padding: "14px 16px", border: "1px solid rgba(255,255,255,.1)", borderRadius: "11px", color: "rgba(255,255,255,.85)" }}><span style={{ color: "#75a0ff", fontFamily: "monospace", marginRight: "12px" }}>0{index + 1}</span>{item}</div>)}</div><button onClick={() => router.replace("/dashboard/campaigns/new")} style={{ marginTop: "30px", width: "100%", border: 0, background: "#276bff", color: "#fff", borderRadius: "11px", padding: "15px", fontWeight: 700, cursor: "pointer" }}>Créer ma première campagne →</button></>}
        </div>
      </div>
      <aside style={{ padding: "48px clamp(28px,5vw,72px)", borderLeft: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.018)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "24px" }}><span style={{ color: "rgba(255,255,255,.4)", fontFamily: "monospace", fontSize: "10px", letterSpacing: ".14em" }}>{step < 4 ? steps[step].label.toUpperCase() : "PROCHAINE ÉTAPE"}</span><div style={{ padding: "24px", border: "1px solid rgba(255,255,255,.1)", borderRadius: "16px", background: "linear-gradient(145deg,rgba(40,105,255,.14),rgba(255,255,255,.025))" }}><div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "rgba(80,140,255,.2)", color: "#7aa5ff", display: "grid", placeItems: "center", fontWeight: 800 }}>S</div><h2 style={{ fontSize: "19px", margin: "20px 0 9px" }}>Sonara s'adapte à votre usage.</h2><p style={{ margin: 0, color: "rgba(255,255,255,.55)", fontSize: "14px", lineHeight: 1.6 }}>Vos réponses servent à personnaliser le point de départ, jamais à modifier vos droits ou vos données.</p></div><p style={{ margin: 0, color: "rgba(255,255,255,.35)", lineHeight: 1.65, fontSize: "13px" }}>Vous pourrez modifier vos paramètres et lancer une campagne quand vous le souhaitez.</p></aside>
    </section>
  </main>;
}
