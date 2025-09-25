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

export const formatCard = (c) => `${c.rank}${c.suit}`;
