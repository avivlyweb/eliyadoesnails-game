import { gameConvex } from "../net/convex";
import { sound } from "./audio";
import { questSystem, ClientTicket } from "./game-quest";

export interface MinigameScores {
  base: number;
  art: number;
  finish: number;
}

export class NailStudioMinigameController {
  private overlay: HTMLElement | null = null;
  private currentStep: 1 | 2 | 3 | 4 = 1; // 1: Base Fill, 2: Art Detail, 3: UV Cure, 4: Result
  private ticket: ClientTicket | null = null;
  private scores: MinigameScores = { base: 95, art: 96, finish: 98 };

  // Step 1: Base Fill state
  private nailFillPercentages: number[] = [0, 0, 0, 0, 0];
  private isMouseDown: boolean = false;

  // Step 2: Art Precision state
  private artAccuracy: number = 95;

  // Step 3: UV Cure state
  private cureProgress: number = 0;
  private cureDirection: number = 1;
  private cureHits: number = 0;
  private cureTargetHits: number = 3;
  private cureAnimFrame: number = 0;
  private designId: string | null = null;

  constructor() {
    this.overlay = document.getElementById("nail-minigame-overlay");
    this.setupListeners();
  }

  private setupListeners() {
    const btnClose = document.getElementById("btn-minigame-close");
    if (btnClose) {
      btnClose.addEventListener("click", () => this.close());
    }

    // Step 3: UV Cure button & Spacebar listener
    const btnCure = document.getElementById("btn-cure-action");
    if (btnCure) {
      btnCure.addEventListener("click", () => this.triggerCurePulse());
    }

    window.addEventListener("keydown", (e) => {
      if (this.overlay && this.overlay.style.display === "flex") {
        if (e.code === "Space" && this.currentStep === 3) {
          e.preventDefault();
          this.triggerCurePulse();
        }
      }
    });
  }

  public async startMinigame(ticket: ClientTicket) {
    this.ticket = ticket;
    this.currentStep = 1;
    this.nailFillPercentages = [0, 0, 0, 0, 0];
    this.cureHits = 0;
    this.scores = { base: 0, art: 0, finish: 0 };

    if (!this.overlay) {
      this.overlay = document.getElementById("nail-minigame-overlay");
    }
    if (!this.overlay) return;

    this.overlay.style.display = "flex";
    sound.playTeaPour();

    // Start studio design in backend
    if (ticket.questId) {
      try {
        const res = await gameConvex.startStudioDesign(ticket.questId);
        if (res.designId) this.designId = res.designId;
      } catch (err) {
        console.warn("[Minigame] startDesign sync err:", err);
      }
    }

    this.renderHeader();
    this.renderStep1BaseFill();
  }

  public close() {
    if (this.cureAnimFrame) cancelAnimationFrame(this.cureAnimFrame);
    if (this.overlay) this.overlay.style.display = "none";
  }

  private renderHeader() {
    const clientNameEl = document.getElementById("minigame-client-name");
    const setDesignEl = document.getElementById("minigame-set-design");
    if (clientNameEl && this.ticket) clientNameEl.textContent = `Client: ${this.ticket.clientName} (${this.ticket.role})`;
    if (setDesignEl && this.ticket) setDesignEl.textContent = `${this.ticket.setDesignName} + ${this.ticket.requestedCharm}`;

    this.updateStepPills();
  }

  private updateStepPills() {
    for (let s = 1; s <= 3; s++) {
      const pill = document.getElementById(`step-pill-${s}`);
      if (pill) {
        pill.classList.toggle("active", this.currentStep === s);
        pill.classList.toggle("completed", this.currentStep > s);
      }
    }
  }

  // -------------------------------------------------------------------------
  // STEP 1: BASE COAT SYRUP FILL
  // -------------------------------------------------------------------------
  private renderStep1BaseFill() {
    this.currentStep = 1;
    this.updateStepPills();

    const stage = document.getElementById("minigame-interactive-stage");
    if (!stage) return;

    stage.innerHTML = `
      <div class="minigame-step-title">Step 1: Paint Syrup Gel Base Coat</div>
      <div class="minigame-step-instruction">Drag your brush over all 5 client nails to apply smooth, translucent glass gel.</div>

      <div id="base-nails-rack" class="base-nails-rack">
        ${[0, 1, 2, 3, 4]
          .map(
            (i) => `
          <div class="nail-pad-wrap" data-nail="${i}">
            <div class="nail-pad-shape">
              <div class="nail-pad-fill" id="nail-fill-${i}"></div>
              <div class="nail-shine-highlight"></div>
            </div>
            <span class="nail-coverage-pct" id="nail-pct-${i}">0%</span>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="minigame-progress-row">
        <span>Average Base Coat Coverage: <strong id="base-total-pct">0%</strong></span>
        <button id="btn-next-step-1" class="btn-dock active" style="padding: 7px 18px; display: none;">
          Next: Precision Art ➔
        </button>
      </div>
    `;

    const rack = document.getElementById("base-nails-rack");
    if (!rack) return;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const target = document.elementFromPoint(clientX, clientY);
      const wrap = target?.closest(".nail-pad-wrap");
      if (wrap) {
        const idx = parseInt(wrap.getAttribute("data-nail") || "0", 10);
        if (this.nailFillPercentages[idx] < 100) {
          this.nailFillPercentages[idx] = Math.min(100, this.nailFillPercentages[idx] + 7);
          sound.playGlassFile();
          this.updateNailFills();
        }
      }
    };

    rack.addEventListener("mousedown", () => { this.isMouseDown = true; });
    window.addEventListener("mouseup", () => { this.isMouseDown = false; });
    rack.addEventListener("mousemove", (e) => {
      if (this.isMouseDown) onPointerMove(e);
    });
    rack.addEventListener("touchmove", (e) => onPointerMove(e));

    const nextBtn = document.getElementById("btn-next-step-1");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        const avg = Math.round(
          this.nailFillPercentages.reduce((a, b) => a + b, 0) / this.nailFillPercentages.length
        );
        this.scores.base = Math.min(100, Math.max(70, avg));
        this.renderStep2ArtDetail();
      });
    }
  }

  private updateNailFills() {
    let total = 0;
    for (let i = 0; i < 5; i++) {
      const pct = this.nailFillPercentages[i];
      total += pct;
      const fillEl = document.getElementById(`nail-fill-${i}`);
      const textEl = document.getElementById(`nail-pct-${i}`);
      if (fillEl) fillEl.style.height = `${pct}%`;
      if (textEl) textEl.textContent = `${pct}%`;
    }

    const avg = Math.round(total / 5);
    const totalEl = document.getElementById("base-total-pct");
    if (totalEl) totalEl.textContent = `${avg}%`;

    const nextBtn = document.getElementById("btn-next-step-1");
    if (nextBtn && avg >= 85) {
      nextBtn.style.display = "inline-flex";
    }
  }

  // -------------------------------------------------------------------------
  // STEP 2: PRECISION ART DETAIL
  // -------------------------------------------------------------------------
  private renderStep2ArtDetail() {
    this.currentStep = 2;
    this.updateStepPills();

    const stage = document.getElementById("minigame-interactive-stage");
    if (!stage) return;

    stage.innerHTML = `
      <div class="minigame-step-title">Step 2: Micro-Liner & Artisan Art Detail</div>
      <div class="minigame-step-instruction">Trace the delicate smile line curve along the almond tip with your fine brush.</div>

      <div class="art-detail-stage">
        <div class="macro-nail-canvas-box">
          <svg id="art-trace-svg" viewBox="0 0 300 400" class="art-trace-svg">
            <!-- Nail base body -->
            <path d="M 60,380 C 50,220 70,80 150,20 C 230,80 250,220 240,380 Z" fill="#fdf0ed" stroke="#e0c8be" stroke-width="4"/>
            <!-- Guide smile arc -->
            <path id="guide-arc" d="M 85,90 Q 150,150 215,90" fill="none" stroke="#f2c4c4" stroke-width="8" stroke-dasharray="6,6"/>
            <!-- User trace line -->
            <path id="user-trace-arc" d="" fill="none" stroke="#a8505e" stroke-width="6" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <div class="minigame-progress-row">
        <span>Artisan Brush Accuracy: <strong id="art-accuracy-pct">Hold & Trace Curve</strong></span>
        <button id="btn-next-step-2" class="btn-dock active" style="padding: 7px 18px; display: none;">
          Next: UV Lamp Cure ➔
        </button>
      </div>
    `;

    const svg = document.getElementById("art-trace-svg");
    const userTrace = document.getElementById("user-trace-arc");
    const nextBtn = document.getElementById("btn-next-step-2");
    const accEl = document.getElementById("art-accuracy-pct");
    let points: Array<{ x: number; y: number }> = [];
    let isTracing = false;

    if (svg && userTrace) {
      const getSvgPoint = (e: MouseEvent) => {
        const rect = svg.getBoundingClientRect();
        return {
          x: ((e.clientX - rect.left) / rect.width) * 300,
          y: ((e.clientY - rect.top) / rect.height) * 400,
        };
      };

      svg.addEventListener("mousedown", (e) => {
        isTracing = true;
        points = [getSvgPoint(e)];
      });

      svg.addEventListener("mousemove", (e) => {
        if (!isTracing) return;
        const pt = getSvgPoint(e);
        points.push(pt);
        const d = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x},${p.y}`, "");
        userTrace.setAttribute("d", d);

        if (points.length > 25) {
          this.artAccuracy = Math.min(100, Math.floor(92 + Math.random() * 7));
          if (accEl) accEl.textContent = `${this.artAccuracy}% (Flawless Stroke!)`;
          if (nextBtn) nextBtn.style.display = "inline-flex";
        }
      });

      window.addEventListener("mouseup", () => {
        isTracing = false;
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        this.scores.art = this.artAccuracy;
        sound.playTeaPour();
        this.renderStep3UVCure();
      });
    }
  }

  // -------------------------------------------------------------------------
  // STEP 3: UV TUNNEL LAMP CURING STEP
  // -------------------------------------------------------------------------
  private renderStep3UVCure() {
    this.currentStep = 3;
    this.updateStepPills();

    const stage = document.getElementById("minigame-interactive-stage");
    if (!stage) return;

    stage.innerHTML = `
      <div class="minigame-step-title">Step 3: UV Tunnel Lamp Cure</div>
      <div class="minigame-step-instruction">Press <strong>[Space]</strong> or click <strong>Cure Now</strong> when the purple sweep beam enters the green cure zone!</div>

      <div class="uv-cure-chamber">
        <div class="uv-lamp-glow"></div>
        <div class="uv-meter-track">
          <!-- Sweet spot zone: 38% to 62% -->
          <div class="uv-sweet-spot-zone"></div>
          <!-- Sweeping indicator needle -->
          <div id="uv-sweep-needle" class="uv-sweep-needle"></div>
        </div>

        <div style="display: flex; gap: 16px; align-items: center; justify-content: center; margin-top: 24px;">
          <div class="cure-hit-dots">
            <span class="cure-dot" id="cure-dot-1"></span>
            <span class="cure-dot" id="cure-dot-2"></span>
            <span class="cure-dot" id="cure-dot-3"></span>
          </div>
          <button id="btn-cure-action" class="btn-dock active" style="padding: 10px 24px; font-size: 13px;">
            ⚡ Cure Now! [Space]
          </button>
        </div>
      </div>

      <div class="minigame-progress-row">
        <span>Cured Pulses: <strong id="cure-pulses-count">0 / 3</strong></span>
        <button id="btn-next-step-3" class="btn-dock active" style="padding: 7px 18px; display: none;">
          Reveal Atelier Couture Result ➔
        </button>
      </div>
    `;

    // Re-attach cure button
    const btnCure = document.getElementById("btn-cure-action");
    if (btnCure) {
      btnCure.addEventListener("click", () => this.triggerCurePulse());
    }

    const nextBtn = document.getElementById("btn-next-step-3");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.finishMinigame());
    }

    this.startCureSweepLoop();
  }

  private startCureSweepLoop() {
    const needle = document.getElementById("uv-sweep-needle");
    const speed = 0.85;

    const loop = () => {
      this.cureProgress += this.cureDirection * speed;
      if (this.cureProgress >= 100) {
        this.cureProgress = 100;
        this.cureDirection = -1;
      } else if (this.cureProgress <= 0) {
        this.cureProgress = 0;
        this.cureDirection = 1;
      }

      if (needle) {
        needle.style.left = `${this.cureProgress}%`;
      }

      if (this.currentStep === 3) {
        this.cureAnimFrame = requestAnimationFrame(loop);
      }
    };

    if (this.cureAnimFrame) cancelAnimationFrame(this.cureAnimFrame);
    this.cureAnimFrame = requestAnimationFrame(loop);
  }

  private triggerCurePulse() {
    if (this.currentStep !== 3 || this.cureHits >= this.cureTargetHits) return;

    sound.playUVLampCure();

    // Sweet spot is between 35% and 65%
    const inZone = this.cureProgress >= 35 && this.cureProgress <= 65;
    if (inZone) {
      this.cureHits++;
      const dot = document.getElementById(`cure-dot-${this.cureHits}`);
      if (dot) dot.classList.add("filled");

      const countEl = document.getElementById("cure-pulses-count");
      if (countEl) countEl.textContent = `${this.cureHits} / ${this.cureTargetHits}`;

      if (this.cureHits >= this.cureTargetHits) {
        this.scores.finish = 98;
        const nextBtn = document.getElementById("btn-next-step-3");
        if (nextBtn) nextBtn.style.display = "inline-flex";
      }
    } else {
      // Small penalty
      this.scores.finish = Math.max(70, (this.scores.finish || 90) - 5);
    }
  }

  // -------------------------------------------------------------------------
  // STEP 4: RESULT CELEBRATION & PACKING
  // -------------------------------------------------------------------------
  private async finishMinigame() {
    this.currentStep = 4;
    if (this.cureAnimFrame) cancelAnimationFrame(this.cureAnimFrame);

    const avg = Math.round((this.scores.base + this.scores.art + this.scores.finish) / 3);
    const stars = avg >= 85 ? 3 : avg >= 60 ? 2 : 1;

    // Sync with Convex studio.finishDesign
    if (this.ticket?.questId && this.designId) {
      try {
        await gameConvex.finishStudioDesign(this.ticket.questId, this.designId, this.scores);
      } catch (err) {
        console.warn("[Minigame] finishDesign sync err:", err);
      }
    }

    const stage = document.getElementById("minigame-interactive-stage");
    if (!stage || !this.ticket) return;

    sound.playCameraShutter();
    sound.playBicycleBell();

    const starIcons = stars === 3 ? "★★★" : stars === 2 ? "★★☆" : "★☆☆";

    // Generate link for website deep link
    const lookSlug = this.ticket.id === "mira" ? "cherry-blossom" : this.ticket.id === "nell" ? "rose-quartz" : "moonlight-cateye";
    const bookUrl = `https://eliyadoesnails.vercel.app/#book?look=${lookSlug}&from=atelier_game`;

    stage.innerHTML = `
      <div class="minigame-result-card">
        <div class="result-star-rating">${starIcons}</div>
        <div class="result-rating-title">
          ${stars === 3 ? "Master Artisan Manicure" : "Artisan Slow Craft"}
        </div>
        <div class="result-subtitle">
          Bespoke ${this.ticket.setDesignName} with ${this.ticket.requestedCharm}
        </div>

        <div class="result-breakdown-row">
          <div class="result-stat-box">
            <span class="stat-label">Base Gel Fill</span>
            <span class="stat-val">${this.scores.base}%</span>
          </div>
          <div class="result-stat-box">
            <span class="stat-label">Artisan Detailing</span>
            <span class="stat-val">${this.scores.art}%</span>
          </div>
          <div class="result-stat-box">
            <span class="stat-label">UV Lamp Cure</span>
            <span class="stat-val">${this.scores.finish}%</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 24px; align-items: center;">
          <button id="btn-pack-box-finish" class="btn-dock active" style="padding: 12px 32px; font-size: 14px; width: 100%; max-width: 380px;">
            🎁 Pack into Couture Box & Deliver on Bike
          </button>
          <a href="${bookUrl}" target="_blank" rel="noopener noreferrer" class="btn-dock" style="padding: 10px 24px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; border-color: var(--accent-rose);">
            <span>Book this look at the Amsterdam Atelier ↗</span>
          </a>
        </div>
      </div>
    `;

    const packBtn = document.getElementById("btn-pack-box-finish");
    if (packBtn && this.ticket) {
      packBtn.addEventListener("click", () => {
        questSystem.craftAndPackTicket(this.ticket!.id);
        this.close();

        // Dispatch box packed event so mascot and player get the parcel
        const packedCount = Object.values(questSystem.tickets).filter((t) => t.status === "packed").length;
        window.dispatchEvent(new CustomEvent("box-packed", { detail: { count: packedCount } }));

        // Show toast
        const toast = document.createElement("div");
        toast.style.cssText =
          "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1c1917;color:#faf7f5;padding:12px 24px;border-radius:4px;border:1px solid #e7e1dc;font-size:12px;font-family:var(--font-sans);z-index:9999;box-shadow:0 10px 24px -14px rgba(28,25,23,0.35);";
        toast.textContent = `✦ Packed bespoke ${this.ticket?.setDesignName} into Couture Box for ${this.ticket?.clientName}! Ride your Omafiets bike along the canal to deliver.`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4800);
      });
    }
  }
}

export const nailMinigame = new NailStudioMinigameController();
