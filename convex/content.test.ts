/// <reference types="vite/client" />
import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";

const modules = (import.meta as any).glob("./**/*.*s");

describe("content & seed", () => {
  it("seeds all tables and is idempotent", async () => {
    const t = convexTest(schema, modules);
    const firstRun = await t.mutation(internal.seed.run, {});
    expect(firstRun.success).toBe(true);

    const content = await t.query(api.content.getAll, {});
    expect(content.materials.length).toBe(8);
    expect(content.charms.length).toBe(8);
    expect(content.shades.length).toBe(8);
    expect(content.artStyles.length).toBe(9);
    expect(content.looks.length).toBe(7);
    expect(content.tools.length).toBe(8);
    expect(content.decor.length).toBe(7);
    expect(content.pets.length).toBe(7);
    expect(content.npcs.length).toBe(8);
    expect(content.levels.length).toBe(12);
    expect(content.districts.length).toBe(5);

    // Running seed twice does not create duplicates
    await t.mutation(internal.seed.run, {});
    const content2 = await t.query(api.content.getAll, {});
    expect(content2.materials.length).toBe(8);
    expect(content2.charms.length).toBe(8);
    expect(content2.shades.length).toBe(8);
  });
});
