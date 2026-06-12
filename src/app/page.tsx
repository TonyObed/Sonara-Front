"use client";

import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  // ─── STATE VARIABLES ──────────────────────────────────────────
  const [isLightMode, setIsLightMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("tab-campaigns");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isYearlyPricing, setIsYearlyPricing] = useState(false);
  const [priceOpacity, setPriceOpacity] = useState(1);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Simulator states
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("En attente...");
  const [callTimer, setCallTimer] = useState("00:00");
  const [customQuestionInput, setCustomQuestionInput] = useState("");
  const [appliedCustomQuestion, setAppliedCustomQuestion] = useState("");
  const [dialogue, setDialogue] = useState<Array<{ sender: "ai" | "user"; text: string }>>([]);
  const [showReport, setShowReport] = useState(false);

  // ─── REFS ─────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogueLogRef = useRef<HTMLDivElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const mouseGlowRef = useRef<HTMLDivElement>(null);

  const animationIdRef = useRef<number | null>(null);
  const callTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutIdsRef = useRef<NodeJS.Timeout[]>([]);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const waveAmplitudeRef = useRef(0);
  const currentAmplitudeRef = useRef(0);
  const waveTimeRef = useRef(0);

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

  // ─── DYNAMIC STATISTICS COUNT UP (BENTO & EASED) ──────────────
  useEffect(() => {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        let delayOffset = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardEl = entry.target as HTMLElement;
            const numberEl = cardEl.querySelector(".stat-number");
            if (!numberEl) return;

            const target = parseInt(numberEl.getAttribute("data-target") || "0", 10);
            const prefix = numberEl.getAttribute("data-prefix") || "";
            const suffix = numberEl.getAttribute("data-suffix") || "";
            const duration = 2000; // ms

            function easeOutCubic(t: number) {
              return 1 - Math.pow(1 - t, 3);
            }

            setTimeout(() => {
              cardEl.classList.add("animate-in");

              let startTime: number | null = null;
              function animateCount(timestamp: number) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const easedProgress = easeOutCubic(progress);
                const currentVal = Math.floor(easedProgress * target);

                if (numberEl) {
                  numberEl.textContent = `${prefix}${currentVal}${suffix}`;
                }

                if (progress < 1) {
                  requestAnimationFrame(animateCount);
                } else if (numberEl) {
                  numberEl.textContent = `${prefix}${target}${suffix}`;
                }
              }
              requestAnimationFrame(animateCount);
            }, delayOffset);

            delayOffset += 150;
            statsObserver.unobserve(cardEl);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".stat-card").forEach((el) => statsObserver.observe(el));
    return () => statsObserver.disconnect();
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

  // ─── TAB SWITCH LOGIC ──────────────────────────────────────────
  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    
    // Trigger height transitions on active tab if it is analytics
    if (tabId === "tab-analytics") {
      setTimeout(() => {
        const fills = document.querySelectorAll(".chart-bar-fill") as NodeListOf<HTMLElement>;
        fills.forEach((fill) => {
          const targetHeight = fill.getAttribute("data-height") || "0%";
          fill.style.height = targetHeight;
        });
      }, 50);
    } else {
      // Reset heights
      const fills = document.querySelectorAll(".chart-bar-fill") as NodeListOf<HTMLElement>;
      fills.forEach((fill) => {
        fill.style.height = "0%";
      });
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

  // ─── SIMULATOR DRAW WAVE ──────────────────────────────────────
  const drawWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = waveAmplitudeRef.current === 1.0 ? "rgba(0, 82, 255, 0.9)" : "rgba(36, 113, 163, 0.9)";

    currentAmplitudeRef.current += (waveAmplitudeRef.current - currentAmplitudeRef.current) * 0.1;

    for (let x = 0; x < canvas.width; x++) {
      const y = canvas.height / 2 +
        Math.sin(x * 0.05 + waveTimeRef.current) * currentAmplitudeRef.current * 18 +
        Math.sin(x * 0.115 - waveTimeRef.current * 1.5) * (currentAmplitudeRef.current * 6);

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
    waveTimeRef.current += 0.15;
    animationIdRef.current = requestAnimationFrame(drawWave);
  };

  const drawFlatLine = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  // ─── RESIZE CANVAS ────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        if (!isCalling) {
          drawFlatLine();
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial sizing

    return () => window.removeEventListener("resize", handleResize);
  }, [isCalling]);

  // ─── SIMULATOR TIMELINE ACTIONS ───────────────────────────────
  const formatTime = (sec: number) => {
    const min = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${min}:${s}`;
  };

  const startCall = () => {
    setIsCalling(true);
    setDialogue([]);
    setShowReport(false);
    setCallStatus("Appel en cours...");
    setCallTimer("00:00");

    let sec = 0;
    callTimerIntervalRef.current = setInterval(() => {
      sec++;
      setCallTimer(formatTime(sec));
    }, 1000);

    waveAmplitudeRef.current = 0.2; // Hum
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    animationIdRef.current = requestAnimationFrame(drawWave);

    const addAI = (text: string, delay: number) => {
      const tId = setTimeout(() => {
        waveAmplitudeRef.current = 1.0; // AI speaks
        setDialogue((prev) => [...prev, { sender: "ai", text }]);
        setTimeout(() => {
          if (dialogueLogRef.current) {
            dialogueLogRef.current.scrollTop = dialogueLogRef.current.scrollHeight;
          }
        }, 50);
      }, delay);
      callTimeoutIdsRef.current.push(tId);
    };

    const addAIOff = (delay: number) => {
      const tId = setTimeout(() => {
        waveAmplitudeRef.current = 0.1; // AI stops
      }, delay);
      callTimeoutIdsRef.current.push(tId);
    };

    const addUser = (text: string, delay: number) => {
      const tId = setTimeout(() => {
        waveAmplitudeRef.current = 0.8; // User speaks
        setDialogue((prev) => [...prev, { sender: "user", text }]);
        setTimeout(() => {
          if (dialogueLogRef.current) {
            dialogueLogRef.current.scrollTop = dialogueLogRef.current.scrollHeight;
          }
        }, 50);
      }, delay);
      callTimeoutIdsRef.current.push(tId);
    };

    const addUserOff = (delay: number) => {
      const tId = setTimeout(() => {
        waveAmplitudeRef.current = 0.1; // User stops
      }, delay);
      callTimeoutIdsRef.current.push(tId);
    };

    // 1. AI starts
    addAI("Bonjour Monsieur Koné ! C'est Awa de la Banque XYZ. Yako pour l'attente l'autre jour ô. J'ai besoin de 2 petites minutes pour avoir votre avis sur nos services, c'est possible ?", 1500);
    addAIOff(5000);

    // 2. User responds
    addUser("Oui bonjour Awa, y a pas de soucis, tu peux y aller, je t'écoute.", 6000);
    addUserOff(8500);

    // 3. AI question
    const questionText = appliedCustomQuestion 
      ? appliedCustomQuestion 
      : "Super, merci ! Globalement, sur une échelle de 1 à 5, comment vous évaluez l'accueil physique dans notre agence d'Angré ?";
    addAI(questionText, 9500);
    addAIOff(13500);

    // 4. User answer
    const answerText = appliedCustomQuestion 
      ? "Ah, par rapport à ça... Je trouve que c'est un peu lent, mais ça peut aller."
      : "Franchement, je mets 3... Les rangs là-bas c'est trop décourageant, on perd tout notre temps.";
    addUser(answerText, 14500);
    addUserOff(18500);

    // 5. AI follow up
    const responseText = appliedCustomQuestion
      ? "C'est bien noté ô ! Nous faisons de notre mieux pour corriger cela. Merci pour votre franchise."
      : "Ah, Yako pour ça ô ! L'attente dans les rangs à Angré, je comprends tout à fait, c'est pas facile. Mais dites-moi, pour éviter les rangs, est-ce que vous avez déjà testé notre application mobile pour faire vos virements ?";
    addAI(responseText, 19500);
    addAIOff(24500);

    // 6. User reply
    const replyText = appliedCustomQuestion 
      ? "D'accord, merci." 
      : "Ah bon ? Non, je ne savais pas du tout que c'était possible de faire ça depuis la maison.";
    addUser(replyText, 25500);
    addUserOff(28500);

    // 7. AI end
    const endText = appliedCustomQuestion
      ? "Merci infiniment d'avoir pris le temps de me répondre ô. Passez une excellente journée !"
      : "Djaah, mais c'est très simple ô ! Je viens de vous envoyer le lien de téléchargement direct par SMS. Vous allez voir, ça va vous faciliter la vie. Merci infiniment pour votre temps et passez une excellente journée !";
    addAI(endText, 29500);
    addAIOff(33500);

    // Auto close
    const finalId = setTimeout(() => {
      terminateCall(true);
    }, 34000);
    callTimeoutIdsRef.current.push(finalId);
  };

  const terminateCall = (completed = false) => {
    setIsCalling(false);
    setCallStatus("Appel terminé");

    if (callTimerIntervalRef.current) clearInterval(callTimerIntervalRef.current);
    callTimeoutIdsRef.current.forEach((id) => clearTimeout(id));
    callTimeoutIdsRef.current = [];

    waveAmplitudeRef.current = 0;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    drawFlatLine();

    if (completed) {
      setShowReport(true);
    }
  };

  const applyCustomPrompt = () => {
    if (customQuestionInput.trim()) {
      setAppliedCustomQuestion(customQuestionInput.trim());
      // Flash success on button
      const btn = document.getElementById("applyCustomPromptBtn");
      if (btn) {
        btn.textContent = "Appliquée !";
        btn.style.borderColor = "var(--success)";
        btn.style.color = "var(--success)";
        setTimeout(() => {
          btn.textContent = "Appliquer";
          btn.style.borderColor = "var(--border-strong)";
          btn.style.color = "";
        }, 1500);
      }
    }
  };

  // Initial draw flat line
  useEffect(() => {
    drawFlatLine();
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
  <section id="stats">
    <div className="container">
      <div className="stats-grid">
        {/* Card 1 (Large - Spans 2 Cols) */}
        <div className="stat-card large">
          <div className="stat-content">
            <div className="stat-number" data-target="75" data-suffix="%">0%</div>
            <div className="stat-label">Réduction moyenne des coûts d'exploitation par rapport à un centre d'appels traditionnel</div>
          </div>
          <div className="stat-graphic">
            <div className="voice-wave" aria-hidden="true">
              <span className="voice-wave-bar"></span>
              <span className="voice-wave-bar"></span>
              <span className="voice-wave-bar"></span>
              <span className="voice-wave-bar"></span>
              <span className="voice-wave-bar"></span>
            </div>
          </div>
        </div>
        {/* Card 2 (Small - Spans 1 Col) */}
        <div className="stat-card">
          <div className="stat-number" data-target="100" data-suffix="k+">0k+</div>
          <div className="stat-label">Capacité d'appels simultanés sans latence</div>
        </div>
        {/* Card 3 (Small - Spans 1 Col) */}
        <div className="stat-card">
          <div className="stat-number" data-target="10" data-prefix="&lt; " data-suffix=" min">0 min</div>
          <div className="stat-label">Génération de rapports d'analyse</div>
        </div>
        {/* Card 4 (Large - Spans 2 Cols) */}
        <div className="stat-card large">
          <div className="stat-content">
            <div className="stat-number" data-target="92" data-suffix="%">0%</div>
            <div className="stat-label">Taux moyen de complétion des enquêtes menées intégralement par nos agents IA</div>
          </div>
          <div className="stat-graphic">
            <div className="voice-pulse-ring" aria-hidden="true">
              <span className="voice-pulse-circle"></span>
              <span className="voice-pulse-circle"></span>
              <span className="voice-pulse-circle"></span>
              <span className="voice-pulse-dot"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ HOW IT WORKS */}
  <section id="how">
    <div className="container">
      <div style={{ "textAlign": "center", "display": "flex", "flexDirection": "column", "alignItems": "center" }}>
        <span className="label-badge reveal">Processus</span>
        <h2 className="section-title reveal">Trois étapes simples. <span>Zéro humain.</span></h2>
        <p className="section-subtitle reveal">Mettez en place vos campagnes téléphoniques automatisées en moins de temps qu'il n'en faut pour rédiger un email.</p>
      </div>

      <div className="steps-grid">
        <div className="step-card reveal">
          <div className="step-header">
            <span className="step-badge">ÉTAPE 01</span>
            <div className="step-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
          </div>
          <h3 className="step-title">Configurer l'IA</h3>
          <p>Rédigez l'objectif de votre enquête et vos questions en français. Définissez le ton, le degré d'expressions locales (nouchi) et importez votre fichier de contacts CSV.</p>
        </div>

        <div className="step-card reveal reveal-delay-1">
          <div className="step-header">
            <span className="step-badge">ÉTAPE 02</span>
            <div className="step-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
          </div>
          <h3 className="step-title">Lancement instantané</h3>
          <p>Sonara initie les appels. Notre modèle s'adapte à la voix de l'interlocuteur, gère les interruptions, pose des questions de relance personnalisées et rebondit avec fluidité.</p>
        </div>

        <div className="step-card reveal reveal-delay-2">
          <div className="step-header">
            <span className="step-badge">ÉTAPE 03</span>
            <div className="step-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
            </div>
          </div>
          <h3 className="step-title">Analyses & Rapports</h3>
          <p>Accédez aux transcriptions complètes, aux sentiments détectés (satisfait, neutre, irrité) et aux résumés automatisés via votre dashboard ou par export direct.</p>
        </div>
      </div>
    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ USE CASES */}
  <section id="usecases">
    <div className="container">
      <div className="usecase-intro">
        <div>
          <span className="label-badge reveal">Applications</span>
          <h2 className="section-title reveal">Une IA adaptée à <span>votre industrie</span></h2>
        </div>
        <p className="section-subtitle reveal" style={{ "marginBottom": "0", "maxWidth": "440px" }}>Découvrez comment les banques, opérateurs de téléphonie et assureurs optimisent leur gestion client.</p>
      </div>

      <div className="usecases-grid">
        <div className="usecase-card reveal">
          <div className="usecase-meta">
            <span className="usecase-sector">Banque & Microfinance</span>
            <span className="usecase-vol"> KYC Vocal </span>
          </div>
          <h3>Satisfaction Client & Qualification</h3>
          <p>Automatisez les appels post-ouverture de compte, qualifiez les dossiers KYC et menez des enquêtes d'évaluation des conseillers en agence.</p>
          <div className="usecase-tags">
            <span className="usecase-tag">Conformité</span>
            <span className="usecase-tag">NPS</span>
          </div>
        </div>

        <div className="usecase-card reveal reveal-delay-1">
          <div className="usecase-meta">
            <span className="usecase-sector">Télécommunications</span>
            <span className="usecase-vol"> NPS de masse </span>
          </div>
          <h3>Prévention du Churn & Rétention</h3>
          <p>Contactez instantanément des milliers de clients suite à un incident réseau ou une baisse d'activité pour mesurer leur attachement et prévenir la perte de clients.</p>
          <div className="usecase-tags">
            <span className="usecase-tag">Fidélité</span>
            <span className="usecase-tag">Grande échelle</span>
          </div>
        </div>

        <div className="usecase-card reveal reveal-delay-2">
          <div className="usecase-meta">
            <span className="usecase-sector">Assurances</span>
            <span className="usecase-vol"> Sinistres & Relances </span>
          </div>
          <h3>Suivi et renouvellement</h3>
          <p>Relancez de manière bienveillante les contrats arrivant à échéance et automatisez la qualification initiale des déclarations de sinistres auto/santé.</p>
          <div className="usecase-tags">
            <span className="usecase-tag">Renouvellement</span>
            <span className="usecase-tag">Déclaration</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ INTERACTIVE SIMULATOR (DEMO) */}
  <section id="demo">
    <div className="container demo-grid">
      <div className="demo-interactive-wrapper reveal">
        <div className="phone-mockup-header">
          <div className="caller-profile">
            <div className="caller-avatar">🎙️</div>
            <div className="caller-details">
              <span className="caller-name">Awa — Sonara IA</span>
              <span className={`caller-status ${isCalling ? "active" : ""}`} id="callStatus">{callStatus}</span>
            </div>
          </div>
          <span className="call-timer" id="callTimer">{callTimer}</span>
        </div>

        <div className="wave-canvas-container">
          <canvas ref={canvasRef} id="waveCanvas"></canvas>
        </div>

        <div className="dialogue-log" ref={dialogueLogRef} id="dialogueLog">
          {dialogue.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", margin: "auto" }} id="demoPlaceholder">
              Cliquez sur "Lancer l'appel de test" ci-dessous pour démarrer la simulation.
            </div>
          )}
          {dialogue.map((msg, idx) => (
            <div key={idx} className={`chat-row ${msg.sender === "ai" ? "ai-row" : "user-row"}`}>
              <div className="bubble-icon">{msg.sender === "ai" ? "A" : "K"}</div>
              <div className="bubble-txt">{msg.text}</div>
            </div>
          ))}
        </div>

        {/* Simulator Report placeholder (hidden initially) */}
        <div className="analysis-report-card" id="analysisReport" style={{ display: showReport ? "block" : "none" }}>
          <h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Rapport d'appel Sonara</h4>
          <p><strong>Résumé :</strong> <span id="reportSummary">
              {appliedCustomQuestion 
                ? `L'IA a posé la question personnalisée: "${appliedCustomQuestion}". Le client a répondu de façon coopérative.`
                : "Client insatisfait de l'attente à l'agence d'Angré (Note 3/5). Ne connaissait pas l'application mobile. Lien SMS de téléchargement envoyé automatiquement."}
            </span></p>
          <div className="report-badge-row">
            <span className="report-badge sentiment" id="reportSentiment">
              {appliedCustomQuestion ? "Sentiment: Positif (4/5)" : "Sentiment: Neutre-Négatif (3/5)"}
            </span>
            <span className="report-badge action" id="reportAction" style={appliedCustomQuestion ? { color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)" } : { color: "var(--brand-accent)", background: "var(--brand-accent-t)" }}>
              {appliedCustomQuestion ? "Action: Archive standard" : "Action: Relance SMS envoyée"}
            </span>
          </div>
        </div>

        <div className="simulator-controls">
          <div className="simulator-btn-row">
            <button className="btn btn-primary sim-btn" id="startCallBtn" onClick={startCall} disabled={isCalling}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Lancer l'appel
            </button>
            <button className="btn btn-secondary sim-btn" id="stopCallBtn" disabled>
              Raccourcir / Raccrocher
            </button>
          </div>
          <div className="custom-question-input">
            <input type="text" id="customPromptInput" placeholder="Personnalisez la question d'enquête d'Awa..." />
            <button className="btn btn-secondary" id="applyCustomPromptBtn" onClick={applyCustomPrompt}>Appliquer</button>
          </div>
        </div>
      </div>

      <div className="demo-info reveal reveal-delay-2">
        <span className="label-badge">Démonstration</span>
        <h2 className="section-title">Une IA qui parle <span>comme vos clients.</span></h2>
        <p className="section-subtitle" style={{ "marginBottom": "24px" }}>
          Les automates vocaux rigides frustrent vos clients. Sonara utilise des modèles linguistiques avancés adaptés à la syntaxe, au rythme et aux expressions de l'Afrique de l'Ouest (français ivoirien, nouchi fluide).
        </p>
        <ul style={{ "listStyle": "none", "display": "flex", "flexDirection": "column", "gap": "16px" }}>
          <li style={{ "display": "flex", "gap": "12px", "fontSize": "14.5px", "color": "var(--text-secondary)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2.5" style={{ "flexShrink": "0" }}><path d="M20 6 9 17l-5-5"/></svg>
            <span><strong>Compréhension des nuances :</strong> Détecte les hésitations, gère le nouchi et les réponses vagues en relançant le client.</span>
          </li>
          <li style={{ "display": "flex", "gap": "12px", "fontSize": "14.5px", "color": "var(--text-secondary)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2.5" style={{ "flexShrink": "0" }}><path d="M20 6 9 17l-5-5"/></svg>
            <span><strong>Zéro Latence :</strong> Conversations fluides sans temps d'attente gênant entre les phrases.</span>
          </li>
          <li style={{ "display": "flex", "gap": "12px", "fontSize": "14.5px", "color": "var(--text-secondary)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2.5" style={{ "flexShrink": "0" }}><path d="M20 6 9 17l-5-5"/></svg>
            <span><strong>Rapport automatisé :</strong> Les conversations sont retranscrites, analysées par sentiment et synthétisées instantanément.</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ PLATFORM SHOWCASE (TABS) */}
  <section id="dashboard-showcase">
    <div className="container">
      <div style={{ "textAlign": "center", "display": "flex", "flexDirection": "column", "alignItems": "center", "marginBottom": "48px" }}>
        <span className="label-badge reveal">L'Interface</span>
        <h2 className="section-title reveal">Prenez le contrôle <span>de vos données</span></h2>
        <p className="section-subtitle reveal">Explorez l'interface intuitive conçue pour vos équipes marketing et relation client.</p>
      </div>

      <div className="showcase-tabs reveal">
        <button className={`tab-btn ${activeTab === "tab-campaigns" ? "active" : ""}`} onClick={() => switchTab("tab-campaigns")}>Gestion des Campagnes</button>
        <button className={`tab-btn ${activeTab === "tab-analytics" ? "active" : ""}`} onClick={() => switchTab("tab-analytics")}>Analyses & Rapports</button>
        <button className={`tab-btn ${activeTab === "tab-agent" ? "active" : ""}`} onClick={() => switchTab("tab-agent")}>Éditeur d'Agent IA</button>
      </div>

      <div className="dashboard-mockup reveal reveal-delay-1">
        <div className="db-header">
          <div className="db-logo">
            <img src="Branding bard sonara/Sonara_Logo_Variante_03.png" alt="Sonara Icon" className="db-logo-img" />
            <h4>Sonara Workspace</h4>
          </div>
          <div className="db-user">
            <span className="db-user-name">Koffi Kouassi</span>
            <div className="db-user-avatar">KK</div>
          </div>
        </div>

        <div className="db-body">
          <div className="db-sidebar">
            <a href="#" className="db-sidebar-item active">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="10" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
              Tableau de bord
            </a>
            <a href="#" className="db-sidebar-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Campagnes
            </a>
            <a href="#" className="db-sidebar-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Contacts
            </a>
            <a href="#" className="db-sidebar-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Paramètres
            </a>
          </div>

          <div className="db-main">
            {/* Tab Campaigns */}
            <div className={`tab-content ${activeTab === "tab-campaigns" ? "active" : ""}`} id="tab-campaigns">
              <div style={{ "display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "20px" }}>
                <h5 style={{ "fontSize": "15px", "fontWeight": "600" }}>Liste des Campagnes</h5>
                <button className="btn btn-primary" style={{ "padding": "6px 12px", "fontSize": "12px" }}>+ Nouvelle Campagne</button>
              </div>
              <table className="campaigns-table">
                <thead>
                  <tr>
                    <th>Nom de la campagne</th>
                    <th>Statut</th>
                    <th>Taux de complétion</th>
                    <th>Score NPS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Enquête NPS Epargne - Mai 2026</strong></td>
                    <td><span className="status-pill active">En cours</span></td>
                    <td>
                      <div className="db-progress-bar"><div className="db-progress-fill" style={{ "width": "74%" }}></div></div>
                      74%
                    </td>
                    <td style={{ "color": "var(--success)", "fontWeight": "600" }}>+48</td>
                  </tr>
                  <tr>
                    <td><strong>KYC Validation Microcrédit Abidjan</strong></td>
                    <td><span className="status-pill active">En cours</span></td>
                    <td>
                      <div className="db-progress-bar"><div className="db-progress-fill" style={{ "width": "42%" }}></div></div>
                      42%
                    </td>
                    <td style={{ "color": "var(--brand-accent)", "fontWeight": "600" }}>+25</td>
                  </tr>
                  <tr>
                    <td><strong>Sondage Satisfaction Assurance Auto</strong></td>
                    <td><span className="status-pill completed">Terminé</span></td>
                    <td>
                      <div className="db-progress-bar"><div className="db-progress-fill" style={{ "width": "100%" }}></div></div>
                      100%
                    </td>
                    <td style={{ "color": "var(--success)", "fontWeight": "600" }}>+52</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tab Analytics */}
            <div className={`tab-content ${activeTab === "tab-analytics" ? "active" : ""}`} id="tab-analytics">
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h5>Évolution du NPS (Hebdomadaire)</h5>
                  <div className="chart-container">
                    <div className="chart-bar-col">
                      <div className="chart-bar-fill" style={{ "height": "0%" }} data-height="40%" data-val="+20"></div>
                      <div className="chart-bar-label">S1</div>
                    </div>
                    <div className="chart-bar-col">
                      <div className="chart-bar-fill" style={{ "height": "0%" }} data-height="55%" data-val="+32"></div>
                      <div className="chart-bar-label">S2</div>
                    </div>
                    <div className="chart-bar-col">
                      <div className="chart-bar-fill" style={{ "height": "0%" }} data-height="75%" data-val="+44"></div>
                      <div className="chart-bar-label">S3</div>
                    </div>
                    <div className="chart-bar-col">
                      <div className="chart-bar-fill" style={{ "height": "0%" }} data-height="90%" data-val="+52"></div>
                      <div className="chart-bar-label">S4</div>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <h5>Répartition Sentiment</h5>
                  <div className="sentiment-donut-mock">
                    <div className="sentiment-row">
                      <div className="sentiment-label-box">
                        <span className="sentiment-dot" style={{ "backgroundColor": "var(--success)" }}></span>
                        <span>Satisfait</span>
                      </div>
                      <span className="sentiment-percent">72%</span>
                    </div>
                    <div className="sentiment-row">
                      <div className="sentiment-label-box">
                        <span className="sentiment-dot" style={{ "backgroundColor": "#F59E0B" }}></span>
                        <span>Neutre</span>
                      </div>
                      <span className="sentiment-percent">18%</span>
                    </div>
                    <div className="sentiment-row">
                      <div className="sentiment-label-box">
                        <span className="sentiment-dot" style={{ "backgroundColor": "var(--error)" }}></span>
                        <span>Irrité</span>
                      </div>
                      <span className="sentiment-percent">10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Agent Editor */}
            <div className={`tab-content ${activeTab === "tab-agent" ? "active" : ""}`} id="tab-agent">
              <div className="agent-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Sélection de la Voix</label>
                    <select>
                      <option>Awa — Français Ivoirien (Féminin)</option>
                      <option>Koffi — Français Ivoirien (Masculin)</option>
                      <option>Coumba — Wolof (Féminin)</option>
                      <option>Sophie — Français standard (Féminin)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Température du modèle (Créativité)</label>
                    <select defaultValue="0.5 — Naturel & Engageant">
                      <option>0.2 — Strict & Précis</option>
                      <option>0.5 — Naturel & Engageant</option>
                      <option>0.8 — Très conversationnel</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Consigne Système de l'IA (Prompt)</label>
                  <textarea defaultValue="Tu es Awa, conseillère virtuelle pour la Banque XYZ. Appelle le client avec enthousiasme. Parle avec des expressions ivoiriennes courantes (ex: 'Yako', 'D'accord ô'). Sois polie et à l'écoute." />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>

  {/* ═══════════════════════════════════════════════════════ INTEGRATIONS MARQUEE */}
  <section id="integrations" aria-label="Intégrations partenaires">
    <div className="container" style={{ "textAlign": "center", "marginBottom": "24px" }}>
      <span className="label-badge" style={{ "marginBottom": "12px" }}>Écosystème</span>
      <h3 style={{ "fontSize": "20px", "fontWeight": "700", "color": "var(--text-secondary)" }}>S'intègre parfaitement avec vos outils existants</h3>
    </div>
    
    <div className="marquee-container">
      {/* Row 1 */}
      <div className="marquee-row">
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Salesforce CRM
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          HubSpot
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="15"/><line x1="15" x2="9" y1="9" y2="15"/></svg>
          Zapier
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
          Oracle Database
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Salesforce CRM
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          HubSpot
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="15"/><line x1="15" x2="9" y1="9" y2="15"/></svg>
          Zapier
        </div>
      </div>
      
      {/* Row 2 */}
      <div className="marquee-row reverse">
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          MTN Côte d'Ivoire
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Orange CI API
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
          Microsoft Excel / CSV
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Wave Money API
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          MTN Côte d'Ivoire
        </div>
        <div className="marquee-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Orange CI API
        </div>
      </div>
    </div>
  </section>

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
