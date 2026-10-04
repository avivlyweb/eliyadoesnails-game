import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const CONVEX_URL =
  (import.meta as any).env?.VITE_CONVEX_URL ||
  "https://incredible-snake-136.eu-west-1.convex.cloud";

export const convex = new ConvexClient(CONVEX_URL);

/** Reject if a Convex call hasn't settled in `ms` (so the game never hangs on a dead connection). */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`[Convex] ${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}
export { api };

const GUEST_TOKEN_KEY = "eliyadoesnails_guest_token";

export function getGuestToken(): string {
  try {
    let token = localStorage.getItem(GUEST_TOKEN_KEY);
    if (!token) {
      token = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "guest-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(GUEST_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return "guest-session-" + Math.random().toString(36).slice(2, 10);
  }
}

export interface PlayerStatePayload {
  player: {
    _id: string;
    guestToken: string;
    name: string;
    level: number;
    xp: number;
    gloss: number;
    unlocks: string[];
    position: { theta: number; phi: number };
    gameMinutes: number;
    activePetKey?: string;
  };
  inventory: Array<{ itemType: string; itemKey: string; qty: number }>;
  quests: Array<{
    _id: string;
    templateKey: string;
    npcKey: string;
    status: string;
    acceptedAt?: number;
    deadlineGameMinutes?: number;
    stars?: number;
  }>;
  friendships: Array<{ npcKey: string; points: number; level: number }>;
  placedDecor: Array<{ decorKey: string; slot: string }>;
}

export type StateListener = (state: PlayerStatePayload) => void;

class GameConvexService {
  public isOnline: boolean = false;
  public content: any = null;
  public currentState: PlayerStatePayload | null = null;
  private guestToken: string;
  private listeners: StateListener[] = [];
  private unsubscribeLiveState: (() => void) | null = null;
  private lastSaveTime: number = 0;
  private savePending: boolean = false;
  private currentCoord = { theta: 0.8, phi: 0.8 };
  private currentGameMinutes: number = 480; // 08:00 default
  private clockInterval: number | null = null;

  constructor() {
    this.guestToken = getGuestToken();
  }

  public async init(): Promise<void> {
    // 1. Fetch content from Convex with fallback to /content-fallback.json
    try {
      this.content = await withTimeout(convex.query(api.content.getAll, {}), 8000, "content.getAll");
      this.isOnline = true;
      console.log("[Convex] Content loaded from Convex server.");
    } catch (err) {
      console.warn("[Convex] Server query failed, attempting content-fallback.json:", err);
      try {
        const resp = await fetch("/content-fallback.json");
        this.content = await resp.json();
        console.log("[Convex] Loaded offline content-fallback.json successfully.");
      } catch (fallbackErr) {
        console.error("[Convex] Failed to load offline fallback content:", fallbackErr);
      }
      this.isOnline = false;
      // Stop the client from retrying forever in the background while we play offline.
      convex.close().catch(() => {});
    }

    // 2. Bootstrap Player
    if (this.isOnline) {
      try {
        const bootstrapped = await withTimeout(
          convex.mutation(api.players.bootstrap, { guestToken: this.guestToken }),
          8000,
          "players.bootstrap"
        );
        this.currentState = bootstrapped as any;
        this.currentGameMinutes = bootstrapped.player.gameMinutes || 480;
        this.currentCoord = {
          theta: bootstrapped.player.position?.theta ?? 0.8,
          phi: bootstrapped.player.position?.phi ?? 0.8,
        };
        this.notifyListeners();
        console.log("[Convex] Player bootstrapped:", bootstrapped.player);

        // 3. Subscribe to live player state updates
        this.unsubscribeLiveState = convex.onUpdate(
          api.players.state,
          { guestToken: this.guestToken },
          (liveState) => {
            if (liveState) {
              this.currentState = liveState as any;
              this.notifyListeners();
            }
          }
        );
      } catch (bootErr) {
        console.warn("[Convex] Bootstrap failed, operating offline:", bootErr);
        this.isOnline = false;
        this.initOfflineState();
      }
    } else {
      this.initOfflineState();
    }

    // 4. In-game Clock: 1 in-game hour = 1 real minute (1 game minute = 1 real sec)
    if (typeof window !== "undefined") {
      this.clockInterval = window.setInterval(() => {
        this.currentGameMinutes = (this.currentGameMinutes + 1) % 1440;
      }, 1000);

      // 5. Periodic Position Save every 10s
      window.setInterval(() => {
        this.flushPosition();
      }, 10000);

      // 6. Flush on visibilitychange / pagehide
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.flushPosition();
        }
      });
      window.addEventListener("pagehide", () => {
        this.flushPosition();
      });
    }
  }

  private initOfflineState() {
    this.currentState = {
      player: {
        _id: "local-player",
        guestToken: this.guestToken,
        name: "Eliya",
        level: 1,
        xp: 0,
        gloss: 50,
        unlocks: ["district:canal", "npc:mira", "npc:nell"],
        position: { theta: 0.8, phi: 0.8 },
        gameMinutes: 480,
      },
      inventory: [
        { itemType: "shade", itemKey: "rose_quartz", qty: 1 },
        { itemType: "shade", itemKey: "cherry_blossom", qty: 1 },
        { itemType: "shade", itemKey: "apricot_peach", qty: 1 },
        { itemType: "tool", itemKey: "czech_glass_file", qty: 1 },
        { itemType: "tool", itemKey: "micro_liner_brush", qty: 1 },
        { itemType: "material", itemKey: "silk_ribbon", qty: 2 },
      ],
      quests: [
        {
          _id: "local-quest-1",
          templateKey: "mira_1_cherry_french",
          npcKey: "mira",
          status: "offered",
        },
      ],
      friendships: [
        { npcKey: "mira", points: 0, level: 0 },
        { npcKey: "nell", points: 0, level: 0 },
      ],
      placedDecor: [],
    };
    this.notifyListeners();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    if (this.currentState) {
      listener(this.currentState);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    if (!this.currentState) return;
    for (const fn of this.listeners) {
      try {
        fn(this.currentState);
      } catch (err) {
        console.error("[Convex] Error in state listener:", err);
      }
    }
  }

  public updatePlayerLocation(theta: number, phi: number) {
    this.currentCoord.theta = theta;
    this.currentCoord.phi = phi;
    this.savePending = true;
  }

  public async flushPosition(): Promise<void> {
    if (!this.isOnline || !this.savePending) return;
    const now = Date.now();
    if (now - this.lastSaveTime < 8000) return; // respect min 10s throttling guideline
    this.lastSaveTime = now;
    this.savePending = false;

    try {
      await convex.mutation(api.players.savePosition, {
        guestToken: this.guestToken,
        theta: this.currentCoord.theta,
        phi: this.currentCoord.phi,
        gameMinutes: Math.floor(this.currentGameMinutes),
      });
    } catch (err) {
      console.warn("[Convex] savePosition heartbeat skipped:", err);
    }
  }

  public getGameMinutes(): number {
    return this.currentGameMinutes;
  }

  public getFormattedTime(): string {
    const hours = Math.floor(this.currentGameMinutes / 60) % 24;
    const minutes = Math.floor(this.currentGameMinutes % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  public async harvestNode(nodeKey: string) {
    if (!this.isOnline) {
      // Offline fallback: simulate local harvest
      return {
        success: true,
        materialKey: nodeKey.includes("pearl")
          ? "freshwater_pearl"
          : nodeKey.includes("ribbon")
          ? "silk_ribbon"
          : nodeKey.includes("syrup")
          ? "syrup_base"
          : nodeKey.includes("daisy")
          ? "daisy_sprig"
          : nodeKey.includes("chrome")
          ? "chrome_drop"
          : nodeKey.includes("crystal")
          ? "aurora_crystal"
          : nodeKey.includes("gold")
          ? "gold_leaf"
          : "sakura_petal",
        materialName: "Crafting Botanical",
        materialNameKo: "식물 & 원석",
        qty: 2,
        nextReadyAt: Date.now() + 240000,
      };
    }
    return await convex.mutation(api.gather.harvest, {
      guestToken: this.guestToken,
      nodeKey,
    });
  }

  public async savePositionImmediate(): Promise<void> {
    if (!this.isOnline) return;
    this.lastSaveTime = Date.now();
    this.savePending = false;
    try {
      await convex.mutation(api.players.savePosition, {
        guestToken: this.guestToken,
        theta: this.currentCoord.theta,
        phi: this.currentCoord.phi,
        gameMinutes: Math.floor(this.currentGameMinutes),
      });
    } catch (err) {
      console.warn("[Convex] savePositionImmediate error:", err);
    }
  }

  public async craftCharm(charmKey: string) {
    if (!this.isOnline) {
      return { success: true, charmKey, charmName: charmKey.replace(/_/g, " ") };
    }
    return await convex.mutation(api.craft.craftCharm, {
      guestToken: this.guestToken,
      charmKey,
    });
  }

  public async fetchNodeStates(): Promise<Array<{ nodeKey: string; readyAt: number }>> {
    if (!this.isOnline) return [];
    try {
      return await convex.query(api.gather.nodeStates, {
        guestToken: this.guestToken,
      });
    } catch {
      return [];
    }
  }

  public async getQuestBoard(npcKey?: string) {
    if (!this.isOnline) {
      const allQuests = this.currentState?.quests || [];
      const filtered = allQuests.filter(
        (q) =>
          (q.status === "offered" || q.status === "active" || q.status === "crafted") &&
          (!npcKey || q.npcKey === npcKey)
      );
      const templates = this.content?.questTemplates || [];
      const looks = this.content?.looks || [];
      return filtered.map((q) => {
        const template = templates.find((t: any) => t.key === q.templateKey);
        const look = template ? looks.find((l: any) => l.key === template.lookKey) : null;
        return { ...q, template, look };
      });
    }
    try {
      return await convex.query(api.quests.board, {
        guestToken: this.guestToken,
        npcKey,
      });
    } catch (err) {
      console.warn("[Convex] getQuestBoard error:", err);
      return [];
    }
  }

  public async acceptQuest(questId: string) {
    if (!this.isOnline) {
      if (this.currentState) {
        const q = this.currentState.quests.find((item) => item._id === questId);
        if (q) {
          q.status = "active";
          q.acceptedAt = Date.now();
          this.notifyListeners();
        }
      }
      return { success: true, questId };
    }
    return await convex.mutation(api.quests.accept, {
      guestToken: this.guestToken,
      questId: questId as any,
    });
  }

  public async deliverQuest(questId: string) {
    if (!this.isOnline) {
      if (this.currentState) {
        const q = this.currentState.quests.find((item) => item._id === questId);
        if (q) {
          q.status = "delivered";
          this.currentState.player.gloss += 50;
          this.currentState.player.xp += 100;
          this.notifyListeners();
        }
      }
      return {
        success: true,
        questId,
        rewards: {
          gloss: 50,
          xp: 100,
          friendship: 15,
        },
        glossEarned: 50,
        xpEarned: 100,
        friendshipEarned: 15,
        newLevel: this.currentState?.player.level ?? 1,
        newGloss: this.currentState?.player.gloss ?? 100,
        newXp: this.currentState?.player.xp ?? 100,
        levelUps: [],
        newUnlocks: [],
      };
    }
    return await convex.mutation(api.quests.deliver, {
      guestToken: this.guestToken,
      questId: questId as any,
    });
  }

  public async startStudioDesign(questId: string) {
    if (!this.isOnline) {
      return {
        success: true,
        designId: "local-design-" + Date.now(),
        look: null,
      };
    }
    return await convex.mutation(api.studio.startDesign, {
      guestToken: this.guestToken,
      questId: questId as any,
    });
  }

  public async finishStudioDesign(
    questId: string,
    designId: string,
    scores: { base: number; art: number; finish: number }
  ) {
    if (!this.isOnline) {
      if (this.currentState) {
        const q = this.currentState.quests.find((item) => item._id === questId);
        if (q) {
          q.status = "crafted";
          q.stars = 3;
          this.notifyListeners();
        }
      }
      return {
        success: true,
        designId,
        stars: 3,
        scores,
      };
    }
    return await convex.mutation(api.studio.finishDesign, {
      guestToken: this.guestToken,
      questId: questId as any,
      designId: designId as any,
      scores,
    });
  }

  public async buyShopItem(
    itemType: "shade" | "tool" | "decor",
    itemKey: string
  ) {
    if (!this.isOnline) {
      if (this.currentState) {
        this.currentState.player.gloss -= 50;
        this.currentState.inventory.push({
          itemType,
          itemKey,
          qty: 1,
        });
        this.notifyListeners();
      }
      return { success: true, itemKey, cost: 50 };
    }
    return await convex.mutation(api.shop.buyItem, {
      guestToken: this.guestToken,
      itemType,
      itemKey,
    });
  }

  public async sellMaterial(materialKey: string, qty: number) {
    if (!this.isOnline) {
      if (this.currentState) {
        const item = this.currentState.inventory.find(
          (i) => i.itemType === "material" && i.itemKey === materialKey
        );
        if (item) {
          item.qty = Math.max(0, item.qty - qty);
        }
        this.currentState.player.gloss += 4 * qty;
        this.notifyListeners();
      }
      return { success: true, materialKey, soldQty: qty, payout: 4 * qty };
    }
    return await convex.mutation(api.shop.sellMaterial, {
      guestToken: this.guestToken,
      materialKey,
      qty,
    });
  }

  public async setActivePet(petKey?: string) {
    if (!this.isOnline) {
      if (this.currentState) {
        this.currentState.player.activePetKey = petKey;
        this.notifyListeners();
      }
      return { success: true, activePetKey: petKey };
    }
    return await convex.mutation(api.shop.setActivePet, {
      guestToken: this.guestToken,
      petKey,
    });
  }

  public isNight(): boolean {
    const hours = Math.floor(this.currentGameMinutes / 60) % 24;
    return hours >= 20 || hours < 6;
  }
}

export const gameConvex = new GameConvexService();
