import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Atelier Companion Mascot State
  companionState: defineTable({
    companionId: v.string(),
    name: v.string(),
    happiness: v.number(),
    level: v.number(),
    collectedCharms: v.array(v.string()),
    totalDelivered: v.number(),
    lastInteracted: v.number(),
  }).index("by_companion_id", ["companionId"]),

  // Shared Atelier Client Deliveries & Keepsakes
  clientDeliveries: defineTable({
    clientId: v.string(),
    clientName: v.string(),
    setDesignName: v.string(),
    requestedCharm: v.string(),
    deliveredAt: v.number(),
  }).index("by_delivered_at", ["deliveredAt"]),
});
