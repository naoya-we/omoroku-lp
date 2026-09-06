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

  // Setup Cinematic Opening Fog & Scroll-driven Mist Dissolve
  initCinematicFogReveal();

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
 * Cinematic Opening Fog & Scroll-driven Mist Dissolve
 * 1. ページを開いたとき：立ち込める霧が優しく晴れ渡り、光が差し込んでタイトルが現れる
 * 2. その霧の中を進むと（スクロール）：左右・手前の霧が大きく開いて霧散し、動画とページ全景が現れる
 */
function initCinematicFogReveal() {
  if (typeof gsap === 'undefined') return;

  const fogWrapper = document.getElementById('cinematic-fog-wrapper');
  if (!fogWrapper) return;

  // 1. Initial Opening Atmosphere (ページロード時の霧の揺らぎとタイトルの浮かび上がり)
  const introTl = gsap.timeline({ delay: 0.1 });

  introTl
    .fromTo('.fog-layer-ambient',
      { opacity: 0.95, filter: 'blur(35px)' },
      { opacity: 0.72, filter: 'blur(22px)', duration: 2.2, ease: 'power2.out' }
    )
    .fromTo('.fog-light-shafts',
      { opacity: 0, scale: 0.9 },
      { opacity: 0.8, scale: 1, duration: 2.5, ease: 'power2.out' },
      0.3
    )
    .fromTo('.fog-foreground-wisp',
      { opacity: 0.95, filter: 'blur(20px)' },
      { opacity: 0.65, filter: 'blur(32px)', duration: 2.0, ease: 'power2.out' },
      0.2
    )
    .fromTo('.hero-title-line',
      { opacity: 0, y: 45, filter: 'blur(16px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.6, stagger: 0.25, ease: 'power3.out' },
      0.6
    )
    .fromTo('.hero-fade-in',
      { opacity: 0, y: 25, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.15, ease: 'power2.out' },
      1.1
    );

  // 2. Scroll-driven "進むと霧が晴れる" Experience (スクロールに応じて霧が左右・前方へ晴れてページ全貌が現れる)
  if (typeof ScrollTrigger !== 'undefined') {
    const scrubTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom 25%',
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });

    scrubTl
      // Left bank sweeps away to the left
      .to('.fog-bank-left', {
        xPercent: -85,
        opacity: 0,
        scale: 1.4,
        ease: 'power1.inOut'
      }, 0)
      // Right bank sweeps away to the right
      .to('.fog-bank-right', {
        xPercent: 85,
        opacity: 0,
        scale: 1.4,
        ease: 'power1.inOut'
      }, 0)
      // Foreground wisps push past camera lens and dissolve
      .to('.fog-foreground-wisp', {
        scale: 2.2,
        opacity: 0,
        filter: 'blur(50px)',
        ease: 'power2.inOut'
      }, 0)
      // God rays dissipate into clear ambient daylight
      .to('.fog-light-shafts', {
        opacity: 0,
        scaleY: 1.4,
        ease: 'power1.inOut'
      }, 0)
      // Ambient overall haze vanishes completely
      .to('.fog-layer-ambient', {
        opacity: 0,
        ease: 'power1.inOut'
      }, 0)
      // The "霧の向こうへ進む" scroll guide fades smoothly
      .to('.fog-enter-prompt', {
        opacity: 0,
        y: -30,
        ease: 'power2.out'
      }, 0);
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
