import { useEffect, useCallback, useMemo, useState } from "react";
import { makeDeck, shuffle, cardId, formatCard } from "../lib/deck";
import { evaluateBestHand, compareHands } from "../lib/poker-eval";

function topUpDealerPure(dealerArr, remainingArr) {
  const dealer = [...dealerArr];
  const remaining = [...remainingArr];
  while (dealer.length < 8 && remaining.length) {
    dealer.push(remaining.shift());
  }
  return { dealer, remaining };
}

function dealOneTurnPure(remainingArr, selectionIds) {
  const remaining = [...remainingArr];
  const toDealer = [];
  let playerCard = null;

  while (remaining.length) {
    const c = remaining.shift();
    if (!playerCard && selectionIds.has(cardId(c))) {
      playerCard = c;
      break;
    } else {
      toDealer.push(c);
    }
  }
  return { playerCard, toDealer, remaining };
}

export default function useRenjiePokerEngine() {
    const freshDeck = useMemo(() => shuffle(makeDeck()), []); // one-time seed
  const [game, setGame] = useState(() => ({
    player: [],
    dealer: [],
    remaining: freshDeck,
    selection: new Set(),  // Set<string> of card IDs
    message: "New game — pick a subset and Deal.",
    gameOver: false,
    winner: null,          // 'player' | 'dealer' | null
  }));

  // Derived bits you might want in UI
  const remainingIds = useMemo(() => new Set(game.remaining.map(cardId)), [game.remaining]);

  // Evaluate best hands
  const playerEval = useMemo(
    () => (game.player.length ? evaluateBestHand(game.player) : null),
    [game.player]
  );
  const dealerEval = useMemo(
    () => (game.dealer.length ? evaluateBestHand(game.dealer) : null),
    [game.dealer]
  );

  // ---- selection helpers ---------------------------------------------------

  const toggleSelect = useCallback((card) => {
    const id = cardId(card);
    setGame(prev => {
      // ignore if card no longer remains in the deck
      if (!prev.remaining.some(c => cardId(c) === id)) return prev;

      const nextSel = new Set(prev.selection);
      if (nextSel.has(id)) nextSel.delete(id);
      else nextSel.add(id);
      return { ...prev, selection: nextSel };
    });
  }, []);

  const selectSuit = useCallback((suitKey) => {
    setGame(prev => {
      const nextSel = new Set(prev.selection);
      for (const c of prev.remaining) {
        if (c.suitKey === suitKey) nextSel.add(cardId(c)); // idempotent add
      }
      return { ...prev, selection: nextSel };
    });
  }, []);

  const selectRank = useCallback((rank) => {
    setGame(prev => {
      const nextSel = new Set(prev.selection);
      for (const c of prev.remaining) {
        if (c.rank === rank) nextSel.add(cardId(c)); // idempotent add
      }
      return { ...prev, selection: nextSel };
    });
  }, []);

  const selectAll = useCallback(() => {
    setGame(prev => {
      const nextSel = new Set(prev.selection);
      for (const c of prev.remaining) nextSel.add(cardId(c));
      return { ...prev, selection: nextSel };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setGame(prev => ({ ...prev, selection: new Set() }));
  }, []);

  // ---- core actions --------------------------------------------------------

  const reset = useCallback(() => {
    setGame({
      player: [],
      dealer: [],
      remaining: shuffle(makeDeck()),
      selection: new Set(),
      message: "New game — pick a subset and Deal.",
      gameOver: false,
      winner: null,
    });
  }, []);

  const deal = useCallback(() => {
    setGame(prev => {
      if (prev.gameOver) return prev;
      if (prev.player.length >= 5) return prev;
      if (prev.selection.size === 0) return { ...prev, message: "Select at least one card to deal." };
      if (prev.remaining.length === 0) return { ...prev, message: "No cards remaining." };

      // Run one "turn" against the current snapshot
      const { playerCard, toDealer, remaining } =
        dealOneTurnPure(prev.remaining, prev.selection);

      console.log("to player:", playerCard ? formatCard(playerCard) : "none", "| to dealer:", toDealer.map(formatCard).join(", ") || "none");

      if (!playerCard) {
        // We ran out without hitting selection: all burns go to dealer
        return {
          ...prev,
          dealer: [...prev.dealer, ...toDealer],
          remaining,
          message: "No match found — dealer took all dealt cards. Try again.",
        };
      }

      const nextPlayer = [...prev.player, playerCard];
      const nextDealer = [...prev.dealer, ...toDealer];

      console.log(nextPlayer.length, "cards in player hand;", nextDealer.length, "in dealer hand;", remaining.length, "remaining.");

      return {
        ...prev,
        player: nextPlayer,
        dealer: nextDealer,
        remaining,
        selection: new Set(), // clear selection
        message: nextPlayer.length === 5
          ? "You have 5 cards — finishing the game..."
          : "Dealt. Choose next subset and Deal.",
      };
    });
  }, []);

  useEffect(() => {
    if (game.gameOver) return;
    if (game.player.length !== 5) return;

    setGame(prev => {
      if (prev.gameOver) return prev;

      const { dealer: dealerFinal, remaining: remainingFinal } =
        topUpDealerPure(prev.dealer, prev.remaining);

      // console.log("******************");
      // console.log(prev.player);
      // console.log("******************");
      // console.log(dealerFinal);
      // console.log("******************");

      const pH = evaluateBestHand(prev.player);
      const dH = evaluateBestHand(dealerFinal);
      const cmp = compareHands(pH, dH);
      const winner = cmp > 0 ? "player" : cmp < 0 ? "dealer" : "dealer"; // ties to dealer

      const message =
        winner === "player"
          ? `Player wins! Player: ${pH.name} vs Dealer: ${dH.name}`
          : `Dealer wins${cmp === 0 ? " (ties go to dealer)" : ""}. Player: ${pH.name} vs Dealer: ${dH.name}`;

      return {
        ...prev,
        dealer: dealerFinal,
        remaining: remainingFinal,
        gameOver: true,
        winner,
        message,
      };
    });
  }, [game.player.length, game.gameOver]);


  
  return {
    // state
    player: game.player,
    dealer: game.dealer,             
    remainingIds,
    selection: game.selection,
    message: game.message,
    gameOver: game.gameOver,
    winner: game.winner,

    // evaluations for UI
    playerEval,
    dealerEval,

    // actions
    reset,
    deal,
    toggleSelect,
    selectSuit,
    selectAll,
    clearSelection,
  };
}
