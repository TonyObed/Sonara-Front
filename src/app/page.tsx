"use client";

import React, { useState, useEffect, useRef } from "react";
import { StatsSection } from "../components/landing/StatsSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { UseCasesSection } from "../components/landing/UseCasesSection";
import { CallSimulatorSection } from "../components/landing/CallSimulatorSection";
import { PlatformShowcase } from "../components/landing/PlatformShowcase";
import { IntegrationsSection } from "../components/landing/IntegrationsSection";
import { TestimonialsWall } from "../components/landing/TestimonialsWall";
import { PricingSection } from "../components/landing/PricingSection";
import { Footer } from "../components/landing/Footer";

export default function Home() {
  // ─── STATE VARIABLES ──────────────────────────────────────────
  const [isLightMode, setIsLightMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ─── REFS ─────────────────────────────────────────────────────
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const mouseGlowRef = useRef<HTMLDivElement>(null);

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
  <nav className={`nav-ai ${isScrolled ? "scrolled" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`} aria-label="Navigation principale" id="navbar">
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
        <li><a href="#pricing">Tarifs</a></li>
      </ul>
      <div className="nav-ai-right">
        <a href="#demo" className="demo-link">Réserver une Démo</a>
        <a href="/login" className="demo-link">Se connecter</a>
        <button id="themeToggleBtn" className="theme-toggle-btn" aria-label="Changer le thème" onClick={toggleTheme}>
          <svg className="sun-icon" style={{ display: isLightMode ? 'none' : 'block' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          <svg className="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: isLightMode ? 'block' : 'none' }}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>
        <a href="/signup" className="btn-get-started">Commencer</a>
        
        {/* Burger Button for Mobile viewports */}
        <button
          className={`mobile-burger-btn ${mobileMenuOpen ? "open" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu de navigation"
          aria-expanded={mobileMenuOpen}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "none",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "30px",
            height: "18px",
            zIndex: 1100,
            position: "relative",
            color: "currentColor",
          }}
        >
          <span className="burger-line" style={{ display: "block", height: "2px", width: "100%", background: "currentColor", transition: "transform 0.3s, opacity 0.3s" }} />
          <span className="burger-line" style={{ display: "block", height: "2px", width: "100%", background: "currentColor", transition: "transform 0.3s, opacity 0.3s", marginTop: "6px" }} />
          <span className="burger-line" style={{ display: "block", height: "2px", width: "100%", background: "currentColor", transition: "transform 0.3s, opacity 0.3s", marginTop: "6px" }} />
        </button>
      </div>
    </div>
  </nav>

  {/* Mobile Navigation Menu Dropdown/Overlay */}
  <div
    className={`mobile-menu-overlay ${mobileMenuOpen ? "open" : ""}`}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(10, 12, 16, 0.98)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      zIndex: 1050,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px",
      transition: "opacity 0.4s ease, visibility 0.4s ease",
      opacity: mobileMenuOpen ? 1 : 0,
      visibility: mobileMenuOpen ? "visible" : "hidden",
    }}
  >
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        alignItems: "center",
        width: "100%",
      }}
    >
      <li>
        <a
          href="#"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.9)",
            textDecoration: "none",
            fontFamily: "var(--font-body), sans-serif",
          }}
        >
          Accueil
        </a>
      </li>
      {["Produits", "Témoignages", "Ressources", "Tarifs"].map((item, idx) => (
        <li key={idx} style={{ opacity: mobileMenuOpen ? 1 : 0, transform: mobileMenuOpen ? "translateY(0)" : "translateY(16px)", transition: `transform 0.4s ease ${idx * 0.06}s, opacity 0.4s ease ${idx * 0.06}s` }}>
          <a
            href={item === "Tarifs" ? "#pricing" : "#"}
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.9)",
              textDecoration: "none",
              fontFamily: "var(--font-body), sans-serif",
            }}
          >
            {item}
          </a>
        </li>
      ))}
      <li style={{ width: "80px", height: "1px", background: "rgba(255,255,255,0.15)", margin: "10px 0" }} />
      <li style={{ opacity: mobileMenuOpen ? 1 : 0, transform: mobileMenuOpen ? "translateY(0)" : "translateY(16px)", transition: "transform 0.4s ease 0.3s, opacity 0.4s ease 0.3s" }}>
        <a
          href="/login"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            fontSize: "20px",
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.7)",
            textDecoration: "none",
          }}
        >
          Se connecter
        </a>
      </li>
      <li style={{ opacity: mobileMenuOpen ? 1 : 0, transform: mobileMenuOpen ? "translateY(0)" : "translateY(16px)", transition: "transform 0.4s ease 0.35s, opacity 0.4s ease 0.35s" }}>
        <a
          href="/signup"
          onClick={() => setMobileMenuOpen(false)}
          className="btn-get-started"
          style={{
            background: "#ffffff",
            color: "#000000",
            fontSize: "16px",
            fontWeight: 600,
            padding: "12px 32px",
            borderRadius: "9999px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Commencer
        </a>
      </li>
    </ul>
  </div>

  <main id="sonara-main" className="relative z-10 bg-[var(--bg-primary)] shadow-[0_40px_80px_rgba(0,0,0,0.45)] transition-colors duration-300">
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

  {/* ═══════════════════════════════════════════════════════ TESTIMONIALS WALL */}
  <TestimonialsWall />

  {/* ═══════════════════════════════════════════════════════ PRICING & FAQ & CTA & FOOTER */}
  <PricingSection />
  </main>

  <Footer />
    </>
  );
}
