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

const MATERIAL_ICONS: Record<string, { icon: string; name: string; nameKo: string; district: string; price: number; desc: string }> = {
  sakura_petal: { icon: "🌸", name: "Sakura Petal", nameKo: "벚꽃잎", district: "Canal & Meadow", price: 3, desc: "Delicate spring cherry blossom petals harvested from Amsterdam canal trees." },
  freshwater_pearl: { icon: "🦪", name: "Freshwater Pearl", nameKo: "담수진주", district: "Canal", price: 5, desc: "Luminous organic pearls found along historic canal bridges." },
  silk_ribbon: { icon: "🎀", name: "Silk Ribbon", nameKo: "실크 리본", district: "Market", price: 4, desc: "Fine blush-tinted coquette ribbons from the vintage haberdashery." },
  syrup_base: { icon: "🍯", name: "Syrup Base", nameKo: "시럽 베이스", district: "Market", price: 4, desc: "Clear high-viscosity syrup lacquer formulated for glass jelly layering." },
  daisy_sprig: { icon: "🌼", name: "Daisy Sprig", nameKo: "데이지", district: "Meadow", price: 3, desc: "Fresh petite wild daisies gathered from the sunny tulip pastures." },
  chrome_drop: { icon: "💧", name: "Chrome Drop", nameKo: "크롬 방울", district: "Windmill", price: 8, desc: "Molten liquid mirror chrome droplets condensed near the windmill." },
  aurora_crystal: { icon: "💎", name: "Aurora Crystal", nameKo: "오로라 크리스탈", district: "Windmill & Harbour", price: 12, desc: "Prismatic crystal shards refracting holographic northern lights." },
  gold_leaf: { icon: "✨", name: "Gold Leaf", nameKo: "금박", district: "Harbour", price: 12, desc: "Micro-thin 24k gold leaf flakes collected from the harbour salon boat." },
};

const CHARM_RECIPES: Record<string, { name: string; nameKo: string; icon: string; level: number; recipe: Array<{ key: string; name: string; qty: number }>; desc: string }> = {
  ribbon_bow: { name: "Ribbon Bow", nameKo: "리본 보우 파츠", icon: "🎀", level: 1, recipe: [{ key: "silk_ribbon", name: "Silk Ribbon", qty: 2 }, { key: "sakura_petal", name: "Sakura Petal", qty: 1 }], desc: "Hand-sculpted coquette ribbon bow charm." },
  baroque_pearl: { name: "Baroque Pearl", nameKo: "바로크 진주 파츠", icon: "🦪", level: 1, recipe: [{ key: "freshwater_pearl", name: "Freshwater Pearl", qty: 3 }], desc: "Organic irregular nacre pearl cluster." },
  molten_chrome_drops: { name: "Molten Chrome Drops", nameKo: "몰튼 크롬 드롭", icon: "💧", level: 5, recipe: [{ key: "chrome_drop", name: "Chrome Drop", qty: 3 }, { key: "syrup_base", name: "Syrup Base", qty: 1 }], desc: "Liquid metallic drops with mirror reflections." },
  cyber_heart: { name: "Cyber Heart", nameKo: "사이버 하트 파츠", icon: "🩶", level: 6, recipe: [{ key: "chrome_drop", name: "Chrome Drop", qty: 2 }, { key: "silk_ribbon", name: "Silk Ribbon", qty: 1 }], desc: "Futuristic barbed-wire chrome heart." },
  aurora_teardrop: { name: "Aurora Teardrop", nameKo: "오로라 티어드롭", icon: "💎", level: 6, recipe: [{ key: "aurora_crystal", name: "Aurora Crystal", qty: 2 }, { key: "freshwater_pearl", name: "Freshwater Pearl", qty: 1 }], desc: "Faceted iridescent teardrop jewel." },
  y2k_stars: { name: "Y2K Stars", nameKo: "Y2K 사이버 스타", icon: "⭐", level: 8, recipe: [{ key: "gold_leaf", name: "Gold Leaf", qty: 1 }, { key: "daisy_sprig", name: "Daisy Sprig", qty: 2 }, { key: "syrup_base", name: "Syrup Base", qty: 1 }], desc: "Prismatic retro star cluster with golden accents." },
  saturn_orbital: { name: "Saturn Orbital", nameKo: "토성 궤도 참", icon: "🪐", level: 8, recipe: [{ key: "aurora_crystal", name: "Aurora Crystal", qty: 1 }, { key: "gold_leaf", name: "Gold Leaf", qty: 1 }, { key: "chrome_drop", name: "Chrome Drop", qty: 1 }], desc: "Orbital ringed cosmic charm." },
  chrome_monkey: { name: "Chrome Monkey", nameKo: "크롬 몽키 파츠", icon: "🐵", level: 10, recipe: [{ key: "chrome_drop", name: "Chrome Drop", qty: 2 }, { key: "gold_leaf", name: "Gold Leaf", qty: 2 }], desc: "Couture metallic miniature mascot charm." },
};

const TOOLS_DATA: Record<string, { name: string; nameKo: string; icon: string; level: number; effect: string; price: string }> = {
  czech_glass_file: { name: "Czech Glass File", nameKo: "체코 글라스 파일", icon: "🪄", level: 1, effect: "Base step accuracy +10", price: "Starter Tool" },
  micro_liner_brush: { name: "Micro Liner Brush", nameKo: "마이크로 라이너 브러쉬", icon: "🖌️", level: 1, effect: "Trace tolerance +30%", price: "Starter Tool" },
  cuticle_serum_dropper: { name: "Cuticle Serum Dropper", nameKo: "큐티클 세럼 스포이트", icon: "🧴", level: 2, effect: "Spill penalty -50%", price: "90 Gloss" },
  magnetic_cat_eye_wand: { name: "Magnetic Cat-Eye Wand", nameKo: "마그네틱 캣아이 자석", icon: "🧲", level: 4, effect: "Required for cat-eye prism art", price: "150 Gloss" },
  precision_tweezers: { name: "Precision Tweezers", nameKo: "정밀 핀셋", icon: "🥢", level: 5, effect: "Required for molten chrome 3D drops", price: "180 Gloss" },
  aura_airbrush: { name: "Aura Airbrush", nameKo: "오라 에어브러쉬", icon: "💨", level: 5, effect: "Required for constellation aura art", price: "200 Gloss" },
  chrome_burnishing_pen: { name: "Chrome Burnishing Pen", nameKo: "크롬 버니싱 펜", icon: "🖋️", level: 6, effect: "Cure step green zone +25%", price: "160 Gloss" },
  nail_sizing_wheel: { name: "Nail Sizing Wheel", nameKo: "사이징 휠", icon: "📐", level: 7, effect: "+15% Gloss on all deliveries", price: "300 Gloss" },
};

const SHADES_DATA: Record<string, { name: string; nameKo: string; hex: string; finish: string; level: number }> = {
  rose_quartz: { name: "Rose Quartz Syrup", nameKo: "로즈 쿼츠 시럽", hex: "#e8b4b8", finish: "syrup", level: 1 },
  cherry_blossom: { name: "Cherry Blossom Syrup", nameKo: "체리 블라썸 시럽", hex: "#f3c2c2", finish: "syrup", level: 1 },
  apricot_peach: { name: "Apricot Peach Dew", nameKo: "살구 복숭아 이슬", hex: "#f5c5a3", finish: "syrup", level: 1 },
  matcha_latte: { name: "Matcha Latte Glaze", nameKo: "말차 라떼 글레이즈", hex: "#b5c99a", finish: "syrup", level: 2 },
  molten_sterling: { name: "Molten Sterling Chrome", nameKo: "몰튼 실버 리퀴드", hex: "#d9dce1", finish: "chrome", level: 5 },
  lilac_prism: { name: "Lilac Prism Cat-Eye", nameKo: "라일락 오로라 캣아이", hex: "#c8b6ff", finish: "cateye", level: 4 },
  moonlight_silver: { name: "Moonlight Silver Cat-Eye", nameKo: "문라이트 실버 캣아이", hex: "#e0e1dd", finish: "cateye", level: 6 },
  emerald_nebula: { name: "Emerald Nebula Cat-Eye", nameKo: "에메랄드 네뷸라 캣아이", hex: "#52b788", finish: "cateye", level: 9 },
};

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
  private currentInvTab: "materials" | "charms" | "tools" | "shades" = "materials";
  private harvestToastTimer: any = null;

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
    gameConvex.init().then(async () => {
      this.syncFromConvexState(gameConvex.currentState);
      const states = await gameConvex.fetchNodeStates();
      this.planet.syncNodeStates(states);
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
      if (e.code === "KeyI") {
        this.toggleInventory();
      }
      if (e.code === "Escape") {
        this.closeAllModals();
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
    if (lm.nodeKey) {
      this.handleGatherNode(lm);
      return;
    }

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

  private async handleGatherNode(lm: any) {
    if (this.planet.depletedNodes.has(lm.nodeKey)) {
      this.showToast(`⏳ ${lm.name} is regrowing... respawns soon!`);
      return;
    }

    this.player.playGatherAnimation(0.8);
    sound.playGlassFile();

    await gameConvex.savePositionImmediate();

    try {
      const res = await gameConvex.harvestNode(lm.nodeKey);
      this.planet.setNodeHarvested(lm.nodeKey, res.nextReadyAt);
      this.showHarvestToast(res);
      this.renderInventory();
    } catch (err: any) {
      if (err.message?.includes("NODE_DEPLETED")) {
        this.showToast("⏳ Node has already been harvested!");
      } else if (err.message?.includes("DISTRICT_LOCKED")) {
        this.showToast("🔒 District is locked! Level up to access.");
      } else if (err.message?.includes("TOO_FAR")) {
        this.showToast("Step closer to gather this botanical node.");
      } else {
        this.showToast(`Harvest error: ${err.message || err}`);
      }
    }
  }

  private showHarvestToast(res: { materialKey: string; materialName: string; materialNameKo: string; qty: number }) {
    const toast = document.getElementById("harvest-toast");
    const iconEl = document.getElementById("harvest-toast-icon");
    const titleEl = document.getElementById("harvest-toast-title");
    const subEl = document.getElementById("harvest-toast-sub");
    if (!toast || !titleEl || !subEl) return;

    const meta = MATERIAL_ICONS[res.materialKey];
    if (iconEl) iconEl.textContent = meta?.icon ?? "🌸";
    titleEl.textContent = `+${res.qty} ${res.materialName}`;
    subEl.textContent = `${res.materialNameKo} · Stored in Atelier Basket`;

    toast.classList.add("show");
    if (this.harvestToastTimer) clearTimeout(this.harvestToastTimer);
    this.harvestToastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
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

    // Atelier Basket & Inventory Controls
    const btnOpenInv = document.getElementById("btn-open-inventory");
    if (btnOpenInv) btnOpenInv.addEventListener("click", () => this.toggleInventory());

    const btnCloseInv = document.getElementById("btn-inventory-close");
    if (btnCloseInv) btnCloseInv.addEventListener("click", () => this.toggleInventory(false));

    document.querySelectorAll(".inv-tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = (e.currentTarget as HTMLElement).getAttribute("data-tab") as any;
        if (target) {
          this.switchInventoryTab(target);
        }
      });
    });

    // Completion Overlay Continue Button
    const btnComp = document.getElementById("btn-completion-continue");
    if (btnComp) {
      btnComp.addEventListener("click", () => {
        const overlay = document.getElementById("game-completion-overlay");
        if (overlay) overlay.style.display = "none";
      });
    }
  }

  public toggleInventory(force?: boolean) {
    const modal = document.getElementById("inventory-modal-overlay");
    if (!modal) return;
    const shouldOpen = force !== undefined ? force : modal.style.display !== "flex";
    modal.style.display = shouldOpen ? "flex" : "none";
    if (shouldOpen) {
      sound.playTeaPour();
      this.renderInventory();
    }
  }

  public switchInventoryTab(tab: "materials" | "charms" | "tools" | "shades") {
    this.currentInvTab = tab;
    document.querySelectorAll(".inv-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
    });
    this.renderInventory();
  }

  private closeAllModals() {
    const invModal = document.getElementById("inventory-modal-overlay");
    if (invModal) invModal.style.display = "none";
    const studioModal = document.getElementById("eliya-modal-overlay");
    if (studioModal) studioModal.style.display = "none";
    const dialogBox = document.getElementById("dialogue-box");
    if (dialogBox) dialogBox.style.display = "none";
    const orderCard = document.getElementById("order-card");
    if (orderCard) orderCard.style.display = "none";
  }

  private getInventoryQty(itemType: string, itemKey: string): number {
    const inv = gameConvex.currentState?.inventory;
    if (!inv) return 0;
    const item = inv.find((i: any) => i.itemType === itemType && i.itemKey === itemKey);
    return item?.qty ?? 0;
  }

  public renderInventory() {
    const container = document.getElementById("inv-grid-container");
    if (!container) return;

    const player = gameConvex.currentState?.player;
    const playerLevel = player?.level ?? 1;

    container.innerHTML = "";

    if (this.currentInvTab === "materials") {
      for (const [key, mat] of Object.entries(MATERIAL_ICONS)) {
        const count = this.getInventoryQty("material", key);
        const card = document.createElement("div");
        card.className = "inv-item-card";
        card.innerHTML = `
          <div class="inv-item-top">
            <span class="inv-item-icon">${mat.icon}</span>
            <span class="inv-item-qty">×${count}</span>
          </div>
          <div class="inv-item-name">${mat.name}</div>
          <div class="inv-item-name-ko">${mat.nameKo}</div>
          <div class="inv-item-desc">${mat.desc}</div>
          <div style="margin-top:auto; font-size:10px; font-family:var(--font-mono); color:var(--text-muted); display:flex; justify-content:space-between; padding-top:6px; border-top:1px dashed var(--hairline);">
            <span>${mat.district}</span>
            <span style="color:#b8860b;">${mat.price} Gloss</span>
          </div>
        `;
        container.appendChild(card);
      }
    } else if (this.currentInvTab === "charms") {
      for (const [key, charm] of Object.entries(CHARM_RECIPES)) {
        const count = this.getInventoryQty("charm", key);
        let canCraft = playerLevel >= charm.level;
        let recipeHtml = "";

        for (const ing of charm.recipe) {
          const owned = this.getInventoryQty("material", ing.key);
          const hasEnough = owned >= ing.qty;
          if (!hasEnough) canCraft = false;
          recipeHtml += `
            <div style="display:flex; justify-content:space-between; color:${hasEnough ? 'var(--text-primary)' : 'var(--accent-petal)'};">
              <span>${ing.name}</span>
              <span style="font-family:var(--font-mono);">${owned}/${ing.qty} ${hasEnough ? '✓' : '✗'}</span>
            </div>
          `;
        }

        const card = document.createElement("div");
        card.className = "inv-item-card";
        card.innerHTML = `
          <div class="inv-item-top">
            <span class="inv-item-icon">${charm.icon}</span>
            <span class="inv-item-qty">×${count}</span>
          </div>
          <div class="inv-item-name">${charm.name}</div>
          <div class="inv-item-name-ko">${charm.nameKo}</div>
          <div class="inv-item-desc">${charm.desc}</div>
          <div class="inv-item-recipe">
            <div style="font-weight:600; font-family:var(--font-mono); font-size:9px; letter-spacing:0.5px; text-transform:uppercase;">Recipe Requirements</div>
            ${recipeHtml}
          </div>
          <button class="inv-craft-btn" ${canCraft ? "" : "disabled"} data-charm-key="${key}">
            ${playerLevel < charm.level ? `🔒 Unlock at Lv.${charm.level}` : (canCraft ? `✦ Craft [만들기]` : `Missing Ingredients`)}
          </button>
        `;

        const craftBtn = card.querySelector(".inv-craft-btn") as HTMLButtonElement;
        if (craftBtn && canCraft) {
          craftBtn.addEventListener("click", async () => {
            craftBtn.disabled = true;
            craftBtn.textContent = "Crafting...";
            try {
              await gameConvex.craftCharm(key);
              sound.playTeaPour();
              this.showToast(`✦ Successfully crafted bespoke ${charm.name}!`);
              this.renderInventory();
            } catch (err: any) {
              this.showToast(`Crafting failed: ${err.message || err}`);
              this.renderInventory();
            }
          });
        }

        container.appendChild(card);
      }
    } else if (this.currentInvTab === "tools") {
      for (const [key, tool] of Object.entries(TOOLS_DATA)) {
        const isOwned = key === "czech_glass_file" || key === "micro_liner_brush" || this.getInventoryQty("tool", key) > 0;
        const card = document.createElement("div");
        card.className = "inv-item-card";
        card.innerHTML = `
          <div class="inv-item-top">
            <span class="inv-item-icon">${tool.icon}</span>
            <span class="inv-item-qty" style="background:${isOwned ? '#edf7ed' : '#f5f5f5'}; border-color:${isOwned ? '#c8e6c9' : '#e0e0e0'}; color:${isOwned ? '#2e7d32' : '#757575'};">${isOwned ? "Equipped" : "Locked"}</span>
          </div>
          <div class="inv-item-name">${tool.name}</div>
          <div class="inv-item-name-ko">${tool.nameKo}</div>
          <div class="inv-item-desc" style="color:var(--text-primary); font-weight:500;">✦ ${tool.effect}</div>
          <div style="margin-top:auto; font-size:10px; font-family:var(--font-mono); color:var(--text-muted); padding-top:6px; border-top:1px dashed var(--hairline);">
            ${isOwned ? "Starter Atelier Kit" : `Atelier Lv.${tool.level} · ${tool.price}`}
          </div>
        `;
        container.appendChild(card);
      }
    } else if (this.currentInvTab === "shades") {
      for (const [key, shade] of Object.entries(SHADES_DATA)) {
        const isOwned = shade.level === 1 || this.getInventoryQty("shade", key) > 0;
        const card = document.createElement("div");
        card.className = "inv-item-card";
        card.innerHTML = `
          <div class="inv-item-top">
            <div style="width:26px; height:26px; border-radius:50%; background:${shade.hex}; border:2px solid var(--surface); box-shadow:0 0 0 1px var(--hairline);"></div>
            <span class="inv-item-qty" style="background:${isOwned ? '#edf7ed' : '#f5f5f5'}; border-color:${isOwned ? '#c8e6c9' : '#e0e0e0'}; color:${isOwned ? '#2e7d32' : '#757575'};">${isOwned ? "In Palette" : "Locked"}</span>
          </div>
          <div class="inv-item-name">${shade.name}</div>
          <div class="inv-item-name-ko">${shade.nameKo}</div>
          <div class="inv-item-desc" style="font-family:var(--font-mono); font-size:10px; text-transform:uppercase;">Finish: ${shade.finish}</div>
          <div style="margin-top:auto; font-size:10px; font-family:var(--font-mono); color:var(--text-muted); padding-top:6px; border-top:1px dashed var(--hairline);">
            ${isOwned ? "Starter Atelier Shade" : `Atelier Lv.${shade.level}`}
          </div>
        `;
        container.appendChild(card);
      }
    }
  }

  private syncFromConvexState(state: PlayerStatePayload | null) {
    if (!state?.player) return;
    const p = state.player;
    const levelEl = document.getElementById("hud-level");
    if (levelEl) levelEl.textContent = `Lv. ${p.level}`;
    const glossEl = document.getElementById("hud-gloss");
    if (glossEl) glossEl.textContent = `${p.gloss} Gloss`;

    const invModal = document.getElementById("inventory-modal-overlay");
    if (invModal && invModal.style.display === "flex") {
      this.renderInventory();
    }
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

      if (lm.nodeKey) {
        const isDepleted = this.planet.depletedNodes.has(lm.nodeKey);
        msg = isDepleted
          ? `⏳ ${lm.name} is regrowing... respawns soon`
          : `🌸 Press [E] or Click to Gather ${lm.name}`;
      } else if (lm.id === "atelier") {
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
