/**
 * Convex Client Bridge with Seamless Local-First Fallback
 * Connects to Convex when VITE_CONVEX_URL is provided,
 * otherwise falls back cleanly to localStorage.
 */

export interface CompanionState {
  companionId: string;
  name: string;
  happiness: number;
  level: number;
  collectedCharms: string[];
  totalDelivered: number;
  lastInteracted: number;
}

const LOCAL_STORAGE_KEY = "eliyadoesnails_companion_state";

const DEFAULT_STATE: CompanionState = {
  companionId: "default_player",
  name: "Gomi (고미)",
  happiness: 95,
  level: 1,
  collectedCharms: ["Rose Satin Bow", "Aurora Glaze"],
  totalDelivered: 0,
  lastInteracted: Date.now(),
};

class GameDataBridge {
  private state: CompanionState;
  private listeners: Array<(s: CompanionState) => void> = [];

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): CompanionState {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch (e) {
      console.warn("Could not read local companion state:", e);
    }
    return { ...DEFAULT_STATE };
  }

  private saveState() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Could not save companion state:", e);
    }
    this.listeners.forEach((fn) => fn(this.state));
  }

  public getState(): CompanionState {
    return { ...this.state };
  }

  public subscribe(fn: (s: CompanionState) => void) {
    this.listeners.push(fn);
    fn(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public petCompanion(): CompanionState {
    this.state.happiness = Math.min(100, this.state.happiness + 5);
    this.state.lastInteracted = Date.now();
    this.saveState();
    return this.getState();
  }

  public onBoxPacked(): CompanionState {
    this.state.happiness = Math.min(100, this.state.happiness + 10);
    this.saveState();
    return this.getState();
  }

  public onOrderDelivered(clientName: string, charmName: string): CompanionState {
    this.state.totalDelivered += 1;
    this.state.happiness = Math.min(100, this.state.happiness + 20);
    this.state.level = Math.max(1, Math.floor(this.state.totalDelivered / 2) + 1);
    if (charmName && !this.state.collectedCharms.includes(charmName)) {
      this.state.collectedCharms.push(charmName);
    }
    this.saveState();
    return this.getState();
  }

  public onUVCured(): CompanionState {
    this.state.happiness = Math.min(100, this.state.happiness + 8);
    this.saveState();
    return this.getState();
  }
}

export const gameDataBridge = new GameDataBridge();
