import { QueryCtx, MutationCtx } from "../_generated/server";

export async function getPlayer(ctx: QueryCtx | MutationCtx, guestToken: string) {
  const p = await ctx.db
    .query("players")
    .withIndex("by_token", (q) => q.eq("guestToken", guestToken))
    .unique();
  if (!p) throw new Error("NO_PLAYER");
  return p;
}
