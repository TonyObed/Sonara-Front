"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./onboarding.module.css";

type AnswerKey = "acquisition" | "jobRole" | "primaryGoal" | "contactVolume";
type Answers = Record<AnswerKey, string>;

type Choice = { title: string; description: string; code: string };
type Step = {
  key: AnswerKey;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  choices: Choice[];
};

const STEPS: Step[] = [
  {
    key: "acquisition",
    shortLabel: "Découverte",
    eyebrow: "Faisons connaissance",
    title: "Comment avez-vous découvert Sonara ?",
    description: "Votre réponse nous aide à comprendre ce qui vous a mené jusqu'ici.",
    choices: [
      { title: "Recommandation", description: "Un proche ou un collègue", code: "RE" },
      { title: "Réseaux sociaux", description: "LinkedIn, Instagram, X…", code: "RS" },
      { title: "Recherche Google", description: "Une recherche sur le web", code: "GO" },
      { title: "Événement / démo", description: "Une présentation ou rencontre", code: "EV" },
      { title: "Autre", description: "Une autre source", code: "AU" },
    ],
  },
  {
    key: "jobRole",
    shortLabel: "Votre rôle",
    eyebrow: "Votre quotidien",
    title: "Quel rôle occupez-vous dans l'entreprise ?",
    description: "Nous adapterons les raccourcis et conseils de départ à votre métier.",
    choices: [
      { title: "Dirigeant(e)", description: "Vision, pilotage et décisions", code: "DG" },
      { title: "Marketing / communication", description: "Marque et connaissance client", code: "MK" },
      { title: "Relation client", description: "Satisfaction et fidélisation", code: "RC" },
      { title: "Études / qualité", description: "Analyse et amélioration continue", code: "EQ" },
      { title: "Commercial", description: "Prospection et qualification", code: "CO" },
      { title: "Autre", description: "Un autre métier", code: "AU" },
    ],
  },
  {
    key: "primaryGoal",
    shortLabel: "Objectif",
    eyebrow: "Votre première victoire",
    title: "Que voulez-vous accomplir en premier ?",
    description: "Sonara préparera votre espace autour de ce premier cas d'usage.",
    choices: [
      { title: "Mesurer la satisfaction", description: "Collecter des avis à grande échelle", code: "CS" },
      { title: "Qualifier des prospects", description: "Identifier les opportunités", code: "QP" },
      { title: "Relancer des clients", description: "Réactiver et fidéliser", code: "RL" },
      { title: "Mener une étude", description: "Explorer un marché ou un sujet", code: "ET" },
      { title: "Autre", description: "Un objectif personnalisé", code: "AU" },
    ],
  },
  {
    key: "contactVolume",
    shortLabel: "Volume",
    eyebrow: "À votre échelle",
    title: "Combien de contacts prévoyez-vous ?",
    description: "Une simple estimation pour adapter votre démarrage. Cela ne limite pas votre compte.",
    choices: [
      { title: "Moins de 100", description: "Premiers tests et petits panels", code: "<1" },
      { title: "100 à 500", description: "Campagnes ciblées régulières", code: "5H" },
      { title: "500 à 2 000", description: "Volume intermédiaire", code: "2K" },
      { title: "Plus de 2 000", description: "Déploiement à grande échelle", code: "+2" },
    ],
  },
];

const EMPTY_ANSWERS: Answers = {
  acquisition: "",
  jobRole: "",
  primaryGoal: "",
  contactVolume: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("preview") === "1") {
      setReady(true);
      return;
    }
    fetch("/api/company/onboarding", { credentials: "include" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.success || !payload.data.shouldShow) {
          router.replace("/dashboard");
          return;
        }
        setReady(true);
      })
      .catch(() => router.replace("/dashboard"));
  }, [router]);

  const current = STEPS[Math.min(step, STEPS.length - 1)];
  const selectedValue = answers[current.key];
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const completion = step >= STEPS.length ? 100 : answeredCount * 25;

  const skip = async () => {
    setSaving(true);
    await fetch("/api/company/onboarding", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skipped: true }),
    }).catch(() => undefined);
    router.replace("/dashboard");
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/company/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, tutorialSeen: true }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Enregistrement impossible.");
      }
      setStep(STEPS.length);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return <main className={styles.loading}><span /></main>;
  }

  const isComplete = step >= STEPS.length;

  return (
    <main className={styles.shell}>
      <div className={styles.auroraOne} />
      <div className={styles.auroraTwo} />
      <div className={styles.grid} />

      <aside className={styles.sidebar}>
        <div>
          <Image
            src="/Branding bard sonara/Sonara_Logo_Variante_01.png"
            alt="Sonara"
            width={126}
            height={31}
            priority
            className={styles.logo}
          />
          <div className={styles.sidebarIntro}>
            <span className={styles.monoLabel}>MISE EN ROUTE</span>
            <h2>Votre espace,<br />à votre image.</h2>
            <p>Quatre réponses. Une expérience Sonara mieux adaptée dès le premier appel.</p>
          </div>
        </div>

        <nav className={styles.stepList} aria-label="Progression de l'onboarding">
          {STEPS.map((item, index) => {
            const done = index < step || isComplete;
            const active = index === step && !isComplete;
            return (
              <div key={item.key} className={`${styles.stepItem} ${active ? styles.stepActive : ""} ${done ? styles.stepDone : ""}`}>
                <div className={styles.stepMarker}>{done ? "✓" : String(index + 1).padStart(2, "0")}</div>
                <div>
                  <span>Étape {index + 1}</span>
                  <strong>{item.shortLabel}</strong>
                </div>
              </div>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <div className={styles.securityDot} />
          <p><strong>Vos réponses restent privées.</strong><br />Elles personnalisent votre accueil, jamais vos droits.</p>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.mobileBrand}>
            <Image src="/Branding bard sonara/Sonara_Logo_Variante_01.png" alt="Sonara" width={108} height={27} />
          </div>
          {!isComplete && (
            <div className={styles.progressBlock}>
              <span>{answeredCount}/4 réponses</span>
              <div className={styles.progressTrack}><i style={{ width: `${completion}%` }} /></div>
              <strong>{completion}%</strong>
            </div>
          )}
          {!isComplete && (
            <button className={styles.skipButton} type="button" onClick={() => void skip()} disabled={saving}>
              Configurer plus tard
            </button>
          )}
        </header>

        <div className={styles.contentGrid}>
          <div className={styles.formColumn}>
            {!isComplete ? (
              <div className={styles.question} key={current.key}>
                <div className={styles.eyebrow}><span />{current.eyebrow}</div>
                <h1>{current.title}</h1>
                <p className={styles.lead}>{current.description}</p>

                <div className={styles.choiceGrid}>
                  {current.choices.map((choice) => {
                    const selected = selectedValue === choice.title;
                    return (
                      <button
                        type="button"
                        key={choice.title}
                        className={`${styles.choiceCard} ${selected ? styles.choiceSelected : ""}`}
                        onClick={() => setAnswers((previous) => ({ ...previous, [current.key]: choice.title }))}
                        aria-pressed={selected}
                      >
                        <span className={styles.choiceCode}>{choice.code}</span>
                        <span className={styles.choiceText}>
                          <strong>{choice.title}</strong>
                          <small>{choice.description}</small>
                        </span>
                        <span className={styles.choiceCheck}>{selected ? "✓" : "→"}</span>
                      </button>
                    );
                  })}
                </div>

                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => setStep((value) => Math.max(0, value - 1))}
                    disabled={step === 0 || saving}
                  >
                    <span>←</span> Retour
                  </button>
                  <button
                    type="button"
                    className={styles.nextButton}
                    disabled={!selectedValue || saving}
                    onClick={() => step === STEPS.length - 1 ? void finish() : setStep((value) => value + 1)}
                  >
                    {saving ? "Préparation…" : step === STEPS.length - 1 ? "Préparer mon espace" : "Continuer"}
                    {!saving && <span>→</span>}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.complete}>
                <div className={styles.successOrb}><span>✓</span></div>
                <div className={styles.eyebrow}><span />Configuration terminée</div>
                <h1>Votre cockpit Sonara est prêt.</h1>
                <p className={styles.lead}>Vous pouvez maintenant créer votre première campagne et entendre votre assistant en action.</p>
                <div className={styles.launchSteps}>
                  <div><span>01</span><strong>Créez votre campagne</strong><small>Définissez l'objectif et le scénario.</small></div>
                  <div><span>02</span><strong>Ajoutez vos contacts</strong><small>Importez une liste CSV ou testez un numéro.</small></div>
                  <div><span>03</span><strong>Lancez et analysez</strong><small>Suivez les résultats depuis votre dashboard.</small></div>
                </div>
                <button type="button" className={styles.launchButton} onClick={() => router.replace("/dashboard/campaigns/new")}>
                  Créer ma première campagne <span>→</span>
                </button>
                <button type="button" className={styles.dashboardLink} onClick={() => router.replace("/dashboard")}>Découvrir d'abord le dashboard</button>
              </div>
            )}
          </div>

          <aside className={styles.previewColumn}>
            <div className={styles.previewLabel}><span>APERÇU DE VOTRE ESPACE</span><i>LIVE</i></div>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div className={styles.miniLogo}>S</div>
                <div><span>SONARA WORKSPACE</span><strong>Première campagne</strong></div>
                <button type="button" aria-label="Menu de l'aperçu">•••</button>
              </div>
              <div className={styles.wavePanel}>
                <div className={styles.waveBars} aria-hidden="true">
                  {[34, 58, 42, 75, 49, 88, 61, 35, 71, 92, 48, 67, 39, 80, 53, 30, 62, 45].map((height, index) => (
                    <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 45}ms` }} />
                  ))}
                </div>
                <div className={styles.liveRow}><span><i /> ASSISTANT PRÊT</span><strong>00:00</strong></div>
              </div>
              <div className={styles.previewData}>
                <div><span>OBJECTIF</span><strong>{answers.primaryGoal || "À définir"}</strong></div>
                <div><span>VOLUME</span><strong>{answers.contactVolume || "À définir"}</strong></div>
                <div><span>EXPÉRIENCE</span><strong>{answers.jobRole ? "Personnalisée" : "En préparation"}</strong></div>
              </div>
              <div className={styles.readiness}>
                <div><span>Préparation du workspace</span><strong>{isComplete ? 100 : answeredCount * 25}%</strong></div>
                <div className={styles.readinessTrack}><i style={{ width: `${isComplete ? 100 : answeredCount * 25}%` }} /></div>
              </div>
            </div>
            <p className={styles.previewHint}><span>✦</span> Vos choix mettent à jour cet aperçu en temps réel.</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
