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

    // Active Theme ('maroon' | 'crimson')
    const savedTheme = (typeof localStorage !== 'undefined' && localStorage.getItem('vedika-theme')) || (document.body ? document.body.getAttribute('data-theme') : 'maroon') || 'maroon';
    this.currentTheme = savedTheme;

    // Initial positioning: camera framed naturally so head, shoulders, and chest are solid and grounded
    this.rootGroup.position.set(0, 0, 0);
    this.camera.position.set(0, 0.26, 2.65);
    this.camera.lookAt(0, 0.26, 0);

    // Scroll-driven state
    this.scrollProgress = 0;
    this.targetBotRotY = 0;
    this.targetBotRotX = 0;
    this.targetBotRotZ = 0;
    this.targetCamY = 0.26;
    this.targetCamZ = 2.65;

    // 3D Revolving Carousel (Tilted 15 degrees to the left)
    this.carouselTiltGroup = new THREE.Group();
    this.carouselGroup = new THREE.Group();
    this.carouselCards = [];
    this.carouselTargetRotation = 0;
    // Compact radius (1.48m) so cards gracefully orbit around Vedika without eclipsing her
    this.carouselRadius = 1.48;
    this.isCarouselActive = false;

    // Tilt the entire carousel circle 15 degrees to the left (+15° around Z axis = +0.2618 rad)
    // plus gentle forward pitch on X (0.12 rad) for open, readable 3D perspective
    this.carouselTiltGroup.rotation.z = 15 * (Math.PI / 180); // +0.2618 rad (15° left tilt)
    this.carouselTiltGroup.rotation.x = 0.12; // gentle forward incline
    this.carouselTiltGroup.position.set(0, 0.04, 0);

    this.carouselTiltGroup.add(this.carouselGroup);
    this.scene.add(this.carouselTiltGroup);

    this.clock = new THREE.Clock();

    this.initLighting();
    if (this.currentTheme !== 'maroon') {
      this.setTheme(this.currentTheme);
    }
    this.initEventListeners();
    this.loadModel();
    this.build3DCarousel();
    this.onResize();
    this.animate();
  }

  initLighting() {
    // Ambient Light - Deep imperial maroon tone (or warm cinnabar in crimson theme)
    this.ambientLight = new THREE.AmbientLight(0x1e0409, 2.2);
    this.scene.add(this.ambientLight);

    // Top Shimmering Downlight - Soft Warm Alabaster Off-White
    this.topGlowLight = new THREE.DirectionalLight(0xfdf9f3, 3.8);
    this.topGlowLight.position.set(0, 4.5, 1);
    this.scene.add(this.topGlowLight);

    // Key Light - Warm Alabaster Champagne Key
    this.keyLight = new THREE.DirectionalLight(0xfff6ea, 2.8);
    this.keyLight.position.set(3, 3.5, 3);
    this.scene.add(this.keyLight);

    // Fill Light - Soft Antique Burgundy-Maroon Fill
    this.fillLight = new THREE.DirectionalLight(0x6a1525, 1.8);
    this.fillLight.position.set(-3, 1.5, 2);
    this.scene.add(this.fillLight);

    // Rim Backlight 1 - Crisp Alabaster Off-White High-Intensity Rim
    this.rimLight1 = new THREE.DirectionalLight(0xfcfaf6, 5.0);
    this.rimLight1.position.set(2.5, 3.5, -3);
    this.scene.add(this.rimLight1);

    // Rim Backlight 2 - Deep Wine Maroon Backfill
    this.rimLight2 = new THREE.DirectionalLight(0x9e182e, 4.2);
    this.rimLight2.position.set(-2.5, 2.5, -3);
    this.scene.add(this.rimLight2);

    // Visor Point Light - Luminous Ivory Off-White
    this.visorLight = new THREE.PointLight(0xfff8ee, 2.4, 2.2);
    this.visorLight.position.set(0, 0.45, 0.8);
    this.scene.add(this.visorLight);
  }

  setTheme(theme) {
    this.currentTheme = theme;
    if (theme === 'crimson') {
      // Warm Cinnabar & Sunset Coral Lighting Rig (From Website reference.mp4)
      if (this.ambientLight) this.ambientLight.color.setHex(0x360a05);
      if (this.topGlowLight) {
        this.topGlowLight.color.setHex(0xffe2d0);
        this.topGlowLight.intensity = 4.2;
      }
      if (this.keyLight) {
        this.keyLight.color.setHex(0xffebe0);
        this.keyLight.intensity = 3.0;
      }
      if (this.fillLight) {
        this.fillLight.color.setHex(0xb82c16);
        this.fillLight.intensity = 2.4;
      }
      if (this.rimLight1) {
        this.rimLight1.color.setHex(0xffded0);
        this.rimLight1.intensity = 5.2;
      }
      if (this.rimLight2) {
        this.rimLight2.color.setHex(0xe83a1e); // vivid sunset vermilion rim from reference video
        this.rimLight2.intensity = 4.8;
      }
      if (this.visorLight) {
        this.visorLight.color.setHex(0xff6e48);
      }
    } else {
      // Imperial Velvet Maroon & Alabaster Off-White
      if (this.ambientLight) this.ambientLight.color.setHex(0x1e0409);
      if (this.topGlowLight) {
        this.topGlowLight.color.setHex(0xfdf9f3);
        this.topGlowLight.intensity = 3.8;
      }
      if (this.keyLight) {
        this.keyLight.color.setHex(0xfff6ea);
        this.keyLight.intensity = 2.8;
      }
      if (this.fillLight) {
        this.fillLight.color.setHex(0x6a1525);
        this.fillLight.intensity = 1.8;
      }
      if (this.rimLight1) {
        this.rimLight1.color.setHex(0xfcfaf6);
        this.rimLight1.intensity = 5.0;
      }
      if (this.rimLight2) {
        this.rimLight2.color.setHex(0x9e182e);
        this.rimLight2.intensity = 4.2;
      }
      if (this.visorLight) {
        this.visorLight.color.setHex(0xfff8ee);
      }
    }

    this.refreshCarouselTextures();
  }

  refreshCarouselTextures() {
    if (!this.carouselCards) return;
    this.carouselCards.forEach((card) => {
      const sharp = this.generateCardTexture(card.data, false);
      const blur = this.generateCardTexture(card.data, true);
      if (card.material && card.material.uniforms) {
        if (card.material.uniforms.tSharp.value) card.material.uniforms.tSharp.value.dispose();
        if (card.material.uniforms.tBlur.value) card.material.uniforms.tBlur.value.dispose();
        card.material.uniforms.tSharp.value = sharp;
        card.material.uniforms.tBlur.value = blur;
        card.material.needsUpdate = true;
      }
    });
  }

  loadModel() {
    const loadingOverlay = document.getElementById('model-loading-overlay');
    const loader = new GLTFLoader();
    const modelUrl = '/models/vedika-M1.glb';

    const onModelSuccess = (gltf) => {
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

      // Pre-warm WebGL shaders for instant zero-jank first frame
      try {
        this.renderer.compile(this.scene, this.camera);
      } catch (_) {}

      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => { loadingOverlay.style.display = 'none'; }, 200);
      }
    };

    const onModelFail = (error) => {
      console.warn('GLB load fallback to procedural model:', error);
      this.buildProceduralBot();
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => { loadingOverlay.style.display = 'none'; }, 200);
      }
    };

    // Instant parse from high-priority early head stream / persistent cache
    if (window.__vedikaModelPromise) {
      window.__vedikaModelPromise
        .then((arrayBuffer) => {
          loader.parse(
            arrayBuffer,
            '',
            (gltf) => onModelSuccess(gltf),
            (parseErr) => {
              console.warn('[VEDIKA] Buffer parse error, fallback to loader.load:', parseErr);
              loader.load(modelUrl, onModelSuccess, null, onModelFail);
            }
          );
        })
        .catch((err) => {
          console.warn('[VEDIKA] Preload promise error, fallback to loader.load:', err);
          loader.load(modelUrl, onModelSuccess, null, onModelFail);
        });
    } else {
      loader.load(
        modelUrl,
        onModelSuccess,
        (xhr) => {
          if (loadingOverlay && xhr.total > 0) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            const textEl = loadingOverlay.querySelector('.loader-text');
            if (textEl) textEl.textContent = `SYNCING 3D NEURAL CORE: ${percent}%`;
          }
        },
        onModelFail
      );
    }
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
    ctx.fillStyle = '#1c0409';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#fcfaf6';
    ctx.shadowColor = 'rgba(184, 34, 60, 0.8)';
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
        new THREE.MeshBasicMaterial({ color: 0xfcfaf6 })
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
     3D REVOLVING CAROUSEL (30° TILTED ORBITAL HALO)
     - 10 Cards mapping the webapp's actual feature suite
     - Center card is enlarged (1.38x) and 100% razor sharp
     - Remaining cards' content is blurred with defocused frosted glass
     ========================================================================== */
  build3DCarousel() {
    const cardData = [
      { id: '01', category: 'VEDIKA-AI', title: 'Ask Vedika & History', desc: 'Conversational Socratic AI mentor with full session logs.', hue: '#fcfaf6' },
      { id: '02', category: 'VEDIKA-AI', title: 'Dynamic Infographics', desc: 'Auto coordinate graphs, math plots & algorithmic trees.', hue: '#f4ede2' },
      { id: '03', category: 'CODING', title: 'Code with Vedika', desc: 'Live code sandbox with real-time memory stack tracer.', hue: '#ece3d4' },
      { id: '04', category: 'PRACTICE', title: 'Daily Code Puzzles', desc: 'Gamified algorithmic challenges with runtime checks.', hue: '#fcfaf6' },
      { id: '05', category: 'CAREERS', title: 'Viva & Aptitude Prep', desc: 'AI oral viva defenses & corporate interview mock drills.', hue: '#dfd3c3' },
      { id: '06', category: 'VEDIKA-LABS', title: 'Virtual Biology Lab', desc: '3D cellular cytology, organelle explorer & specimen labs.', hue: '#fcfaf6' },
      { id: '07', category: 'VEDIKA-LABS', title: 'Virtual Physics Lab', desc: 'Orbital gravity mechanics, wave packets & laser benches.', hue: '#f4ede2' },
      { id: '08', category: 'VEDIKA-LABS', title: 'Virtual Chemistry Lab', desc: 'Molecular 3D tetrahedral geometry & reaction titration.', hue: '#ece3d4' },
      { id: '09', category: 'CURRICULUM', title: 'DSA Resource Hub', desc: 'Company-wise Google, Amazon, Meta roadmap & cheatsheets.', hue: '#fcfaf6' },
      { id: '10', category: 'PLACEMENTS', title: 'Jobs & Progress Radar', desc: 'Curated skill-matched openings & student analytics.', hue: '#dfd3c3' }
    ];

    const numCards = cardData.length;
    // Base Card Geometry: (0.20 x 0.28) - scales dynamically up to 1.38x when centered
    const cardGeo = new THREE.PlaneGeometry(0.20, 0.28);

    cardData.forEach((data, i) => {
      const angle = (i / numCards) * Math.PI * 2;
      const sharpTexture = this.generateCardTexture(data, false);
      const blurTexture = this.generateCardTexture(data, true);

      // Hardware-accelerated crossfade ShaderMaterial:
      // Blurs content when on the sides/back, sharpens to crystal clarity at center!
      const cardMat = new THREE.ShaderMaterial({
        uniforms: {
          tSharp: { value: sharpTexture },
          tBlur: { value: blurTexture },
          uSharpness: { value: 0.0 },
          uOpacity: { value: 0.98 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tSharp;
          uniform sampler2D tBlur;
          uniform float uSharpness;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            vec4 sharpCol = texture2D(tSharp, vUv);
            vec4 blurCol = texture2D(tBlur, vUv);
            vec4 finalCol = mix(blurCol, sharpCol, clamp(uSharpness, 0.0, 1.0));
            gl_FragColor = vec4(finalCol.rgb, finalCol.a * uOpacity);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true
      });

      const cardMesh = new THREE.Mesh(cardGeo, cardMat);

      // Position in 3D circle around Vedika with compact radius (1.48m)
      cardMesh.position.x = Math.sin(angle) * this.carouselRadius;
      cardMesh.position.z = Math.cos(angle) * this.carouselRadius;
      cardMesh.position.y = 0.02;

      // Orient card tangent to circle facing outward
      cardMesh.rotation.y = angle;
      const defaultQuat = cardMesh.quaternion.clone();

      this.carouselCards.push({ mesh: cardMesh, material: cardMat, baseAngle: angle, defaultQuat, data });
      this.carouselGroup.add(cardMesh);
    });

    // Carousel starts hidden/compact until Stage 4
    this.carouselTiltGroup.scale.set(0.001, 0.001, 0.001);
    this.carouselTiltGroup.visible = false;
  }

  // Generates card texture in Regal Maroon & Alabaster Off-White
  // isBlurred = true: content (text, emblem, details) is blurred;
  // isBlurred = false: 100% razor-sharp typography and vector art
  generateCardTexture(data, isBlurred = false) {
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

    // Card Background: Luminous, high-contrast Pearlescent Alabaster Ivory
    // (Breathtaking visibility against the dark maroon backdrop; matches Vedika's porcelain finish)
    drawRoundRect(10, 10, 380, 540, 26);
    const bgGrad = ctx.createLinearGradient(10, 10, 390, 550);
    if (isBlurred) {
      bgGrad.addColorStop(0, 'rgba(244, 238, 228, 0.90)');
      bgGrad.addColorStop(0.5, 'rgba(236, 227, 214, 0.88)');
      bgGrad.addColorStop(1, 'rgba(224, 212, 196, 0.90)');
    } else {
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(0.35, '#fcfaf6');
      bgGrad.addColorStop(0.75, '#f5ede2');
      bgGrad.addColorStop(1, '#e8ded0');
    }
    ctx.fillStyle = bgGrad;
    ctx.fill();

    const isCrimson = this.currentTheme === 'crimson';

    // Dual Perimeter Borders
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isCrimson 
      ? (isBlurred ? 'rgba(80, 16, 10, 0.45)' : 'rgba(60, 12, 6, 0.88)')
      : (isBlurred ? 'rgba(74, 13, 24, 0.45)' : 'rgba(54, 8, 17, 0.88)');
    ctx.stroke();

    // Inner hairline frame
    drawRoundRect(16, 16, 368, 528, 20);
    ctx.lineWidth = 1;
    ctx.strokeStyle = isCrimson 
      ? (isBlurred ? 'rgba(230, 56, 30, 0.25)' : 'rgba(230, 56, 30, 0.55)')
      : (isBlurred ? 'rgba(184, 34, 60, 0.25)' : 'rgba(184, 34, 60, 0.45)');
    ctx.stroke();

    // Top specular highlight crescent
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(40, 12);
    ctx.lineTo(360, 12);
    const topHl = ctx.createLinearGradient(40, 12, 360, 12);
    topHl.addColorStop(0, 'transparent');
    topHl.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
    topHl.addColorStop(1, 'transparent');
    ctx.strokeStyle = topHl;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // If blurred mode: apply 2D canvas filter blur to all text and emblem content!
    if (isBlurred) {
      ctx.filter = 'blur(10px) opacity(65%)';
    }

    // Top Header: Tag & Number Pill
    ctx.save();
    drawRoundRect(28, 30, 54, 28, 8);
    ctx.fillStyle = isCrimson ? 'rgba(50, 10, 6, 0.92)' : 'rgba(46, 6, 14, 0.92)';
    ctx.fill();
    ctx.strokeStyle = isCrimson ? 'rgba(230, 56, 30, 0.7)' : 'rgba(184, 34, 60, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 15px "Thinoo", -apple-system, sans-serif';
    ctx.fillStyle = '#fcfaf6'; // Crisp white number
    ctx.textAlign = 'center';
    ctx.fillText(data.id, 55, 49);
    ctx.restore();

    // Category in bold tracked theme accent
    ctx.font = 'bold 12px "Thinoo", -apple-system, sans-serif';
    ctx.fillStyle = isCrimson ? '#8a1a0a' : '#6b1122';
    ctx.textAlign = 'right';
    ctx.fillText(data.category, 368, 49);
    ctx.textAlign = 'left';

    // Thin separator
    ctx.strokeStyle = isCrimson ? 'rgba(80, 16, 10, 0.2)' : 'rgba(74, 13, 24, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, 74);
    ctx.lineTo(372, 74);
    ctx.stroke();

    // Central Topic Emblem (Garnet-Ruby in Maroon, Sunset Cinnabar in Crimson)
    const artBoxY = 195;
    const artRadius = 76;

    ctx.save();
    ctx.translate(200, artBoxY);

    // Glowing radial backdrop
    const artGrad = ctx.createRadialGradient(-15, -25, 8, 0, 0, artRadius);
    if (isCrimson) {
      artGrad.addColorStop(0, '#ff5c38');
      artGrad.addColorStop(0.55, '#c82810');
      artGrad.addColorStop(1, '#3a0702');
      ctx.shadowColor = 'rgba(230, 56, 30, 0.6)';
    } else {
      artGrad.addColorStop(0, '#c92a46');
      artGrad.addColorStop(0.55, '#731224');
      artGrad.addColorStop(1, '#2a040b');
      ctx.shadowColor = 'rgba(184, 34, 60, 0.5)';
    }

    ctx.fillStyle = artGrad;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, artRadius - 6, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight crescent
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(-22, -28, 26, 13, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Concentric orbiting rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, artRadius - 20, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(252, 250, 246, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, artRadius - 38, 0, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();

    // Card Title in Calluna (Deep Contrast & Legibility!)
    ctx.font = 'bold 24px "Calluna", Georgia, serif';
    ctx.fillStyle = isCrimson ? '#180402' : '#160205';
    ctx.fillText(data.title, 28, 395);

    // Card Description in Vollkorn
    ctx.font = '15px "Vollkorn", Georgia, serif';
    ctx.fillStyle = isCrimson ? '#421008' : '#3a0813';
    ctx.fillText(data.desc, 28, 428, 344);

    // Bottom Action Pill
    ctx.save();
    drawRoundRect(28, 474, 344, 44, 12);
    const btnGrad = ctx.createLinearGradient(28, 474, 372, 518);
    if (isCrimson) {
      btnGrad.addColorStop(0, '#8c1a0c');
      btnGrad.addColorStop(1, '#340602');
    } else {
      btnGrad.addColorStop(0, '#560e1d');
      btnGrad.addColorStop(1, '#24040a');
    }
    ctx.fillStyle = btnGrad;
    ctx.fill();
    ctx.strokeStyle = isCrimson ? 'rgba(230, 56, 30, 0.6)' : 'rgba(184, 34, 60, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 12px "Thinoo", -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('EXPLORE FEATURE →', 46, 501);
    ctx.restore();

    if (isBlurred) {
      ctx.filter = 'none';
      // Frosted defocus glaze
      ctx.fillStyle = 'rgba(240, 230, 218, 0.15)';
      ctx.fill();
    }

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
  // - Stage 1 (01 / Brand Hero): Center frontal gaze
  // - Stage 1 -> 2: Turn to organic TOP-LEFT look (-0.82 rad Y, -0.22 rad X, 0.08 rad Z) in lockstep with page shift
  // - Stage 2 (02 / Vedika-AI): Hold graceful TOP-LEFT gaze looking at headline & telemetry
  // - Stage 2 -> 3: Return from TOP-LEFT back to Center frontal gaze (0.0 rad)
  // - Stage 3 (03 / Courses & Resource Hub): Center frontal gaze
  // - Stage 3 -> 4: 3D Carousel entrance (tilted 30° to right) & gaze prepares to far left card
  // - Stage 4 (04 / Pure Carousel): Bot sweeps gaze smoothly from far left card to far right card (ZERO shaking!)
  // - Stage 4 -> 5: Carousel exits, camera returns, bot smoothly settles back to Center
  // - Stage 5 (05 / Virtual Labs, Jobs & Progress): Center frontal gaze
  // Full reversibility: scrolling up from Stage 5 to Stage 1 reverses all transformations in exact symmetry!
  updateScrollProgress(progress) {
    this.scrollProgress = progress;

    const p = Math.max(0, Math.min(1, progress));
    let targetY = 0;
    let targetX = 0;
    let targetZ = 0;
    let camY = 0.26;
    let camZ = 2.65;

    // Organic "Top-Left" look for Stage 2:
    // - targetY = -0.82 rad (~47° left)
    // - targetX = -0.22 rad (~12.6° lifted up towards top-left)
    // - targetZ = 0.08 rad (natural inquisitive human-like head roll)
    const TOP_LEFT_Y = -0.82;
    const TOP_LEFT_X = -0.22;
    const TOP_LEFT_Z = 0.08;

    if (p < 0.107) {
      // Stage 1: Frontal gaze (Center)
      targetY = 0.0;
      targetX = 0.0;
      targetZ = 0.0;
      camZ = 2.65;
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.202) {
      // Shift Page 1 -> Page 2: Turn smoothly to TOP-LEFT
      // Synchronized directly with Page 1 exit and Page 2 entry (reversible)
      const t = (p - 0.107) / (0.202 - 0.107);
      const easeT = (1 - Math.cos(t * Math.PI)) * 0.5;
      targetY = THREE.MathUtils.lerp(0.0, TOP_LEFT_Y, easeT);
      targetX = THREE.MathUtils.lerp(0.0, TOP_LEFT_X, easeT);
      targetZ = THREE.MathUtils.lerp(0.0, TOP_LEFT_Z, easeT);
      camZ = THREE.MathUtils.lerp(2.65, 2.58, easeT);
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.321) {
      // Stage 2: Holding gaze gracefully towards TOP-LEFT (reading Vedika-AI title & features)
      targetY = TOP_LEFT_Y;
      targetX = TOP_LEFT_X;
      targetZ = TOP_LEFT_Z;
      camZ = 2.58;
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.417) {
      // Shift Page 2 -> Page 3: Get back from TOP-LEFT to CENTER
      // Synchronized directly with Page 2 exit and Page 3 entry (reversible)
      const t = (p - 0.321) / (0.417 - 0.321);
      const easeT = (1 - Math.cos(t * Math.PI)) * 0.5;
      targetY = THREE.MathUtils.lerp(TOP_LEFT_Y, 0.0, easeT);
      targetX = THREE.MathUtils.lerp(TOP_LEFT_X, 0.0, easeT);
      targetZ = THREE.MathUtils.lerp(TOP_LEFT_Z, 0.0, easeT);
      camZ = THREE.MathUtils.lerp(2.58, 2.65, easeT);
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.536) {
      // Stage 3: Frontal gaze (Center) for Courses & Resource Hub
      targetY = 0.0;
      targetX = 0.0;
      targetZ = 0.0;
      camZ = 2.65;
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
    } else if (p < 0.631) {
      // Shift Page 3 -> Page 4: 3D Carousel enters, camera pulls back smoothly,
      // bot smoothly prepares gaze by turning from Center to FAR LEFT carousel card
      const t = (p - 0.536) / (0.631 - 0.536);
      const easeT = (1 - Math.cos(t * Math.PI)) * 0.5;
      targetY = THREE.MathUtils.lerp(0.0, -0.70, easeT);
      targetX = THREE.MathUtils.lerp(0.0, -0.06, easeT);
      targetZ = THREE.MathUtils.lerp(0.0, -0.04, easeT);
      camZ = THREE.MathUtils.lerp(2.65, 3.10, easeT);
      camY = THREE.MathUtils.lerp(0.26, 0.24, easeT);
      this.isCarouselActive = true;
      this.carouselTargetScale = easeT;
    } else if (p < 0.798) {
      // Stage 4: 100% PURE 3D CAROUSEL (Tilted 30° to the right)
      // As user scrolls the carousel, bot sweeps smoothly from FAR LEFT card to FAR RIGHT card
      // Zero sawtooth, zero modulo resets, ZERO SHAKING even on fastest scroll!
      this.isCarouselActive = true;
      this.carouselTargetScale = 1.0;
      camZ = 3.10;
      camY = 0.24;

      const tCarousel = (p - 0.631) / (0.798 - 0.631);
      this.carouselTargetRotation = tCarousel * Math.PI * 2 * 1.8;

      // Smooth, majestic gaze sweep from far left card (-0.70) to far right card (+0.70)
      targetY = THREE.MathUtils.lerp(-0.70, 0.70, tCarousel);
      targetX = -0.06;
      targetZ = THREE.MathUtils.lerp(-0.04, 0.04, tCarousel);
    } else if (p < 0.893) {
      // Shift Page 4 -> Page 5: Carousel exits, camera returns,
      // bot smoothly transitions from FAR RIGHT card (+0.70) back to CENTER (0.0)
      const t = (p - 0.798) / (0.893 - 0.798);
      const easeT = (1 - Math.cos(t * Math.PI)) * 0.5;
      camZ = THREE.MathUtils.lerp(3.10, 2.65, easeT);
      camY = THREE.MathUtils.lerp(0.24, 0.26, easeT);
      this.carouselTargetScale = Math.max(0.001, 1.0 - easeT);
      this.isCarouselActive = (this.carouselTargetScale > 0.05);

      targetY = THREE.MathUtils.lerp(0.70, 0.0, easeT);
      targetX = THREE.MathUtils.lerp(-0.06, 0.0, easeT);
      targetZ = THREE.MathUtils.lerp(0.04, 0.0, easeT);
    } else {
      // Stage 5: Virtual Labs, Jobs & Progress (Center gaze)
      this.isCarouselActive = false;
      this.carouselTargetScale = 0.001;
      camZ = 2.65;
      camY = 0.26;
      targetY = 0.0;
      targetX = 0.0;
      targetZ = 0.0;
    }

    this.targetBotRotY = targetY;
    this.targetBotRotX = targetX;
    this.targetBotRotZ = targetZ;
    this.targetCamY = camY;
    this.targetCamZ = camZ;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Responsive, silky interpolation to target angles (tracks GSAP scrubbed scroll faithfully without trailing lag)
    this.bustPivot.rotation.y += (this.targetBotRotY - this.bustPivot.rotation.y) * 0.28;
    this.bustPivot.rotation.x += (this.targetBotRotX - this.bustPivot.rotation.x) * 0.28;
    this.bustPivot.rotation.z += (this.targetBotRotZ - this.bustPivot.rotation.z) * 0.28;

    // Camera strictly centered horizontally (x = 0)
    this.camera.position.x = 0;
    this.camera.position.y += (this.targetCamY - this.camera.position.y) * 0.22;
    this.camera.position.z += (this.targetCamZ - this.camera.position.z) * 0.22;
    this.camera.lookAt(0, 0.26, 0);

    // 3D Carousel animation & visibility (15° left-tilted orbital group)
    if (this.isCarouselActive) {
      this.carouselTiltGroup.visible = true;
      const currentScale = this.carouselTiltGroup.scale.x;
      const newScale = currentScale + (this.carouselTargetScale - currentScale) * 0.12;
      this.carouselTiltGroup.scale.set(newScale, newScale, newScale);

      this.carouselGroup.rotation.y += (this.carouselTargetRotation - this.carouselGroup.rotation.y) * 0.10;

      // Center proximity effect:
      // Cards coming to center front scale up to 1.40x & become 100% razor sharp;
      // Straightens up at center (0° tilt) and smoothly returns to tilted position when scrolling away!
      const tempPos = new THREE.Vector3();
      const qWorldStraight = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
      const parentWorldQuat = new THREE.Quaternion();
      this.carouselGroup.getWorldQuaternion(parentWorldQuat);
      const invParentWorldQuat = parentWorldQuat.clone().invert();
      const qStraightLocal = invParentWorldQuat.multiply(qWorldStraight);

      this.carouselCards.forEach((card) => {
        card.mesh.getWorldPosition(tempPos);
        let proximity = 0;
        if (tempPos.z > 0) {
          // Responsive proximity window around center front
          proximity = Math.pow(Math.max(0, 1.0 - Math.abs(tempPos.x) / 0.88), 1.5);
        }
        // Center card scales up (1.40x), remaining cards are 0.90x
        const scale = THREE.MathUtils.lerp(0.90, 1.40, proximity);
        card.mesh.scale.set(scale, scale, 1);

        // Center card straightens up to 0° upright facing camera when centered,
        // and smoothly returns to the 15° tilted orbital angle as it scrolls away!
        if (card.defaultQuat) {
          card.mesh.quaternion.copy(card.defaultQuat).slerp(qStraightLocal, proximity);
        }

        // Center card unblurs into crystal sharpness, remaining cards stay blurred!
        if (card.material.uniforms && card.material.uniforms.uSharpness) {
          card.material.uniforms.uSharpness.value = proximity;
        }
      });
    } else {
      if (this.carouselTiltGroup.scale.x > 0.01) {
        const newScale = this.carouselTiltGroup.scale.x * 0.82;
        this.carouselTiltGroup.scale.set(newScale, newScale, newScale);
      } else {
        this.carouselTiltGroup.visible = false;
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
