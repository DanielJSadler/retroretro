export interface PokerDeck {
  name: string;
  cards: string[];
}

export const PRESET_DECKS = {
  fibonacci: {
    name: "Fibonacci",
    cards: ["0", "1", "2", "3", "5", "8", "13", "?"],
  },
  percentage: {
    name: "Percentage",
    cards: [...Array.from({ length: 21 }, (_, index) => `${index * 5}%`), "?"],
  },
  powersOfTwo: {
    name: "Powers of two",
    cards: ["0", "1", "2", "4", "8", "16", "32", "?"],
  },
  tshirt: {
    name: "T-shirt sizes",
    cards: ["XS", "S", "M", "L", "XL", "XXL", "?"],
  },
} satisfies Record<string, PokerDeck>;

export type PresetDeckId = keyof typeof PRESET_DECKS;

export const LEGACY_DECK: PokerDeck = {
  name: "Fibonacci",
  cards: ["1", "2", "3", "5", "8", "13", "21", "?"],
};

export function getRoomDeck(session: { deck?: PokerDeck } | null | undefined): PokerDeck {
  return session?.deck ?? LEGACY_DECK;
}

export function validateCustomCards(input: string[]): string[] {
  if (input.length < 2 || input.length > 30) {
    throw new Error("A deck needs between 2 and 30 cards.");
  }
  const cards = input.map((card) => card.trim());
  if (cards.some((card) => !card || card.length > 12)) {
    throw new Error("Each card needs a label of 1–12 characters.");
  }
  const unique = new Set(cards.map((card) => card.toLocaleLowerCase()));
  if (unique.size !== cards.length) {
    throw new Error("Card labels must be unique.");
  }
  return [...cards.filter((card) => card !== "?"), ...cards.filter((card) => card === "?")];
}

export function validateDeckName(input: string): string {
  const name = input.trim();
  if (!name || name.length > 50) {
    throw new Error("Deck name must be 1–50 characters.");
  }
  return name;
}

export function voteLabel(value: string | number | null): string {
  return value === null ? "?" : String(value);
}

export type NumericScale = "number" | "percentage" | null;

export function getNumericScale(deck: PokerDeck): NumericScale {
  const scoringCards = deck.cards.filter((card) => card !== "?");
  if (scoringCards.length === 0) return null;
  if (scoringCards.every((card) => /^-?\d+(?:\.\d+)?$/.test(card))) return "number";
  if (scoringCards.every((card) => /^-?\d+(?:\.\d+)?%$/.test(card))) return "percentage";
  return null;
}

export function numericVote(label: string, scale: NumericScale): number | null {
  if (!scale || label === "?") return null;
  return Number(scale === "percentage" ? label.slice(0, -1) : label);
}
