"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { api, ApiError } from "@/lib/api-client";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  const [newsSubmitting, setNewsSubmitting] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  const footerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const statusDotRef = useRef<HTMLSpanElement>(null);

  // Email anti-scraping assembly on mount
  const [displayedEmail, setDisplayedEmail] = useState("écrivez-nous");
  const [mailToUrl, setMailToUrl] = useState("#");

  useEffect(() => {
    const parts = ["hello", "sonara.ci"];
    const addr = parts.join("@");
    setDisplayedEmail(addr);
    setMailToUrl(`mailto:${addr}`);
  }, []);

  // GSAP animations for the footer (curtain, marquee, wordmark, status, and magnetic buttons)
  useGSAP(() => {
    const footer = footerRef.current;
    const inner = innerRef.current;
    const main = document.getElementById("sonara-main");

    if (!footer || !main || !inner) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Curtain layout logic ---
    const updateLayout = () => {
      const fh = footer.offsetHeight;
      const vh = window.innerHeight;
      
      if (fh <= vh && !reduced) {
        footer.style.position = "fixed";
        footer.style.bottom = "0";
        footer.style.left = "0";
        footer.style.right = "0";
        main.style.marginBottom = `${fh}px`;
      } else {
        footer.style.position = "relative";
        footer.style.bottom = "";
        footer.style.left = "";
        footer.style.right = "";
        main.style.marginBottom = "0px";
      }
      ScrollTrigger.refresh();
    };

    // ResizeObserver for tracking footer height changes dynamically
    let lastHeight = 0;
    const resizeObserver = new ResizeObserver(() => {
      const currentHeight = footer.offsetHeight;
      if (Math.abs(currentHeight - lastHeight) > 2) {
        lastHeight = currentHeight;
        updateLayout();
      }
    });
    resizeObserver.observe(footer);

    window.addEventListener("resize", updateLayout);
    updateLayout();

    // --- Parallax curtain reveal & Letter-by-letter Wordmark stagger ---
    let scrollTriggerInstance: ScrollTrigger | null = null;
    if (!reduced) {
      const letters = footer.querySelectorAll("[data-snr-letter]");
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: main,
          start: "bottom bottom",
          end: () => `bottom bottom-=${Math.min(footer.offsetHeight, window.innerHeight * 0.9)}`,
          scrub: 0.5,
          invalidateOnRefresh: true,
        }
      });

      tl.fromTo(inner, { yPercent: -16 }, { yPercent: 0, ease: "none" }, 0);
      tl.fromTo(letters, { yPercent: 108 }, { yPercent: 0, stagger: 0.06, ease: "power1.out" }, 0.1);
      
      scrollTriggerInstance = tl.scrollTrigger || null;
    }

    // --- Infinite horizontal marquee loop ---
    let marqueeTween: gsap.core.Tween | null = null;
    if (marqueeRef.current) {
      marqueeTween = gsap.to(marqueeRef.current, {
        xPercent: -50,
        duration: 32,
        ease: "none",
        repeat: -1,
      });
    }

    // --- Status dot pulse ---
    let statusTween: gsap.core.Tween | null = null;
    if (statusDotRef.current) {
      statusTween = gsap.to(statusDotRef.current, {
        opacity: 0.3,
        duration: 1.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }

    // --- Magnetic CTA buttons (Fine pointers only, e.g. mouse, trackpad) ---
    const magneticElements = footer.querySelectorAll("[data-magnetic]");
    const moves: Array<() => void> = [];

    if (!reduced && window.matchMedia("(pointer: fine)").matches) {
      magneticElements.forEach((el) => {
        const moveHandler = (e: Event) => {
          const mouseEvent = e as MouseEvent;
          const r = el.getBoundingClientRect();
          const dx = mouseEvent.clientX - (r.left + r.width / 2);
          const dy = mouseEvent.clientY - (r.top + r.height / 2);
          gsap.to(el, { x: dx * 0.25, y: dy * 0.35, duration: 0.5, ease: "power3.out" });
        };

        const leaveHandler = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
        };

        el.addEventListener("mousemove", moveHandler);
        el.addEventListener("mouseleave", leaveHandler);

        moves.push(() => {
          el.removeEventListener("mousemove", moveHandler);
          el.removeEventListener("mouseleave", leaveHandler);
        });
      });
    }

    // Cleanup functions
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateLayout);
      if (scrollTriggerInstance) scrollTriggerInstance.kill();
      if (marqueeTween) marqueeTween.kill();
      if (statusTween) statusTween.kill();
      moves.forEach((clean) => clean());
    };
  }, { scope: footerRef });

  // Canvas wave animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let rafId = 0;
    let t = 0;

    let mx = -9999;
    let mxT = -9999;
    let boost = 0;
    let boostT = 0;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      
      if (mx === -9999) mx = mxT;
      mx += (mxT - mx) * 0.14;
      boost += (boostT - boost) * 0.08;

      const step = 9;
      const bw = 3.5;
      const mid = h / 2;

      for (let x = 0; x < w; x += step) {
        const n = x / Math.max(w, 1);
        const a1 = Math.sin(n * 9.4 + time * 1.3) * 0.5 + 0.5;
        const a2 = Math.sin(n * 23.7 - time * 0.8 + 1.7) * 0.5 + 0.5;
        const a3 = Math.sin(n * 53.1 + time * 2.1) * 0.5 + 0.5;
        
        let amp = 0.12 + 0.88 * (a1 * 0.55 + a2 * 0.3 + a3 * 0.15);
        const d = (x - mx) / 110;
        
        amp = Math.min(1.05, amp + boost * Math.exp(-d * d) * 0.85);
        const bh = Math.max(3, amp * h * 0.92);

        ctx.globalAlpha = 0.28 + amp * 0.72;
        ctx.fillStyle = "#0052FF"; // Accent blue
        ctx.beginPath();
        
        if (ctx.roundRect) {
          ctx.roundRect(x, mid - bh / 2, bw, bh, bw / 2);
        } else {
          ctx.rect(x, mid - bh / 2, bw, bh);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(t);
    };

    const loop = () => {
      t += 0.016;
      draw(t);
      rafId = requestAnimationFrame(loop);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const handlePointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mxT = e.clientX - r.left;
      boostT = 1;
    };

    const handlePointerLeave = () => {
      boostT = 0;
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    // Initial loop execution
    rafId = requestAnimationFrame(loop);

    // IntersectionObserver to pause when off-screen for performance
    let intersectionObserver: IntersectionObserver | null = null;
    try {
      intersectionObserver = new IntersectionObserver((entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible && !rafId) {
          rafId = requestAnimationFrame(loop);
        } else if (!isVisible && rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      });
      intersectionObserver.observe(canvas);
    } catch (e) {
      console.warn("IntersectionObserver not supported for canvas animation", e);
    }

    return () => {
      resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || newsSubmitting) return;

    setNewsSubmitting(true);
    setNewsError(null);
    try {
      // Capture réelle du prospect (POST /api/leads, rate-limité par IP côté serveur).
      await api.leads.create({
        name: value.split("@")[0] || "Prospect",
        email: value,
        message: "Inscription newsletter depuis le footer de la landing.",
      });
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      setNewsError(
        err instanceof ApiError ? err.message : "Erreur réseau. Réessayez dans un instant."
      );
    } finally {
      setNewsSubmitting(false);
    }
  };

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      window.scrollTo(0, 0);
    }
  };

  return (
    <footer
      ref={footerRef}
      id="sonara-footer"
      data-screen-label="Footer Sonara"
      style={{
        position: "relative",
        zIndex: 1,
        background: "var(--bg-primary, #121212)",
        color: "var(--text-primary, #FFFFFF)",
        overflow: "hidden",
        borderTop: "1px solid var(--border, rgba(255,255,255,0.08))",
      }}
    >
      <div ref={innerRef} id="sonara-footer-inner" style={{ display: "flex", flexDirection: "column" }}>
                {/* ==================== 1. BLOC CTA ==================== */}
        <section
          style={{
            padding: "clamp(32px, 4vh, 60px) clamp(24px, 5vw, 72px) 0",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "48px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: "min(100%, 420px)" }}>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-secondary, rgba(255, 255, 255, 0.45))",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <span style={{ color: "#0052FF" }}>◆</span>
              <span>Sonara — Enquêtes vocales par IA</span>
            </p>
            <h2
              style={{
                fontSize: "clamp(42px, 6.5vw, 92px)",
                fontWeight: 900,
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
                margin: 0,
                color: "var(--text-primary, #FFFFFF)",
                textWrap: "balance",
              }}
            >
              L'oreille que vous<br />
              <em
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontStyle: "italic",
                  fontWeight: 700,
                  color: "#0052FF",
                  letterSpacing: "-0.06em",
                }}
              >
                n'aviez pas.
              </em>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              <a
                href="#demo"
                data-magnetic="true"
                className="btn-footer-cta-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "18px 34px",
                  borderRadius: "999px",
                  background: "#0052FF",
                  color: "#FFFFFF",
                  fontSize: "17px",
                  fontWeight: 700,
                  textDecoration: "none",
                  transition: "background 0.3s, color 0.3s, transform 0.1s",
                }}
              >
                Demander une démo<span aria-hidden="true">→</span>
              </a>
              <a
                href={mailToUrl}
                data-magnetic="true"
                className="btn-footer-cta-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "18px 30px",
                  borderRadius: "999px",
                  border: "1px solid var(--border-accent, rgba(255, 255, 255, 0.25))",
                  color: "var(--text-primary, #FFFFFF)",
                  fontSize: "17px",
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "border-color 0.3s, color 0.3s, transform 0.1s",
                }}
              >
                Parler à l'équipe
              </a>
            </div>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                letterSpacing: "0.08em",
                color: "var(--text-secondary, rgba(255, 255, 255, 0.45))",
                margin: 0,
              }}
            >
              Réponse sous 24 h — démo de 30 minutes.
            </p>
          </div>
        </section>

        {/* ==================== 2. ONDE SONORE CANVASES ==================== */}
        <section style={{ padding: "12px clamp(24px, 5vw, 72px) 0" }}>
          <canvas
            ref={canvasRef}
            id="sonara-wave"
            style={{
              display: "block",
              width: "100%",
              height: "76px",
              cursor: "pointer",
            }}
          />
        </section>

        {/* ==================== 3. COLONNES DE LIENS ==================== */}
        <section
          style={{
            margin: "20px clamp(24px, 5vw, 72px) 0",
            paddingTop: "16px",
            borderTop: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "40px 28px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-secondary, rgba(255, 255, 255, 0.4))",
                margin: "0 0 12px",
                fontWeight: 400,
              }}
            >
              Produit
            </h3>
            <a href="#platform" className="footer-link">Fonctionnalités</a>
            <a href="#pricing" className="footer-link">Tarifs</a>
            <a href="#usecases" className="footer-link">Cas d'usage</a>
            <a href="#platform" className="footer-link">Sécurité &amp; conformité</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-secondary, rgba(255, 255, 255, 0.4))",
                margin: "0 0 12px",
                fontWeight: 400,
              }}
            >
              Secteurs
            </h3>
            <a href="#usecases" className="footer-link">Banques &amp; finance</a>
            <a href="#usecases" className="footer-link">Télécoms</a>
            <a href="#usecases" className="footer-link">Assurances</a>
            <a href="#usecases" className="footer-link">Institutions publiques</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-secondary, rgba(255, 255, 255, 0.4))",
                margin: "0 0 12px",
                fontWeight: 400,
              }}
            >
              Entreprise
            </h3>
            <a href="#" className="footer-link">À propos</a>
            <a href="#" className="footer-link">Carrières</a>
            <a href="#" className="footer-link">Presse</a>
            <a href="#" className="footer-link">Blog</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-secondary, rgba(255, 255, 255, 0.4))",
                margin: "0 0 12px",
                fontWeight: 400,
              }}
            >
              Contact
            </h3>
            <a
              id="sonara-email"
              href={mailToUrl}
              style={{
                fontFamily: "'Space Mono', monospace",
                color: "var(--text-primary, #FFFFFF)",
                textDecoration: "none",
                fontSize: "15px",
                padding: "4px 0",
                transition: "color 0.25s",
              }}
              className="footer-email-link"
            >
              {displayedEmail}
            </a>
            <p
              style={{
                color: "var(--text-secondary, rgba(255, 255, 255, 0.55))",
                fontSize: "15px",
                margin: "4px 0 12px",
                lineHeight: 1.5,
              }}
            >
              Abidjan — Plateau<br />
              Côte d'Ivoire
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <a href="#" className="footer-pill-social">LinkedIn</a>
              <a href="#" className="footer-pill-social">X</a>
              <a href="#" className="footer-pill-social">YouTube</a>
            </div>
          </div>
        </section>

        {/* ==================== 4. NEWSLETTER FORM ==================== */}
        <section
          style={{
            margin: "6px clamp(24px, 5vw, 72px) 0",
            paddingTop: "6px",
            borderTop: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0px", minWidth: "min(100%, 300px)", maxWidth: "460px" }}>
            <h3
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-secondary, rgba(255, 255, 255, 0.4))",
                margin: 0,
                fontWeight: 400,
              }}
            >
              Restez à l'écoute
            </h3>
            <p
              id="sonara-news-p"
              style={{
                fontSize: "16px",
                color: "var(--text-secondary, rgba(255, 255, 255, 0.75))",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              Études de cas et nouveautés produit. Un e-mail par mois, pas plus.
            </p>
          </div>
          
          {!subscribed ? (
            <form
              onSubmit={handleNewsSubmit}
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: "10px",
                alignItems: "center",
                maxWidth: "100%",
              }}
            >
              <input
                id="sonara-news-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                aria-label="Adresse e-mail"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "14px",
                  color: "var(--text-primary, #FFFFFF)",
                  background: "var(--bg-tertiary, rgba(255, 255, 255, 0.06))",
                  border: "1px solid var(--border, rgba(255, 255, 255, 0.18))",
                  borderRadius: "999px",
                  padding: "10px 16px",
                  width: "240px",
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border-color 0.25s",
                }}
                className="footer-news-input"
              />
              <button
                type="submit"
                disabled={newsSubmitting}
                data-magnetic="true"
                style={{
                  fontFamily: "var(--font-body), sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  background: "#0052FF",
                  border: "none",
                  borderRadius: "999px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "background 0.3s, color 0.3s, transform 0.1s",
                }}
                className="footer-news-submit"
              >
                {newsSubmitting ? "Envoi…" : "S'abonner"}
              </button>
            </form>
          ) : (
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "14px",
                color: "var(--text-primary, #FFFFFF)",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span style={{ color: "#0052FF" }}>◆</span>Merci — vous êtes sur la liste.
            </p>
          )}
          {newsError && (
            <p
              role="alert"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "#FF5C5C",
                margin: "10px 0 0",
              }}
            >
              {newsError}
            </p>
          )}
        </section>

        {/* ==================== 5. CONFIANCE BADGES ==================== */}
        <section
          style={{
            margin: "2px clamp(24px, 5vw, 72px) 0",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.06em",
              color: "var(--text-secondary, rgba(255, 255, 255, 0.72))",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.14))",
              borderRadius: "999px",
              padding: "4px 10px",
            }}
          >
            <span style={{ color: "#0052FF", fontSize: "9px" }}>◆</span>
            Données hébergées en Côte d'Ivoire — ST Digital
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.06em",
              color: "var(--text-secondary, rgba(255, 255, 255, 0.72))",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.14))",
              borderRadius: "999px",
              padding: "4px 10px",
            }}
          >
            <span style={{ color: "#0052FF", fontSize: "9px" }}>◆</span>
            Conforme ARTCI
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.06em",
              color: "var(--text-secondary, rgba(255, 255, 255, 0.72))",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.14))",
              borderRadius: "999px",
              padding: "4px 10px",
            }}
          >
            <span
              ref={statusDotRef}
              id="sonara-status-dot"
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#46D58A",
                display: "inline-block",
              }}
            />
            Tous les systèmes opérationnels
          </span>
        </section>

        {/* ==================== 6. MARQUEE ==================== */}
        <section
          style={{
            marginTop: "16px",
            borderTop: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
            borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
            padding: "12px 0",
            overflow: "hidden",
          }}
        >
          <div
            ref={marqueeRef}
            id="sonara-marquee-track"
            style={{
              display: "flex",
              width: "max-content",
              willChange: "transform",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "44px", paddingRight: "44px" }}>
              <span className="marquee-span">Français ivoirien nat</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
              <span className="marquee-span">Zéro code — brief en langage naturel</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
              <span className="marquee-span">Transcription &amp; résumé en moins de 2 min</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
              <span className="marquee-span">Conversation adaptative par IA</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
              <span className="marquee-span">Hébergé en CI — pricing en FCFA</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "44px", paddingRight: "44px" }}>
              <span className="marquee-span">Français ivoirien nat</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
              <span className="marquee-span">Zéro code — brief en langage naturel</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
              <span className="marquee-span">Transcription &amp; résumé en moins de 2 min</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
              <span className="marquee-span">Conversation adaptative par IA</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
              <span className="marquee-span">Hébergé en CI — pricing en FCFA</span>
              <span style={{ color: "#0052FF", fontSize: "11px" }}>◆</span>
            </div>
          </div>
        </section>

        {/* ==================== 7. BARRE LÉGALE ==================== */}
        <section
          style={{
            padding: "10px clamp(24px, 5vw, 72px)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                color: "var(--text-secondary, rgba(255, 255, 255, 0.4))",
              }}
            >
              © 2026 Sonara — Tous droits réservés
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "24px" }}>
            <a href="#" className="footer-legal-link">Confidentialité</a>
            <a href="#" className="footer-legal-link">CGU</a>
            <a href="#" className="footer-legal-link">Conformité ARTCI</a>
            <button
              onClick={scrollToTop}
              aria-label="Retour en haut"
              style={{
                width: "40px",
                height: "40px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-accent, rgba(255, 255, 255, 0.25))",
                borderRadius: "999px",
                background: "transparent",
                color: "var(--text-primary, #FFFFFF)",
                fontSize: "16px",
                cursor: "pointer",
                transition: "border-color 0.25s, color 0.25s",
              }}
              className="footer-scroll-top-btn"
            >
              ↑
            </button>
          </div>
        </section>

        {/* ==================== 8. WORDMARK GÉANT ==================== */}
        <section
          aria-hidden="true"
          style={{
            overflow: "hidden",
            padding: "0 clamp(16px, 3vw, 48px)",
            marginTop: "0px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              transform: "none",
            }}
          >
            {["S", "O", "N", "A", "R", "A"].map((letter, idx) => (
              <span
                key={idx}
                data-snr-letter={letter}
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(64px, 15.5vw, 310px)",
                  lineHeight: 0.8,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary, #FFFFFF)",
                  display: "inline-block",
                  transition: "color 0.35s",
                  cursor: "default",
                }}
                className="footer-wordmark-letter"
              >
                {letter}
              </span>
            ))}
          </div>
        </section>

      </div>
    </footer>
  );
}
