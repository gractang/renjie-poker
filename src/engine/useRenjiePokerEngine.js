import { useEffect, useCallback, useMemo, useState } from "react";
import { makeDeck, shuffle, cardId } from "../lib/deck";
import { evaluateBestHand, compareHands } from "../lib/poker-eval";

const NEW_GAME_MESSAGE = "new game — pick a subset and select deal.";
const SELECT_AT_LEAST_ONE_MESSAGE = "select at least one card to deal.";
const NO_CARDS_REMAINING_MESSAGE = "no cards remaining.";
const NO_MATCH_MESSAGE = "no match found — dealer took all dealt cards. try again.";
const FINISHING_GAME_MESSAGE = "you have 5 cards — finishing the game...";
const DEALT_MESSAGE = "dealt. choose next subset and deal.";

const RESULT_TYPE_NO_MATCH = "no-match";
const RESULT_TYPE_MATCH = "match";

function buildWinnerMessage(cmp, playerHandName, dealerHandName) {
  if (cmp > 0) {
    return `player wins! player: ${playerHandName} vs dealer: ${dealerHandName}`;
  }

  return `dealer wins${cmp === 0 ? " (ties go to dealer)" : ""}. player: ${playerHandName} vs dealer: ${dealerHandName}`;
}

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
    message: NEW_GAME_MESSAGE,
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
      message: NEW_GAME_MESSAGE,
      gameOver: false,
      winner: null,
    });
  }, []);

  const deal = useCallback(() => {
    setGame(prev => {
      if (prev.gameOver) return prev;
      if (prev.player.length >= 5) return prev;
      if (prev.selection.size === 0) return { ...prev, message: SELECT_AT_LEAST_ONE_MESSAGE };
      if (prev.remaining.length === 0) return { ...prev, message: NO_CARDS_REMAINING_MESSAGE };

      // Run one "turn" against the current snapshot
      const { playerCard, toDealer, remaining } =
        dealOneTurnPure(prev.remaining, prev.selection);

      if (!playerCard) {
        // We ran out without hitting selection: all burns go to dealer
        return {
          ...prev,
          dealer: [...prev.dealer, ...toDealer],
          remaining,
          message: NO_MATCH_MESSAGE,
        };
      }

      const nextPlayer = [...prev.player, playerCard];
      const nextDealer = [...prev.dealer, ...toDealer];

      return {
        ...prev,
        player: nextPlayer,
        dealer: nextDealer,
        remaining,
        selection: new Set(), // clear selection
        message: nextPlayer.length === 5
          ? FINISHING_GAME_MESSAGE
          : DEALT_MESSAGE,
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
      const message = buildWinnerMessage(cmp, pH.name, dH.name);

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


  // Peek at what a deal would produce without changing state
  const computeFullDeal = useCallback(() => {
    if (game.gameOver || game.player.length >= 5 || game.selection.size === 0 || game.remaining.length === 0) {
      return null;
    }

    const { playerCard, toDealer, remaining } = dealOneTurnPure(game.remaining, game.selection);

    if (!playerCard) {
      return {
        type: RESULT_TYPE_NO_MATCH,
        dealerCards: toDealer,
        playerCard: null,
        remaining,
        topUpCards: [],
      };
    }

    const nextPlayerCount = game.player.length + 1;
    let topUpCards = [];
    let finalRemaining = remaining;

    if (nextPlayerCount === 5) {
      const dealerAfterDeal = [...game.dealer, ...toDealer];
      const needed = Math.max(0, 8 - dealerAfterDeal.length);
      topUpCards = remaining.slice(0, needed);
      finalRemaining = remaining.slice(needed);
    }

    return {
      type: RESULT_TYPE_MATCH,
      playerCard,
      dealerCards: toDealer,
      remaining: finalRemaining,
      topUpCards,
      isGameOver: nextPlayerCount === 5,
    };
  }, [game]);

  // Apply a pre-computed deal result to state
  const commitDeal = useCallback((result) => {
    setGame(prev => {
      if (prev.gameOver) return prev;

      if (result.type === RESULT_TYPE_NO_MATCH) {
        return {
          ...prev,
          dealer: [...prev.dealer, ...result.dealerCards],
          remaining: result.remaining,
          message: NO_MATCH_MESSAGE,
        };
      }

      const nextPlayer = [...prev.player, result.playerCard];
      const nextDealer = [...prev.dealer, ...result.dealerCards, ...result.topUpCards];

      if (result.isGameOver) {
        const pH = evaluateBestHand(nextPlayer);
        const dH = evaluateBestHand(nextDealer);
        const cmp = compareHands(pH, dH);
        const winner = cmp > 0 ? "player" : "dealer";
        const message = buildWinnerMessage(cmp, pH.name, dH.name);

        return {
          ...prev,
          player: nextPlayer,
          dealer: nextDealer,
          remaining: result.remaining,
          selection: new Set(),
          gameOver: true,
          winner,
          message,
        };
      }

      return {
        ...prev,
        player: nextPlayer,
        dealer: nextDealer,
        remaining: result.remaining,
        selection: new Set(),
        message: DEALT_MESSAGE,
      };
    });
  }, []);

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
    computeFullDeal,
    commitDeal,
    toggleSelect,
    selectSuit,
    selectRank,
    selectAll,
    clearSelection,
  };
}
