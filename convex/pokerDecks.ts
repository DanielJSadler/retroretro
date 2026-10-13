import { v, type Infer } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { auth } from "./auth";
import {
  PRESET_DECKS,
  validateCustomCards,
  validateDeckName,
  type PokerDeck,
} from "../src/features/planning-poker/lib/decks";

const presetId = v.union(
  v.literal("fibonacci"),
  v.literal("percentage"),
  v.literal("powersOfTwo"),
  v.literal("tshirt"),
);

export const deckSelection = v.union(
  v.object({ kind: v.literal("preset"), presetId }),
  v.object({ kind: v.literal("saved"), deckId: v.id("pokerDecks") }),
  v.object({
    kind: v.literal("custom"),
    name: v.string(),
    cards: v.array(v.string()),
  }),
);

export type DeckSelection = Infer<typeof deckSelection>;

async function ensureUniqueName(
  ctx: MutationCtx,
  userId: Id<"users">,
  name: string,
  exceptId?: Id<"pokerDecks">,
) {
  const decks = await ctx.db
    .query("pokerDecks")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  if (decks.some((deck) => deck._id !== exceptId && deck.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("You already have a deck with this name.");
  }
}

export async function resolveDeckSelection(
  ctx: MutationCtx,
  selection: DeckSelection,
): Promise<PokerDeck> {
  if (selection.kind === "preset") {
    const preset = PRESET_DECKS[selection.presetId];
    return { name: preset.name, cards: [...preset.cards] };
  }

  const userId = await auth.getUserId(ctx);
  if (selection.kind === "saved") {
    if (!userId) throw new Error("Sign in to use a saved deck.");
    const saved = await ctx.db.get(selection.deckId);
    if (!saved || saved.userId !== userId) throw new Error("Saved deck not found.");
    return { name: saved.name, cards: [...saved.cards] };
  }

  const cards = validateCustomCards(selection.cards);
  const name = selection.name.trim() || "Custom deck";
  if (userId) {
    const savedName = validateDeckName(selection.name);
    await ensureUniqueName(ctx, userId, savedName);
    const now = Date.now();
    await ctx.db.insert("pokerDecks", {
      userId,
      name: savedName,
      cards,
      createdAt: now,
      updatedAt: now,
    });
    return { name: savedName, cards };
  }
  return { name: validateDeckName(name), cards };
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    const decks = await ctx.db
      .query("pokerDecks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return decks.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const updateMine = mutation({
  args: {
    deckId: v.id("pokerDecks"),
    name: v.string(),
    cards: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Sign in to edit a saved deck.");
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) throw new Error("Saved deck not found.");
    const name = validateDeckName(args.name);
    const cards = validateCustomCards(args.cards);
    await ensureUniqueName(ctx, userId, name, args.deckId);
    await ctx.db.patch(args.deckId, { name, cards, updatedAt: Date.now() });
  },
});

export const deleteMine = mutation({
  args: { deckId: v.id("pokerDecks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Sign in to delete a saved deck.");
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) throw new Error("Saved deck not found.");
    await ctx.db.delete(args.deckId);
  },
});
