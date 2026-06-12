"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./AuthPage.module.css";
import ParticleGrid from "./ParticleGrid";

/* ─── Types ─────────────────────────────────────────── */
type Mode = "login" | "signup";

interface AuthPageProps {
  initialMode?: Mode;
}

/* ─── Copy / Textes par mode ────────────────────────── */
const COPY: Record<
  Mode,
  {
    eyebrow: string;
    title: string;
    sub: string;
    cta: string;
    switchText: string;
    switchLink: string;
    switchHref: string;
    ok: string;
  }
> = {
  login: {
    eyebrow: "Espace client",
    title: "Connexion à votre compte",
    sub: "Pilotez vos campagnes d'enquêtes vocales et suivez vos résultats en temps réel.",
    cta: "Se connecter",
    switchText: "Pas encore de compte ?",
    switchLink: "Créer un compte",
    switchHref: "/signup",
    ok: "Connexion réussie. Redirection vers votre dashboard…",
  },
  signup: {
    eyebrow: "Démarrer gratuitement",
    title: "Créer votre compte",
    sub: "Lancez votre première campagne d'enquête vocale IA en moins de 10 minutes.",
    cta: "Créer mon compte",
    switchText: "Vous avez déjà un compte ?",
    switchLink: "Se connecter",
    switchHref: "/login",
    ok: "Compte créé. Bienvenue chez Sonara — préparation de votre espace…",
  },
};

/* ─── Testimonials data ─────────────────────────────── */
const SLIDES = [
  {
    quote: (
      <>
        Sonara a remplacé notre centre d&apos;appels pour les enquêtes de
        satisfaction. On a <b>divisé nos coûts par trois</b> et les rapports
        tombent en temps réel, plus besoin d&apos;attendre une semaine.
      </>
    ),
    initials: "AK",
    avatarGradient: "linear-gradient(135deg,#0052ff,#3aa0ff)",
    name: "Awa Koné",
    role: "Dir. Expérience Client · Banque",
  },
  {
    quote: (
      <>
        L&apos;IA mène une <b>vraie conversation en français ivoirien</b>. Nos
        clients ne se rendent même pas compte que ce n&apos;est pas un agent
        humain au bout du fil.
      </>
    ),
    initials: "YA",
    avatarGradient: "linear-gradient(135deg,#1f8a5b,#2fd07a)",
    name: "Yann Aka",
    role: "Responsable CRM · Télécom",
  },
  {
    quote: (
      <>
        On lance une campagne de <b>10 000 appels en quelques minutes</b>.
        Avant, il fallait deux semaines et toute une équipe pour le même
        résultat.
      </>
    ),
    initials: "FD",
    avatarGradient: "linear-gradient(135deg,#6b3df0,#a06bff)",
    name: "Fatou Diabaté",
    role: "Insights Manager · Institut d'études",
  },
  {
    quote: (
      <>
        Les résumés automatiques après chaque appel nous font{" "}
        <b>gagner un temps fou</b>. En trois mois, c&apos;est devenu l&apos;outil
        indispensable de notre équipe.
      </>
    ),
    initials: "KN",
    avatarGradient: "linear-gradient(135deg,#d9603a,#ffab6b)",
    name: "Koffi N'Guessan",
    role: "Dir. Marketing · Assurance",
  },
];

/* ─── Validation helpers ────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(
  mode: Mode,
  values: { name: string; company: string; email: string; password: string }
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!EMAIL_RE.test(values.email.trim()))
    errors.email = "Entrez une adresse email valide.";
  if (values.password.length < 8) errors.password = "8 caractères minimum.";
  if (mode === "signup") {
    if (!values.name.trim()) errors.name = "Indiquez votre nom.";
    if (!values.company.trim()) errors.company = "Indiquez votre entreprise.";
  }
  return errors;
}

/* ════════════════════════════════════════════════════ */
/*  Main component                                       */
/* ════════════════════════════════════════════════════ */
export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState({
    name: "",
    company: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  /* ── Carousel autoplay ── */
  const [slideIdx, setSlideIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const restart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
  }, []);

  useEffect(() => {
    restart();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restart]);


  /* ── Field change ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  /* ── Submit ── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setForgotSent(false);
    const errs = validateForm(mode, values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1300);
  };

  /* ── Forgot password ── */
  const handleForgot = (e: React.MouseEvent) => {
    e.preventDefault();
    setForgotSent(true);
    setSuccess(false);
  };

  const copy = COPY[mode];

  return (
    <div className={styles.stage}>

      {/* ════ LEFT : FORM ════ */}
      <section className={styles.paneForm}>
        {/* Form centré — pas de header logo en haut */}
        <div className={styles.formWrap}>
          <form
            className={styles.card}
            id="authForm"
            noValidate
            onSubmit={handleSubmit}
          >
            {/* Head — logo au-dessus du titre, eyebrow supprimé */}
            <div className={styles.head}>
              <div className={styles.formLogo}>
                <Image
                  src="/Branding bard sonara/Sonara_Logo_Variante_01.png"
                  alt="Sonara"
                  width={130}
                  height={32}
                  priority
                />
              </div>
              <h1 className={styles.h1}>{copy.title}</h1>
              <p className={styles.sub}>{copy.sub}</p>
            </div>

            {/* Social buttons */}
            <div className={styles.social}>
              <button
                type="button"
                className={styles.sbtn}
                data-provider="Google"
              >
                <svg viewBox="0 0 24 24" className={styles.socialIcon}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                className={styles.sbtn}
                data-provider="Microsoft"
              >
                <svg viewBox="0 0 24 24" className={styles.socialIcon}>
                  <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
                  <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
                  <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
                  <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
                </svg>
                Microsoft
              </button>
            </div>

            {/* Divider */}
            <div className={styles.divider}>
              <span>ou avec votre email</span>
            </div>

            {/* Signup-only fields */}
            {mode === "signup" && (
              <>
                <div
                  className={`${styles.field} ${errors.name ? styles.invalid : ""}`}
                >
                  <label htmlFor="name">Nom complet</label>
                  <div className={styles.inputShell}>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Awa Koné"
                      autoComplete="name"
                      value={values.name}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.name && (
                    <div className={styles.errMsg}>{errors.name}</div>
                  )}
                </div>

                <div
                  className={`${styles.field} ${errors.company ? styles.invalid : ""}`}
                >
                  <label htmlFor="company">Entreprise</label>
                  <div className={styles.inputShell}>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      placeholder="Nom de votre société"
                      autoComplete="organization"
                      value={values.company}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.company && (
                    <div className={styles.errMsg}>{errors.company}</div>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div
              className={`${styles.field} ${errors.email ? styles.invalid : ""}`}
            >
              <label htmlFor="email">Email professionnel</label>
              <div className={styles.inputShell}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="vous@entreprise.ci"
                  autoComplete="email"
                  value={values.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <div className={styles.errMsg}>{errors.email}</div>
              )}
            </div>

            {/* Password */}
            <div
              className={`${styles.field} ${errors.password ? styles.invalid : ""}`}
            >
              <label htmlFor="password">Mot de passe</label>
              <div className={`${styles.inputShell} ${styles.hasToggle}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={values.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className={styles.eye}
                  aria-label="Afficher le mot de passe"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
                      <path d="M6.6 6.6C3.6 8.3 2 12 2 12s3.5 7 10 7a9 9 0 0 0 5.4-1.6" />
                      <path d="m2 2 20 20" />
                      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <div className={styles.errMsg}>{errors.password}</div>
              )}
            </div>

            {/* Remember / Forgot — login only */}
            {mode === "login" && (
              <div className={styles.rowBetween}>
                <label className={styles.remember}>
                  <input type="checkbox" id="remember" />
                  <span>Se souvenir de moi</span>
                </label>
                <a
                  href="#"
                  className={`${styles.link} ${styles.muted}`}
                  onClick={handleForgot}
                >
                  Mot de passe oublié ?
                </a>
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              className={`${styles.cta} ${loading ? styles.loading : ""}`}
              id="cta"
            >
              <span className={styles.spin} />
              <span className={styles.ctaLabel}>{copy.cta}</span>
              <svg
                className={styles.ctaArrow}
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>

            {/* Success / forgot banner */}
            {(success || forgotSent) && (
              <div className={`${styles.okBanner} ${styles.show}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>
                  {forgotSent
                    ? "Un lien de réinitialisation a été envoyé à votre adresse."
                    : copy.ok}
                </span>
              </div>
            )}

            {/* Switch mode */}
            <p className={styles.switchText}>
              {copy.switchText}
              <Link
                href={copy.switchHref}
                className={styles.link}
              >
                {copy.switchLink}
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className={styles.footLeft}>
          <span>© 2026 Sonara</span>
          <span className={styles.footRight}>Abidjan, Côte d&apos;Ivoire</span>
        </div>
      </section>

      {/* ════ RIGHT : TESTIMONIALS ════ */}
      <aside className={styles.paneTesti}>
        {/* Animated particle grid */}
        <ParticleGrid />

        {/* Gradient overlays */}
        <div className={styles.gradientOverlay} />

        <div className={styles.testiInner}>

          {/* Top bar */}
          <div className={styles.testiTop}>
            <div className={styles.testiMark}>
              <div className={styles.nm}>
                Sonara
                <small>L&apos;oreille que vous n&apos;aviez pas.</small>
              </div>
            </div>
            <div className={styles.badge}>
              <span className={styles.pulse} />
              +50 000 appels / mois
            </div>
          </div>

          {/* Testimonial content */}
          <div className={styles.testiContent}>
            <span className={styles.quoteMark}>&ldquo;</span>
            <div className={styles.testiEyebrow}>
              Ils écoutent leurs clients avec Sonara
            </div>

            {/* Slides — pure CSS fade crossfade */}
            <div className={styles.carousel}>
              {SLIDES.map((slide, i) => (
                <div
                  key={i}
                  className={`${styles.slide} ${i === slideIdx ? styles.active : ""}`}
                >
                  <blockquote className={styles.blockquote}>
                    {slide.quote}
                  </blockquote>
                  <div className={styles.author}>
                    <div
                      className={styles.avatar}
                      style={{ background: slide.avatarGradient }}
                    >
                      {slide.initials}
                    </div>
                    <div className={styles.who}>
                      <b>{slide.name}</b>
                      <span>{slide.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statStrip}>
            <div className={styles.stat}>
              <div className={styles.statV}>
                <em>70–80%</em>
              </div>
              <div className={styles.statL}>
                de coûts en moins
                <br />
                vs centre d&apos;appels
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statV}>&lt; 10 min</div>
              <div className={styles.statL}>
                pour vos premiers
                <br />
                résultats
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statV}>27 M+</div>
              <div className={styles.statL}>
                habitants joignables
                <br />
                en Côte d&apos;Ivoire
              </div>
            </div>
          </div>

        </div>
      </aside>
    </div>
  );
}
