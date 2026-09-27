import { internalMutation } from "./_generated/server";
import materialsData from "./seedData/materials.json";
import resourceNodesData from "./seedData/resourceNodes.json";
import charmsData from "./seedData/charms.json";
import shadesData from "./seedData/shades.json";
import artStylesData from "./seedData/artStyles.json";
import looksData from "./seedData/looks.json";
import toolsData from "./seedData/tools.json";
import decorData from "./seedData/decor.json";
import petsData from "./seedData/pets.json";
import npcsData from "./seedData/npcs.json";
import dialogueData from "./seedData/dialogue.json";
import questTemplatesData from "./seedData/questTemplates.json";
import districtsData from "./seedData/districts.json";
import levelsData from "./seedData/levels.json";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Materials
    for (const item of materialsData) {
      const existing = await ctx.db
        .query("materials")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("materials", item);
      }
    }

    // 2. Resource Nodes
    for (const item of resourceNodesData) {
      const existing = await ctx.db
        .query("resourceNodes")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("resourceNodes", item);
      }
    }

    // 3. Charms
    for (const item of charmsData) {
      const existing = await ctx.db
        .query("charms")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("charms", item);
      }
    }

    // 4. Shades
    for (const item of shadesData) {
      const validItem = {
        ...item,
        finish: item.finish as "syrup" | "chrome" | "cateye",
      };
      const existing = await ctx.db
        .query("shades")
        .withIndex("by_key", (q) => q.eq("key", validItem.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, validItem);
      } else {
        await ctx.db.insert("shades", validItem);
      }
    }

    // 5. Art Styles
    for (const item of artStylesData) {
      const existing = await ctx.db
        .query("artStyles")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("artStyles", item);
      }
    }

    // 6. Looks
    for (const item of looksData) {
      const existing = await ctx.db
        .query("looks")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("looks", item);
      }
    }

    // 7. Tools
    for (const item of toolsData) {
      const existing = await ctx.db
        .query("tools")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("tools", item);
      }
    }

    // 8. Decor
    for (const item of decorData) {
      const existing = await ctx.db
        .query("decor")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("decor", item);
      }
    }

    // 9. Pets
    for (const item of petsData) {
      const existing = await ctx.db
        .query("pets")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("pets", item);
      }
    }

    // 10. NPCs
    for (const item of npcsData) {
      const existing = await ctx.db
        .query("npcs")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("npcs", item);
      }
    }

    // 11. Dialogue
    for (const item of dialogueData) {
      const existing = await ctx.db
        .query("dialogue")
        .withIndex("by_npc_trigger", (q) =>
          q.eq("npcKey", item.npcKey).eq("trigger", item.trigger)
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("dialogue", item);
      }
    }

    // 12. Quest Templates
    for (const item of questTemplatesData) {
      const validItem = {
        ...item,
        kind: item.kind as "story" | "daily",
      };
      const existing = await ctx.db
        .query("questTemplates")
        .withIndex("by_key", (q) => q.eq("key", validItem.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, validItem);
      } else {
        await ctx.db.insert("questTemplates", validItem);
      }
    }

    // 13. Districts
    for (const item of districtsData) {
      const existing = await ctx.db
        .query("districts")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("districts", item);
      }
    }

    // 14. Levels
    for (const item of levelsData) {
      const existing = await ctx.db
        .query("levels")
        .withIndex("by_level", (q) => q.eq("level", item.level))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("levels", item);
      }
    }

    return { success: true };
  },
});
