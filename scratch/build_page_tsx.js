const fs = require('fs');
const path = require('path');

const jsxBodyPath = path.join(__dirname, 'body_jsx.txt');
const pageTsxPath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');

if (!fs.existsSync(jsxBodyPath)) {
  console.error('JSX body file not found:', jsxBodyPath);
  process.exit(1);
}

let jsx = fs.readFileSync(jsxBodyPath, 'utf8');

// ─── 1. NAVBAR SCROLLED CLASS BINDING ────────────────────────────
// In the original, the nav tag is:
// <nav className="nav-ai" aria-label="Navigation principale" id="navbar">
jsx = jsx.replace(
  /<nav className="nav-ai" aria-label="Navigation principale" id="navbar">/g,
  `<nav className={\`nav-ai \${isScrolled ? "scrolled" : ""}\`} aria-label="Navigation principale" id="navbar">`
);

// ─── 2. THEME TOGGLE BUTTON CLICK AND DISPLAY BINDING ────────────
// The button is:
// <button id="themeToggleBtn" className="theme-toggle-btn" aria-label="Toggle theme">
jsx = jsx.replace(
  /<button id="themeToggleBtn" className="theme-toggle-btn" aria-label="Toggle theme">/g,
  `<button id="themeToggleBtn" className="theme-toggle-btn" aria-label="Toggle theme" onClick={toggleTheme}>`
);

// Toggle visibility of sun/moon icons based on isLightMode:
// <svg className="sun-icon" ...> -> style={{ display: isLightMode ? 'none' : 'block' }}
// <svg className="moon-icon" ... style={{ "display": "none" }}> -> style={{ display: isLightMode ? 'block' : 'none' }}
jsx = jsx.replace(
  /<svg className="sun-icon"/g,
  `<svg className="sun-icon" style={{ display: isLightMode ? 'none' : 'block' }}`
);
jsx = jsx.replace(
  /<svg className="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style=\{\{ "display": "none" \}\}>/g,
  `<svg className="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ display: isLightMode ? 'block' : 'none' }}>`
);

// ─── 3. VIDEO REF BINDING ────────────────────────────────────────
// The video is:
// <video id="bgVideo" className="hero-ai-video" ...>
jsx = jsx.replace(
  /<video\s+id="bgVideo"\s+className="hero-ai-video"/g,
  `<video ref={bgVideoRef} id="bgVideo" className="hero-ai-video"`
);

// ─── 4. GLOW REF BINDING ─────────────────────────────────────────
// The mouseGlow div is:
// <div className="mouse-glow" id="mouseGlow" />
jsx = jsx.replace(
  /<div className="mouse-glow" id="mouseGlow" \/>/g,
  `<div className="mouse-glow" ref={mouseGlowRef} id="mouseGlow" />`
);

// ─── 5. SHOWCASE TABS BINDING ────────────────────────────────────
// In the tabs container:
// <button className="tab-btn active" onClick="switchTab(event, 'tab-campaigns')">Gestion des Campagnes</button>
// <button className="tab-btn" onClick="switchTab(event, 'tab-analytics')">Analyses & Rapports</button>
// <button className="tab-btn" onClick="switchTab(event, 'tab-agent')">Éditeur d'Agent IA</button>
jsx = jsx.replace(
  /<button className="tab-btn active" onClick="switchTab\(event, 'tab-campaigns'\)">Gestion des Campagnes<\/button>/g,
  `<button className={\`tab-btn \${activeTab === "tab-campaigns" ? "active" : ""}\`} onClick={() => switchTab("tab-campaigns")}>Gestion des Campagnes</button>`
);
jsx = jsx.replace(
  /<button className="tab-btn" onClick="switchTab\(event, 'tab-analytics'\)">Analyses & Rapports<\/button>/g,
  `<button className={\`tab-btn \${activeTab === "tab-analytics" ? "active" : ""}\`} onClick={() => switchTab("tab-analytics")}>Analyses & Rapports</button>`
);
jsx = jsx.replace(
  /<button className="tab-btn" onClick="switchTab\(event, 'tab-agent'\)">Éditeur d'Agent IA<\/button>/g,
  `<button className={\`tab-btn \${activeTab === "tab-agent" ? "active" : ""}\`} onClick={() => switchTab("tab-agent")}>Éditeur d'Agent IA</button>`
);

// In the content panels:
// <div className="tab-content active" id="tab-campaigns">
// <div className="tab-content" id="tab-analytics">
// <div className="tab-content" id="tab-agent">
jsx = jsx.replace(
  /<div className="tab-content active" id="tab-campaigns">/g,
  `<div className={\`tab-content \${activeTab === "tab-campaigns" ? "active" : ""}\`} id="tab-campaigns">`
);
jsx = jsx.replace(
  /<div className="tab-content" id="tab-analytics">/g,
  `<div className={\`tab-content \${activeTab === "tab-analytics" ? "active" : ""}\`} id="tab-analytics">`
);
jsx = jsx.replace(
  /<div className="tab-content" id="tab-agent">/g,
  `<div className={\`tab-content \${activeTab === "tab-agent" ? "active" : ""}\`} id="tab-agent">`
);

// ─── 6. TESTIMONIALS CAROUSEL BINDING ────────────────────────────
// The track is:
// <div className="carousel-track" id="carouselTrack">
jsx = jsx.replace(
  /<div className="carousel-track" id="carouselTrack">/g,
  `<div className="carousel-track" id="carouselTrack" style={{ transform: \`translateX(-\${currentSlide * 33.333}%)\` }}>`
);

// The dots are:
// <span className="dot active" onClick="jumpToSlide(0)"></span>
// <span className="dot" onClick="jumpToSlide(1)"></span>
// <span className="dot" onClick="jumpToSlide(2)"></span>
jsx = jsx.replace(
  /<span className="dot active" onClick="jumpToSlide\(0\)"><\/span>/g,
  `<span className={\`dot \${currentSlide === 0 ? "active" : ""}\`} onClick={() => jumpToSlide(0)}></span>`
);
jsx = jsx.replace(
  /<span className="dot" onClick="jumpToSlide\(1\)"><\/span>/g,
  `<span className={\`dot \${currentSlide === 1 ? "active" : ""}\`} onClick={() => jumpToSlide(1)}></span>`
);
jsx = jsx.replace(
  /<span className="dot" onClick="jumpToSlide\(2\)"><\/span>/g,
  `<span className={\`dot \${currentSlide === 2 ? "active" : ""}\`} onClick={() => jumpToSlide(2)}></span>`
);

// ─── 7. PRICING TOGGLE BINDING ───────────────────────────────────
// Toggle checkbox input:
// <input type="checkbox" id="pricingToggle" onchange="togglePricing(this)" />
jsx = jsx.replace(
  /<input type="checkbox" id="pricingToggle" onchange="togglePricing\(this\)" \/>/g,
  `<input type="checkbox" id="pricingToggle" checked={isYearlyPricing} onChange={(e) => togglePricing(e.target.checked)} />`
);

// Monthly/Yearly labels:
// <span className="billing-label active" id="billingMonthlyLabel">Facturation mensuelle</span>
// <span className="billing-label" id="billingYearlyLabel">Facturation annuelle...</span>
jsx = jsx.replace(
  /<span className="billing-label active" id="billingMonthlyLabel">/g,
  `<span className={\`billing-label \${!isYearlyPricing ? "active" : ""}\`} id="billingMonthlyLabel">`
);
jsx = jsx.replace(
  /<span className="billing-label" id="billingYearlyLabel">/g,
  `<span className={\`billing-label \${isYearlyPricing ? "active" : ""}\`} id="billingYearlyLabel">`
);

// Price values:
// <span className="price-value" id="priceStarter" data-monthly="25 000" data-yearly="20 000">25 000</span>
// <span className="price-value" id="priceBusiness" data-monthly="60 000" data-yearly="48 000">60 000</span>
jsx = jsx.replace(
  /<span className="price-value" id="priceStarter" data-monthly="25 000" data-yearly="20 000">25 000<\/span>/g,
  `<span className="price-value" id="priceStarter" style={{ opacity: priceOpacity }} data-monthly="25 000" data-yearly="20 000">{isYearlyPricing ? "20 000" : "25 000"}</span>`
);
jsx = jsx.replace(
  /<span className="price-value" id="priceBusiness" data-monthly="60 000" data-yearly="48 000">60 000<\/span>/g,
  `<span className="price-value" id="priceBusiness" style={{ opacity: priceOpacity }} data-monthly="60 000" data-yearly="48 000">{isYearlyPricing ? "48 000" : "60 000"}</span>`
);

// ─── 8. FAQ ACCORDION BINDING ────────────────────────────────────
let faqBtnIndex = 0;
jsx = jsx.replace(
  /<button className="faq-trigger"[^>]*onClick="toggleFaq\(this\)"[^>]*>\s*<span className="faq-question">([\s\S]*?)<\/span>/gi,
  (match, qText) => {
    const currentFaqIdx = faqBtnIndex++;
    return `<button className="faq-trigger" aria-expanded={activeFaq === ${currentFaqIdx}} aria-controls="faq-panel-${currentFaqIdx + 1}" onClick={() => toggleFaq(${currentFaqIdx})}>
            <span className="faq-question">${qText}</span>`;
  }
);

// Replace FAQ item class:
// Since they are written as `<div className="faq-item">` or `<div className="faq-item active">`
// Let's do replacements with dynamic class:
// We can search for the `<div className="faq-item">` and replace them sequentially or with a state check.
// We can use a counter index to replace them with `<div className={`faq-item ${activeFaq === index ? 'active' : ''}`}>`.
let faqIndex = 0;
jsx = jsx.replace(/<div className="faq-item">/g, (match) => {
  const currentFaqIdx = faqIndex++;
  return `<div className={\`faq-item \${activeFaq === ${currentFaqIdx} ? "active" : ""}\`}>`;
});

// Panel height binding:
// <div className="faq-panel"> -> style={{ maxHeight: activeFaq === index ? panelHeights[index] : '0px' }}
let faqPanelIndex = 0;
jsx = jsx.replace(/<div className="faq-panel">/g, (match) => {
  const currentPanelIdx = faqPanelIndex++;
  return `<div className="faq-panel" style={{ maxHeight: activeFaq === ${currentPanelIdx} ? "300px" : "0px", transition: "max-height 300ms var(--ease-snap)" }}>`;
});

// ─── 9. SIMULATOR BINDINGS ───────────────────────────────────────
// Canvas ref:
// <canvas id="waveCanvas"></canvas>
jsx = jsx.replace(
  /<canvas id="waveCanvas" \/>/g,
  `<canvas ref={canvasRef} id="waveCanvas" />`
);
jsx = jsx.replace(
  /<canvas id="waveCanvas"><\/canvas>/g,
  `<canvas ref={canvasRef} id="waveCanvas"></canvas>`
);

// Dialogue log ref and contents:
// The dialogue container is:
// <div className="dialogue-log" id="dialogueLog">
//   <div style={{ "textAlign": "center", "color": "var(--text-muted)", "fontSize": "13px", "margin": "auto" }} id="demoPlaceholder">
//     Cliquez sur "Lancer l'appel de test" ci-dessous pour démarrer la simulation.
//   </div>
// </div>
jsx = jsx.replace(
  /<div className="dialogue-log" id="dialogueLog">[\s\S]*?<\/div>\s*<\/div>/,
  `<div className="dialogue-log" ref={dialogueLogRef} id="dialogueLog">
          {dialogue.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", margin: "auto" }} id="demoPlaceholder">
              Cliquez sur "Lancer l'appel de test" ci-dessous pour démarrer la simulation.
            </div>
          )}
          {dialogue.map((msg, idx) => (
            <div key={idx} className={\`chat-row \${msg.sender === "ai" ? "ai-row" : "user-row"}\`}>
              <div className="bubble-icon">{msg.sender === "ai" ? "A" : "K"}</div>
              <div className="bubble-txt">{msg.text}</div>
            </div>
          ))}
        </div>`
);

// Report card container:
// <div className="analysis-report-card" id="analysisReport" style=\{\{ "display": "none" \}\}>
jsx = jsx.replace(
  /<div className="analysis-report-card" id="analysisReport" style=\{\{\s*"display":\s*"none"\s*\}\}>/g,
  `<div className="analysis-report-card" id="analysisReport" style={{ display: showReport ? "block" : "none" }}>`
);

// Report card fields rendering:
// <span id="reportSummary">Analyse en cours...</span>
// <span className="report-badge sentiment" id="reportSentiment">Sentiment: --</span>
// <span className="report-badge action" id="reportAction">Action: --</span>
jsx = jsx.replace(
  /<span id="reportSummary">Analyse en cours...<\/span>/g,
  `<span id="reportSummary">
              {appliedCustomQuestion 
                ? \`L'IA a posé la question personnalisée: "\${appliedCustomQuestion}". Le client a répondu de façon coopérative.\`
                : "Client insatisfait de l'attente à l'agence d'Angré (Note 3/5). Ne connaissait pas l'application mobile. Lien SMS de téléchargement envoyé automatiquement."}
            </span>`
);
jsx = jsx.replace(
  /<span className="report-badge sentiment" id="reportSentiment">Sentiment: --<\/span>/g,
  `<span className="report-badge sentiment" id="reportSentiment">
              {appliedCustomQuestion ? "Sentiment: Positif (4/5)" : "Sentiment: Neutre-Négatif (3/5)"}
            </span>`
);
jsx = jsx.replace(
  /<span className="report-badge action" id="reportAction">Action: --<\/span>/g,
  `<span className="report-badge action" id="reportAction" style={appliedCustomQuestion ? { color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)" } : { color: "var(--brand-accent)", background: "var(--brand-accent-t)" }}>
              {appliedCustomQuestion ? "Action: Archive standard" : "Action: Relance SMS envoyée"}
            </span>`
);

// Control buttons:
// <button className="btn btn-primary sim-btn" id="startCallBtn">
// <button className="btn btn-secondary sim-btn" id="stopCallBtn" disabled />
jsx = jsx.replace(
  /<button className="btn btn-primary sim-btn" id="startCallBtn">/g,
  `<button className="btn btn-primary sim-btn" id="startCallBtn" onClick={startCall} disabled={isCalling}>`
);
jsx = jsx.replace(
  /<button className="btn btn-secondary sim-btn" id="stopCallBtn" disabled\s*\/>/g,
  `<button className="btn btn-secondary sim-btn" id="stopCallBtn" onClick={() => terminateCall(false)} disabled={!isCalling} />`
);
jsx = jsx.replace(
  /<button className="btn btn-secondary sim-btn" id="stopCallBtn" disabled>Raccourcir \/ Raccrocher<\/button>/g,
  `<button className="btn btn-secondary sim-btn" id="stopCallBtn" onClick={() => terminateCall(false)} disabled={!isCalling}>Raccourcir / Raccrocher</button>`
);

// Status timer:
// <span className="caller-status" id="callStatus">En attente...</span>
// <span className="call-timer" id="callTimer">00:00</span>
jsx = jsx.replace(
  /<span className="caller-status" id="callStatus">En attente...<\/span>/g,
  `<span className={\`caller-status \${isCalling ? "active" : ""}\`} id="callStatus">{callStatus}</span>`
);
jsx = jsx.replace(
  /<span className="call-timer" id="callTimer">00:00<\/span>/g,
  `<span className="call-timer" id="callTimer">{callTimer}</span>`
);

// Custom question input and apply:
// <input type="text" id="customPromptInput" placeholder="Personnalisez la question d'enquête d'Awa..." />
// <button className="btn btn-secondary" id="applyCustomPromptBtn">Appliquer</button>
jsx = jsx.replace(
  /<input type="text" id="customPromptInput" placeholder="Personnalisez la question d'enqu&ecirc;te d'Awa\.\.\." \/>/g,
  `<input type="text" id="customPromptInput" placeholder="Personnalisez la question d'enquête d'Awa..." value={customQuestionInput} onChange={(e) => setCustomQuestionInput(e.target.value)} />`
);
jsx = jsx.replace(
  /<button className="btn btn-secondary" id="applyCustomPromptBtn">Appliquer<\/button>/g,
  `<button className="btn btn-secondary" id="applyCustomPromptBtn" onClick={applyCustomPrompt}>Appliquer</button>`
);

// ─── 10. WRAP INTO COMPONENT TEMPLATE ────────────────────────────
const componentContent = `"use client";

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
        mouseGlowRef.current.style.left = \`\${mouseCurrentRef.current.x}px\`;
        mouseGlowRef.current.style.top = \`\${mouseCurrentRef.current.y}px\`;
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
                  numberEl.textContent = \`\${prefix}\${currentVal}\${suffix}\`;
                }

                if (progress < 1) {
                  requestAnimationFrame(animateCount);
                } else if (numberEl) {
                  numberEl.textContent = \`\${prefix}\${target}\${suffix}\`;
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
    return \`\${min}:\${s}\`;
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
      ${jsx.trim()}
    </>
  );
}
`;

fs.writeFileSync(pageTsxPath, componentContent, 'utf8');
console.log('Successfully generated page.tsx');
