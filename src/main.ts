import * as THREE from "three";
import { SphericalPlanet } from "./engine/spherical-planet";
import { SphericalCharacter } from "./engine/character";
import { PlanetCamera } from "./engine/planet-camera";
import { ManicureStation } from "./station/manicure-table";
import { photobooth } from "./photobooth/life4cuts";
import { sound } from "./engine/audio";
import { questSystem, ClientTicket } from "./engine/game-quest";
import { AtelierCompanion } from "./engine/companion";
import { gameConvex, PlayerStatePayload } from "./net/convex";
import { DISTRICTS, sphericalToNormal } from "./engine/planet-layout";

class EliyaCanalWorldGame {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private cameraController: PlanetCamera;
  private planet: SphericalPlanet;
  private player: SphericalCharacter;
  private manicureStation: ManicureStation;
  private companion: AtelierCompanion;
  private clock: THREE.Clock;

  // Delivery & Interaction State
  private pendingDeliveryTicketId: string | null = null;

  constructor() {
    const canvas = document.getElementById("scene") as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xfaf7f5);
    this.scene.fog = new THREE.FogExp2(0xfaf7f5, 0.012);

    this.camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 300);
    this.cameraController = new PlanetCamera(this.camera);

    this.clock = new THREE.Clock();

    this.setupLighting();

    // 1. Build Spherical Planetoid (Amsterdam Canal World)
    this.planet = new SphericalPlanet(this.scene);

    // 2. Initialize Player Character (Eliya)
    this.player = new SphericalCharacter(this.scene, this.planet.radius);

    // 3. Initialize Manicure Station (Macro studio)
    this.manicureStation = new ManicureStation(this.scene);
    this.manicureStation.setVisible(false);

    // 4. Initialize Living Atelier Companion & Golden Hour Spores (Inspired by HeyMossy)
    this.companion = new AtelierCompanion();

    this.setupEventListeners();
    this.setupHUDControls();

    // Initialize Quest HUD Tray & Book
    questSystem.updateHUD();

    // 5. Connect to Convex Backend (or local content fallback if offline)
    gameConvex.init().then(() => {
      this.syncFromConvexState(gameConvex.currentState);
    });
    gameConvex.subscribe((state) => {
      this.syncFromConvexState(state);
    });

    // Expose game on window for UI interactions
    (window as any).gameInstance = this;

    // Start background lo-fi music automatically or on first click
    window.addEventListener("pointerdown", () => sound.startLoFiMusic(), { once: true });
    window.addEventListener("keydown", () => sound.startLoFiMusic(), { once: true });

    this.animate();
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0xfff5ed, 1.3);
    this.scene.add(ambient);

    // Golden hour sunlight
    const sun = new THREE.DirectionalLight(0xffedd5, 2.4);
    sun.position.set(30, 50, 35);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    const hemi = new THREE.HemisphereLight(0xfff0e6, 0x6e5e54, 0.65);
    this.scene.add(hemi);
  }

  private setupEventListeners() {
    window.addEventListener("resize", () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyE") {
        this.interactWithNearby();
      }
      if (e.code === "KeyJ") {
        this.toggleOrderCard();
      }
      if (e.code === "KeyB") {
        this.player.toggleBicycle();
        document.getElementById("btn-toggle-bike")?.classList.toggle("active", this.player.isRidingBicycle);
      }
      if (e.code === "KeyC") {
        this.companion.toggle();
      }
    });

    // Listen for box packing updates from custom creator UI
    window.addEventListener("box-packed", (e: any) => {
      const count = e.detail?.count ?? 1;
      this.player.updateBoxCount(count);
    });

    // Click canvas to trigger interaction if near
    const canvas = document.getElementById("scene");
    if (canvas) {
      canvas.addEventListener("click", () => {
        const near = this.planet.getNearestLandmark(this.player.getPosition());
        if (near) {
          this.interactWithNearby();
        }
      });
    }
  }

  public interactWithNearby() {
    const near = this.planet.getNearestLandmark(this.player.getPosition());
    if (!near) return;

    const lm = near.landmark;
    if (lm.id === "atelier") {
      this.openManicureStation();
      return;
    }

    if (lm.id === "photobooth") {
      if (questSystem.isCompleted) {
        this.showCompletionCelebration();
        return;
      }
      const pipTicket = questSystem.getTicket("pip");
      if (pipTicket && pipTicket.status === "packed") {
        this.showDeliveryDialogue(pipTicket);
        return;
      }
      this.openPhotobooth();
      return;
    }

    // Neighbors along the canal (Mira the Florist, Nell the Potter, Bea the Houseboat Muse)
    const ticket = questSystem.getTicketByLandmark(lm.id);
    if (ticket) {
      this.showDeliveryDialogue(ticket);
    } else {
      this.showDialogue(lm.name, lm.dialogue);
    }
  }

  private showDeliveryDialogue(ticket: ClientTicket) {
    const dialogBox = document.getElementById("dialogue-box");
    const nameEl = document.getElementById("dialogue-speaker");
    const roleEl = document.getElementById("dialogue-role");
    const textEl = document.getElementById("dialogue-text");
    const deliverBtn = document.getElementById("btn-deliver-order");

    if (!dialogBox || !nameEl || !textEl) return;

    nameEl.textContent = ticket.clientName;
    if (roleEl) roleEl.textContent = ticket.role;
    this.pendingDeliveryTicketId = ticket.id;

    if (ticket.status === "packed") {
      textEl.textContent = `Eliya! Did you bring my bespoke ${ticket.setDesignName}? Look at that gorgeous packaging!`;
      if (deliverBtn) {
        deliverBtn.style.display = "inline-flex";
        deliverBtn.textContent = `🎁 Deliver Couture Box`;
      }
    } else if (ticket.status === "delivered") {
      textEl.textContent = `Enjoying my ${ticket.setDesignName}! Thank you again, Eliya! ♡`;
      if (deliverBtn) deliverBtn.style.display = "none";
    } else {
      // unprepared
      textEl.textContent = ticket.greeting;
      if (deliverBtn) deliverBtn.style.display = "none";
    }

    dialogBox.style.display = "flex";
    sound.playTeaPour();
  }

  private showDialogue(speaker: string, text: string) {
    const dialogBox = document.getElementById("dialogue-box");
    const nameEl = document.getElementById("dialogue-speaker");
    const roleEl = document.getElementById("dialogue-role");
    const textEl = document.getElementById("dialogue-text");
    const deliverBtn = document.getElementById("btn-deliver-order");

    if (dialogBox && nameEl && textEl) {
      nameEl.textContent = speaker;
      if (roleEl) roleEl.textContent = "Canal Neighbor";
      textEl.textContent = text;
      if (deliverBtn) deliverBtn.style.display = "none";
      dialogBox.style.display = "flex";
      sound.playTeaPour();
    }
  }

  public openManicureStation() {
    const modal = document.getElementById("eliya-modal-overlay");
    if (modal) {
      modal.style.display = "flex";
      sound.playTeaPour();
      const creatorTab = document.querySelector('[data-cat="creator"]') as HTMLButtonElement;
      if (creatorTab) creatorTab.click();
    }
  }

  public openPhotobooth() {
    const modal = document.getElementById("eliya-modal-overlay");
    if (modal) {
      modal.style.display = "flex";
      sound.playCameraShutter();
      const stationTab = document.querySelector('[data-cat="station"]') as HTMLButtonElement;
      if (stationTab) stationTab.click();
    }
  }

  public showCompletionCelebration() {
    const overlay = document.getElementById("game-completion-overlay");
    if (overlay) {
      overlay.style.display = "flex";
      sound.playCameraShutter();
      sound.playTeaPour();
    }
  }

  public toggleOrderCard() {
    const orderCard = document.getElementById("order-card");
    if (!orderCard) return;
    const isHidden = orderCard.style.display === "none";
    orderCard.style.display = isHidden ? "flex" : "none";
    sound.playTeaPour();
  }

  public showToast(msg: string) {
    const toast = document.createElement("div");
    toast.style.cssText =
      "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1c1917;color:#faf7f5;padding:12px 24px;border-radius:4px;border:1px solid #e7e1dc;font-size:12px;font-family:var(--font-sans);z-index:9999;box-shadow:0 10px 24px -14px rgba(28,25,23,0.35);";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  private setupHUDControls() {
    // Top Bar Buttons
    const btnStation = document.getElementById("btn-open-station");
    const btnBooth = document.getElementById("btn-open-booth");
    const btnBike = document.getElementById("btn-toggle-bike");
    const btnSound = document.getElementById("btn-toggle-sound");
    const journalBtn = document.getElementById("journal-button");
    const btnContextInteract = document.getElementById("btn-context-interact");

    if (btnStation) btnStation.addEventListener("click", () => this.openManicureStation());
    if (btnBooth) btnBooth.addEventListener("click", () => this.openPhotobooth());
    if (journalBtn) journalBtn.addEventListener("click", () => this.toggleOrderCard());
    if (btnContextInteract) btnContextInteract.addEventListener("click", () => this.interactWithNearby());

    if (btnBike) {
      btnBike.addEventListener("click", () => {
        this.player.toggleBicycle();
        btnBike.classList.toggle("active", this.player.isRidingBicycle);
      });
    }

    if (btnSound) {
      btnSound.addEventListener("click", () => {
        sound.isMuted = !sound.isMuted;
        btnSound.classList.toggle("active", !sound.isMuted);
        if (!sound.isMuted) sound.startLoFiMusic();
      });
    }

    // Modal Close
    const btnClose = document.getElementById("btn-modal-close");
    if (btnClose) {
      btnClose.addEventListener("click", () => {
        const modal = document.getElementById("eliya-modal-overlay");
        if (modal) modal.style.display = "none";
      });
    }

    // Dialogue Close
    const btnCloseDialog = document.getElementById("btn-close-dialogue");
    if (btnCloseDialog) {
      btnCloseDialog.addEventListener("click", () => {
        const dialogBox = document.getElementById("dialogue-box");
        if (dialogBox) dialogBox.style.display = "none";
      });
    }

    // Deliver Order Button
    const btnDeliver = document.getElementById("btn-deliver-order");
    if (btnDeliver) {
      btnDeliver.addEventListener("click", () => {
        if (!this.pendingDeliveryTicketId) return;
        const res = questSystem.deliverToClient(this.pendingDeliveryTicketId);

        // Notify companion mascot
        window.dispatchEvent(
          new CustomEvent("delivery-completed", {
            detail: {
              clientName: this.pendingDeliveryTicketId.toUpperCase(),
              rewardCharm: res.reward,
            },
          })
        );

        const textEl = document.getElementById("dialogue-text");
        if (textEl) {
          textEl.innerHTML = `${res.dialogue}<br/><br/><strong style="color:#a8505e;">✦ Received Reward: ${res.reward}!</strong>`;
        }
        btnDeliver.style.display = "none";

        // Count remaining packed boxes
        const packedCount = Object.values(questSystem.tickets).filter((t) => t.status === "packed").length;
        this.player.updateBoxCount(packedCount);

        this.showToast(`🎁 Successfully delivered to ${this.pendingDeliveryTicketId.toUpperCase()}!`);

        if (questSystem.isCompleted) {
          setTimeout(() => {
            this.showCompletionCelebration();
          }, 1400);
        }
      });
    }

    // Completion Overlay Continue Button
    const btnComp = document.getElementById("btn-completion-continue");
    if (btnComp) {
      btnComp.addEventListener("click", () => {
        const overlay = document.getElementById("game-completion-overlay");
        if (overlay) overlay.style.display = "none";
      });
    }
  }

  private syncFromConvexState(state: PlayerStatePayload | null) {
    if (!state?.player) return;
    const p = state.player;
    const levelEl = document.getElementById("hud-level");
    if (levelEl) levelEl.textContent = `Lv. ${p.level}`;
    const glossEl = document.getElementById("hud-gloss");
    if (glossEl) glossEl.textContent = `${p.gloss} Gloss`;
  }

  private updateHUD() {
    // 1. Update Live In-Game Clock from Convex
    const clockEl = document.getElementById("hud-clock");
    if (clockEl) clockEl.textContent = gameConvex.getFormattedTime();

    // 2. Update Current District Tag
    const districtEl = document.getElementById("hud-district");
    if (districtEl) {
      const norm = this.player.normal;
      let closest = DISTRICTS[0];
      let minAngularDist = 999;
      for (const d of DISTRICTS) {
        const dNorm = sphericalToNormal(d.centerTheta, d.centerPhi);
        const dist = norm.distanceTo(dNorm);
        if (dist < minAngularDist) {
          minAngularDist = dist;
          closest = d;
        }
      }
      districtEl.textContent = `${closest.name} · ${closest.nameKo}`;
    }

    const near = this.planet.getNearestLandmark(this.player.getPosition());
    const dock = document.getElementById("interact-dock");
    const actionText = document.getElementById("interaction-action-text");
    const prompt = document.getElementById("interaction-prompt");

    if (near) {
      const lm = near.landmark;
      let msg = `✦ Press [E] or Click to visit ${lm.name}`;

      if (lm.id === "atelier") {
        msg = `✦ Press [E] or Click to Craft at Atelier Gloss`;
      } else if (lm.id === "photobooth") {
        msg = questSystem.isCompleted
          ? `✨ Press [E] or Click to Print Atelier Celebration Strip`
          : `📸 Press [E] or Click to Visit Life4Cuts Photobooth`;
      } else {
        const ticket = questSystem.getTicketByLandmark(lm.id);
        if (ticket && ticket.status === "packed") {
          msg = `🎁 Press [E] or Click to Deliver Couture Box to ${ticket.clientName}`;
        } else if (ticket) {
          msg = `✦ Press [E] or Click to Talk to ${ticket.clientName}`;
        }
      }

      if (actionText) actionText.textContent = msg;
      if (dock) dock.style.display = "flex";
      if (prompt) {
        prompt.textContent = msg;
        prompt.style.display = "block";
      }
    } else {
      if (dock) dock.style.display = "none";
      if (prompt) prompt.style.display = "none";
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update path status & coordinates for Convex synchronization
    this.player.isOnPath = this.planet.isPointOnPath(this.player.normal);
    const norm = this.player.normal;
    const phi = Math.acos(THREE.MathUtils.clamp(norm.y, -1, 1));
    let theta = Math.atan2(norm.x, norm.z);
    if (theta < 0) theta += Math.PI * 2;
    gameConvex.updatePlayerLocation(theta, phi);

    // Update dynamic world props (windmill, lanterns, pickups, wind sway)
    this.planet.update(delta);

    // Update Character Movement & Physics (Camera-relative input)
    this.player.update(delta, this.camera);

    // Tangent forward vector on sphere (true single-source forward)
    const forward = this.player.getForward();

    // Update Camera (Little Ritual parallel transport)
    this.cameraController.update(
      this.player.getPosition(),
      this.player.normal,
      forward,
      this.player.isMoving(),
      this.player.isRidingBicycle,
      delta
    );

    this.updateHUD();

    // Render WebGL
    this.renderer.render(this.scene, this.camera);
  };
}

// Boot Game
window.addEventListener("DOMContentLoaded", () => {
  new EliyaCanalWorldGame();
});
