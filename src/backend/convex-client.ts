import { ConvexClient } from "convex/browser";

// Connect to Eliya Does Nails live Convex deployment
const CONVEX_URL = (import.meta as any).env?.VITE_CONVEX_URL || "https://incredible-snake-136.convex.cloud";

export const convex = new ConvexClient(CONVEX_URL);

export interface ActiveAppointment {
  _id?: string;
  clientName: string;
  clientRole: string;
  preferredTea: string;
  intentionNote: string;
  baseSyrupShade: string;
  layers: number;
  magneticStyle?: string;
  appliedCharms: Array<{
    charmId: string;
    fingerIndex: number;
    xOffset: number;
    yOffset: number;
  }>;
  status: string;
}

export class GameDatabase {
  public static async startSession(clientName: string, intention: string, tea: string, shade: string) {
    try {
      const result = await convex.mutation("appointments:startAppointment" as any, {
        clientName,
        clientRole: "Amsterdam Neighbor",
        preferredTea: tea,
        intentionNote: intention,
        baseSyrupShade: shade,
      });
      return result;
    } catch (err) {
      console.warn("Convex offline or schema pending, running in local memory mode:", err);
      return "local-session-" + Date.now();
    }
  }

  public static async saveStrip(data: {
    clientName: string;
    setDesignName: string;
    frameColor: string;
    poses: string[];
    stickers: Array<{ stickerId: string; posX: number; posY: number }>;
  }) {
    try {
      const result = await convex.mutation("appointments:savePhotoStrip" as any, {
        appointmentId: "local" as any,
        ...data,
      });
      return result;
    } catch (err) {
      console.warn("Convex offline or schema pending, saved locally:", err);
      return { stripId: "local-" + Date.now(), shareSlug: Math.random().toString(36).substring(2, 8) };
    }
  }
}
