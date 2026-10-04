import { sound } from "./audio";
import { gameConvex, PlayerStatePayload } from "../net/convex";

export interface ClientTicket {
  id: string; // npcKey: 'mira', 'nell', etc.
  questId?: string; // convex quest _id
  templateKey?: string;
  clientName: string;
  role: string;
  landmarkId: string;
  locationName: string;
  setDesignName: string;
  requestedCharm: string;
  baseModelPath: string;
  status: "offered" | "unprepared" | "packed" | "delivered";
  greeting: string;
  deliveryDialogue: string;
  rewardCharm: string;
  rewardGloss?: number;
  rewardXp?: number;
  rewardFriendship?: number;
  deadlineGameMinutes?: number;
  icon: string;
}

export interface QuestObjective {
  /** Which part of the loop the player is in: meet -> craft -> deliver */
  phase: "meet" | "craft" | "deliver" | "finale";
  title: string;
  detail: string;
  /** Landmark id the waypoint should point at (npc_mira, atelier, photobooth...) */
  targetId: string | null;
}

export class AtelierQuestSystem {
  public roundTitle: string = "The Slow Beauty Round";
  public roundSubtitle: string = "A bespoke set crafted with care for every neighbor.";

  public tickets: Record<string, ClientTicket> = {
    mira: {
      id: "mira",
      clientName: "Mira",
      role: "Florist",
      landmarkId: "npc_mira",
      locationName: "Flower Cart by Canal",
      setDesignName: "Cherry Blossom Sakura French",
      requestedCharm: "Sculpted Ribbon Bow",
      baseModelPath: "/models/high-detail/sets/set-cherry-blossom.glb",
      status: "offered",
      greeting: "Eliya! The morning market is opening, but my hands feel so bare without your floral jelly press-ons!",
      deliveryDialogue: "For me? The Cherry Blossom set! Look at the delicate sheer blush and 3D micro-petals—they match my fresh morning peonies so beautifully! Here, take this baroque pearl for your atelier charm palette.",
      rewardCharm: "Baroque Nacre Pearl",
      rewardGloss: 40,
      rewardXp: 100,
      rewardFriendship: 15,
      icon: "🌸",
    },
    nell: {
      id: "nell",
      clientName: "Nell",
      role: "Potter",
      landmarkId: "npc_nell",
      locationName: "Bell Gable Ceramic House",
      setDesignName: "Rose Quartz French",
      requestedCharm: "Molten Chrome Drops",
      baseModelPath: "/models/high-detail/sets/cyberpunk-liquid-chrome-set.glb",
      status: "offered",
      greeting: "Eliya! Normal polish chips in five seconds at the pottery wheel. I need your sculptured nail armor!",
      deliveryDialogue: "Mirror-reflective, solid and pure artisanal luxury! The pottery wheel won't stand a chance. I threw this scalloped ceramic palette for you!",
      rewardCharm: "Molten Chrome Drops",
      rewardGloss: 50,
      rewardXp: 80,
      rewardFriendship: 15,
      icon: "🏺",
    },
    pip: {
      id: "pip",
      clientName: "Pip",
      role: "Photo Collector",
      landmarkId: "npc_pip",
      locationName: "Hongdae Life4Cuts Studio",
      setDesignName: "Apricot Pearl Glass",
      requestedCharm: "Barbed Wire Cyber Heart",
      baseModelPath: "/models/high-detail/sets/blush-glaze-coquette-set.glb",
      status: "offered",
      greeting: "Eliya! The Life4Cuts arcade booth is primed, but we need your iconic Glass Manicure for today's lookbook strip!",
      deliveryDialogue: "Perfection! Look at that glassy syrup glow under the photo flashes! Step inside the booth right now, let's print your official atelier celebration strip!",
      rewardCharm: "Barbed Wire Cyber Heart",
      rewardGloss: 50,
      rewardXp: 80,
      rewardFriendship: 15,
      icon: "📸",
    },
    joon: {
      id: "joon",
      clientName: "Joon",
      role: "Barista",
      landmarkId: "npc_joon",
      locationName: "Slow Matcha Kiosk",
      setDesignName: "Matcha Glaze Jelly",
      requestedCharm: "Ceremonial Whisk Charm",
      baseModelPath: "/models/high-detail/sets/set-cherry-blossom.glb",
      status: "offered",
      greeting: "Eliya, an-nyeong! A calm morning calls for deep jade matcha tint with gold rim.",
      deliveryDialogue: "Gomawo! The jade gradient is as tranquil as a freshly whisked bowl of Uji ceremonial tea. Come have a matcha on the house!",
      rewardCharm: "Matcha Ceramic Whisk",
      rewardGloss: 60,
      rewardXp: 90,
      rewardFriendship: 15,
      icon: "🍵",
    },
    sanne: {
      id: "sanne",
      clientName: "Sanne",
      role: "Market Stall Owner",
      landmarkId: "npc_sanne",
      locationName: "Atelier Market Stall",
      setDesignName: "Honey Syrup Amber",
      requestedCharm: "Fine Silk Ribbon",
      baseModelPath: "/models/high-detail/sets/cyberpunk-liquid-chrome-set.glb",
      status: "offered",
      greeting: "Eliya! Market trade is busy today. Can you craft a bright amber syrup set that catches the stall lights?",
      deliveryDialogue: "Prachtig! These warm amber tips look like glowing honey drops. Customers won't stop staring!",
      rewardCharm: "Silk Ribbon Spool",
      rewardGloss: 60,
      rewardXp: 90,
      rewardFriendship: 15,
      icon: "🧺",
    },
    truus: {
      id: "truus",
      clientName: "Oma Truus",
      role: "Tulip Grower",
      landmarkId: "npc_truus",
      locationName: "Tulip Greenhouse Conservatory",
      setDesignName: "Tulip Glaze Velvet",
      requestedCharm: "Dutch Tulip Bulb Charm",
      baseModelPath: "/models/high-detail/sets/set-cherry-blossom.glb",
      status: "offered",
      greeting: "Dag kindje! The tulip bulbs are blooming in the greenhouse. Something soft and floral for an old grower?",
      deliveryDialogue: "Oh wat lief! Exactly the gentle coral blush of my prize spring tulips. You have magical hands, Eliya.",
      rewardCharm: "Tulip Petal Press",
      rewardGloss: 70,
      rewardXp: 110,
      rewardFriendship: 15,
      icon: "🌷",
    },
    lotte: {
      id: "lotte",
      clientName: "Lotte",
      role: "Junior Apprentice",
      landmarkId: "npc_lotte",
      locationName: "Junior Atelier Meadow Corner",
      setDesignName: "Candy Jelly Confetti",
      requestedCharm: "Glitter Star Shard",
      baseModelPath: "/models/high-detail/sets/blush-glaze-coquette-set.glb",
      status: "offered",
      greeting: "Eliya!! Look look! I'm practicing my brush strokes! Can you show me how a real Master crafts rainbow jelly nails?",
      deliveryDialogue: "YAYYY! They sparkle like sugar crystals! I'm gonna practice every day to become an artisan like you!",
      rewardCharm: "Glitter Star Shard",
      rewardGloss: 45,
      rewardXp: 75,
      rewardFriendship: 15,
      icon: "🎀",
    },
    bea: {
      id: "bea",
      clientName: "Bea",
      role: "Houseboat Muse",
      landmarkId: "npc_bea",
      locationName: "Moored Wooden Salon Boat",
      setDesignName: "Moonlight Cat-Eye",
      requestedCharm: "Saturn Orbital Charm",
      baseModelPath: "/models/high-detail/sets/set-moonlight-cateye.glb",
      status: "offered",
      greeting: "Eliya, darling! The canal reflects the street lanterns so softly tonight, but my nails are waiting for your cosmic velvet touch.",
      deliveryDialogue: "Oh, the velvet cosmic shimmer! The magnetic cat-eye slash shifts with every stroke of the oar under the bridge. Thank you, Eliya!",
      rewardCharm: "Saturn Orbital Charm",
      rewardGloss: 120,
      rewardXp: 150,
      rewardFriendship: 20,
      icon: "⛵",
    },
  };

  public deliveredCount: number = 0;
  public totalClients: number = 8;
  public isCompleted: boolean = false;

  constructor() {
    this.totalClients = Object.keys(this.tickets).length;

    // Listen to live Convex state changes
    gameConvex.subscribe((state) => {
      this.syncWithConvex(state);
    });
  }

  public syncWithConvex(state: PlayerStatePayload) {
    if (!state?.quests) return;

    for (const q of state.quests) {
      const ticket = this.tickets[q.npcKey];
      if (ticket) {
        ticket.questId = q._id;
        ticket.templateKey = q.templateKey;
        ticket.deadlineGameMinutes = q.deadlineGameMinutes;

        if (q.status === "offered") {
          ticket.status = "offered";
        } else if (q.status === "active") {
          ticket.status = "unprepared";
        } else if (q.status === "crafted") {
          ticket.status = "packed";
        } else if (q.status === "delivered") {
          ticket.status = "delivered";
        }
      }
    }

    this.deliveredCount = Object.values(this.tickets).filter(
      (t) => t.status === "delivered"
    ).length;
    this.isCompleted = this.deliveredCount >= this.totalClients;
    this.updateHUD();
  }

  public getTicket(id: string): ClientTicket | null {
    return this.tickets[id] || null;
  }

  public getTicketByLandmark(landmarkId: string): ClientTicket | null {
    // Check direct landmark id or npc key
    const npcKey = landmarkId.replace("npc_", "");
    if (this.tickets[npcKey]) return this.tickets[npcKey];

    // Fallback search
    for (const t of Object.values(this.tickets)) {
      if (t.landmarkId === landmarkId || landmarkId.includes(t.id)) return t;
    }
    return null;
  }

  // Accept an offered quest from an NPC
  public async acceptCommission(ticketId: string): Promise<boolean> {
    const t = this.tickets[ticketId];
    if (!t) return false;

    if (t.questId) {
      try {
        await gameConvex.acceptQuest(t.questId);
      } catch (err) {
        console.warn("[Quest] Error accepting quest in Convex:", err);
      }
    }

    t.status = "unprepared";
    sound.playTeaPour();
    sound.playBicycleBell();
    this.updateHUD();
    return true;
  }

  // Pack crafted set for a specific client
  public async craftAndPackTicket(ticketId: string): Promise<boolean> {
    const t = this.tickets[ticketId];
    if (!t) return false;

    if (t.questId) {
      try {
        const start = await gameConvex.startStudioDesign(t.questId);
        if (start.designId) {
          await gameConvex.finishStudioDesign(t.questId, start.designId, {
            base: 96,
            art: 98,
            finish: 95,
          });
        }
      } catch (err) {
        console.warn("[Quest] studio design sync err:", err);
      }
    }

    t.status = "packed";
    sound.playUVLampCure();
    setTimeout(() => sound.playBicycleBell(), 600);
    this.updateHUD();
    return true;
  }

  // Deliver packed set to client
  public async deliverToClient(ticketId: string): Promise<{
    success: boolean;
    dialogue: string;
    reward: string;
    glossEarned: number;
    xpEarned: number;
    levelUps?: number[];
    newUnlocks?: string[];
  }> {
    const t = this.tickets[ticketId];
    if (!t) {
      return { success: false, dialogue: "No order found.", reward: "", glossEarned: 0, xpEarned: 0 };
    }

    if (t.status === "offered") {
      return { success: false, dialogue: t.greeting, reward: "", glossEarned: 0, xpEarned: 0 };
    }

    if (t.status === "unprepared") {
      return {
        success: false,
        dialogue: `I'm eagerly waiting for my bespoke ${t.setDesignName}! Remember to cure and pack it at the Atelier Manicure Station.`,
        reward: "",
        glossEarned: 0,
        xpEarned: 0,
      };
    }

    if (t.status === "delivered") {
      return {
        success: true,
        dialogue: `Enjoying my ${t.setDesignName}! Thank you again, Eliya! ♡`,
        reward: "",
        glossEarned: 0,
        xpEarned: 0,
      };
    }

    // Success delivery via Convex backend
    let glossEarned = t.rewardGloss ?? 50;
    let xpEarned = t.rewardXp ?? 100;
    let levelUps: number[] = [];
    let newUnlocks: string[] = [];

    if (t.questId) {
      try {
        const res: any = await gameConvex.deliverQuest(t.questId);
        glossEarned = res.rewards?.gloss ?? res.glossEarned ?? glossEarned;
        xpEarned = res.rewards?.xp ?? res.xpEarned ?? xpEarned;
        levelUps = res.levelUps ?? [];
        newUnlocks = res.newUnlocks ?? [];
      } catch (err) {
        console.warn("[Quest] deliverQuest convex err:", err);
      }
    }

    t.status = "delivered";
    this.deliveredCount = Object.values(this.tickets).filter(
      (item) => item.status === "delivered"
    ).length;

    sound.playCameraShutter();
    sound.playTeaPour();

    if (this.deliveredCount >= this.totalClients) {
      this.isCompleted = true;
    }

    this.updateHUD();
    return {
      success: true,
      dialogue: t.deliveryDialogue,
      reward: t.rewardCharm,
      glossEarned,
      xpEarned,
      levelUps,
      newUnlocks,
    };
  }

  /**
   * The one thing the player should do next. Drives the always-visible
   * objective tracker and the 3D waypoint, so the player is never lost.
   * Priority: deliver a packed box > craft an accepted order > meet the next client.
   */
  public getCurrentObjective(): QuestObjective {
    const list = Object.values(this.tickets);
    if (this.isCompleted) {
      return {
        phase: "finale",
        title: "Print your celebration strip",
        detail: "Every neighbour is served! Visit the Life4Cuts photobooth in Market Square and press E.",
        targetId: "photobooth",
      };
    }
    const packed = list.find((t) => t.status === "packed");
    if (packed) {
      return {
        phase: "deliver",
        title: `Deliver to ${packed.clientName}`,
        detail: `Bring the ${packed.setDesignName} box to ${packed.locationName}, then press E.`,
        targetId: packed.landmarkId,
      };
    }
    const accepted = list.find((t) => t.status === "unprepared");
    if (accepted) {
      return {
        phase: "craft",
        title: `Craft ${accepted.clientName}'s nails`,
        detail: `Go to Eliya's Atelier Gloss and press E. ${accepted.clientName}'s ticket is selected, so press Pack and play the 3 nail steps.`,
        targetId: "atelier",
      };
    }
    const offered = list.find((t) => t.status === "offered");
    if (offered) {
      return {
        phase: "meet",
        title: `Meet ${offered.clientName} the ${offered.role}`,
        detail: `Follow the pink arrow to ${offered.locationName} and press E to take the order.`,
        targetId: offered.landmarkId,
      };
    }
    return { phase: "meet", title: "Explore the canal world", detail: "Gather flowers with E and visit the market.", targetId: null };
  }

  // Update in-game HUD elements
  public updateHUD() {
    // 1. Atelier book summary button
    const bookSummary = document.getElementById("book-summary");
    if (bookSummary) {
      bookSummary.textContent = `${this.deliveredCount} / ${this.totalClients} delivered`;
    }

    // 2. Round progress badge
    const roundProgress = document.getElementById("round-progress");
    if (roundProgress) {
      roundProgress.textContent = `${this.deliveredCount} / ${this.totalClients}`;
    }

    // 3. Tray slots in the Order Card
    const ticketIds = Object.keys(this.tickets);
    ticketIds.forEach((id, idx) => {
      const slotEl = document.querySelector(`[data-slot="${idx}"]`);
      if (slotEl) {
        const ticket = this.tickets[id];
        slotEl.classList.toggle("is-packed", ticket.status === "packed");
        slotEl.classList.toggle("is-delivered", ticket.status === "delivered");
        slotEl.setAttribute(
          "title",
          `${ticket.clientName}: ${ticket.setDesignName} (${ticket.status})`
        );
      }
    });

    // 4. Order description hint
    const orderDesc = document.getElementById("order-description");
    if (orderDesc) {
      if (this.isCompleted) {
        orderDesc.textContent =
          "Everyone across the five districts has been served! Step into the Hongdae Life4Cuts photobooth for your celebration strip.";
      } else {
        const nextPacked = Object.values(this.tickets).find((t) => t.status === "packed");
        const nextNeeded = Object.values(this.tickets).find((t) => t.status === "unprepared");
        const nextOffered = Object.values(this.tickets).find((t) => t.status === "offered");

        if (nextPacked) {
          orderDesc.textContent = `Ride your Omafiets bike to deliver ${nextPacked.setDesignName} to ${nextPacked.clientName} at ${nextPacked.locationName}!`;
        } else if (nextNeeded) {
          orderDesc.textContent = `Step up to the Manicure Desk at Atelier Gloss to craft ${nextNeeded.setDesignName} for ${nextNeeded.clientName}!`;
        } else if (nextOffered) {
          orderDesc.textContent = `Visit ${nextOffered.clientName} at ${nextOffered.locationName} to accept a new Slow Beauty commission!`;
        }
      }
    }
  }
}

export const questSystem = new AtelierQuestSystem();
