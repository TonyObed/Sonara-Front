"use client";

import React, { useState, useEffect, useRef } from "react";
import { StatsSection } from "../components/landing/StatsSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { UseCasesSection } from "../components/landing/UseCasesSection";
import { CallSimulatorSection } from "../components/landing/CallSimulatorSection";
import { PlatformShowcase } from "../components/landing/PlatformShowcase";
import { IntegrationsSection } from "../components/landing/IntegrationsSection";

export default function Home() {
  // ─── STATE VARIABLES ──────────────────────────────────────────
  const [isLightMode, setIsLightMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isYearlyPricing, setIsYearlyPricing] = useState(false);
  const [priceOpacity, setPriceOpacity] = useState(1);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // ─── REFS ─────────────────────────────────────────────────────
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const mouseGlowRef = useRef<HTMLDivElement>(null);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });
  const glowActiveRef = useRef(false);

  // ─── BACKGROUND MOUSE GLOW LERP EFFECT ────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseTargetRef.current.x = e.clientX;
      mouseTargetRef.current.y = e.clientY;
      if (!glowActiveRef.current) {
        glowActiveRef.current = true;
        updateGlowPosition();
      }
    };

    const updateGlowPosition = () => {
      mouseCurrentRef.current.x += (mouseTargetRef.current.x - mouseCurrentRef.current.x) * 0.08;
      mouseCurrentRef.current.y += (mouseTargetRef.current.y - mouseCurrentRef.current.y) * 0.08;

      if (mouseGlowRef.current) {
        mouseGlowRef.current.style.left = `${mouseCurrentRef.current.x}px`;
        mouseGlowRef.current.style.top = `${mouseCurrentRef.current.y}px`;
      }

      if (glowActiveRef.current) {
        requestAnimationFrame(updateGlowPosition);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      glowActiveRef.current = false;
    };
  }, []);

  // ─── NAVBAR SCROLL STYLE ──────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── SCROLL REVEAL (IntersectionObserver) ──────────────────────
  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, []);



  // ─── THEME SYNC WITH CLASS ────────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsLightMode(true);
      document.body.classList.add("light-mode");
    } else {
      setIsLightMode(false);
      document.body.classList.remove("light-mode");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    if (newMode) {
      localStorage.setItem("theme", "light");
      document.body.classList.add("light-mode");
    } else {
      localStorage.setItem("theme", "dark");
      document.body.classList.remove("light-mode");
    }
  };

  // ─── TESTIMONIALS AUTO ROTATE ─────────────────────────────────
  useEffect(() => {
    carouselIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 6000);

    return () => {
      if (carouselIntervalRef.current) clearInterval(carouselIntervalRef.current);
    };
  }, []);

  const jumpToSlide = (index: number) => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
    }
    setCurrentSlide(index);
  };

  // ─── PRICING TOGGLE LOGIC ──────────────────────────────────────
  const togglePricing = (checked: boolean) => {
    setPriceOpacity(0);
    setTimeout(() => {
      setIsYearlyPricing(checked);
      setPriceOpacity(1);
    }, 150);
  };

  // ─── FAQ TOGGLE LOGIC ──────────────────────────────────────────
  const toggleFaq = (index: number) => {
    setActiveFaq((prev) => (prev === index ? null : index));
  };



  // ─── VIDEO AUTO-PLAY SETUP ────────────────────────────────────
  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video) return;

    let playedLocal = false;
    video.play()
      .then(() => {
        playedLocal = true;
      })
      .catch((e) => {
        console.log("Autoplay prevented, loading HLS fallback:", e);
        loadHlsFallback(video);
      });

    function loadHlsFallback(v: HTMLVideoElement) {
      const videoSrc = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";
      // @ts-ignore
      if (typeof window !== "undefined" && window.Hls) {
        // @ts-ignore
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(videoSrc);
        hls.attachMedia(v);
        hls.on("hlsManifestParsed", () => {
          v.play().catch(e => console.log("HLS Play failed:", e));
        });
      } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = videoSrc;
        v.addEventListener("loadedmetadata", () => {
          v.play().catch(e => console.log("HLS Native Play failed:", e));
        });
      }
    }

    const handleError = () => {
      if (!playedLocal) {
        loadHlsFallback(video);
      }
    };

    video.addEventListener("error", handleError);
    return () => {
      video.removeEventListener("error", handleError);
    };
  }, []);



  return (
    <>
      {/* Glow */}
      <div className="mouse-glow" ref={mouseGlowRef} id="mouseGlow" />

      {/* Main body JSX */}
      {/* Background Light Glow (Interactive) */}
  <div className="mouse-glow" id="mouseGlow"></div>

  {/* ═══════════════════════════════════════════════════════ NAV */}
  <nav className={`nav-ai ${isScrolled ? "scrolled" : ""}`} aria-label="Navigation principale" id="navbar">
    <div className="nav-ai-inner">
      <a href="#" className="nav-ai-logo logo">
        <img src="Branding bard sonara/Sonara_Logo_Variante_01.png" alt="Sonara" className="logo-img logo-dark-theme" />
        <img src="Branding bard sonara/Sonara_Logo_Variante_05.png" alt="Sonara" className="logo-img logo-light-theme" style={{ "display": "none" }} />
      </a>
      <ul className="nav-ai-links">
        <li>
          <a href="#">
            Produits
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ "opacity": "0.6" }}><path d="m6 9 6 6 6-6"/></svg>
          </a>
        </li>
        <li><a href="#">Témoignages</a></li>
        <li><a href="#">Ressources</a></li>
        <li><a href="#section-pricing">Tarifs</a></li>
      </ul>
      <div className="nav-ai-right">
        <a href="#demo" className="demo-link">Réserver une Démo</a>
        <a href="/login" className="demo-link">Se connecter</a>
        <button id="themeToggleBtn" className="theme-toggle-btn" aria-label="Changer le thème" onClick={toggleTheme}>
          <svg className="sun-icon" style={{ display: isLightMode ? 'none' : 'block' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          <svg className="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: isLightMode ? 'block' : 'none' }}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>
        <a href="/signup" className="btn-get-started">Commencer</a>
      </div>
    </div>
  </nav>

  {/* ═══════════════════════════════════════════════════════ HERO */}
  <section className="hero-ai">
    {/* Background Video Layer */}
    <video ref={bgVideoRef} id="bgVideo" className="hero-ai-video"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    >
      <source src="test 1.mp4" type="video/mp4" />
    </video>

    {/* Video Overlay */}
    <div className="hero-ai-overlay"></div>

    {/* Decorative Gradients */}
    <div className="hero-ai-grad-top"></div>
    <div className="hero-ai-grad-bottom"></div>

    {/* Content Container */}
    <div className="hero-ai-content">
      
      {/* Pre-headline */}
      <p className="hero-ai-pre">
        L’IA vocale pour l’Afrique francophone
      </p>

      {/* Main Headline */}
      <h1 className="hero-ai-main">
        Enquêtez. Analysez. Décidez.
      </h1>

      {/* Subheadline */}
      <p className="hero-ai-sub">
        Sonara automatise vos campagnes d’appels téléphoniques avec une IA vocale naturelle, et génère des rapports d’analyse en temps réel.
      </p>

      {/* CTA Buttons */}
      <div className="hero-ai-buttons">
        {/* Primary Button */}
        <a href="#demo" className="hero-ai-btn-primary">
          <span>Voir une Démo</span>
          <div className="arrow-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </a>

        {/* Secondary Button */}
        <a href="#demo" className="hero-ai-btn-secondary">
          <span>Voir la Démo</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>

    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ STATS */}
  <StatsSection />

  {/* ═══════════════════════════════════════════════════════ HOW IT WORKS */}
  <HowItWorksSection />

  {/* ═══════════════════════════════════════════════════════ USE CASES */}
  <UseCasesSection />

  {/* ═══════════════════════════════════════════════════════ INTERACTIVE SIMULATOR (DEMO) */}
  <CallSimulatorSection />

  {/* ═══════════════════════════════════════════════════════ PLATFORM SHOWCASE (TABS) */}
  <PlatformShowcase />

  {/* ═══════════════════════════════════════════════════════ INTEGRATIONS MARQUEE */}
  <IntegrationsSection />

  {/* ═══════════════════════════════════════════════════════ TESTIMONIALS */}
  <section id="testimonials">
    <div className="container">
      <div className="carousel-wrapper reveal">
        <div className="carousel-track" id="carouselTrack" style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}>
          {/* Slide 1 */}
          <div className="carousel-slide">
            <div className="quote-icon">“</div>
            <p className="quote-text">« Nous avons réduit nos coûts d'enquête de 75% tout en augmentant notre taux de réponse de 40% par rapport aux centres d'appels traditionnels. L'IA de Sonara fait un travail exceptionnel. »</p>
            <div className="author-info">
              <span className="author-name">Mamadou Diop</span>
              <span className="author-role">Directeur Relation Client, Assurances NSIA</span>
            </div>
          </div>
          {/* Slide 2 */}
          <div className="carousel-slide">
            <div className="quote-icon">“</div>
            <p className="quote-text">« Contacter 10 000 abonnés en une matinée et obtenir des rapports de sentiment structurés avant midi a complètement révolutionné notre façon de piloter notre NPS opérationnel. »</p>
            <div className="author-info">
              <span className="author-name">Awa Koné</span>
              <span className="author-role">Responsable Marketing, MTN Côte d'Ivoire</span>
            </div>
          </div>
          {/* Slide 3 */}
          <div className="carousel-slide">
            <div className="quote-icon">“</div>
            <p className="quote-text">« Les clients sont bluffés par la voix naturelle d'Awa. Son nouchi léger et respectueux met instantanément à l'aise, permettant de collecter des réponses d'une sincérité rare. »</p>
            <div className="author-info">
              <span className="author-name">Jean-Luc Koffi</span>
              <span className="author-role">Directeur Général, Microfinance Ivoire</span>
            </div>
          </div>
        </div>
        
        <div className="carousel-dots">
          <span className={`dot ${currentSlide === 0 ? "active" : ""}`} onClick={() => jumpToSlide(0)}></span>
          <span className={`dot ${currentSlide === 1 ? "active" : ""}`} onClick={() => jumpToSlide(1)}></span>
          <span className={`dot ${currentSlide === 2 ? "active" : ""}`} onClick={() => jumpToSlide(2)}></span>
        </div>
      </div>
    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ PRICING */}
  <section id="pricing">
    <div className="container">
      <div style={{ "textAlign": "center", "display": "flex", "flexDirection": "column", "alignItems": "center" }}>
        <span className="label-badge reveal">Nos Offres</span>
        <h2 className="section-title reveal">Une tarification simple. <span>En FCFA.</span></h2>
        <p className="section-subtitle reveal">Des prix transparents adaptés au volume de votre entreprise. Sans engagement à long terme.</p>
      </div>

      <div className="pricing-toggle-box reveal">
        <span className="pricing-toggle-label active" id="billingMonthlyLabel">Mensuel</span>
        <label className="toggle-switch">
          <input type="checkbox" id="pricingToggle" checked={isYearlyPricing} onChange={(e) => togglePricing(e.target.checked)} />
          <span className="slider"></span>
        </label>
        <span className="pricing-toggle-label" id="billingYearlyLabel">
          Annuel 
          <span className="discount-badge">Économisez 20%</span>
        </span>
      </div>

      <div className="pricing-grid">
        {/* Card 1 */}
        <div className="pricing-card reveal">
          <span className="pricing-tier">Starter</span>
          <div className="pricing-price-container">
            <span className="price-currency">FCFA</span>
            <span className="price-value" id="priceStarter" data-monthly="50k" data-yearly="40k">50k</span>
          </div>
          <span className="price-period">par mois</span>
          <div className="pricing-included">1 000 appels inclus / mois</div>
          <ul className="pricing-features-list">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>80 FCFA / appel suppl.</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>1 campagne active</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Import CSV & Export Excel</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Transcription & résumé auto</span>
            </li>
            <li className="muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              <span>Analyses de sentiment</span>
            </li>
            <li className="muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              <span>API & Webhooks</span>
            </li>
          </ul>
          <a href="#demo" className="btn btn-secondary" style={{ "width": "100%" }}>Démarrer</a>
        </div>

        {/* Card 2 */}
        <div className="pricing-card featured reveal reveal-delay-1">
          <span className="featured-badge">Recommandé</span>
          <span className="pricing-tier">Business</span>
          <div className="pricing-price-container">
            <span className="price-currency">FCFA</span>
            <span className="price-value" id="priceBusiness" data-monthly="200k" data-yearly="160k">200k</span>
          </div>
          <span className="price-period">par mois</span>
          <div className="pricing-included">10 000 appels inclus / mois</div>
          <ul className="pricing-features-list">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>60 FCFA / appel suppl.</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Campagnes illimitées</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Import CSV & Segmentation</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Analyses de sentiment</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Accès API & Webhooks</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Support prioritaire</span>
            </li>
          </ul>
          <a href="#demo" className="btn btn-primary" style={{ "width": "100%" }}>Sélectionner Business</a>
        </div>

        {/* Card 3 */}
        <div className="pricing-card reveal reveal-delay-2">
          <span className="pricing-tier">Enterprise</span>
          <div className="pricing-price-container">
            <span className="price-value" style={{ "fontSize": "36px" }}>Sur devis</span>
          </div>
          <span className="price-period">tarifs sur mesure</span>
          <div className="pricing-included">Volume d'appels illimités</div>
          <ul className="pricing-features-list">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Coût par appel négocié</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Hébergement des données en CI</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Modèles de voix personnalisés</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>SLA contractuel et sécurité</span>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              <span>Gestionnaire de compte dédié</span>
            </li>
          </ul>
          <a href="mailto:contact@sonara.ai" className="btn btn-secondary" style={{ "width": "100%" }}>Nous contacter</a>
        </div>
      </div>
    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ FAQ */}
  <section id="faq">
    <div className="container">
      <div style={{ "textAlign": "center", "display": "flex", "flexDirection": "column", "alignItems": "center", "marginBottom": "48px" }}>
        <span className="label-badge reveal">Questions</span>
        <h2 className="section-title reveal">Foire aux <span>questions</span></h2>
        <p className="section-subtitle reveal">Toutes les réponses pour aborder votre transition vers les enquêtes vocales assistées par IA.</p>
      </div>

      <div className="faq-wrapper reveal">
        <div className={`faq-item ${activeFaq === 0 ? "active" : ""}`}>
          <button className="faq-trigger" aria-expanded={activeFaq === 0} aria-controls="faq-panel-1" onClick={() => toggleFaq(0)}>
            <span className="faq-question">L'IA parle-t-elle vraiment avec les expressions de Côte d'Ivoire ?</span>
            <svg className="faq-icon-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div className="faq-panel" id="faq-panel-1" role="region" aria-labelledby="faq-trigger-1">
            <div className="faq-content">
              Oui absolument ! Nos modèles sont optimisés pour le marché ouest-africain. L'IA de Sonara maîtrise les structures de phrases locales, l'accent ivoirien standard, et peut être configurée pour utiliser des expressions de nouchi léger afin d'instaurer un climat de confiance et de proximité avec vos répondants.
            </div>
          </div>
        </div>

        <div className={`faq-item ${activeFaq === 1 ? "active" : ""}`}>
          <button className="faq-trigger" aria-expanded={activeFaq === 1} aria-controls="faq-panel-2" onClick={() => toggleFaq(1)}>
            <span className="faq-question">Où sont hébergées les données d'appels et d'enquêtes ?</span>
            <svg className="faq-icon-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div className="faq-panel" id="faq-panel-2" role="region" aria-labelledby="faq-trigger-2">
            <div className="faq-content">
              Pour nos clients Enterprise et sur demande, nous offrons un hébergement des données directement en Côte d'Ivoire sur des serveurs sécurisés tiers de confiance, garantissant une conformité totale avec la loi 2013-450 relative à la protection des données à caractère personnel encadrée par l'ARTCI.
            </div>
          </div>
        </div>

        <div className={`faq-item ${activeFaq === 2 ? "active" : ""}`}>
          <button className="faq-trigger" aria-expanded={activeFaq === 2} aria-controls="faq-panel-3" onClick={() => toggleFaq(2)}>
            <span className="faq-question">Comment s'effectue l'intégration avec nos outils existants ?</span>
            <svg className="faq-icon-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div className="faq-panel" id="faq-panel-3" role="region" aria-labelledby="faq-trigger-3">
            <div className="faq-content">
              Vous pouvez importer vos contacts très simplement via un fichier CSV classique, ou connecter votre CRM (Salesforce, HubSpot) directement via nos Webhooks et API. Par exemple, vous pouvez déclencher un appel d'enquête automatique 10 minutes après qu'un dossier client ait été marqué comme résolu dans votre outil interne.
            </div>
          </div>
        </div>

        <div className={`faq-item ${activeFaq === 3 ? "active" : ""}`}>
          <button className="faq-trigger" aria-expanded={activeFaq === 3} aria-controls="faq-panel-4" onClick={() => toggleFaq(3)}>
            <span className="faq-question">Est-il possible de transférer l'appel vers un agent humain ?</span>
            <svg className="faq-icon-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div className="faq-panel" id="faq-panel-4" role="region" aria-labelledby="faq-trigger-4">
            <div className="faq-content">
              Oui, tout à fait. Si le client en cours d'appel exprime le besoin explicite de parler à un conseiller ("Je veux parler à un responsable" ou "Transférez-moi"), l'IA de Sonara peut immédiatement transférer l'appel vers le numéro de votre centre de support ou agence tout en préservant le contexte.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ CTA FINAL */}
  <section id="cta-final">
    <div className="container reveal">
      <span className="label-badge">Démarrage</span>
      <h2 className="cta-heading">Transformez la voix de vos clients<br/>en insights exploitables.</h2>
      <p className="cta-subtext">Aucune ligne de code requise pour lancer votre première campagne. Essayez Sonara gratuitement dès aujourd'hui.</p>
      <div className="cta-btn-group">
        <a href="#demo" className="btn btn-primary">Lancer un appel test gratuit</a>
        <a href="mailto:contact@sonara.ai" className="btn btn-secondary">Parler à un expert</a>
      </div>
    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ FOOTER */}
  <footer>
    <div className="container">
      <div className="footer-grid">
        <div className="footer-logo-desc">
          <a href="#" className="logo"><img src="Branding bard sonara/Sonara_Logo_Variante_01.png" alt="Sonara" className="logo-img" /></a>
          <p>La première plateforme ouest-africaine d'enquêtes téléphoniques automatisées par IA vocale conversationnelle. Basée à Abidjan, Côte d'Ivoire.</p>
        </div>
        <div className="footer-col">
          <h4>Produit</h4>
          <ul className="footer-links">
            <li><a href="#how">Fonctionnement</a></li>
            <li><a href="#usecases">Cas d'usage</a></li>
            <li><a href="#pricing">Tarifs</a></li>
            <li><a href="#demo">Démo interactive</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Ressources</h4>
          <ul className="footer-links">
            <li><a href="#">Documentation</a></li>
            <li><a href="#">Guides Nouchi IA</a></li>
            <li><a href="#">Conformité ARTCI</a></li>
            <li><a href="#">Support technique</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Entreprise</h4>
          <ul className="footer-links">
            <li><a href="#">À propos</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Mentions légales</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="footer-copy">© 2026 Sonara. Tous droits réservés. Abidjan, Côte d'Ivoire.</span>
        <div className="footer-badges">
          <span className="footer-badge">
            <span style={{ "width": "6px", "height": "6px", "background": "var(--success)", "borderRadius": "50%", "display": "inline-block" }}></span>
            Données hébergées en CI
          </span>
          <span className="footer-badge secondary">Conforme loi 2013-450</span>
        </div>
      </div>
    </div>
  </footer>

  {/* ═══════════════════════════════════════════════════════ JAVASCRIPT LOGIC */}
    </>
  );
}
