/**
 * OMOROKU FILMS — Cinematic Video & Stream Controller
 * Controls background video playback/pausing on scroll, frame scrubbing,
 * visual chapter blending, timecode HUD, and ambient audio synthesizer.
 */

class VideoController {
  constructor() {
    this.video = document.getElementById('bg-video');
    this.canvas = document.getElementById('bg-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // HUD Elements
    this.hudTimecode = document.getElementById('hud-timecode');
    this.hudRecBadge = document.getElementById('hud-rec-badge');
    this.hudStatus = document.getElementById('hud-status-text');
    this.hudFps = document.getElementById('hud-fps');
    this.modeToggleBtn = document.getElementById('mode-toggle-btn');
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.letterboxToggleBtn = document.getElementById('letterbox-toggle-btn');

    // Playback state — Hybrid Engine (Down: Real-time Play / Up: Smooth Rewind)
    this.mode = 'hybrid'; // 'hybrid' (スクロール連動・順再生＆巻き戻し) | 'loop' (自動ループ再生)
    this.isPlaying = false;
    this.scrollTimeout = null;
    this.audioContext = null;
    this.isMuted = true;
    this.ambientGain = null;

    // Smooth Scrub & Seek variables
    this.targetProgress = 0;
    this.currentProgress = 0;
    this.scrollDirection = 'forward'; // 'forward' | 'reverse'
    this.lastScrollY = window.scrollY;

    // Chapter visuals with Veo Dream Dolly frames
    this.chapters = [
      { id: 'hero', imageSrc: 'assets/images/veo_dream_world.jpg', label: 'APARTMENT PROLOGUE', timeStart: 0 },
      { id: 'storyboard', imageSrc: 'assets/images/veo_dream_world.jpg', label: 'LIQUID GLASS RIPPLE', timeStart: 6 },
      { id: 'shooting', imageSrc: 'assets/images/veo_metropolis_nebula.jpg', label: 'INVERTED GRAVITY', timeStart: 12 },
      { id: 'postproduction', imageSrc: 'assets/images/veo_metropolis_nebula.jpg', label: 'NEON METROPOLIS', timeStart: 18 },
      { id: 'premiere', imageSrc: 'assets/images/premiere_screening.jpg', label: 'CINEMA PREMIERE', timeStart: 24 }
    ];

    this.currentChapterIndex = 0;
    this.targetChapterIndex = 0;
    this.chapterBlend = 0; // 0 to 1 transition progress

    // Canvas particle system for cinematic dust & anamorphic light leaks
    this.particles = [];
    this.lightFlareX = 0;

    this.init();
  }

  init() {
    this.initCanvas();
    this.setupVideo();
    this.startScrubLoop();
    this.setupScrollListeners();
    this.setupHUDControls();
    this.startCanvasLoop();
  }

  initCanvas() {
    if (!this.canvas) return;
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate floating cinematic dust motes
    for (let i = 0; i < 45; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3 - 0.2,
        alpha: Math.random() * 0.5 + 0.1
      });
    }
  }

  setupVideo() {
    if (!this.video) return;

    this.video.muted = true;
    this.video.playsInline = true;

    // Responsive Mobile Optimization: Load 2.4MB video on mobile devices, 13MB HD on desktop
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const mobileSrc = 'assets/videos/veo_dream_dolly_mobile.mp4';
    const desktopSrc = 'assets/videos/veo_dream_dolly.mp4';
    const targetSrc = isMobile ? mobileSrc : desktopSrc;

    if (!this.video.src || (!this.video.src.includes('mobile') && isMobile)) {
      this.video.src = targetSrc;
    }

    // Immediately sync if metadata is already loaded (e.g. from cache or local disk)
    const onMetadataReady = () => {
      console.log(`Veo Video ready (${isMobile ? 'MOBILE 2.4MB' : 'DESKTOP HD'}). Duration:`, this.video.duration);
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;
      this.targetProgress = progress;
      this.currentProgress = progress;
      if (this.video.duration && scrollY > 10) {
        this.video.currentTime = progress * this.video.duration;
      }
      this.updateTimecode(this.video.currentTime || 0);
    };

    if (this.video.readyState >= 1) {
      onMetadataReady();
    } else {
      this.video.addEventListener('loadedmetadata', onMetadataReady);
    }

    // Seeked listener to handle continuous smooth reverse seeking
    this.video.addEventListener('seeked', () => {
      if (this.scrollDirection === 'reverse' && this.video.duration) {
        const targetTime = Math.max(0, this.targetProgress * this.video.duration);
        if (this.video.currentTime - targetTime > 0.04 && !this.video.seeking) {
          this.video.currentTime = targetTime;
          this.updateTimecode(targetTime);
        }
      }
    });

    // Time update listener for HUD
    this.video.addEventListener('timeupdate', () => {
      this.updateTimecode(this.video.currentTime);
    });

    // Pause initially at top
    this.video.pause();
  }

  startScrubLoop() {
    // RAF tick for smooth progress tracking & reverse seek updates
    const ticker = () => {
      if (!this.video || !this.video.duration) {
        requestAnimationFrame(ticker);
        return;
      }

      if (this.mode === 'hybrid') {
        const duration = this.video.duration;
        const targetTime = Math.max(0, Math.min(this.targetProgress * duration, duration - 0.02));

        if (this.scrollDirection === 'reverse') {
          // When scrolling UP: ensure video rewinds smoothly towards targetTime
          if (!this.video.seeking && (this.video.currentTime - targetTime > 0.04)) {
            this.video.currentTime = targetTime;
            this.updateTimecode(targetTime);
          }
        }
      }

      requestAnimationFrame(ticker);
    };

    requestAnimationFrame(ticker);
  }

  setupScrollListeners() {
    window.addEventListener('scroll', () => {
      this.handleScroll();
    }, { passive: true });
  }

  handleScroll() {
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;

    // Detect scroll direction (FORWARD vs REVERSE)
    const deltaY = scrollY - this.lastScrollY;
    if (deltaY > 0.5) {
      this.scrollDirection = 'forward';
    } else if (deltaY < -0.5) {
      this.scrollDirection = 'reverse';
    }
    this.lastScrollY = scrollY;
    this.targetProgress = progress;

    // Update chapter index based on scroll sections
    const chapterProgress = progress * (this.chapters.length - 1);
    const newIndex = Math.min(Math.floor(chapterProgress), this.chapters.length - 1);
    this.currentChapterIndex = newIndex;
    this.chapterBlend = chapterProgress - Math.floor(chapterProgress);

    // Active Chapter HUD Label
    const activeChap = this.chapters[newIndex];
    const chapterPill = document.getElementById('hud-chapter-pill');
    if (chapterPill && activeChap) {
      chapterPill.textContent = `CH ${newIndex + 1}: ${activeChap.label}`;
    }

    // Update Right Film Strip Dots
    const dots = document.querySelectorAll('.film-strip-dot');
    dots.forEach((d, idx) => {
      if (idx === newIndex) {
        d.classList.add('active');
      } else {
        d.classList.remove('active');
      }
    });

    // Subtle cinema camera zoom on scroll (1.0 to 1.05)
    if (this.video) {
      const zoom = 1.0 + progress * 0.06;
      this.video.style.transform = `translate(-50%, -50%) scale(${zoom})`;
    }

    // Top of page check: reset cleanly to 0
    if (scrollY <= 5 && this.video) {
      if (!this.video.paused) this.video.pause();
      this.video.currentTime = 0;
      this.updateTimecode(0);
      this.updateHUDStatus(false);
      return;
    }

    if (this.mode === 'hybrid' && this.video && this.video.duration) {
      const duration = this.video.duration;
      const targetTime = Math.max(0, Math.min(progress * duration, duration - 0.02));

      if (this.scrollDirection === 'forward') {
        // === DOWN SCROLL: PLAY FORWARD SMOOTHLY ===
        this.updateHUDStatus(true);

        // If video is far behind scroll position (fast wheel or skip), catch up
        if (targetTime - this.video.currentTime > 1.5) {
          this.video.currentTime = targetTime;
        }

        // Adjust dynamic playback speed to match scroll tempo
        const lead = targetTime - this.video.currentTime;
        if (lead > 0.3) {
          this.video.playbackRate = Math.min(2.5, 1.0 + lead * 1.2);
        } else if (lead < -0.3) {
          this.video.playbackRate = 0.7;
        } else {
          this.video.playbackRate = 1.0;
        }

        // Play forward in 60fps hardware accelerated pipeline
        if (this.video.paused) {
          this.video.play().then(() => {
            this.isPlaying = true;
          }).catch(() => {});
        }

        // Pause smoothly when scroll stops
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          if (this.video && !this.video.paused) {
            this.video.pause();
            this.isPlaying = false;
          }
          this.updateHUDStatus(false);
        }, 220);

      } else {
        // === UP SCROLL: REWIND BACKWARD SMOOTHLY ===
        this.updateHUDStatus(true);

        // Pause forward play immediately
        if (!this.video.paused) {
          this.video.pause();
          this.isPlaying = false;
        }

        // Seek backward towards targetTime (NEVER fastSeek to avoid GOP snap)
        if (!this.video.seeking && (this.video.currentTime - targetTime > 0.04)) {
          this.video.currentTime = targetTime;
          this.updateTimecode(targetTime);
        }

        // Clear idle debounce
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          this.updateHUDStatus(false);
        }, 200);
      }
    }
  }

  updateHUDStatus(active) {
    if (!this.hudRecBadge || !this.hudStatus) return;

    if (active) {
      this.hudRecBadge.classList.remove('bg-gray-500');
      this.hudRecBadge.classList.add('bg-red-500', 'rec-dot');

      if (this.scrollDirection === 'reverse') {
        this.hudStatus.innerHTML = `▲ 巻き戻し (REWIND)`;
        this.hudStatus.className = 'text-amber-400 font-semibold tracking-wider text-xs';
      } else {
        this.hudStatus.innerHTML = `▼ 順再生 (FORWARD)`;
        this.hudStatus.className = 'text-cyan-400 font-semibold tracking-wider text-xs';
      }
    } else {
      this.hudRecBadge.classList.remove('bg-red-500', 'rec-dot');
      this.hudRecBadge.classList.add('bg-gray-500');
      this.hudStatus.textContent = 'STANDBY';
      this.hudStatus.className = 'text-gray-400 font-medium tracking-wider text-xs';
    }
  }

  updateTimecode(seconds) {
    if (!this.hudTimecode) return;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 24);

    const pad = (n) => String(n).padStart(2, '0');
    this.hudTimecode.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  }

  setupHUDControls() {
    // Mode toggle button (Scroll Synced vs Continuous Loop)
    if (this.modeToggleBtn) {
      this.modeToggleBtn.innerHTML = `
        <i data-lucide="repeat" class="w-3.5 h-3.5 mr-1 text-cyan-400"></i>
        <span>連動再生</span>
      `;

      this.modeToggleBtn.addEventListener('click', () => {
        if (this.mode === 'hybrid') {
          this.mode = 'loop';
          this.video.loop = true;
          this.video.play().then(() => {
            this.isPlaying = true;
            this.updateHUDStatus(true);
          }).catch(() => {});
          this.modeToggleBtn.innerHTML = `
            <i data-lucide="play-circle" class="w-3.5 h-3.5 mr-1 text-amber-400"></i>
            <span>常時再生</span>
          `;
        } else {
          this.mode = 'hybrid';
          this.video.loop = false;
          this.video.pause();
          this.isPlaying = false;
          this.updateHUDStatus(false);
          this.modeToggleBtn.innerHTML = `
            <i data-lucide="repeat" class="w-3.5 h-3.5 mr-1 text-cyan-400"></i>
            <span>連動再生</span>
          `;
        }
        if (window.lucide) lucide.createIcons();
      });
    }

    // Cinema Immersion Mode Toggle (Hides UI cards to show pure full-bleed video)
    const cinemaModeBtn = document.getElementById('cinema-mode-btn');
    if (cinemaModeBtn) {
      cinemaModeBtn.addEventListener('click', () => {
        const isActive = document.body.classList.toggle('cinema-immersion-active');
        cinemaModeBtn.innerHTML = isActive ? `
          <i data-lucide="eye" class="w-3.5 h-3.5 mr-1 text-amber-400"></i>
          <span class="text-amber-300">Cinema: ON</span>
        ` : `
          <i data-lucide="clapperboard" class="w-3.5 h-3.5 mr-1 text-cyan-400"></i>
          <span>Cinema Mode</span>
        `;
        if (window.lucide) lucide.createIcons();
      });
    }

    // Sound toggle button (Web Audio ambient drone)
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        this.toggleSound();
      });
    }

    // Letterbox toggle button (expand/collapse cinemascope bars)
    if (this.letterboxToggleBtn) {
      this.letterboxToggleBtn.addEventListener('click', () => {
        const topBar = document.querySelector('.letterbox-top');
        const bottomBar = document.querySelector('.letterbox-bottom');
        if (topBar && bottomBar) {
          const isCollapsed = topBar.style.transform === 'translateY(-100%)';
          topBar.style.transform = isCollapsed ? 'translateY(0)' : 'translateY(-100%)';
          bottomBar.style.transform = isCollapsed ? 'translateY(0)' : 'translateY(100%)';
          this.letterboxToggleBtn.classList.toggle('text-cyan-400');
        }
      });
    }

    // Veo Video File Input Handler
    const veoInput = document.getElementById('veo-video-input');
    if (veoInput) {
      veoInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.loadVideoFile(file);
        }
      });
    }

    // Drag & Drop Handler on entire page
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('video/')) {
          this.loadVideoFile(file);
        }
      }
    });
  }

  loadVideoFile(file) {
    if (!this.video) return;
    try {
      const url = URL.createObjectURL(file);
      this.video.src = url;
      this.video.load();
      this.video.play().then(() => {
        this.isPlaying = true;
        this.updateHUDStatus(true);
      }).catch(() => {});

      const chapterPill = document.getElementById('hud-chapter-pill');
      if (chapterPill) {
        chapterPill.textContent = 'VEO VIDEO CONNECTED';
        chapterPill.className = 'text-[11px] font-mono text-cyan-300 uppercase font-bold animate-pulse';
      }
    } catch (err) {
      console.error('Error loading video file:', err);
    }
  }

  toggleSound() {
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.setupAmbientSound();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isMuted = !this.isMuted;
    if (this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.08, this.audioContext.currentTime, 0.2);
    }

    if (this.soundToggleBtn) {
      this.soundToggleBtn.innerHTML = this.isMuted ? `
        <i data-lucide="volume-x" class="w-3.5 h-3.5 text-gray-400"></i>
        <span>Sound: OFF</span>
      ` : `
        <i data-lucide="volume-2" class="w-3.5 h-3.5 text-cyan-400"></i>
        <span class="text-cyan-300">Sound: ON</span>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }

  setupAmbientSound() {
    // Elegant low cinematic synth drone using Web Audio API
    try {
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const filter = this.audioContext.createBiquadFilter();
      this.ambientGain = this.audioContext.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.audioContext.currentTime); // A1 note

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(110, this.audioContext.currentTime); // A2 note

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, this.audioContext.currentTime);

      this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.audioContext.destination);

      osc1.start();
      osc2.start();
    } catch (e) {
      console.warn('Audio setup error:', e);
    }
  }

  startCanvasLoop() {
    if (!this.canvas || !this.ctx) return;

    let isVisible = !document.hidden;
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
    });

    const render = () => {
      if (isVisible) {
        this.renderCanvasFrame();
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  renderCanvasFrame() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // Render cinematic floating dust motes
    ctx.fillStyle = '#ffffff';
    for (let p of this.particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.globalAlpha = p.alpha * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Anamorphic horizontal light streak across top third when playing
    if (this.isPlaying) {
      this.lightFlareX += 8;
      if (this.lightFlareX > width * 1.5) this.lightFlareX = -width * 0.5;

      const flareGrad = ctx.createLinearGradient(this.lightFlareX - 300, 0, this.lightFlareX + 300, 0);
      flareGrad.addColorStop(0, 'transparent');
      flareGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.35)');
      flareGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, height * 0.35, width, 2);
    }
  }
}

// Global initialization
window.VideoController = VideoController;
