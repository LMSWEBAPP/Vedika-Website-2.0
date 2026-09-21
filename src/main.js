import { BotScene } from './three/BotScene.js';
import { initScrollChoreography } from './animations/scrollChoreography.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Scene
  const canvas = document.getElementById('webgl-canvas');
  let botScene = null;
  if (canvas) {
    botScene = new BotScene(canvas);
    window.__botScene = botScene;
  }

  // 2. Initialize Theme Switcher (Imperial Maroon vs Reference Video Crimson)
  initThemeSwitcher(botScene);

  // 3. Initialize Scroll Choreography
  initScrollChoreography(botScene);

  // 4. Animated Emotional Waveform Canvas (Stage 2 HUD)
  initWaveformCanvas();

  // 5. Interactive Simulation Sandbox
  initSimulationSandbox();

  // 6. Stage 4 Category Pills Interaction
  initContentPills();

  // 7. Audio Toggle & Secondary Actions
  initSecondaryActions();
});

/* ==========================================================================
   WAVEFORM CANVAS (STAGE 2 TELEMETRY)
   Smooth animated sine pulse graph representing "Emotional State: Calm & Focused"
   ========================================================================== */
function initWaveformCanvas() {
  const canvas = document.getElementById('emotional-wave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let offset = 0;

  function renderWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background Grid lines - subtle off-white
    ctx.strokeStyle = 'rgba(244, 237, 226, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Sine wave - Theme-reactive telemetry line (Glowing Coral in Crimson, Alabaster in Maroon)
    const isCrimson = document.body.getAttribute('data-theme') === 'crimson';
    ctx.beginPath();
    ctx.strokeStyle = isCrimson ? '#ff5c38' : '#fcfaf6';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = isCrimson ? 'rgba(255, 87, 51, 0.95)' : 'rgba(184, 34, 60, 0.85)';
    ctx.shadowBlur = isCrimson ? 12 : 8;

    const centerY = canvas.height / 2;
    for (let x = 0; x < canvas.width; x++) {
      // Gentle calm pulsing sine wave with harmonic
      const y = centerY + 
        Math.sin((x + offset) * 0.04) * 14 + 
        Math.sin((x - offset * 0.5) * 0.08) * 5;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    offset += 1.8;
    requestAnimationFrame(renderWave);
  }

  renderWave();
}

/* ==========================================================================
   INTERACTIVE SIMULATION SANDBOX (SECTION 5)
   ========================================================================== */
function initSimulationSandbox() {
  const display = document.getElementById('sim-display');
  if (!display) return;
  const tabs = document.querySelectorAll('.sim-tab');
  const dialogueText = document.getElementById('sim-dialogue-text');
  const chatInput = document.getElementById('sim-chat-input');
  const chatSendBtn = document.getElementById('btn-sim-send');
  const messagesContainer = document.getElementById('dialogue-messages');

  const getThemeColors = () => {
    const isCrimson = document.body.getAttribute('data-theme') === 'crimson';
    return {
      isCrimson,
      activeBg: isCrimson ? 'rgba(230, 56, 30, 0.30)' : 'rgba(184, 34, 60, 0.25)',
      activeBorder: isCrimson ? 'rgba(255, 180, 160, 0.8)' : 'rgba(252, 250, 246, 0.6)',
      frameBg: isCrimson ? 'rgba(46, 9, 5, 0.88)' : 'rgba(36, 5, 11, 0.85)',
      sunCenter: isCrimson ? 'radial-gradient(circle, #ff5733 25%, #6a1408 80%)' : 'radial-gradient(circle, #b8223c 25%, #4a0d18 80%)',
      sunGlow: isCrimson ? 'rgba(230, 56, 30, 0.7)' : 'rgba(184, 34, 60, 0.6)',
      carbonSphere: isCrimson ? 'radial-gradient(circle, #5c1208, #180402)' : 'radial-gradient(circle, #4a0d18, #180306)',
      carbonGlow: isCrimson ? 'rgba(230, 56, 30, 0.55)' : 'rgba(184, 34, 60, 0.5)'
    };
  };

  const simConfigs = {
    code: {
      text: `"Look at how the recursive stack frame expands in memory. Notice that each frame preserves its own local scope before resolving the base condition. What would happen if we remove the terminating case?"`,
      render: () => {
        const c = getThemeColors();
        return `
        <div class="code-stack-sim" style="width: 100%; max-width: 460px; font-family: 'Thinoo', sans-serif; font-size: 0.78rem; letter-spacing: 0.06em;">
          <div style="color: #c2b29d; margin-bottom: 10px; display: flex; justify-content: space-between;">
            <span>CALL STACK MEMORY HEAP</span>
            <span style="color: #fcfaf6;">0x7FFEE4B2</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: ${c.activeBg}; border: 1px solid ${c.activeBorder}; padding: 10px 14px; border-radius: 8px; color: #fcfaf6; display: flex; justify-content: space-between; animation: pulse 2s infinite;">
              <span>factorial(n=1) → returns 1</span>
              <span style="color: #fcfaf6; font-weight: bold;">BASE HIT [0x04]</span>
            </div>
            <div style="background: ${c.frameBg}; border: 1px solid rgba(244, 237, 226, 0.2); padding: 10px 14px; border-radius: 8px; color: #f4ede2; display: flex; justify-content: space-between;">
              <span>factorial(n=2) → waiting on (n=1)</span>
              <span style="color: #c2b29d;">FRAME [0x03]</span>
            </div>
            <div style="background: ${c.frameBg}; border: 1px solid rgba(244, 237, 226, 0.14); padding: 10px 14px; border-radius: 8px; color: #c2b29d; display: flex; justify-content: space-between;">
              <span>factorial(n=3) → waiting on (n=2)</span>
              <span style="color: #948470;">FRAME [0x02]</span>
            </div>
            <div style="background: ${c.frameBg}; border: 1px solid rgba(244, 237, 226, 0.1); padding: 10px 14px; border-radius: 8px; color: #948470; display: flex; justify-content: space-between;">
              <span>main() → invoked factorial(3)</span>
              <span style="color: #6d5e4d;">ROOT [0x01]</span>
            </div>
          </div>
        </div>
      `;
      }
    },
    physics: {
      text: `"Observe how orbital velocity balances the central gravitational pull. If tangential velocity increases by just 15%, the stable ellipse converts into an open hyperbolic escape trajectory."`,
      render: () => {
        const c = getThemeColors();
        return `
        <div class="physics-sim-view" style="display: flex; flex-direction: column; align-items: center; position: relative; width: 280px; height: 240px;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 44px; height: 44px; border-radius: 50%; background: ${c.sunCenter}; box-shadow: 0 0 35px ${c.sunGlow};"></div>
          <div style="position: absolute; top: 50%; left: 50%; width: 180px; height: 180px; transform: translate(-50%, -50%); border: 1px dashed rgba(244, 237, 226, 0.4); border-radius: 50%; animation: spin 10s linear infinite;">
            <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 18px; height: 18px; border-radius: 50%; background: #fcfaf6; box-shadow: 0 0 15px rgba(255, 255, 255, 0.9);"></div>
          </div>
          <div style="position: absolute; bottom: 10px; font-family: 'Thinoo', sans-serif; font-size: 0.72rem; letter-spacing: 0.08em; color: #fcfaf6;">
            ORBITAL VELOCITY: 7.92 km/s | G = 6.674e-11
          </div>
        </div>
      `;
      }
    },
    chemistry: {
      text: `"Here is the molecular geometry of a methane molecule (CH₄). Notice how the four covalent bonds repel each other symmetrically into a 109.5° tetrahedral angle to minimize electron cloud repulsion."`,
      render: () => {
        const c = getThemeColors();
        return `
        <div class="chem-sim-view" style="position: relative; width: 260px; height: 220px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: ${c.carbonSphere}; border: 2px solid #fcfaf6; display: flex; align-items: center; justify-content: center; font-family: 'Thinoo', sans-serif; font-weight: bold; color: #fcfaf6; box-shadow: 0 0 25px ${c.carbonGlow}; z-index: 5;">
            C
          </div>
          <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 26px; height: 26px; border-radius: 50%; background: #fcfaf6; color: #160205; border: 1px solid rgba(244, 237, 226, 0.4); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">H</div>
          <div style="position: absolute; bottom: 25px; left: 35px; width: 26px; height: 26px; border-radius: 50%; background: #fcfaf6; color: #160205; border: 1px solid rgba(244, 237, 226, 0.4); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">H</div>
          <div style="position: absolute; bottom: 25px; right: 35px; width: 26px; height: 26px; border-radius: 50%; background: #fcfaf6; color: #160205; border: 1px solid rgba(244, 237, 226, 0.4); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">H</div>
          <div style="position: absolute; bottom: 0; font-family: 'Thinoo', sans-serif; font-size: 0.72rem; letter-spacing: 0.08em; color: #c2b29d;">
            TETRAHEDRAL BOND ANGLE: 109.5°
          </div>
        </div>
      `;
      }
    }
  };

  // Set initial display
  if (display && simConfigs.code) {
    display.innerHTML = simConfigs.code.render();
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const simKey = tab.getAttribute('data-sim');
      const config = simConfigs[simKey];
      if (config) {
        display.innerHTML = config.render();
        dialogueText.textContent = config.text;
      }
    });
  });

  // Handle chat prompt
  function sendChat() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'msg user-msg';
    userMsg.style.background = 'rgba(255, 255, 255, 0.08)';
    userMsg.style.padding = '12px 16px';
    userMsg.style.borderRadius = '10px';
    userMsg.style.alignSelf = 'flex-end';
    userMsg.style.maxWidth = '85%';
    userMsg.innerHTML = `<span style="display: block; font-size: 0.68rem; color: #cbd5e1; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace;">YOU:</span><p style="font-size: 0.85rem; color: #ffffff;">${escapeHtml(text)}</p>`;
    messagesContainer.appendChild(userMsg);

    chatInput.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Simulate Socratic Response
    setTimeout(() => {
      const botResponse = document.createElement('div');
      botResponse.className = 'msg bot-msg';
      botResponse.innerHTML = `
        <span class="speaker-tag mono-text">VEDIKA AI:</span>
        <p>"Great question! In this state, think about what is conserved: is energy or momentum changing? When you isolate that variable, does the equation simplify?"</p>
      `;
      messagesContainer.appendChild(botResponse);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 600);
  }

  if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', sendChat);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChat();
    });
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

/* ==========================================================================
   STAGE 4 CONTENT PILLS INTERACTION
   ========================================================================== */
function initContentPills() {
  const pills = document.querySelectorAll('.content-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
}

/* ==========================================================================
   SECONDARY ACTIONS (AUDIO, BOOKMARK, SHARE)
   ========================================================================= */
function initSecondaryActions() {
  const audioBtn = document.getElementById('btn-audio-toggle');
  let audioActive = false;
  let audioCtx = null;

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      audioActive = !audioActive;
      const label = audioBtn.querySelector('.btn-sound-label');
      if (audioActive) {
        audioBtn.style.color = '#fcfaf6';
        audioBtn.style.borderColor = 'rgba(252, 250, 246, 0.6)';
        if (label) label.textContent = 'MUTE';
        playFuturisticChime();
      } else {
        audioBtn.style.color = '';
        audioBtn.style.borderColor = '';
        if (label) label.textContent = 'AUDIO';
      }
    });
  }

  function playFuturisticChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2); // A5

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.log('Audio not allowed yet:', e);
    }
  }
}

/* ==========================================================================
   THEME SWITCHER SYSTEM (IMPERIAL MAROON vs REFERENCE VIDEO CRIMSON)
   ========================================================================== */
function initThemeSwitcher(botScene) {
  const savedTheme = localStorage.getItem('vedika-theme') || 'maroon';
  applyTheme(savedTheme);

  const toggleButtons = document.querySelectorAll('.theme-switch-btn');
  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTheme = btn.getAttribute('data-theme');
      if (targetTheme) {
        applyTheme(targetTheme);
      }
    });
  });

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('vedika-theme', theme);

    // Sync all toggle switch buttons across the page
    const allBtns = document.querySelectorAll('.theme-switch-btn');
    allBtns.forEach((b) => {
      if (b.getAttribute('data-theme') === theme) {
        b.classList.add('active');
        b.setAttribute('aria-checked', 'true');
      } else {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      }
    });

    // Update 3D Bot Scene lighting and card textures
    if (botScene && typeof botScene.setTheme === 'function') {
      botScene.setTheme(theme);
    }

    // Direct SVG attribute update for logo dot circle to guarantee zero maroon delay
    const logoCircle = document.getElementById('logo-dot-circle');
    if (logoCircle) {
      logoCircle.setAttribute('fill', theme === 'crimson' ? '#ff4d2e' : '#b8223c');
    }
  }
}
