
    // ─── BACKGROUND MOUSE GLOW LERP EFFECT ───────────────────────────
    const mouseGlow = document.getElementById('mouseGlow');
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let glowActive = false;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!glowActive) {
        glowActive = true;
        updateGlowPosition();
      }
    }, { passive: true });

    function updateGlowPosition() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      mouseGlow.style.left = `${currentX}px`;
      mouseGlow.style.top = `${currentY}px`;

      if (glowActive) {
        requestAnimationFrame(updateGlowPosition);
      }
    }

    // ─── NAVBAR SCROLL STYLE ────────────────────────────────────
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });

    // ─── SCROLL REVEAL (IntersectionObserver) ────────────────────
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ─── DYNAMIC STATISTICS COUNT UP (BENTO & EASED) ──────────────
    const statsObserver = new IntersectionObserver((entries) => {
      let delayOffset = 0;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const cardEl = entry.target;
          const numberEl = cardEl.querySelector('.stat-number');
          if (!numberEl) return;

          const target = parseInt(numberEl.getAttribute('data-target'), 10);
          const prefix = numberEl.getAttribute('data-prefix') || '';
          const suffix = numberEl.getAttribute('data-suffix') || '';
          const duration = 2000; // ms

          // Easing function: Cubic Out
          function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
          }

          // Staggered card slide-in and fade-in
          setTimeout(() => {
            cardEl.classList.add('animate-in');
            
            // Start count-up animation
            let startTime = null;
            function animateCount(timestamp) {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              const easedProgress = easeOutCubic(progress);
              const currentVal = Math.floor(easedProgress * target);
              
              numberEl.textContent = `${prefix}${currentVal}${suffix}`;
              
              if (progress < 1) {
                requestAnimationFrame(animateCount);
              } else {
                numberEl.textContent = `${prefix}${target}${suffix}`;
              }
            }
            requestAnimationFrame(animateCount);
          }, delayOffset);

          delayOffset += 150; // 150ms stagger delay between cards!
          statsObserver.unobserve(cardEl);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.stat-card').forEach(el => statsObserver.observe(el));

    // ─── INTERACTIVE TAB SWITCHING (DASHBOARD SHOWCASE) ──────────
    function switchTab(event, tabId) {
      // Remove active from all tabs
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      
      // Add active to targeted tab & content
      event.currentTarget.classList.add('active');
      const targetContent = document.getElementById(tabId);
      targetContent.classList.add('active');

      // Animate chart bars if switching to analytics tab
      if (tabId === 'tab-analytics') {
        const fills = targetContent.querySelectorAll('.chart-bar-fill');
        fills.forEach((fill, index) => {
          fill.style.height = '0%';
          setTimeout(() => {
            fill.style.height = fill.getAttribute('data-height');
          }, 80 + index * 100); // staggered height growth!
        });
      } else {
        // Reset them when not active so they animate again
        const fills = document.querySelectorAll('.chart-bar-fill');
        fills.forEach(fill => {
          fill.style.height = '0%';
        });
      }
    }

    // ─── TESTIMONIALS CAROUSEL SLIDER ───────────────────────────
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    
    function jumpToSlide(index) {
      currentSlide = index;
      track.style.transform = `translateX(-${index * 33.333}%)`;
      dots.forEach(d => d.classList.remove('active'));
      dots[index].classList.add('active');
    }

    // Auto rotate testimonials
    let carouselInterval = setInterval(() => {
      currentSlide = (currentSlide + 1) % 3;
      jumpToSlide(currentSlide);
    }, 6000);

    // Stop auto rotate on dot click
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        clearInterval(carouselInterval);
      });
    });

    // ─── PRICING DYNAMIC TOGGLE ─────────────────────────────────
    function togglePricing(checkbox) {
      const isYearly = checkbox.checked;
      const starterPrice = document.getElementById('priceStarter');
      const businessPrice = document.getElementById('priceBusiness');
      const monthlyLabel = document.getElementById('billingMonthlyLabel');
      const yearlyLabel = document.getElementById('billingYearlyLabel');

      // Fade out prices
      starterPrice.style.opacity = 0;
      businessPrice.style.opacity = 0;

      setTimeout(() => {
        if (isYearly) {
          starterPrice.textContent = starterPrice.getAttribute('data-yearly');
          businessPrice.textContent = businessPrice.getAttribute('data-yearly');
          monthlyLabel.classList.remove('active');
          yearlyLabel.classList.add('active');
        } else {
          starterPrice.textContent = starterPrice.getAttribute('data-monthly');
          businessPrice.textContent = businessPrice.getAttribute('data-monthly');
          monthlyLabel.classList.add('active');
          yearlyLabel.classList.remove('active');
        }
        
        // Fade in prices
        starterPrice.style.opacity = 1;
        businessPrice.style.opacity = 1;
      }, 150);
    }

    // ─── FAQ ACCORDION LOGIC ────────────────────────────────────
    function toggleFaq(button) {
      const faqItem = button.parentElement;
      const panel = faqItem.querySelector('.faq-panel');
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      // Close other FAQs
      document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem && item.classList.contains('active')) {
          item.classList.remove('active');
          item.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
          item.querySelector('.faq-panel').style.maxHeight = '0px';
        }
      });

      // Toggle current FAQ
      if (!isExpanded) {
        faqItem.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + "px";
      } else {
        faqItem.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = "0px";
      }
    }

    // ─── VOICE CALL SIMULATOR ENGINE (JS SIMULATED CALL) ────────
    const startCallBtn = document.getElementById('startCallBtn');
    const stopCallBtn = document.getElementById('stopCallBtn');
    const callStatus = document.getElementById('callStatus');
    const callTimer = document.getElementById('callTimer');
    const dialogueLog = document.getElementById('dialogueLog');
    const demoPlaceholder = document.getElementById('demoPlaceholder');
    const customPromptInput = document.getElementById('customPromptInput');
    const applyCustomPromptBtn = document.getElementById('applyCustomPromptBtn');
    const analysisReport = document.getElementById('analysisReport');
    const reportSummary = document.getElementById('reportSummary');
    const reportSentiment = document.getElementById('reportSentiment');
    const reportAction = document.getElementById('reportAction');

    // Canvas Equalizer setup
    const canvas = document.getElementById('waveCanvas');
    const ctx = canvas.getContext('2d');
    let animationId = null;
    let waveAmplitude = 0; // Target amplitude
    let currentAmplitude = 0; // Smoothed amplitude
    let waveFrequency = 0.05;
    let waveColor = 'rgba(0, 82, 255, 0.8)';
    let time = 0;

    // Resize canvas
    function resizeCanvas() {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Draw equalizer waves
    function drawWave() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = waveColor;
      
      // Interpolate amplitude smoothly
      currentAmplitude += (waveAmplitude - currentAmplitude) * 0.1;

      for (let x = 0; x < canvas.width; x++) {
        // Compose multiple sine waves for organic soundwave feel
        const y = canvas.height / 2 + 
          Math.sin(x * waveFrequency + time) * currentAmplitude * 18 +
          Math.sin(x * (waveFrequency * 2.3) - time * 1.5) * (currentAmplitude * 6);
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.stroke();
      time += 0.15;
      animationId = requestAnimationFrame(drawWave);
    }

    // Dialogue script data
    let customQuestion = "";
    let callTimerInterval = null;
    let callDurationSeconds = 0;
    let callTimeoutIds = [];

    // Helper to format call timer
    function formatTime(sec) {
      const min = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return `${min}:${s}`;
    }

    // Apply custom prompt question
    applyCustomPromptBtn.addEventListener('click', () => {
      const val = customPromptInput.value.trim();
      if (val) {
        customQuestion = val;
        // Show brief visual feedback on button
        applyCustomPromptBtn.textContent = "Appliquée !";
        applyCustomPromptBtn.style.borderColor = "var(--success)";
        applyCustomPromptBtn.style.color = "var(--success)";
        setTimeout(() => {
          applyCustomPromptBtn.textContent = "Appliquer";
          applyCustomPromptBtn.style.borderColor = "var(--border-strong)";
          applyCustomPromptBtn.style.color = "var(--text-primary)";
        }, 1500);
      }
    });

    // Append speech bubbles to the dialogue logger
    function appendBubble(sender, text) {
      if (demoPlaceholder) {
        demoPlaceholder.remove();
      }
      
      const row = document.createElement('div');
      row.className = `chat-row ${sender === 'ai' ? 'ai-row' : 'user-row'}`;
      
      const icon = document.createElement('div');
      icon.className = 'bubble-icon';
      icon.textContent = sender === 'ai' ? 'A' : 'K';
      
      const txt = document.createElement('div');
      txt.className = 'bubble-txt';
      txt.textContent = text;
      
      row.appendChild(icon);
      row.appendChild(txt);
      dialogueLog.appendChild(row);
      dialogueLog.scrollTop = dialogueLog.scrollHeight;
    }

    // Simulator states & script timing
    function runSimulatedCall() {
      // Clear previous logs
      dialogueLog.innerHTML = '';
      analysisReport.style.display = 'none';
      callDurationSeconds = 0;
      callTimer.textContent = '00:00';
      
      // Update header states
      callStatus.textContent = 'Appel en cours...';
      callStatus.className = 'caller-status active';
      startCallBtn.disabled = true;
      stopCallBtn.disabled = false;
      
      // Start call timer
      callTimerInterval = setInterval(() => {
        callDurationSeconds++;
        callTimer.textContent = formatTime(callDurationSeconds);
      }, 1000);

      // Start soundwave rendering
      waveAmplitude = 0.2; // quiet hum
      waveColor = 'rgba(0, 82, 255, 0.7)';
      if (!animationId) drawWave();

      // Dialogue timeline (in ms)
      const timeline = [
        {
          delay: 1500,
          action: () => {
            waveAmplitude = 1.0; // AI speaks
            waveColor = 'rgba(0, 82, 255, 0.9)'; // Blue for AI
            appendBubble('ai', "Bonjour Monsieur Koné ! C'est Awa de la Banque XYZ. Yako pour l'attente l'autre jour ô. J'ai besoin de 2 petites minutes pour avoir votre avis sur nos services, c'est possible ?");
          }
        },
        {
          delay: 5000,
          action: () => {
            waveAmplitude = 0.1; // AI stops speaking
          }
        },
        {
          delay: 6000,
          action: () => {
            waveAmplitude = 0.8; // User speaks
            waveColor = 'rgba(36, 113, 163, 0.9)'; // Navy for user
            appendBubble('user', "Oui bonjour Awa, y a pas de soucis, tu peux y aller, je t'écoute.");
          }
        },
        {
          delay: 8500,
          action: () => {
            waveAmplitude = 0.1; // User stops
          }
        },
        {
          delay: 9500,
          action: () => {
            waveAmplitude = 1.0; // AI speaks
            waveColor = 'rgba(0, 82, 255, 0.9)';
            const question = customQuestion ? customQuestion : "Super, merci ! Globalement, sur une échelle de 1 à 5, comment vous évaluez l'accueil physique dans notre agence d'Angré ?";
            appendBubble('ai', question);
          }
        },
        {
          delay: 13500,
          action: () => {
            waveAmplitude = 0.1; // AI stops
          }
        },
        {
          delay: 14500,
          action: () => {
            waveAmplitude = 0.8; // User speaks
            waveColor = 'rgba(36, 113, 163, 0.9)';
            const answer = customQuestion 
              ? "Ah, par rapport à ça... Je trouve que c'est un peu lent, mais ça peut aller." 
              : "Franchement, je mets 3... Les rangs là-bas c'est trop décourageant, on perd tout notre temps.";
            appendBubble('user', answer);
          }
        },
        {
          delay: 18500,
          action: () => {
            waveAmplitude = 0.1;
          }
        },
        {
          delay: 19500,
          action: () => {
            waveAmplitude = 1.0; // AI speaks
            waveColor = 'rgba(0, 82, 255, 0.9)';
            const response = customQuestion
              ? "C'est bien noté ô ! Nous faisons de notre mieux pour corriger cela. Merci pour votre franchise."
              : "Ah, Yako pour ça ô ! L'attente dans les rangs à Angré, je comprends tout à fait, c'est pas facile. Mais dites-moi, pour éviter les rangs, est-ce que vous avez déjà testé notre application mobile pour faire vos virements ?";
            appendBubble('ai', response);
          }
        },
        {
          delay: 24500,
          action: () => {
            waveAmplitude = 0.1;
          }
        },
        {
          delay: 25500,
          action: () => {
            waveAmplitude = 0.8; // User speaks
            waveColor = 'rgba(36, 113, 163, 0.9)';
            const answer2 = customQuestion ? "D'accord, merci." : "Ah bon ? Non, je ne savais pas du tout que c'était possible de faire ça depuis la maison.";
            appendBubble('user', answer2);
          }
        },
        {
          delay: 28500,
          action: () => {
            waveAmplitude = 0.1;
          }
        },
        {
          delay: 29500,
          action: () => {
            waveAmplitude = 1.0; // AI speaks
            waveColor = 'rgba(0, 82, 255, 0.9)';
            const endText = customQuestion
              ? "Merci infiniment d'avoir pris le temps de me répondre ô. Passez une excellente journée !"
              : "Djaah, mais c'est très simple ô ! Je viens de vous envoyer le lien de téléchargement direct par SMS. Vous allez voir, ça va vous faciliter la vie. Merci infiniment pour votre temps et passez une excellente journée !";
            appendBubble('ai', endText);
          }
        },
        {
          delay: 34000,
          action: () => {
            waveAmplitude = 0; // Silent
            terminateCall(true); // Terminate automatically
          }
        }
      ];

      // Schedule timeline
      timeline.forEach(item => {
        const id = setTimeout(item.action, item.delay);
        callTimeoutIds.push(id);
      });
    }

    // Terminate Call
    function terminateCall(completed = false) {
      // Clear timers and delays
      clearInterval(callTimerInterval);
      callTimeoutIds.forEach(id => clearTimeout(id));
      callTimeoutIds = [];
      
      // Update UI button and status states
      startCallBtn.disabled = false;
      stopCallBtn.disabled = true;
      callStatus.textContent = 'Appel terminé';
      callStatus.className = 'caller-status';
      waveAmplitude = 0; // Flat wave
      
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      // Draw a flat baseline
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.moveTo(0, canvas.height/2);
      ctx.lineTo(canvas.width, canvas.height/2);
      ctx.stroke();

      if (completed) {
        // Show AI generated report
        analysisReport.style.display = 'block';
        if (customQuestion) {
          reportSummary.innerHTML = `L'IA a posé la question personnalisée: <em>"${customQuestion}"</em>. Le client a répondu de façon coopérative.`;
          reportSentiment.textContent = 'Sentiment: Positif (4/5)';
          reportAction.textContent = 'Action: Archive standard';
          reportAction.style.color = 'var(--text-secondary)';
          reportAction.style.background = 'rgba(255,255,255,0.05)';
        } else {
          reportSummary.textContent = "Client insatisfait de l'attente à l'agence d'Angré (Note 3/5). Ne connaissait pas l'application mobile. Lien SMS de téléchargement envoyé automatiquement.";
          reportSentiment.textContent = "Sentiment: Neutre-Négatif (3/5)";
          reportAction.textContent = "Action: Relance SMS envoyée";
          reportAction.style.color = 'var(--brand-accent)';
          reportAction.style.background = 'var(--brand-accent-t)';
        }
      }
    }

    startCallBtn.addEventListener('click', runSimulatedCall);
    stopCallBtn.addEventListener('click', () => terminateCall(false));

    // ─── HLS.JS BACKGROUND VIDEO INITIALIZATION ─────────────────
    const bgVideo = document.getElementById('bgVideo');
    const videoSrc = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";

    if (bgVideo) {
      let playedLocal = false;
      
      // Try local source first
      bgVideo.play().then(() => {
        playedLocal = true;
        console.log("Playing local video source successfully.");
      }).catch((e) => {
        console.log("Local video autoplay prevented or failed, loading HLS:", e);
        loadHLS();
      });

      // Fallback if local source fails to decode/load
      bgVideo.addEventListener('error', () => {
        if (!playedLocal) {
          console.log("Error loading local source, falling back to HLS.");
          loadHLS();
        }
      }, true);

      function loadHLS() {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(videoSrc);
          hls.attachMedia(bgVideo);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            bgVideo.play().catch((e) => console.log("HLS Auto-play prevented:", e));
          });
        } else if (bgVideo.canPlayType("application/vnd.apple.mpegurl")) {
          bgVideo.src = videoSrc;
          bgVideo.addEventListener("loadedmetadata", () => {
            bgVideo.play().catch((e) => console.log("HLS Auto-play prevented:", e));
          });
        }
      }
    }

    // ─── THEME TOGGLE LOGIC ─────────────────────────────────────
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-mode');
    }
    
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
          localStorage.setItem('theme', 'light');
        } else {
          localStorage.setItem('theme', 'dark');
        }
      });
    }

    // Initially draw flat line on canvas
    terminateCall(false);
  