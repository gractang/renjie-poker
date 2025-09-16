import { useCallback, useMemo, useState } from "react";
import { makeDeck, shuffle, cardId, formatCard } from "../lib/deck";
import { evaluateBestHand, compareHands } from "../lib/poker-eval";

export default function useRenjiePokerEngine() {
  const [remaining, setRemaining] = useState(() => shuffle(makeDeck()));
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [selection, setSelection] = useState(new Set());
  const [message, setMessage] = useState("Choose a subset and click Deal.");
  const [revealDealer, setRevealDealer] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const remainingIds = useMemo(() => new Set(remaining.map(cardId)), [remaining]);

  const reset = useCallback(() => {
    setRemaining(shuffle(makeDeck()));
    setPlayer([]); setDealer([]); setSelection(new Set());
    setMessage("Choose a subset and click Deal.");
    setRevealDealer(false); setGameOver(false);
  }, []);

  const toggleSelect = useCallback((card) => {
    if (!remainingIds.has(cardId(card))) return;
    const next = new Set(selection);
    const id = cardId(card);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelection(next);
  }, [selection, remainingIds]);

  const deal = useCallback(() => {
    if (gameOver || player.length >= 5) return;

    const anyInDeck = [...selection].some(id => remainingIds.has(id));
    if (!anyInDeck) { setMessage("Your subset has no cards left."); return; }

    const newDealer = [...dealer], newPlayer = [...player], newRemaining = [];
    let delivered = null;

    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      if (selection.has(cardId(c))) {
        delivered = c;
        newPlayer.push(c);
        for (let j = i + 1; j < remaining.length; j++) newRemaining.push(remaining[j]);
        break;
      } else {
        newDealer.push(c);
      }
    }

    if (!delivered) { setMessage("No selected card found. Try another selection."); return; }

    setDealer(newDealer); setPlayer(newPlayer); setRemaining(newRemaining); setSelection(new Set());

    if (newPlayer.length === 5) {
      let d = [...newDealer], rem = [...newRemaining];
      while (d.length < 8 && rem.length) d.push(rem.shift()); // dealer ≥ 8
      setDealer(d); setRemaining(rem);
      setMessage("Player has 5 cards. Click 'Score'.");
    } else {
      setMessage(`You received ${formatCard(delivered)}. Pick a new subset.`);
    }
  }, [dealer, player, remaining, selection, remainingIds, gameOver]);

  const revealAndScore = useCallback(() => {
    if (player.length !== 5) { setMessage("You need 5 cards first."); return; }
    if (dealer.length < 5)   { setMessage("Dealer needs at least 5 cards."); return; }

    setRevealDealer(true);
    const pH = evaluateBestHand(player);
    const dH = evaluateBestHand(dealer);
    const cmp = compareHands(pH, dH);
    setGameOver(true);
    if (cmp > 0) setMessage(`Player wins! Player: ${pH.name} vs Dealer: ${dH.name}`);
    else if (cmp < 0) setMessage(`Dealer wins! Player: ${pH.name} vs Dealer: ${dH.name}`);
    else setMessage(`Tie — Dealer wins ties. Player: ${pH.name} vs Dealer: ${dH.name}`);
  }, [player, dealer]);

  const playerEval = useMemo(() => player.length === 5 ? evaluateBestHand(player) : null, [player]);
  const dealerEval = useMemo(() => (revealDealer || gameOver) && dealer.length >= 5 ? evaluateBestHand(dealer) : null, [dealer, revealDealer, gameOver]);

  return {
    remaining, player, dealer, selection, message, revealDealer, gameOver, remainingIds,
    playerEval, dealerEval,
    reset, toggleSelect, deal, revealAndScore,
  };
}
