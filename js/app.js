/**
 * OMOROKU FILMS — Main Application Script
 * Orchestrates GSAP timelines, Lucide icons, modal interactions,
 * and page components.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Initialize Video Controller & Character Runner
  const videoCtrl = new VideoController();
  const characterRunner = new CharacterRunner();

  // Setup Cinematic Loading Screen & Volumetric Mist Parting System
  initCinematicLoader();

  // Setup GSAP Scroll-driven Section Animations
  initScrollAnimations();

  // Setup Portfolio Works Modal
  initWorksModal();

  // Setup Contact Form
  initContactForm();

  // Setup Smooth Scroll Navigation
  initNavigation();

  // Setup Live FPS meter for cinematic HUD
  initFpsMeter();
});

/**
 * Cinematic Loading Screen & Volumetric Mist Parting Reveal
 * 1. ページを開いたとき（ロード中）：深い映画の霧に包まれたローディング画面（0% -> 100% プログレス表示・タイムコード）
 * 2. ロード完了後、進むと（スクロール or ボタンクリック）：霧が左右・前方へダイナミックに晴れ渡り、動画とページ全体が現れる
 */
function initCinematicLoader() {
  const fogWrapper = document.getElementById('cinematic-fog-wrapper');
  const loaderContent = document.getElementById('loader-content');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderBarFill = document.getElementById('loader-bar-fill');
  const loaderStatus = document.getElementById('loader-status-text');
  const loaderTimecode = document.getElementById('loader-timecode');
  const loaderEnterCta = document.getElementById('loader-enter-cta');
  const loaderEnterBtn = document.getElementById('loader-enter-btn');

  if (!fogWrapper || !loaderContent) return;

  let progress = 0;
  let hasEntered = false;

  // Real-time Camera Timecode Simulator for Loader
  let frame = 0;
  const timecodeInterval = setInterval(() => {
    if (hasEntered) {
      clearInterval(timecodeInterval);
      return;
    }
    frame = (frame + 1) % 60;
    const sec = Math.floor(frame / 24);
    const pad = (n) => String(n).padStart(2, '0');
    if (loaderTimecode) {
      loaderTimecode.textContent = `00:00:0${sec}:${pad(frame)}`;
    }
  }, 40);

  // Smooth Progress Simulation tied to video & window load
  const updateProgress = (val) => {
    progress = Math.min(100, Math.max(progress, val));
    if (loaderPercent) loaderPercent.textContent = `${Math.round(progress)}%`;
    if (loaderBarFill) loaderBarFill.style.width = `${progress}%`;

    if (progress >= 100) {
      onLoadComplete();
    }
  };

  // Video load event hook
  const bgVideo = document.getElementById('bg-video');
  if (bgVideo) {
    if (bgVideo.readyState >= 3) {
      updateProgress(80);
    } else {
      bgVideo.addEventListener('loadeddata', () => updateProgress(80));
      bgVideo.addEventListener('canplay', () => updateProgress(95));
    }
  }

  // Smoothly increment progress
  let currentProg = 0;
  const progressTimer = setInterval(() => {
    if (currentProg < 88) {
      currentProg += Math.random() * 14 + 8;
      updateProgress(currentProg);
    } else if (document.readyState === 'complete') {
      currentProg += 12;
      updateProgress(currentProg);
    }
  }, 80);

  // Window load complete hook
  window.addEventListener('load', () => {
    setTimeout(() => {
      updateProgress(100);
    }, 350);
  });

  // Fallback timer (1.8s maximum) so user is never stuck
  setTimeout(() => {
    updateProgress(100);
  }, 1800);

  // When loading reaches 100%
  function onLoadComplete() {
    clearInterval(progressTimer);
    if (loaderStatus) {
      loaderStatus.textContent = 'STREAM READY • 4K RAW';
      loaderStatus.className = 'text-emerald-400 font-bold tracking-wider';
    }
    if (loaderEnterCta) {
      loaderEnterCta.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }

    // Auto-enter triggers on scroll down or touchmove
    window.addEventListener('wheel', handleFirstScroll, { passive: true });
    window.addEventListener('touchmove', handleFirstScroll, { passive: true });
    window.addEventListener('scroll', handleFirstScroll, { passive: true });
  }

  function handleFirstScroll(e) {
    if (hasEntered) return;
    if (window.scrollY > 5 || (e && e.deltaY > 0)) {
      partTheMistAndEnter();
    }
  }

  // Click on enter button
  if (loaderEnterBtn) {
    loaderEnterBtn.addEventListener('click', () => {
      partTheMistAndEnter();
    });
  }

  // THE REVEAL ANIMATION: 霧の中を進むと霧が晴れてページが現れる
  function partTheMistAndEnter() {
    if (hasEntered) return;
    hasEntered = true;

    window.removeEventListener('wheel', handleFirstScroll);
    window.removeEventListener('touchmove', handleFirstScroll);
    window.removeEventListener('scroll', handleFirstScroll);

    if (typeof gsap === 'undefined') {
      fogWrapper.classList.add('entered');
      loaderContent.style.display = 'none';
      return;
    }

    const revealTl = gsap.timeline({
      onComplete: () => {
        fogWrapper.classList.add('entered');
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }
    });

    revealTl
      // 1. Center loader card dissolves & lifts
      .to(loaderContent, {
        opacity: 0,
        scale: 0.92,
        y: -35,
        duration: 0.5,
        ease: 'power2.in'
      })
      // 2. Left and right fog banks dramatically sweep away
      .to('.fog-bank-left', {
        xPercent: -100,
        opacity: 0,
        scale: 1.5,
        duration: 1.2,
        ease: 'power3.inOut'
      }, 0.2)
      .to('.fog-bank-right', {
        xPercent: 100,
        opacity: 0,
        scale: 1.5,
        duration: 1.2,
        ease: 'power3.inOut'
      }, 0.2)
      // 3. Foreground wisp plunges past the camera lens and dissolves
      .to('.fog-foreground-wisp', {
        scale: 2.6,
        opacity: 0,
        filter: 'blur(55px)',
        duration: 1.1,
        ease: 'power2.inOut'
      }, 0.15)
      // 4. Ambient dark veil lifts to reveal full-bleed video
      .to(fogWrapper, {
        backgroundColor: 'rgba(7, 7, 10, 0)',
        duration: 1.0,
        ease: 'power2.out'
      }, 0.3)
      .to('.fog-layer-ambient', {
        opacity: 0.15,
        duration: 1.0,
        ease: 'power2.out'
      }, 0.3)
      .to('.fog-light-shafts', {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, 0.3)
      // 5. Main Hero Title & Content burst into view
      .fromTo('.hero-title-line',
        { opacity: 0, y: 45, filter: 'blur(16px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.15, ease: 'power3.out' },
        0.5
      )
      .fromTo('.hero-fade-in',
        { opacity: 0, y: 20, filter: 'blur(6px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.1, ease: 'power2.out' },
        0.8
      );
  }

  // Also setup continuous ScrollTrigger for scrolling after entering
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom 20%',
        scrub: 0.5,
        invalidateOnRefresh: true
      }
    })
    .to('.fog-layer-ambient', { opacity: 0, ease: 'power1.inOut' }, 0)
    .to('.fog-enter-prompt', { opacity: 0, y: -25, ease: 'power1.out' }, 0);
  }
}

/**
 * GSAP Scroll Animations
 */
function initScrollAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // Chapter Subtitle Banners Reveal (Cinematic Subtitles)
  const storySections = document.querySelectorAll('.story-section');
  storySections.forEach((sec, idx) => {
    const banner = sec.querySelector('.cinema-subtitle-banner');

    if (banner) {
      gsap.fromTo(banner,
        { opacity: 0, y: 45, filter: 'blur(10px)', scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          scale: 1,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top 75%',
            end: 'top 30%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }
  });
}

/**
 * Works / Portfolio Modal Preview
 */
function initWorksModal() {
  const modal = document.getElementById('work-modal');
  const modalBackdrop = document.getElementById('work-modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-work-title');
  const modalCategory = document.getElementById('modal-work-category');
  const modalDescription = document.getElementById('modal-work-desc');
  const modalImage = document.getElementById('modal-work-img');
  const modalVideo = document.getElementById('modal-work-video');

  const workCards = document.querySelectorAll('.work-card');

  const openModal = (card) => {
    const title = card.getAttribute('data-title') || '作品プレビュー';
    const category = card.getAttribute('data-category') || 'COMMERCIAL FILM';
    const desc = card.getAttribute('data-desc') || '4K 60fpsシネマカメラとアナモルフィックレンズによる圧倒的な描写力。';
    const imgSrc = card.getAttribute('data-img') || '';
    const videoSrc = card.getAttribute('data-video') || '';

    if (modalTitle) modalTitle.textContent = title;
    if (modalCategory) modalCategory.textContent = category;
    if (modalDescription) modalDescription.textContent = desc;

    if (videoSrc && modalVideo) {
      modalVideo.src = videoSrc;
      modalVideo.classList.remove('hidden');
      if (modalImage) modalImage.classList.add('hidden');
      modalVideo.play().catch(() => {});
    } else if (imgSrc && modalImage) {
      modalImage.src = imgSrc;
      modalImage.classList.remove('hidden');
      if (modalVideo) {
        modalVideo.pause();
        modalVideo.classList.add('hidden');
      }
    }

    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto');
      }, 10);
    }
  };

  const closeModal = () => {
    if (modal) {
      modal.classList.remove('opacity-100', 'pointer-events-auto');
      modal.classList.add('opacity-0', 'pointer-events-none');
      if (modalVideo) modalVideo.pause();
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 300);
    }
  };

  workCards.forEach(card => {
    card.addEventListener('click', () => openModal(card));
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

/**
 * Contact Form Simulation
 */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('form-submit-btn');
  const successBox = document.getElementById('form-success-box');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-block animate-spin mr-2">◌</span>
        送信中...
      `;
    }

    setTimeout(() => {
      form.classList.add('hidden');
      if (successBox) {
        successBox.classList.remove('hidden');
      }
    }, 900);
  });
}

/**
 * Smooth Navigation
 */
function initNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElem = document.querySelector(targetId);
      if (targetElem) {
        e.preventDefault();
        targetElem.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Live Camera HUD FPS Calculation
 */
function initFpsMeter() {
  const fpsElement = document.getElementById('hud-fps');
  if (!fpsElement) return;

  let frameCount = 0;
  let lastTime = performance.now();

  function calcFps(now) {
    frameCount++;
    if (now - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      fpsElement.textContent = `${fps} FPS`;
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(calcFps);
  }
  requestAnimationFrame(calcFps);
}
