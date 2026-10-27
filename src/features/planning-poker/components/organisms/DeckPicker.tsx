import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import {
  PRESET_DECKS,
  validateCustomCards,
  validateDeckName,
  type PresetDeckId,
} from "../../lib/decks";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";

export type DeckChoice =
  | { kind: "preset"; presetId: PresetDeckId }
  | { kind: "saved"; deckId: Id<"pokerDecks"> }
  | { kind: "custom"; name: string; cards: string[] };

const startingCards = ["1", "2", "3", "?"];

function DeckEditor({
  name,
  cards,
  onNameChange,
  onCardsChange,
  nameRequired,
}: {
  name: string;
  cards: string[];
  onNameChange: (name: string) => void;
  onCardsChange: (cards: string[]) => void;
  nameRequired: boolean;
}) {
  const regularCards = cards.filter((card) => card !== "?");
  const includeQuestion = cards.includes("?");
  const updateCards = (next: string[], include = includeQuestion) =>
    onCardsChange([...next, ...(include ? ["?"] : [])]);

  return (
    <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <Input
        label={nameRequired ? "Deck name" : "Deck name (optional)"}
        placeholder="e.g. Team estimates"
        maxLength={50}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
      />
      <div>
        <p className="mb-2 text-sm font-medium text-slate-300">Cards, in display order</p>
        <div className="max-h-72 space-y-3 overflow-y-auto p-1">
          {regularCards.map((card, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                aria-label={`Card ${index + 1}`}
                value={card}
                maxLength={12}
                onChange={(event) => {
                  const next = [...regularCards];
                  next[index] = event.target.value;
                  updateCards(next);
                }}
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              />
              <button type="button" aria-label={`Move card ${index + 1} up`} disabled={index === 0}
                onClick={() => {
                  const next = [...regularCards];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  updateCards(next);
                }}
                className="rounded px-2 py-2 text-slate-300 hover:bg-slate-700 disabled:opacity-40">↑</button>
              <button type="button" aria-label={`Move card ${index + 1} down`} disabled={index === regularCards.length - 1}
                onClick={() => {
                  const next = [...regularCards];
                  [next[index], next[index + 1]] = [next[index + 1], next[index]];
                  updateCards(next);
                }}
                className="rounded px-2 py-2 text-slate-300 hover:bg-slate-700 disabled:opacity-40">↓</button>
              <button type="button" aria-label={`Remove card ${index + 1}`}
                onClick={() => updateCards(regularCards.filter((_, cardIndex) => cardIndex !== index))}
                className="rounded px-2 py-2 text-red-300 hover:bg-red-950/50">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => updateCards([...regularCards, ""])}
          disabled={cards.length >= 30}
          className="mt-2 text-sm font-medium text-indigo-300 hover:text-indigo-200 disabled:opacity-40">
          + Add card
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={includeQuestion}
          onChange={(event) => updateCards(regularCards, event.target.checked)}
          className="accent-indigo-500" />
        Include ? card
      </label>
      <p className="text-xs text-slate-400">Use 2–30 unique cards. Labels can be up to 12 characters.</p>
    </div>
  );
}

export function DeckPicker({
  value,
  onChange,
  isSignedIn,
}: {
  value: DeckChoice;
  onChange: (value: DeckChoice) => void;
  isSignedIn: boolean;
}) {
  const savedDecks = useQuery(api.pokerDecks.listMine) ?? [];
  const updateDeck = useMutation(api.pokerDecks.updateMine);
  const deleteDeck = useMutation(api.pokerDecks.deleteMine);
  const [editingId, setEditingId] = useState<Id<"pokerDecks"> | null>(null);
  const [editName, setEditName] = useState("");
  const [editCards, setEditCards] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedKey = value.kind === "preset"
    ? `preset:${value.presetId}`
    : value.kind === "saved" ? `saved:${value.deckId}` : "custom";
  const selectedSaved = value.kind === "saved"
    ? savedDecks.find((deck) => deck._id === value.deckId)
    : null;

  const startEditing = (deck: (typeof savedDecks)[number]) => {
    setEditingId(deck._id);
    setEditName(deck.name);
    setEditCards([...deck.cards]);
    setError("");
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      const name = validateDeckName(editName);
      const cards = validateCustomCards(editCards);
      setBusy(true);
      await updateDeck({ deckId: editingId, name, cards });
      setEditingId(null);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this deck.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (deckId: Id<"pokerDecks">) => {
    if (!window.confirm("Delete this saved deck? Rooms already using it will keep their cards.")) return;
    try {
      setBusy(true);
      await deleteDeck({ deckId });
      if (value.kind === "saved" && value.deckId === deckId) {
        onChange({ kind: "preset", presetId: "fibonacci" });
      }
      if (editingId === deckId) setEditingId(null);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this deck.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-w-0 space-y-3 p-1">
      <label className="block text-sm font-medium text-slate-300" htmlFor="poker-deck-choice">Card deck</label>
      <select
        id="poker-deck-choice"
        value={selectedKey}
        onChange={(event) => {
          const key = event.target.value;
          setError("");
          if (key === "custom") {
            onChange({ kind: "custom", name: "", cards: [...startingCards] });
          } else if (key.startsWith("saved:")) {
            onChange({ kind: "saved", deckId: key.slice(6) as Id<"pokerDecks"> });
          } else {
            onChange({ kind: "preset", presetId: key.slice(7) as PresetDeckId });
          }
        }}
        className="min-w-0 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 pr-8 text-slate-100"
      >
        {Object.entries(PRESET_DECKS).map(([id, deck]) => (
          <option key={id} value={`preset:${id}`}>{deck.name}</option>
        ))}
        {savedDecks.map((deck) => (
          <option key={deck._id} value={`saved:${deck._id}`}>{deck.name} (saved)</option>
        ))}
        <option value="custom">Create a custom deck</option>
      </select>
      {value.kind === "preset" && (
        <p className="break-words text-sm text-slate-400">{PRESET_DECKS[value.presetId].cards.join(" · ")}</p>
      )}
      {selectedSaved && (
        <p className="break-words text-sm text-slate-400">{selectedSaved.cards.join(" · ")}</p>
      )}
      {value.kind === "custom" && (
        <DeckEditor
          name={value.name}
          cards={value.cards}
          onNameChange={(name) => onChange({ ...value, name })}
          onCardsChange={(cards) => onChange({ ...value, cards })}
          nameRequired={isSignedIn}
        />
      )}
      {isSignedIn && savedDecks.length > 0 && (
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your saved decks</p>
          {savedDecks.map((deck) => (
            <div key={deck._id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-slate-200">{deck.name}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEditing(deck)}
                  className="text-indigo-300 hover:text-indigo-200">Edit</button>
                <button type="button" onClick={() => void handleDelete(deck._id)}
                  disabled={busy} className="text-red-300 hover:text-red-200 disabled:opacity-40">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editingId && (
        <div className="space-y-3">
          <DeckEditor name={editName} cards={editCards} onNameChange={setEditName}
            onCardsChange={setEditCards} nameRequired />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => void handleSave()} disabled={busy}>Save deck</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
