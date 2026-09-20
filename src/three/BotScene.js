import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class BotScene {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.container = canvasElement.parentElement;
    
    // Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Groups & Hierarchy
    this.rootGroup = new THREE.Group();
    this.bustPivot = new THREE.Group(); // Pivot around neck (Y = 0.2)
    this.modelWrapper = new THREE.Group();
    
    this.bustPivot.add(this.modelWrapper);
    this.rootGroup.add(this.bustPivot);
    this.scene.add(this.rootGroup);

    // Initial positioning: camera framed naturally so head, shoulders, and chest are solid and grounded
    this.rootGroup.position.set(0, 0, 0);
    this.camera.position.set(0, 0.26, 2.65);
    this.camera.lookAt(0, 0.26, 0);

    // Scroll-driven state
    this.scrollProgress = 0;
    this.targetBotRotY = 0;
    this.targetBotRotX = 0;
    this.targetCamY = 0.26;
    this.targetCamZ = 2.65;

    // 3D Revolving Carousel (compact, elegant card size, less hazy glassmorphism)
    this.carouselGroup = new THREE.Group();
    this.carouselCards = [];
    this.carouselTargetRotation = 0;
    // Compact radius (1.45m) and tighter framing so cards gracefully orbit around Vedika without eclipsing her
    this.carouselRadius = 1.45; // Clean open circular halo around Vedika
    this.isCarouselActive = false;
    this.scene.add(this.carouselGroup);

    this.clock = new THREE.Clock();

    this.initLighting();
    this.initEventListeners();
    this.loadModel();
    this.build3DCarousel();
    this.onResize();
    this.animate();
  }

  initLighting() {
    // Ambient Light - Deep space obsidian tone
    const ambientLight = new THREE.AmbientLight(0x0c1628, 1.8);
    this.scene.add(ambientLight);

    // Top Shimmering Downlight
    this.topGlowLight = new THREE.DirectionalLight(0x40c8ff, 3.6);
    this.topGlowLight.position.set(0, 4.5, 1);
    this.scene.add(this.topGlowLight);

    // Key Light - Soft White Key
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    this.keyLight.position.set(3, 3.5, 3);
    this.scene.add(this.keyLight);

    // Fill Light - Soft Blue Fill
    this.fillLight = new THREE.DirectionalLight(0x3880c0, 1.8);
    this.fillLight.position.set(-3, 1.5, 2);
    this.scene.add(this.fillLight);

    // Rim Backlight 1 - Electric Cyan High-Intensity Rim
    this.rimLight1 = new THREE.DirectionalLight(0x00e5ff, 5.0);
    this.rimLight1.position.set(2.5, 3.5, -3);
    this.scene.add(this.rimLight1);

    // Rim Backlight 2 - Deep Blue Backfill
    this.rimLight2 = new THREE.DirectionalLight(0x0066aa, 3.2);
    this.rimLight2.position.set(-2.5, 2.5, -3);
    this.scene.add(this.rimLight2);

    // Visor Point Light
    this.visorLight = new THREE.PointLight(0x00e5ff, 1.8, 2.2);
    this.visorLight.position.set(0, 0.45, 0.8);
    this.scene.add(this.visorLight);
  }

  loadModel() {
    const loadingOverlay = document.getElementById('model-loading-overlay');
    const loader = new GLTFLoader();
    const modelUrl = '/models/vedika-M1.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        
        // Scale Vedika to prominent bust size (0.76)
        model.scale.set(0.76, 0.76, 0.76);

        // Position model naturally so full head, neck, shoulders, and chest are completely intact
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -0.15, -center.z);

        // Enhance PBR materials
        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.roughness = Math.min(child.material.roughness || 0.5, 0.42);
            child.material.metalness = Math.min(child.material.metalness || 0.1, 0.22);
            if (child.material.map) {
              child.material.map.colorSpace = THREE.SRGBColorSpace;
              child.material.map.anisotropy = 16;
            }
          }
        });

        this.modelWrapper.add(model);

        if (loadingOverlay) {
          loadingOverlay.style.opacity = '0';
          setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
        }
      },
      (xhr) => {
        if (loadingOverlay && xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          const textEl = loadingOverlay.querySelector('.loader-text');
          if (textEl) textEl.textContent = `SYNCING 3D NEURAL CORE: ${percent}%`;
        }
      },
      (error) => {
        console.warn('GLB load fallback to procedural model:', error);
        this.buildProceduralBot();
        if (loadingOverlay) {
          loadingOverlay.style.opacity = '0';
          setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
        }
      }
    );
  }

  buildProceduralBot() {
    const botGroup = new THREE.Group();
    botGroup.scale.set(0.78, 0.78, 0.78);
    botGroup.position.set(0, -0.12, 0);

    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0xf0f4f8,
      roughness: 0.15,
      metalness: 0.1
    });
    const helmetGeo = new THREE.SphereGeometry(0.48, 32, 32);
    helmetGeo.scale(1, 1.05, 0.95);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 0.52, 0);
    botGroup.add(helmet);

    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x07111c,
      roughness: 0.08,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });
    const visorGeo = new THREE.SphereGeometry(0.38, 32, 32);
    visorGeo.scale(1.02, 0.92, 0.75);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.52, 0.18);
    botGroup.add(visor);

    // Cyan Pixel Eyes
    const eyeCanvas = document.createElement('canvas');
    eyeCanvas.width = 512;
    eyeCanvas.height = 256;
    const ctx = eyeCanvas.getContext('2d');
    ctx.fillStyle = '#07111c';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 15;

    const drawDiamondEye = (cx, cy) => {
      const size = 12;
      for (let r = -4; r <= 4; r++) {
        const count = 5 - Math.abs(r);
        for (let c = -count + 1; c <= count - 1; c++) {
          ctx.fillRect(cx + c * (size + 3), cy + r * (size + 3), size, size);
        }
      }
    };
    drawDiamondEye(170, 110);
    drawDiamondEye(342, 110);

    const mouthPixels = [[-3, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 0]];
    mouthPixels.forEach(([x, y]) => {
      ctx.fillRect(256 + x * 15, 185 + y * 10, 12, 12);
    });

    const eyeTexture = new THREE.CanvasTexture(eyeCanvas);
    const eyeMat = new THREE.MeshBasicMaterial({ map: eyeTexture, transparent: true, opacity: 0.95 });
    const eyePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.28), eyeMat);
    eyePlane.position.set(0, 0.52, 0.44);
    botGroup.add(eyePlane);

    [-0.5, 0.5].forEach((side) => {
      const earBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 24), helmetMat);
      earBase.rotation.z = Math.PI / 2;
      earBase.position.set(side * 0.46, 0.52, 0);

      const earRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.1, 0.02, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff })
      );
      earRing.rotation.y = Math.PI / 2;
      earRing.position.set(side * 0.5, 0.52, 0);

      botGroup.add(earBase);
      botGroup.add(earRing);
    });

    const neckMat = new THREE.MeshStandardMaterial({ color: 0x1a212d, roughness: 0.6 });
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.12, 24), neckMat);
    neck.position.set(0, 0.14, 0);
    botGroup.add(neck);

    const chestGeo = new THREE.SphereGeometry(0.35, 24, 24);
    chestGeo.scale(1.1, 0.9, 0.8);
    const chest = new THREE.Mesh(chestGeo, helmetMat);
    chest.position.set(0, -0.08, 0);
    botGroup.add(chest);

    [-0.42, 0.42].forEach((side) => {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), helmetMat);
      shoulder.position.set(side, -0.06, 0);
      botGroup.add(shoulder);
    });

    this.modelWrapper.add(botGroup);
  }

  /* ==========================================================================
     3D REVOLVING CAROUSEL (REDUCED CARD SIZES & LESS HAZY GLASS)
     User requirement: "reduce the card sizes and all the cards should be little less of glassmorphism"
     ========================================================================== */
  build3DCarousel() {
    const cardData = [
      { id: '01', category: 'PHYSICS', title: 'Quantum Kinematics', desc: 'Particle wave packet dynamics.', hue: '#00e5ff' },
      { id: '02', category: 'CALCULUS', title: 'Vector Surfaces', desc: '3D gradient fields & flux.', hue: '#ff77aa' },
      { id: '03', category: 'CHEMISTRY', title: 'Molecular Orbitals', desc: 'Covalent bond angles in 3D.', hue: '#a855f7' },
      { id: '04', category: 'CODE HEAP', title: 'Call Stack Heap', desc: 'Recursion tree visualizer.', hue: '#38ef7d' },
      { id: '05', category: 'AI TUTOR', title: 'Neural Latent Space', desc: 'Cognitive retention weights.', hue: '#00c6ff' },
      { id: '06', category: 'GRAVITY', title: 'Orbital Mechanics', desc: 'N-body gravitational paths.', hue: '#ffaa40' },
      { id: '07', category: 'ALGORITHMS', title: 'Graph Traversal', desc: 'Dijkstra & A* spatial trees.', hue: '#00f2fe' },
      { id: '08', category: 'THERMO', title: 'Entropy Chamber', desc: 'Kinetic particle dispersion.', hue: '#ff5e3a' },
      { id: '09', category: 'WAVES', title: 'Laser Diffraction', desc: 'Wave interference patterns.', hue: '#e040fb' },
      { id: '10', category: 'EXAM LAB', title: 'Socratic Diagnostics', desc: 'Proof-paced concept checks.', hue: '#00e5ff' }
    ];

    const numCards = cardData.length;
    // COMPACT CARD GEOMETRY: (0.20 x 0.28) - compact, elegant, unobtrusive, allowing Vedika and content to shine
    const cardGeo = new THREE.PlaneGeometry(0.20, 0.28);

    cardData.forEach((data, i) => {
      const angle = (i / numCards) * Math.PI * 2;
      const canvasTexture = this.generateCardTexture(data);

      // Refined semi-solid card material (less glassmorphism, high opacity, crisp contrast)
      const cardMat = new THREE.MeshStandardMaterial({
        map: canvasTexture,
        transparent: true,
        opacity: 0.98,
        roughness: 0.32,
        metalness: 0.14,
        side: THREE.DoubleSide,
        depthWrite: true
      });

      const cardMesh = new THREE.Mesh(cardGeo, cardMat);

      // Position in 3D circle around Vedika with compact radius (1.45m)
      cardMesh.position.x = Math.sin(angle) * this.carouselRadius;
      cardMesh.position.z = Math.cos(angle) * this.carouselRadius;
      // Positioned at chest level (y = 0.04) so Vedika's face & eyes are fully unobstructed
      cardMesh.position.y = 0.04;

      // Orient card tangent to circle facing outward
      cardMesh.rotation.y = angle;

      this.carouselCards.push({ mesh: cardMesh, baseAngle: angle, data });
      this.carouselGroup.add(cardMesh);
    });

    // Carousel starts hidden/compact until Stage 4
    this.carouselGroup.scale.set(0.001, 0.001, 0.001);
    this.carouselGroup.visible = false;
  }

  // Generates clean, high-contrast, semi-solid card texture (much less glassmorphism, maximum readability)
  generateCardTexture(data) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 560;
    const ctx = canvas.getContext('2d');

    const drawRoundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // Card Background: Rich, semi-solid dark slate obsidian (reduced glassmorphism, crisp readability)
    drawRoundRect(10, 10, 380, 540, 24);
    const bgGrad = ctx.createLinearGradient(10, 10, 390, 550);
    bgGrad.addColorStop(0, 'rgba(18, 28, 48, 0.98)');
    bgGrad.addColorStop(0.5, 'rgba(12, 19, 34, 0.97)');
    bgGrad.addColorStop(1, 'rgba(7, 13, 24, 0.99)');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Crisp cyan perimeter border
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.stroke();

    // Top hairline accent glow
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(35, 10);
    ctx.lineTo(365, 10);
    const topHl = ctx.createLinearGradient(35, 10, 365, 10);
    topHl.addColorStop(0, 'transparent');
    topHl.addColorStop(0.5, data.hue);
    topHl.addColorStop(1, 'transparent');
    ctx.strokeStyle = topHl;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Top Header: Tag & Number Pill
    ctx.save();
    drawRoundRect(26, 28, 52, 28, 8);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillStyle = data.hue;
    ctx.textAlign = 'center';
    ctx.fillText(data.id, 52, 47);
    ctx.restore();

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(data.category, 370, 47);
    ctx.textAlign = 'left';

    // Thin separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(26, 72);
    ctx.lineTo(374, 72);
    ctx.stroke();

    // Central Topic Emblem (Crisp, High-Contrast STEM Glyph)
    const artBoxY = 195;
    const artRadius = 76;

    ctx.save();
    ctx.translate(200, artBoxY);

    // Glowing radial backdrop
    const artGrad = ctx.createRadialGradient(-15, -25, 8, 0, 0, artRadius);
    artGrad.addColorStop(0, data.hue);
    artGrad.addColorStop(0.65, '#121e34');
    artGrad.addColorStop(1, '#060a14');

    ctx.fillStyle = artGrad;
    ctx.shadowColor = data.hue;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, artRadius - 6, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight crescent
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(-22, -28, 26, 13, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Futuristic concentric orbiting rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, artRadius - 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = data.hue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, artRadius - 38, 0, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();

    // Card Title & Description (High contrast, crisp text)
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.title, 26, 395);

    ctx.font = '14px "Outfit", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(data.desc, 26, 428, 348);

    // Bottom Action Pill
    ctx.save();
    drawRoundRect(26, 475, 348, 42, 12);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = data.hue;
    ctx.fillText('EXPLORE SIMULATION →', 42, 501);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  // Smooth scroll-driven sequence & 3D carousel revolving around Vedika
  // 5-Stage Choreography:
  // - Stage 1 (01 / Brand Hero): Center gaze
  // - Stage 1 -> 2: Turn from Center to Left
  // - Stage 2 (02 / Cognitive HUD): Left gaze
  // - Stage 2 -> 3: Turn from Left back to Center
  // - Stage 3 (03 / Platform Facts): Center gaze
  // - Stage 3 -> 4: 3D Carousel entrance & camera zoom out
  // - Stage 4 (04 / Pure Carousel): 100% pure revolving carousel halo (zero clutter, nothing else on screen)
  // - Stage 4 -> 5: Carousel exits, camera returns, Creative Labs enters
  // - Stage 5 (05 / Creative Labs): Center gaze with Create Without Boundaries
  updateScrollProgress(progress) {
    this.scrollProgress = progress;

    const p = Math.max(0, Math.min(1, progress));
    let targetY = 0;
    let targetX = 0;
    let camY = 0.26;
    let camZ = 2.65;

    if (p < 0.107) {
      // Stage 1: Frontal gaze (Center)
      targetY = 0.0;
      targetX = 0.0;
      camZ = 2.65;
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.202) {
      // Scrolling Stage 1 -> Stage 2: Turn from Center to Left
      const t = (p - 0.107) / (0.202 - 0.107);
      const easeT = (1 - Math.cos(t * Math.PI)) * 0.5;
      targetY = THREE.MathUtils.lerp(0.0, -0.32, easeT);
      targetX = THREE.MathUtils.lerp(0.0, 0.03, easeT);
      camZ = THREE.MathUtils.lerp(2.65, 2.58, easeT);
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.321) {
      // Stage 2 in view: Holding gaze towards Left (looking at Cognitive HUD & headline)
      targetY = -0.32;
      targetX = 0.03;
      camZ = 2.58;
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.417) {
      // Scrolling Stage 2 -> Stage 3: Turn from Left back to Center
      const t = (p - 0.321) / (0.417 - 0.321);
      const easeT = (1 - Math.cos(t * Math.PI)) * 0.5;
      targetY = THREE.MathUtils.lerp(-0.32, 0.0, easeT);
      targetX = THREE.MathUtils.lerp(0.03, 0.0, easeT);
      camZ = THREE.MathUtils.lerp(2.58, 2.65, easeT);
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.536) {
      // Stage 3 in view: Holding gaze at Center
      targetY = 0.0;
      targetX = 0.0;
      camZ = 2.65;
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.631) {
      // Scrolling Stage 3 -> Stage 4: 3D Carousel enters, camera pulls back smoothly
      const t = (p - 0.536) / (0.631 - 0.536);
      const easeT = (1 - Math.cos(t * Math.PI)) * 0.5;
      targetY = 0.0;
      targetX = 0.0;
      camZ = THREE.MathUtils.lerp(2.65, 3.10, easeT);
      camY = THREE.MathUtils.lerp(0.26, 0.24, easeT);
      this.isCarouselActive = true;
      this.carouselTargetScale = easeT;
    } else if (p < 0.798) {
      // Stage 4: 100% PURE 3D CAROUSEL (Nothing at all obstructing screen!)
      this.isCarouselActive = true;
      this.carouselTargetScale = 1.0;
      camZ = 3.10;
      camY = 0.24;

      const tCarousel = (p - 0.631) / (0.798 - 0.631);
      this.carouselTargetRotation = tCarousel * Math.PI * 2 * 1.8;

      // Vedika smoothly tracks the revolving cards passing in front of her
      const cardStep = (Math.PI * 2) / 10;
      const currentAngleOffset = ((this.carouselTargetRotation % cardStep) / cardStep - 0.5);
      targetY = -currentAngleOffset * 0.35;
      targetX = 0.02;
    } else if (p < 0.893) {
      // Scrolling Stage 4 -> Stage 5: Carousel exits, camera returns, Vedika recenters
      const t = (p - 0.798) / (0.893 - 0.798);
      const easeT = (1 - Math.cos(t * Math.PI)) * 0.5;
      camZ = THREE.MathUtils.lerp(3.10, 2.65, easeT);
      camY = THREE.MathUtils.lerp(0.24, 0.26, easeT);
      this.carouselTargetScale = Math.max(0.001, 1.0 - easeT);
      this.isCarouselActive = (this.carouselTargetScale > 0.05);
      targetY = THREE.MathUtils.lerp(this.bustPivot.rotation.y, 0.0, easeT);
      targetX = 0.0;
    } else {
      // Stage 5: Creative Labs (Create Without Boundaries in full view)
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
      camZ = 2.65;
      camY = 0.26;
      targetY = 0.0;
      targetX = 0.0;
    }

    this.targetBotRotY = targetY;
    this.targetBotRotX = targetX;
    this.targetCamY = camY;
    this.targetCamZ = camZ;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Silky-smooth interpolation to target angles (ZERO cursor tracking)
    this.bustPivot.rotation.y += (this.targetBotRotY - this.bustPivot.rotation.y) * 0.06;
    this.bustPivot.rotation.x += (this.targetBotRotX - this.bustPivot.rotation.x) * 0.06;

    // Camera strictly centered horizontally (x = 0)
    this.camera.position.x = 0;
    this.camera.position.y += (this.targetCamY - this.camera.position.y) * 0.06;
    this.camera.position.z += (this.targetCamZ - this.camera.position.z) * 0.06;
    this.camera.lookAt(0, 0.26, 0);

    // 3D Carousel animation & visibility
    if (this.isCarouselActive) {
      this.carouselGroup.visible = true;
      const currentScale = this.carouselGroup.scale.x;
      const newScale = currentScale + (this.carouselTargetScale - currentScale) * 0.08;
      this.carouselGroup.scale.set(newScale, newScale, newScale);

      this.carouselGroup.rotation.y += (this.carouselTargetRotation - this.carouselGroup.rotation.y) * 0.08;
    } else {
      if (this.carouselGroup.scale.x > 0.01) {
        const newScale = this.carouselGroup.scale.x * 0.85;
        this.carouselGroup.scale.set(newScale, newScale, newScale);
      } else {
        this.carouselGroup.visible = false;
      }
    }

    // Subtle idle breathing motion on Y-axis
    const idleBreath = Math.sin(elapsedTime * 1.5) * 0.008;
    this.modelWrapper.position.y = idleBreath;

    // Soft oscillation on visor point light
    if (this.visorLight) {
      this.visorLight.intensity = 1.8 + Math.sin(elapsedTime * 2.2) * 0.2;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
