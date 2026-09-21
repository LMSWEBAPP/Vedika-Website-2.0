import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollChoreography(botScene) {
  const wrapper = document.getElementById('hero-showcase-wrapper');
  const stage1 = document.getElementById('stage-1');
  const stage2 = document.getElementById('stage-2');
  const stage3 = document.getElementById('stage-3');
  const stage4 = document.getElementById('stage-4');
  const stage5 = document.getElementById('stage-5');

  const stepDots = document.querySelectorAll('.step-dot');
  const stageBadgeText = document.getElementById('badge-stage-text');

  const stageTitles = [
    'HERO SECTION // 01',
    '02 // COGNITIVE HUD',
    '03 // PLATFORM FACTS',
    '04 // 3D CAROUSEL',
    '05 // CREATIVE LABS'
  ];

  // Initial states: Stage 1 active, other layers positioned below
  gsap.set(stage1, { autoAlpha: 1, y: 0 });
  gsap.set([stage2, stage3, stage4, stage5].filter(Boolean), { autoAlpha: 0, y: 50 });

  let currentActiveIndex = 0;
  function updateIndicators(p) {
    let index = 0;
    if (p < 0.155) index = 0;
    else if (p < 0.369) index = 1;
    else if (p < 0.583) index = 2;
    else if (p < 0.845) index = 3;
    else index = 4;

    if (index === currentActiveIndex) return;
    currentActiveIndex = index;

    stepDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    if (stageBadgeText) {
      stageBadgeText.textContent = stageTitles[index] || `STAGE // 0${index + 1}`;
    }
  }

  // Master GSAP scrubbed timeline - silky-smooth scroll without mid-scroll page overlay
  const masterTimeline = gsap.timeline({
    scrollTrigger: {
      id: 'heroShowcaseTrigger',
      trigger: wrapper,
      start: 'top top',
      end: '+=4800',
      pin: true,
      scrub: 1.2, // Silky smooth damping - smooths out mousewheel notches and trackpad jitter
      anticipatePin: 1,
      onUpdate: (self) => {
        const progress = self.progress; // 0.0 to 1.0

        // Synchronize 3D Bot choreography (Center -> Left -> Center -> Pure Carousel -> Creative Labs)
        if (botScene) {
          botScene.updateScrollProgress(progress);
        }

        updateIndicators(progress);
      }
    }
  });

  // Flow Timeline Choreography (Total duration: 420 units):
  // Clean sequential handoff guarantees NO OVERLAY between pages:
  // - Current page cleanly drifts up and fades out (autoAlpha 1 -> 0) BEFORE the next page enters.
  // - Next page drifts up from below (autoAlpha 0 -> 1) into crystal-clear view.
  //
  // 0 - 45: Stage 1 hold
  // 45 - 65: Stage 1 clean exit (y: 0 -> -40, autoAlpha: 1 -> 0)
  // 65 - 85: Stage 2 clean entry (y: 40 -> 0, autoAlpha: 0 -> 1) [Stage 1 already gone, zero overlay!]
  // 85 - 135: Stage 2 hold
  // 135 - 155: Stage 2 clean exit (y: 0 -> -40, autoAlpha: 1 -> 0)
  // 155 - 175: Stage 3 clean entry (y: 40 -> 0, autoAlpha: 0 -> 1) [Stage 2 already gone, zero overlay!]
  // 175 - 225: Stage 3 hold
  // 225 - 245: Stage 3 clean exit (y: 0 -> -40, autoAlpha: 1 -> 0)
  // 245 - 265: Stage 4 (3D Carousel) scales in cleanly
  // 265 - 335: Stage 4 hold (100% PURE 3D CAROUSEL - zero clutter, nothing at all on screen!)
  // 335 - 355: Stage 4 scales out
  // 355 - 375: Stage 5 clean entry (y: 40 -> 0, autoAlpha: 0 -> 1) [Carousel already gone, zero overlay!]
  // 375 - 420: Stage 5 hold (Creative Labs in full view)

  masterTimeline
    .addLabel('stage1')
    .to({}, { duration: 45 })

    // --- TRANSITION 1: STAGE 1 EXIT -> STAGE 2 ENTRY (SEQUENTIAL, ZERO OVERLAY) ---
    .to(stage1, {
      y: -40,
      autoAlpha: 0,
      ease: 'power2.in',
      duration: 20
    }, 45)
    .fromTo(stage2, {
      y: 40,
      autoAlpha: 0
    }, {
      y: 0,
      autoAlpha: 1,
      ease: 'power2.out',
      duration: 20
    }, 65)

    .addLabel('stage2')
    .to({}, { duration: 50 }, 85)

    // --- TRANSITION 2: STAGE 2 EXIT -> STAGE 3 ENTRY (SEQUENTIAL, ZERO OVERLAY) ---
    .to(stage2, {
      y: -40,
      autoAlpha: 0,
      ease: 'power2.in',
      duration: 20
    }, 135)
    .fromTo(stage3, {
      y: 40,
      autoAlpha: 0
    }, {
      y: 0,
      autoAlpha: 1,
      ease: 'power2.out',
      duration: 20
    }, 155)

    .addLabel('stage3')
    .to({}, { duration: 50 }, 175)

    // --- TRANSITION 3: STAGE 3 EXIT -> STAGE 4 PURE CAROUSEL ---
    .to(stage3, {
      y: -40,
      autoAlpha: 0,
      ease: 'power2.in',
      duration: 20
    }, 225);

  masterTimeline
    .addLabel('stage4')
    // Stage 4 Hold: 100% Pure 3D Carousel active with nothing at all on screen
    .to({}, { duration: 70 }, 265);

  // --- TRANSITION 4: STAGE 4 EXIT -> STAGE 5 CREATIVE LABS (ZERO OVERLAY) ---
  if (stage5) {
    masterTimeline.fromTo(stage5, {
      y: 40,
      autoAlpha: 0
    }, {
      y: 0,
      autoAlpha: 1,
      ease: 'power2.out',
      duration: 20
    }, 355);
  }

  masterTimeline
    .addLabel('stage5')
    .to({}, { duration: 45 }, 375);

  // Clickable step dots to jump smoothly to any stage
  const stagePositions = [0.05, 0.26, 0.47, 0.71, 0.94];

  stepDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetStep = parseInt(dot.getAttribute('data-step') || '0', 10);
      const totalScroll = ScrollTrigger.getById('heroShowcaseTrigger');
      if (totalScroll) {
        const start = totalScroll.start;
        const end = totalScroll.end;
        const targetProgress = stagePositions[targetStep] ?? 0;
        const targetScrollY = start + targetProgress * (end - start);
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    });
  });

  // Buttons that navigate between stages
  const btnScrollLabs = document.getElementById('btn-scroll-labs');
  const reticleCta = document.getElementById('reticle-btn-cta');
  const btnExploreArrow = document.getElementById('btn-explore-arrow-step');

  const scrollToStage = (stageIdx) => {
    const totalScroll = ScrollTrigger.getById('heroShowcaseTrigger');
    if (totalScroll) {
      const start = totalScroll.start;
      const end = totalScroll.end;
      const targetProgress = stagePositions[stageIdx] ?? 0;
      const targetScrollY = start + targetProgress * (end - start);
      window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    }
  };

  if (btnScrollLabs) btnScrollLabs.addEventListener('click', () => scrollToStage(4));
  if (reticleCta) reticleCta.addEventListener('click', () => scrollToStage(3));
  if (btnExploreArrow) btnExploreArrow.addEventListener('click', () => scrollToStage(2));

  return masterTimeline;
}
