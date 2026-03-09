import { useCallback, useMemo, useState } from "react";
import { makeDeck, shuffle, cardId } from "../lib/deck";
import { evaluateBestHand } from "../lib/poker-eval";
import {
  buildCompletedGameSummary,
  computeDealResult,
  createGameState,
  resolveDealResult,
  TURN_STATUS_DEALT,
  TURN_STATUS_FINISHED,
  TURN_STATUS_NO_MATCH,
} from "../lib/renjie-game";

const NEW_GAME_MESSAGE = "New game — pick a subset and Deal.";
const SELECT_AT_LEAST_ONE_MESSAGE = "Select at least one card to deal.";
const NO_CARDS_REMAINING_MESSAGE = "No cards remaining.";
const NO_MATCH_MESSAGE = "No match found — dealer took all dealt cards. Try again.";
const DEALT_MESSAGE = "Dealt. Choose next subset and Deal.";
const FINISHING_GAME_MESSAGE = "You have 5 cards — finishing the game...";

function createFreshGame() {
  return {
    ...createGameState(shuffle(makeDeck())),
    message: NEW_GAME_MESSAGE,
  };
}

function buildWinnerMessage(showdown) {
  return showdown.winner === "player"
    ? `Player wins! Player: ${showdown.playerEval.name} vs Dealer: ${showdown.dealerEval.name}`
    : `Dealer wins${showdown.dealerWonTie ? " (ties go to dealer)" : ""}. Player: ${showdown.playerEval.name} vs Dealer: ${showdown.dealerEval.name}`;
}

function buildNextGameState(prevGame, result) {
  const resolution = resolveDealResult(prevGame, result);

  if (resolution.status === TURN_STATUS_NO_MATCH) {
    return {
      ...resolution.nextGame,
      message: NO_MATCH_MESSAGE,
    };
  }

  if (resolution.status === TURN_STATUS_FINISHED) {
    return {
      ...resolution.nextGame,
      message: buildWinnerMessage(resolution.showdown),
    };
  }

  return {
    ...resolution.nextGame,
    message: result.isGameOver ? FINISHING_GAME_MESSAGE : DEALT_MESSAGE,
  };
}

export default function useRenjiePokerEngine() {
  const [game, setGame] = useState(createFreshGame);

  const remainingIds = useMemo(() => new Set(game.remaining.map(cardId)), [game.remaining]);
  const playerEval = useMemo(
    () => (game.player.length ? evaluateBestHand(game.player) : null),
    [game.player]
  );
  const dealerEval = useMemo(
    () => (game.dealer.length ? evaluateBestHand(game.dealer) : null),
    [game.dealer]
  );

  const toggleSelect = useCallback((card) => {
    const id = cardId(card);
    setGame(prev => {
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
        if (c.suitKey === suitKey) nextSel.add(cardId(c));
      }
      return { ...prev, selection: nextSel };
    });
  }, []);

  const selectRank = useCallback((rank) => {
    setGame(prev => {
      const nextSel = new Set(prev.selection);
      for (const c of prev.remaining) {
        if (c.rank === rank) nextSel.add(cardId(c));
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

  const reset = useCallback(() => {
    setGame(createFreshGame());
  }, []);

  const deal = useCallback(() => {
    setGame(prev => {
      if (prev.gameOver) return prev;
      if (prev.player.length >= 5) return prev;
      if (prev.selection.size === 0) return { ...prev, message: SELECT_AT_LEAST_ONE_MESSAGE };
      if (prev.remaining.length === 0) return { ...prev, message: NO_CARDS_REMAINING_MESSAGE };

      const result = computeDealResult(prev);
      if (!result) return prev;

      return buildNextGameState(prev, result);
    });
  }, []);

  const computeFullDeal = useCallback(() => {
    return computeDealResult(game);
  }, [game]);

  const commitDeal = useCallback((result) => {
    setGame(prev => {
      if (prev.gameOver) return prev;
      return buildNextGameState(prev, result);
    });
  }, []);

  const completedGameSummary = useMemo(
    () => buildCompletedGameSummary(game),
    [game]
  );

  return {
    player: game.player,
    dealer: game.dealer,
    remainingIds,
    selection: game.selection,
    message: game.message,
    gameOver: game.gameOver,
    winner: game.winner,
    playerEval,
    dealerEval,
    completedGameSummary,
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
