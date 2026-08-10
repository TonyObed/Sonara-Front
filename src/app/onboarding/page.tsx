"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./onboarding.module.css";

type AnswerKey = "acquisition" | "jobRole" | "primaryGoal" | "contactVolume";
type Answers = Record<AnswerKey, string>;
type SurveyStep = {
  key: AnswerKey;
  kicker: string;
  title: string;
  description: string;
  question: string;
  choices: string[];
};

const SURVEY_STEPS: SurveyStep[] = [
  {
    key: "acquisition",
    kicker: "Découverte",
    title: "Comment avez-vous connu Sonara ?",
    description: "Cette réponse nous aide à comprendre ce qui vous a amené jusqu'ici.",
    question: "Choisissez la réponse la plus proche",
    choices: ["Recommandation", "Réseaux sociaux", "Recherche Google", "Événement / démo", "Autre"],
  },
  {
    key: "jobRole",
    kicker: "Votre rôle",
    title: "Quel rôle occupez-vous dans l'entreprise ?",
    description: "Nous adapterons votre point de départ aux besoins de votre métier.",
    question: "Votre fonction principale",
    choices: ["Dirigeant(e)", "Marketing / communication", "Relation client", "Études / qualité", "Commercial", "Autre"],
  },
  {
    key: "primaryGoal",
    kicker: "Premier objectif",
    title: "Que voulez-vous accomplir avec Sonara ?",
    description: "Votre dashboard sera préparé autour de ce premier cas d'usage.",
    question: "Votre priorité actuelle",
    choices: ["Mesurer la satisfaction", "Qualifier des prospects", "Relancer des clients", "Mener une étude", "Autre"],
  },
  {
    key: "contactVolume",
    kicker: "Votre échelle",
    title: "Combien de contacts prévoyez-vous ?",
    description: "C'est une estimation pour personnaliser votre démarrage, pas une limite.",
    question: "Volume de votre première campagne",
    choices: ["Moins de 100", "100 à 500", "500 à 2 000", "Plus de 2 000"],
  },
];

const EMPTY_ANSWERS: Answers = { acquisition: "", jobRole: "", primaryGoal: "", contactVolume: "" };
const STEP_LABELS = ["Profil", "Découverte", "Rôle", "Objectif", "Volume"];

function splitName(fullName: string) {
  const [firstName, ...last] = fullName.trim().split(/\s+/);
  return { firstName, lastName: last.join(" ") };
}

export default function OnboardingPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const formArea = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("Votre entreprise");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [storedAvatar, setStoredAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewMode = process.env.NODE_ENV === "development" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";
  const avatarPreview = useMemo(() => avatarFile ? URL.createObjectURL(avatarFile) : storedAvatar, [avatarFile, storedAvatar]);

  useEffect(() => () => {
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  useEffect(() => {
    if (formArea.current) formArea.current.scrollTop = 0;
  }, [step]);

  useEffect(() => {
    if (previewMode) {
      setFullName("Koffi N'Guessan");
      setCompanyName("Banque Horizon");
      setReady(true);
      return;
    }

    Promise.all([
      fetch("/api/company/onboarding", { credentials: "include" }).then((response) => response.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((response) => response.json()),
    ])
      .then(([onboardingPayload, mePayload]) => {
        if (!onboardingPayload.success || !onboardingPayload.data.shouldShow || !mePayload.success) {
          router.replace("/dashboard");
          return;
        }
        const user = mePayload.data.user;
        const onboarding = onboardingPayload.data.onboarding;
        setFullName([user.firstName, user.lastName].filter(Boolean).join(" "));
        setCompanyName(mePayload.data.company.name);
        setStoredAvatar(user.avatarUrl ? "/api/auth/avatar/image" : null);
        setAnswers({
          acquisition: onboarding.acquisition ?? "",
          jobRole: onboarding.jobRole ?? "",
          primaryGoal: onboarding.primaryGoal ?? "",
          contactVolume: onboarding.contactVolume ?? "",
        });
        setReady(true);
      })
      .catch(() => router.replace("/dashboard"));
  }, [previewMode, router]);

  const isComplete = step === 5;
  const activeSurvey = step > 0 && step < 5 ? SURVEY_STEPS[step - 1] : null;
  const canContinue = step === 0 ? fullName.trim().length >= 2 : Boolean(activeSurvey && answers[activeSurvey.key]);
  const firstName = splitName(fullName || "Votre nom").firstName;

  const goToStep = (next: number) => {
    if (next < 0 || next >= step || isComplete) return;
    setDirection("back");
    setError(null);
    setStep(next);
  };

  const selectAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1_000_000) {
      setError("Utilisez une image JPG, PNG ou WebP de 1 Mo maximum.");
      event.target.value = "";
      return;
    }
    setError(null);
    setAvatarFile(file);
  };

  const saveProfile = async () => {
    if (previewMode) return;
    const { firstName: profileFirstName, lastName } = splitName(fullName);
    const profileResponse = await fetch("/api/auth/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: profileFirstName, lastName }),
    });
    const profilePayload = await profileResponse.json();
    if (!profileResponse.ok || !profilePayload.success) throw new Error(profilePayload.error?.message ?? "Profil impossible à enregistrer.");

    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);
      const avatarResponse = await fetch("/api/auth/avatar", { method: "POST", credentials: "include", body: formData });
      const avatarPayload = await avatarResponse.json();
      if (!avatarResponse.ok || !avatarPayload.success) throw new Error(avatarPayload.error?.message ?? "Avatar impossible à enregistrer.");
      setStoredAvatar("/api/auth/avatar/image");
      setAvatarFile(null);
    }
  };

  const completeOnboarding = async () => {
    if (!previewMode) {
      const response = await fetch("/api/company/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, tutorialSeen: true }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Configuration impossible à enregistrer.");
    }
    setDirection("next");
    setStep(5);
  };

  const continueFlow = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (step === 0) await saveProfile();
      if (step === 4) await completeOnboarding();
      else {
        setDirection("next");
        setStep((value) => value + 1);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    setSaving(true);
    if (!previewMode) {
      await fetch("/api/company/onboarding", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipped: true }),
      }).catch(() => undefined);
    }
    router.replace("/dashboard");
  };

  if (!ready) return <main className={styles.loading}><span /></main>;

  return (
    <main className={styles.stage}>
      <section className={`${styles.canvas} ${styles[`step${step}`]}`}>
        <div className={styles.glow} />
        <header className={styles.header}>
          <Image src="/Branding bard sonara/Sonara_Logo_Variante_01.png" alt="Sonara" width={112} height={28} priority />
          {!isComplete && <button type="button" className={styles.skip} onClick={() => void skip()} disabled={saving}>Passer</button>}
        </header>

        {!isComplete && (
          <div className={styles.progress} aria-label={`Étape ${step + 1} sur 5`}>
            <div className={styles.progressLine}><i style={{ width: `${step * 25}%` }} /></div>
            {STEP_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                className={`${styles.progressNode} ${index === step ? styles.progressActive : ""} ${index < step ? styles.progressDone : ""}`}
                onClick={() => goToStep(index)}
                disabled={index >= step}
                aria-label={`${label}, étape ${index + 1}`}
              >
                {index < step ? "✓" : index + 1}
              </button>
            ))}
            <div className={styles.flag} aria-hidden="true">⚑</div>
          </div>
        )}

        {!isComplete ? (
          <div className={styles.formArea} ref={formArea}>
            <div className={`${styles.formStep} ${direction === "back" ? styles.fromLeft : styles.fromRight}`} key={step}>
              {step === 0 ? (
                <>
                  <span className={styles.kicker}>Bienvenue sur Sonara</span>
                  <h1>Créons votre profil.</h1>
                  <p className={styles.description}>Votre nom vient de l'inscription. Vérifiez-le et ajoutez une photo si vous le souhaitez.</p>
                  <label className={styles.fieldLabel} htmlFor="onboarding-name">Votre nom complet</label>
                  <div className={styles.textField}>
                    <span>♙</span>
                    <input id="onboarding-name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Votre nom complet" autoComplete="name" />
                  </div>
                  <span className={styles.fieldLabel}>Photo de profil <small>Optionnel</small></span>
                  <button type="button" className={styles.uploadZone} onClick={() => fileInput.current?.click()}>
                    {avatarPreview ? <img src={avatarPreview} alt="Aperçu de votre avatar" /> : <span className={styles.uploadIcon}>↥</span>}
                    <strong>{avatarPreview ? "Changer la photo" : "Choisir une photo"}</strong>
                    <small>JPG, PNG ou WebP · 1 Mo max.</small>
                  </button>
                  <input ref={fileInput} className={styles.hiddenInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectAvatar} />
                </>
              ) : activeSurvey ? (
                <>
                  <span className={styles.kicker}>{activeSurvey.kicker}</span>
                  <h1>{activeSurvey.title}</h1>
                  <p className={styles.description}>{activeSurvey.description}</p>
                  <span className={styles.fieldLabel}>{activeSurvey.question}</span>
                  <div className={styles.options}>
                    {activeSurvey.choices.map((choice) => {
                      const selected = answers[activeSurvey.key] === choice;
                      return (
                        <button
                          type="button"
                          key={choice}
                          className={selected ? styles.optionSelected : ""}
                          onClick={() => setAnswers((current) => ({ ...current, [activeSurvey.key]: choice }))}
                          aria-pressed={selected}
                        >
                          <span>{selected ? "✓" : "◇"}</span>{choice}<i>{selected ? "Sélectionné" : ""}</i>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {error && <p className={styles.error}>{error}</p>}
              <button type="button" className={styles.continue} disabled={!canContinue || saving} onClick={() => void continueFlow()}>
                {saving ? "Enregistrement…" : step === 4 ? "Terminer" : "Continuer"}<span>→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.congratulations}>
            <div className={styles.finishIcon}>⚑</div>
            <span className={styles.kicker}>Configuration terminée</span>
            <h1>Félicitations, {firstName} !</h1>
            <p>Votre espace Sonara est prêt pour sa première campagne.</p>
            <button type="button" onClick={() => router.replace("/dashboard/campaigns/new")}>Commencer <span>→</span></button>
          </div>
        )}

        <ProductPreview
          step={step}
          fullName={fullName}
          companyName={companyName}
          avatar={avatarPreview}
          answers={answers}
        />
      </section>
    </main>
  );
}

function ProductPreview({ step, fullName, companyName, avatar, answers }: { step: number; fullName: string; companyName: string; avatar: string | null; answers: Answers }) {
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "S";
  const goal = answers.primaryGoal || "Objectif de campagne";
  const volume = answers.contactVolume || "Contacts à importer";

  return (
    <div className={styles.previewWrap} aria-hidden="true">
      <div className={styles.productWindow}>
        <aside className={styles.productSidebar}>
          <div className={styles.productBrand}><span>◖</span> Sonara</div>
          <div className={styles.sideNav}><i>⌂</i><span /></div>
          <div className={styles.sideDivider} />
          <div className={styles.sideWorkspace}><i>◫</i><strong>{companyName}</strong></div>
          <div className={styles.sideActive}><span /></div>
          <div className={styles.sideUser}>
            <div>{avatar ? <img src={avatar} alt="" /> : initials}</div>
            <span>{fullName || "Votre profil"}</span>
          </div>
        </aside>

        <div className={styles.productMain}>
          <div className={styles.productTop}>
            <div><span className={styles.tinyMark}>◫</span><strong>{companyName}</strong></div>
            <div className={styles.fakeAvatars}><span>{initials}</span><span>AK</span><span>+</span></div>
          </div>
          <div className={styles.productTabs}><i /><i /><i /><b>+</b></div>
          <div className={styles.previewHeading}>Campagnes actives</div>
          <div className={styles.campaignCards}>
            <div className={styles.campaignCard}><strong>{goal}</strong><span /><small /></div>
            <div className={styles.campaignCard}><strong>{volume}</strong><span /><small /></div>
            <div className={styles.campaignCard}><strong>{answers.jobRole || "Expérience personnalisée"}</strong><span /><small /></div>
          </div>
          <div className={styles.productBottom}><span /></div>
        </div>
      </div>
    </div>
  );
}
