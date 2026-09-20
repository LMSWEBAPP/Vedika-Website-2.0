import { BotScene } from './three/BotScene.js';
import { initScrollChoreography } from './animations/scrollChoreography.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Scene
  const canvas = document.getElementById('webgl-canvas');
  let botScene = null;
  if (canvas) {
    botScene = new BotScene(canvas);
  }

  // 2. Initialize Scroll Choreography
  initScrollChoreography(botScene);

  // 3. Animated Emotional Waveform Canvas (Stage 2 HUD)
  initWaveformCanvas();

  // 4. Interactive Simulation Sandbox
  initSimulationSandbox();

  // 5. Stage 4 Category Pills Interaction
  initContentPills();

  // 6. Audio Toggle & Secondary Actions
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

    // Background Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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

    // Sine wave
    ctx.beginPath();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;

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

  const simConfigs = {
    code: {
      text: `"Look at how the recursive stack frame expands in memory. Notice that each frame preserves its own local scope before resolving the base condition. What would happen if we remove the terminating case?"`,
      render: () => `
        <div class="code-stack-sim" style="width: 100%; max-width: 460px; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">
          <div style="color: #64748b; margin-bottom: 10px; display: flex; justify-content: space-between;">
            <span>CALL STACK MEMORY HEAP</span>
            <span style="color: #00e5ff;">0x7FFEE4B2</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: rgba(0, 229, 255, 0.15); border: 1px solid #00e5ff; padding: 10px 14px; border-radius: 8px; color: #ffffff; display: flex; justify-content: space-between; animation: pulse 2s infinite;">
              <span>factorial(n=1) → returns 1</span>
              <span style="color: #38ef7d;">BASE HIT [0x04]</span>
            </div>
            <div style="background: rgba(14, 20, 32, 0.85); border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 8px; color: #cbd5e1; display: flex; justify-content: space-between;">
              <span>factorial(n=2) → waiting on (n=1)</span>
              <span style="color: #64748b;">FRAME [0x03]</span>
            </div>
            <div style="background: rgba(14, 20, 32, 0.75); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 8px; color: #94a3b8; display: flex; justify-content: space-between;">
              <span>factorial(n=3) → waiting on (n=2)</span>
              <span style="color: #64748b;">FRAME [0x02]</span>
            </div>
            <div style="background: rgba(14, 20, 32, 0.6); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 8px; color: #64748b; display: flex; justify-content: space-between;">
              <span>main() → invoked factorial(3)</span>
              <span style="color: #475569;">ROOT [0x01]</span>
            </div>
          </div>
        </div>
      `
    },
    physics: {
      text: `"Observe how orbital velocity balances the central gravitational pull. If tangential velocity increases by just 15%, the stable ellipse converts into an open hyperbolic escape trajectory."`,
      render: () => `
        <div class="physics-sim-view" style="display: flex; flex-direction: column; align-items: center; position: relative; width: 280px; height: 240px;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 44px; height: 44px; border-radius: 50%; background: radial-gradient(circle, #ff5e3a 20%, #ff2a00 80%); box-shadow: 0 0 35px #ff5e3a;"></div>
          <div style="position: absolute; top: 50%; left: 50%; width: 180px; height: 180px; transform: translate(-50%, -50%); border: 1px dashed rgba(0, 229, 255, 0.4); border-radius: 50%; animation: spin 10s linear infinite;">
            <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 18px; height: 18px; border-radius: 50%; background: #00e5ff; box-shadow: 0 0 15px #00e5ff;"></div>
          </div>
          <div style="position: absolute; bottom: 10px; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #00e5ff;">
            ORBITAL VELOCITY: 7.92 km/s | G = 6.674e-11
          </div>
        </div>
      `
    },
    chemistry: {
      text: `"Here is the molecular geometry of a methane molecule (CH₄). Notice how the four covalent bonds repel each other symmetrically into a 109.5° tetrahedral angle to minimize electron cloud repulsion."`,
      render: () => `
        <div class="chem-sim-view" style="position: relative; width: 260px; height: 220px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: radial-gradient(circle, #334155, #0f172a); border: 2px solid #00e5ff; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: bold; color: #00e5ff; box-shadow: 0 0 25px rgba(0,229,255,0.4); z-index: 5;">
            C
          </div>
          <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 26px; height: 26px; border-radius: 50%; background: #ffffff; color: #000; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">H</div>
          <div style="position: absolute; bottom: 25px; left: 35px; width: 26px; height: 26px; border-radius: 50%; background: #ffffff; color: #000; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">H</div>
          <div style="position: absolute; bottom: 25px; right: 35px; width: 26px; height: 26px; border-radius: 50%; background: #ffffff; color: #000; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">H</div>
          <div style="position: absolute; bottom: 0; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; color: #94a3b8;">
            TETRAHEDRAL BOND ANGLE: 109.5°
          </div>
        </div>
      `
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
        audioBtn.style.color = '#00e5ff';
        audioBtn.style.borderColor = '#00e5ff';
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

  // Bookmark Button
  const bookmarkBtn = document.getElementById('btn-bookmark');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', () => {
      bookmarkBtn.style.color = '#ff5e3a';
      bookmarkBtn.style.borderColor = '#ff5e3a';
    });
  }

  // Share Button
  const shareBtn = document.getElementById('btn-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        const originalHtml = shareBtn.innerHTML;
        shareBtn.innerHTML = `<span style="font-size: 0.65rem; color: #00e5ff; font-family: 'JetBrains Mono', monospace;">COPIED!</span>`;
        setTimeout(() => {
          shareBtn.innerHTML = originalHtml;
        }, 1800);
      }
    });
  }
}
