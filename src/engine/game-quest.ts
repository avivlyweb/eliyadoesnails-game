import { sound } from "./audio";

export interface ClientTicket {
  id: string;
  clientName: string;
  role: string;
  landmarkId: string;
  locationName: string;
  setDesignName: string;
  requestedCharm: string;
  baseModelPath: string;
  status: "unprepared" | "packed" | "delivered";
  greeting: string;
  deliveryDialogue: string;
  rewardCharm: string;
  icon: string;
}

export class AtelierQuestSystem {
  public roundTitle: string = "The Slow Beauty Round";
  public roundSubtitle: string = "A bespoke set crafted with care for every neighbor.";
  
  public tickets: Record<string, ClientTicket> = {
    mira: {
      id: "mira",
      clientName: "Mira",
      role: "The Florist",
      landmarkId: "florist",
      locationName: "Flower Cart by Bridge",
      setDesignName: "Cherry Blossom Sakura French",
      requestedCharm: "Sculpted Ribbon Bow",
      baseModelPath: "/models/high-detail/sets/set-cherry-blossom.glb",
      status: "unprepared",
      greeting: "Eliya! The morning market is opening, but my hands feel so bare without your floral jelly press-ons!",
      deliveryDialogue: "For me? The Cherry Blossom set! Look at the delicate sheer blush and 3D micro-petals—they match my fresh morning peonies so beautifully! Here, take this baroque pearl for your atelier charm palette.",
      rewardCharm: "Baroque Nacre Pearl",
      icon: "🌸"
    },
    nell: {
      id: "nell",
      clientName: "Nell",
      role: "The Potter",
      landmarkId: "potter_house",
      locationName: "Bell Gable Ceramic House",
      setDesignName: "Cyberpunk Liquid Chrome",
      requestedCharm: "Molten Chrome Drops",
      baseModelPath: "/models/high-detail/sets/cyberpunk-liquid-chrome-set.glb",
      status: "unprepared",
      greeting: "Eliya! Normal polish chips in five seconds at the pottery wheel. I need your molten liquid chrome armor!",
      deliveryDialogue: "Liquid Chrome stiletto! Unchipable, mirror-reflective, and pure cyber luxury! The pottery wheel won't stand a chance. I threw this scalloped ceramic palette for you!",
      rewardCharm: "Molten Chrome Drops",
      icon: "🏺"
    },
    bea: {
      id: "bea",
      clientName: "Bea",
      role: "The Houseboat Muse",
      landmarkId: "salon_boat",
      locationName: "Moored Wooden Salon Boat",
      setDesignName: "Moonlight Cat-Eye",
      requestedCharm: "Saturn Orbital Charm",
      baseModelPath: "/models/high-detail/sets/set-moonlight-cateye.glb",
      status: "unprepared",
      greeting: "Eliya, darling! The canal reflects the street lanterns so softly tonight, but my nails are waiting for your cosmic velvet touch.",
      deliveryDialogue: "Oh, the velvet cosmic shimmer! The magnetic cat-eye slash shifts with every stroke of the oar under the bridge. Thank you, Eliya!",
      rewardCharm: "Saturn Orbital Charm",
      icon: "⛵"
    },
    pip: {
      id: "pip",
      clientName: "Pip",
      role: "The Photo Collector",
      landmarkId: "photobooth",
      locationName: "Hongdae Photo Booth",
      setDesignName: "Blush Glaze Coquette",
      requestedCharm: "Barbed Wire Cyber Heart",
      baseModelPath: "/models/high-detail/sets/blush-glaze-coquette-set.glb",
      status: "unprepared",
      greeting: "Eliya! The Life4Cuts arcade booth is primed, but we need your iconic Coquette Blush set for today's lookbook strip!",
      deliveryDialogue: "Perfection! Look at that glassy syrup glow under the photo flashes! Step inside the booth right now, let's print your official atelier celebration strip!",
      rewardCharm: "Barbed Wire Cyber Heart",
      icon: "📸"
    }
  };

  public deliveredCount: number = 0;
  public totalClients: number = 4;
  public isCompleted: boolean = false;

  constructor() {
    this.totalClients = Object.keys(this.tickets).length;
  }

  public getTicket(id: string): ClientTicket | null {
    return this.tickets[id] || null;
  }

  public getTicketByLandmark(landmarkId: string): ClientTicket | null {
    for (const t of Object.values(this.tickets)) {
      if (t.landmarkId === landmarkId) return t;
    }
    return null;
  }

  // Pack crafted set for a specific client
  public craftAndPackTicket(ticketId: string): boolean {
    const t = this.tickets[ticketId];
    if (!t) return false;
    t.status = "packed";
    sound.playUVLampCure();
    setTimeout(() => sound.playBicycleBell(), 600);
    this.updateHUD();
    return true;
  }

  // Deliver packed set to client
  public deliverToClient(ticketId: string): { success: boolean; dialogue: string; reward: string } {
    const t = this.tickets[ticketId];
    if (!t) {
      return { success: false, dialogue: "No order found.", reward: "" };
    }

    if (t.status === "unprepared") {
      return { success: false, dialogue: t.greeting, reward: "" };
    }

    if (t.status === "delivered") {
      return { success: true, dialogue: `Enjoying my ${t.setDesignName}! Thank you again, Eliya! ♡`, reward: "" };
    }

    // Success delivery
    t.status = "delivered";
    this.deliveredCount++;
    sound.playCameraShutter();
    sound.playTeaPour();

    if (this.deliveredCount >= this.totalClients) {
      this.isCompleted = true;
    }

    this.updateHUD();
    return { success: true, dialogue: t.deliveryDialogue, reward: t.rewardCharm };
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
        slotEl.setAttribute("title", `${ticket.clientName}: ${ticket.setDesignName} (${ticket.status})`);
      }
    });

    // 4. Order description hint
    const orderDesc = document.getElementById("order-description");
    if (orderDesc) {
      if (this.isCompleted) {
        orderDesc.textContent = "Everyone along the canal has been served! Step into the Hongdae Life4Cuts photobooth for your keepsake strip.";
      } else {
        const nextNeeded = Object.values(this.tickets).find(t => t.status === "unprepared");
        const nextPacked = Object.values(this.tickets).find(t => t.status === "packed");

        if (nextPacked) {
          orderDesc.textContent = `Ride your Omafiets bike to deliver ${nextPacked.setDesignName} to ${nextPacked.clientName} at ${nextPacked.locationName}!`;
        } else if (nextNeeded) {
          orderDesc.textContent = `Step up to the Manicure Desk at Atelier Gloss to craft ${nextNeeded.setDesignName} for ${nextNeeded.clientName}!`;
        }
      }
    }
  }
}

export const questSystem = new AtelierQuestSystem();
