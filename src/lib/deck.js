export const SUITS = ["♠", "♥", "♣", "♦"];
export const SUIT_KEYS = ["S", "H", "C", "D"];
export const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];

export function makeDeck() {
  const deck = [];
  for (let s = 0; s < SUITS.length; s++) {
    for (let r = 0; r < RANKS.length; r++) {
      deck.push({ rank: RANKS[r], suit: SUITS[s], suitKey: SUIT_KEYS[s], rVal: r + 2 });
    }
  }
  return deck;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const cardId = (c) => {
  if (!c) return "unknown";
  return `${c.rank}${c.suitKey}`;
};

// Literal class names so Tailwind can find them. Colors come from --suit-* vars, which four-color mode overrides.
const SUIT_TEXT_CLASSES = {
  S: "text-[var(--suit-S)]",
  H: "text-[var(--suit-H)]",
  C: "text-[var(--suit-C)]",
  D: "text-[var(--suit-D)]",
};
export const suitTextClass = (suitKey) => SUIT_TEXT_CLASSES[suitKey];

export const formatCard = (c) => `${c.rank}${c.suit}`;

export function cardFromId(id) {
  const rank = id[0];
  const suitKey = id[1];
  const rankIndex = RANKS.indexOf(rank);
  const suitIndex = SUIT_KEYS.indexOf(suitKey);
  if (rankIndex === -1 || suitIndex === -1) return null;
  return { rank, suit: SUITS[suitIndex], suitKey, rVal: rankIndex + 2 };
}
