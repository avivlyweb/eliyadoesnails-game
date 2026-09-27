import { sound } from "./audio";
import { gameDataBridge, CompanionState } from "./convex-client";

/**
 * Atelier Companion Mascot: "Gomi" (유리알 고미)
 * Inspired by HeyMossy's reactive vector creature engine:
 * - Pure scalable SVG with dynamic CSS custom properties
 * - Idle breathing squash-and-stretch
 * - SVG clipPath natural eyelid blinking
 * - Morphing mouth expressions across emotional tiers
 * - Squash-and-stretch celebration jump ("hele")
 * - 3-Depth plane atmospheric golden hour spore particles
 */

export class AtelierCompanion {
  private container: HTMLElement;
  private bubble: HTMLElement;
  private mascotSvg: HTMLElement;
  private sporesCanvas: HTMLCanvasElement | null = null;
  private isVisible: boolean = true;
  private unsubscribeBridge: (() => void) | null = null;

  // Atmospheric spore particles state
  private sporesAnimId: number | null = null;

  constructor() {
    this.container = this.createDOM();
    this.bubble = this.container.querySelector("#mascot-bubble") as HTMLElement;
    this.mascotSvg = this.container.querySelector("#mascot-svg-wrap") as HTMLElement;

    this.setupEvents();
    this.setupSpores();
    this.setupReactiveSync();
  }

  private createDOM(): HTMLElement {
    let existing = document.getElementById("atelier-companion-dock");
    if (existing) existing.remove();

    const dock = document.createElement("div");
    dock.id = "atelier-companion-dock";
    dock.innerHTML = `
      <div id="mascot-speech-wrap" class="mascot-speech-wrap">
        <div id="mascot-bubble" class="mascot-bubble">
          <span id="mascot-text">Welcome to Atelier Gloss! ♡</span>
          <span class="mascot-kr-sub" id="mascot-kr-sub">(아틀리에 글로스에 오신 것을 환영해요)</span>
        </div>
      </div>

      <div id="mascot-avatar-box" class="mascot-avatar-box" title="Click to Pet Gomi (고미)">
        <div id="mascot-svg-wrap" class="mascot-svg-wrap">
          <svg viewBox="0 0 160 160" class="mascot-svg" aria-label="Gomi the Atelier Glass Mascot">
            <defs>
              <!-- Glass Syrup Jelly Gradient -->
              <radialGradient id="gomi-body-grad" cx="40%" cy="30%" r="75%">
                <stop offset="0%" stop-color="#fff8f7" stop-opacity="0.95"/>
                <stop offset="30%" stop-color="#fcedea"/>
                <stop offset="70%" stop-color="#f2c4c4"/>
                <stop offset="100%" stop-color="#d8969f"/>
              </radialGradient>

              <!-- Rose Satin Ribbon Gradient -->
              <linearGradient id="gomi-ribbon-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#c26b7b"/>
                <stop offset="50%" stop-color="#a8505e"/>
                <stop offset="100%" stop-color="#803541"/>
              </linearGradient>

              <!-- Eyelid Clip Paths -->
              <clipPath id="gomi-eye-l"><circle cx="62" cy="92" r="7"/></clipPath>
              <clipPath id="gomi-eye-r"><circle cx="98" cy="92" r="7"/></clipPath>
            </defs>

            <!-- Soft Ground Drop Shadow -->
            <ellipse cx="80" cy="144" rx="46" ry="8" fill="rgba(28, 25, 23, 0.16)"/>

            <!-- Main Body Group (Squash & Stretch Animated) -->
            <g class="gomi-corps">
              <!-- Left & Right Bear Ears -->
              <circle cx="48" cy="56" r="16" fill="url(#gomi-body-grad)" stroke="#e7e1dc" stroke-width="1.2"/>
              <circle cx="48" cy="56" r="9" fill="#f2c4c4" opacity="0.6"/>

              <circle cx="112" cy="56" r="16" fill="url(#gomi-body-grad)" stroke="#e7e1dc" stroke-width="1.2"/>
              <circle cx="112" cy="56" r="9" fill="#f2c4c4" opacity="0.6"/>

              <!-- Sculpted Ribbon Bow on Top -->
              <g class="gomi-bow" transform="translate(80, 44)">
                <!-- Left Wing -->
                <path d="M0,0 C-14,-10 -22,-2 -16,8 C-10,14 -2,6 0,0 Z" fill="url(#gomi-ribbon-grad)"/>
                <!-- Right Wing -->
                <path d="M0,0 C14,-10 22,-2 16,8 C10,14 2,6 0,0 Z" fill="url(#gomi-ribbon-grad)"/>
                <!-- Center Knot & Pearl -->
                <circle cx="0" cy="0" r="4.2" fill="#fff" stroke="#a8505e" stroke-width="1.2"/>
              </g>

              <!-- Jelly Droplet Body Shape -->
              <path d="M80 48 
                       C114 48 132 72 132 102 
                       C132 128 112 140 80 140 
                       C48 140 28 128 28 102 
                       C28 72 46 48 80 48 Z" 
                    fill="url(#gomi-body-grad)" 
                    stroke="#e7e1dc" 
                    stroke-width="1.4"/>

              <!-- Glass Forehead Specular Sheen (Curved highlight) -->
              <path d="M52 64 C64 56 96 56 108 64" 
                    stroke="rgba(255, 255, 255, 0.75)" 
                    stroke-width="3.5" 
                    stroke-linecap="round" 
                    fill="none"/>

              <!-- Left & Right Eyes (Deep Espresso Pupils) -->
              <circle cx="62" cy="92" r="6.8" fill="#1c1917"/>
              <circle cx="98" cy="92" r="6.8" fill="#1c1917"/>

              <!-- Catchlight White Glistening Dots -->
              <circle cx="64.5" cy="89.8" r="2.4" fill="#ffffff"/>
              <circle cx="100.5" cy="89.8" r="2.4" fill="#ffffff"/>
              <circle cx="60.2" cy="94.2" r="1.1" fill="#ffffff" opacity="0.8"/>
              <circle cx="96.2" cy="94.2" r="1.1" fill="#ffffff" opacity="0.8"/>

              <!-- Blinking Eyelids via ClipPath -->
              <g clip-path="url(#gomi-eye-l)">
                <rect class="gomi-paup" x="52" y="84" width="20" height="18" fill="#eac0c5"/>
              </g>
              <g clip-path="url(#gomi-eye-r)">
                <rect class="gomi-paup" x="88" y="84" width="20" height="18" fill="#eac0c5"/>
              </g>

              <!-- Rosy Cheeks -->
              <ellipse cx="50" cy="103" rx="7.5" ry="4.5" fill="#f2c4c4" opacity="0.75"/>
              <ellipse cx="110" cy="103" rx="7.5" ry="4.5" fill="#f2c4c4" opacity="0.75"/>

              <!-- Animated Expressive Mouth -->
              <path id="gomi-mouth" class="gomi-mouth" 
                    d="M74 104 Q80 110 86 104" 
                    stroke="#1c1917" 
                    stroke-width="2.4" 
                    stroke-linecap="round" 
                    fill="none"/>

              <!-- Micro Heart Cheek Decal -->
              <path d="M112 98 C110 96 108 97 108 99 C108 101 112 103 112 103 C112 103 116 101 116 99 C116 97 114 96 112 98 Z" 
                    fill="#a8505e" 
                    opacity="0.6"/>
            </g>

            <!-- Dynamic Garden / Charm Pedestal Tray -->
            <g id="gomi-charms-tray" transform="translate(0, 0)"></g>
          </svg>
        </div>

        <div class="mascot-level-badge" id="mascot-badge">
          <span class="badge-dot"></span>
          <span id="mascot-badge-text">Lv.1 Atelier Mascot</span>
        </div>
      </div>
    `;

    document.body.appendChild(dock);
    this.injectStyles();
    return dock;
  }

  private injectStyles() {
    if (document.getElementById("atelier-companion-styles")) return;

    const style = document.createElement("style");
    style.id = "atelier-companion-styles";
    style.textContent = `
      /* ======================================================== */
      /* ATELIER COMPANION DOCK (Inspired by HeyMossy)            */
      /* ======================================================== */
      #atelier-companion-dock {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 45;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        pointer-events: none;
        user-select: none;
      }

      .mascot-speech-wrap {
        pointer-events: auto;
        opacity: 0;
        transform: translateY(8px) scale(0.96);
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        max-width: 260px;
      }

      .mascot-speech-wrap.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .mascot-bubble {
        background: var(--surface);
        border: 1px solid var(--hairline);
        border-radius: 14px;
        padding: 10px 14px;
        box-shadow: var(--shadow-soft), 0 8px 24px rgba(28, 25, 23, 0.08);
        font-family: var(--font-sans);
        font-size: 11.5px;
        font-weight: 500;
        line-height: 1.4;
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
        gap: 2px;
        position: relative;
      }

      .mascot-bubble::after {
        content: "";
        position: absolute;
        bottom: -6px;
        right: 32px;
        width: 10px;
        height: 10px;
        background: var(--surface);
        border-right: 1px solid var(--hairline);
        border-bottom: 1px solid var(--hairline);
        transform: rotate(45deg);
      }

      .mascot-kr-sub {
        font-family: var(--font-kr);
        font-size: 9.5px;
        color: var(--accent-petal);
        opacity: 0.85;
      }

      .mascot-avatar-box {
        pointer-events: auto;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
      }

      .mascot-avatar-box:hover {
        transform: translateY(-3px) scale(1.03);
      }

      .mascot-svg-wrap {
        width: 88px;
        height: 88px;
        position: relative;
        filter: drop-shadow(0 8px 20px rgba(168, 80, 94, 0.15));
      }

      .mascot-svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      /* Natural Idle Breathing Animation */
      .gomi-corps {
        animation: gomiRespire 4.8s ease-in-out infinite;
        transform-origin: 50% 90%;
      }

      @keyframes gomiRespire {
        0%, 100% { transform: scale(1, 1); }
        50%      { transform: scale(1.025, 0.98); }
      }

      /* HeyMossy Anticipation Squash-and-Stretch Jump ("Hele") */
      .mascot-avatar-box.hele .gomi-corps {
        animation: gomiHele 3.2s ease-in-out 1;
      }

      @keyframes gomiHele {
        0%, 100% { transform: translateY(0) scale(1, 1); }
        6%       { transform: translateY(0) scale(1.12, 0.88); }
        18%      { transform: translateY(-32px) scale(0.92, 1.14); }
        28%      { transform: translateY(0) scale(1.14, 0.86); }
        36%      { transform: translateY(-12px) scale(0.97, 1.05); }
        44%      { transform: translateY(0) scale(1.06, 0.94); }
        52%      { transform: translateY(0) scale(1, 1); }
      }

      /* Natural Eyelid Blinking */
      .gomi-paup {
        transform-origin: 50% 0%;
        animation: gomiBlink 4.2s infinite ease-in-out;
      }

      @keyframes gomiBlink {
        0%, 94%, 100% { transform: scaleY(0); }
        96%, 98%      { transform: scaleY(1); }
      }

      /* Level Badge */
      .mascot-level-badge {
        background: var(--surface);
        border: 1px solid var(--hairline);
        padding: 3px 8px;
        border-radius: 20px;
        font-family: var(--font-mono);
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.5px;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 2px 6px rgba(28, 25, 23, 0.05);
      }

      .badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #50aa6e;
      }

      /* UV Flash Glow */
      .mascot-avatar-box.cured {
        filter: drop-shadow(0 0 24px rgba(168, 80, 94, 0.65)) drop-shadow(0 0 40px rgba(186, 137, 248, 0.55));
      }

      /* ======================================================== */
      /* ATMOSPHERIC GOLDEN HOUR DUST MOTES (Canvas overlay)      */
      /* ======================================================== */
      #atelier-spores {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 5;
        pointer-events: none;
      }

      @media (max-width: 768px) {
        #atelier-companion-dock {
          bottom: 84px;
          right: 14px;
        }
        .mascot-svg-wrap {
          width: 72px;
          height: 72px;
        }
        .mascot-speech-wrap {
          max-width: 200px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private setupEvents() {
    const avatar = this.container.querySelector("#mascot-avatar-box");
    avatar?.addEventListener("click", () => {
      this.pet();
    });

    // Listen to custom gameplay events
    window.addEventListener("box-packed", (e: any) => {
      this.celebrate("Packed with couture love! 🎁", "(정성스럽게 포장된 맞춤 네일 ♡)");
      gameDataBridge.onBoxPacked();
    });

    window.addEventListener("uv-cured", () => {
      this.celebrateCure();
      gameDataBridge.onUVCured();
    });

    window.addEventListener("delivery-completed", (e: any) => {
      const client = e.detail?.clientName || "Neighbor";
      const charm = e.detail?.rewardCharm || "Baroque Pearl";
      this.celebrateDelivery(client, charm);
      gameDataBridge.onOrderDelivered(client, charm);
    });

    // Initial greeting
    setTimeout(() => {
      this.say(
        "A slow afternoon at Atelier Gloss... 🌿",
        "(느린 오후, 맞춤형 유리알 네일과 작은 운하 마을)"
      );
    }, 1800);
  }

  public pet() {
    sound.playMagneticShimmer();
    const box = this.container.querySelector("#mascot-avatar-box");
    if (box) {
      box.classList.remove("hele");
      void (box as HTMLElement).offsetWidth;
      box.classList.add("hele");
      setTimeout(() => box.classList.remove("hele"), 3200);
    }

    const mouth = this.container.querySelector("#gomi-mouth");
    if (mouth) {
      mouth.setAttribute("d", "M72 102 Q80 114 88 102"); // Ecstatic beaming smile
      setTimeout(() => {
        mouth.setAttribute("d", "M74 104 Q80 110 86 104"); // Default sweet smile
      }, 2600);
    }

    gameDataBridge.petCompanion();

    const phrases = [
      { en: "Hehe, that tickles! ♡", kr: "(헤헤, 기분 좋아요!)" },
      { en: "Your glass nails shine so brightly! ✨", kr: "(유리알 네일이 정말 반짝여요!)" },
      { en: "Ring your bike bell with [B]! 🚲", kr: "([B] 키로 자전거 종을 울려보세요!)" },
      { en: "Mira loves fresh Sakura petals 🌸", kr: "(미라는 벚꽃 페탈 네일을 좋아해요)" },
    ];
    const pick = phrases[Math.floor(Math.random() * phrases.length)];
    this.say(pick.en, pick.kr);
  }

  public say(text: string, kr: string, durationMs = 4500) {
    const textEl = document.getElementById("mascot-text");
    const krEl = document.getElementById("mascot-kr-sub");
    if (textEl) textEl.textContent = text;
    if (krEl) krEl.textContent = kr;

    const wrap = this.container.querySelector("#mascot-speech-wrap");
    if (wrap) {
      wrap.classList.add("visible");
      setTimeout(() => {
        wrap.classList.remove("visible");
      }, durationMs);
    }
  }

  public celebrate(text: string, kr: string) {
    this.pet();
    this.say(text, kr, 5000);
  }

  public celebrateCure() {
    const box = this.container.querySelector("#mascot-avatar-box");
    if (box) {
      box.classList.add("cured");
      setTimeout(() => box.classList.remove("cured"), 2000);
    }
    this.say("Cured to diamond glass sheen (432Hz)! ✨", "(432Hz의 맑은 유리알 광채 완성!)", 4000);
  }

  public celebrateDelivery(client: string, charm: string) {
    this.pet();
    this.say(
      `Delivered to ${client}! Unlocked: ${charm} ♡`,
      `(${client}님께 배달 완료! 새로운 참 획득: ${charm})`,
      5500
    );
  }

  private setupReactiveSync() {
    this.unsubscribeBridge = gameDataBridge.subscribe((state: CompanionState) => {
      const badgeText = document.getElementById("mascot-badge-text");
      if (badgeText) {
        badgeText.textContent = `Lv.${state.level} Atelier Mascot (${state.happiness}%)`;
      }
    });
  }

  /* ======================================================== */
  /* ATMOSPHERIC GOLDEN HOUR SPORES CANVAS                     */
  /* ======================================================== */
  private setupSpores() {
    let canvas = document.getElementById("atelier-spores") as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "atelier-spores";
      document.body.prepend(canvas);
    }
    this.sporesCanvas = canvas;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      canvas.style.display = "none";
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = 1, W = 0, H = 0;

    // Pre-render 3 particle color swatches to off-screen canvases (HeyMossy technique)
    const createParticleStamp = (color: string) => {
      const off = document.createElement("canvas");
      off.width = 48;
      off.height = 48;
      const c = off.getContext("2d");
      if (c) {
        const g = c.createRadialGradient(24, 24, 0, 24, 24, 24);
        g.addColorStop(0, color + "1.0)");
        g.addColorStop(0.35, color + "0.55)");
        g.addColorStop(1, color + "0)");
        c.fillStyle = g;
        c.fillRect(0, 0, 48, 48);
      }
      return off;
    };

    const TINTS = [
      createParticleStamp("rgba(242, 196, 196, "), // Rose
      createParticleStamp("rgba(255, 247, 235, "), // Warm Sunlight
      createParticleStamp("rgba(168, 80, 94, "),   // Petal
    ];

    const PLANS = [
      { part: 0.58, r: [0.8, 2.0], v: [2.5, 6.0], a: [0.12, 0.28], balance: [3, 10] },
      { part: 0.30, r: [2.2, 5.0], v: [6.0, 14.0], a: [0.14, 0.32], balance: [8, 22] },
      { part: 0.12, r: [6.5, 14.0], v: [12.0, 22.0], a: [0.08, 0.18], balance: [14, 34] },
    ];

    const between = (arr: number[]) => arr[0] + Math.random() * (arr[1] - arr[0]);

    interface Spore {
      x: number;
      y: number;
      r: number;
      v: number;
      a: number;
      balance: number;
      phase: number;
      img: HTMLCanvasElement;
      plan: any;
    }

    let spores: Spore[] = [];

    const newSpore = (plan: any, fromBottom: boolean): Spore => {
      return {
        x: Math.random() * W,
        y: fromBottom ? H + between([10, 80]) : Math.random() * H,
        r: between(plan.r),
        v: between(plan.v),
        a: between(plan.a),
        balance: between(plan.balance),
        phase: Math.random() * Math.PI * 2,
        img: TINTS[Math.floor(Math.random() * TINTS.length)],
        plan,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(90, Math.max(20, (W * H) / 16000)));
      spores = [];
      for (const p of PLANS) {
        const num = Math.round(count * p.part);
        for (let i = 0; i < num; i++) spores.push(newSpore(p, false));
      }
    };

    resize();
    window.addEventListener("resize", resize);

    let tPrev = 0;
    const renderLoop = (time: number) => {
      const dt = tPrev ? Math.min((time - tPrev) / 1000, 0.05) : 0;
      tPrev = time;

      ctx.clearRect(0, 0, W, H);
      for (const s of spores) {
        s.y -= s.v * dt;
        s.phase += dt * 0.45;
        if (s.y + s.r < -25) Object.assign(s, newSpore(s.plan, true));

        const x = s.x + Math.sin(s.phase) * s.balance;
        const edgeFade = Math.min(1, s.y / (H * 0.2), (H - s.y) / (H * 0.15));
        ctx.globalAlpha = s.a * Math.max(0, edgeFade);
        ctx.drawImage(s.img, x - s.r * 2, s.y - s.r * 2, s.r * 4, s.r * 4);
      }
      ctx.globalAlpha = 1.0;
      this.sporesAnimId = requestAnimationFrame(renderLoop);
    };

    this.sporesAnimId = requestAnimationFrame(renderLoop);

    // Pause rendering when tab is inactive to conserve battery (HeyMossy practice)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (this.sporesAnimId) {
          cancelAnimationFrame(this.sporesAnimId);
          this.sporesAnimId = null;
        }
      } else {
        if (!this.sporesAnimId) {
          tPrev = 0;
          this.sporesAnimId = requestAnimationFrame(renderLoop);
        }
      }
    });
  }

  public toggle() {
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? "flex" : "none";
  }

  public destroy() {
    if (this.unsubscribeBridge) this.unsubscribeBridge();
    if (this.sporesAnimId) cancelAnimationFrame(this.sporesAnimId);
    this.container.remove();
    this.sporesCanvas?.remove();
  }
}
