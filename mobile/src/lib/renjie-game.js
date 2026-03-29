import { cardId } from "./deck";
import { compareHands, evaluateBestHand } from "./poker-eval";

const STATUS_NO_MATCH = "no-match";
const SHOWDOWN_TIE_EPSILON = 1e-9;

export const RESULT_TYPE_NO_MATCH = STATUS_NO_MATCH;
export const RESULT_TYPE_MATCH = "match";

export const TURN_STATUS_NO_MATCH = STATUS_NO_MATCH;
export const TURN_STATUS_DEALT = "dealt";
export const TURN_STATUS_FINISHED = "finished";

function createLocalGameId() {
  return `game-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createGameState(deck) {
  return {
    localGameId: createLocalGameId(),
    startedAt: new Date().toISOString(),
    deckOrder: [...deck],
    turnLog: [],
    player: [],
    dealer: [],
    remaining: [...deck],
    selection: new Set(),
    gameOver: false,
    winner: null,
  };
}

export function dealOneTurnPure(remainingArr, selectionIds) {
  const remaining = [...remainingArr];
  const toDealer = [];
  let playerCard = null;

  while (remaining.length) {
    const card = remaining.shift();
    if (!playerCard && selectionIds.has(cardId(card))) {
      playerCard = card;
      break;
    }
    toDealer.push(card);
  }

  return { playerCard, toDealer, remaining };
}

export function computeDealResult(game) {
  if (
    game.gameOver ||
    game.player.length >= 5 ||
    game.selection.size === 0 ||
    game.remaining.length === 0
  ) {
    return null;
  }

  const { playerCard, toDealer, remaining } = dealOneTurnPure(
    game.remaining,
    game.selection
  );

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
}

export function evaluateShowdown(playerCards, dealerCards) {
  const playerEval = evaluateBestHand(playerCards);
  const dealerEval = evaluateBestHand(dealerCards);
  let rawCompare = compareHands(playerEval, dealerEval);

  // House rule: same high-card flushes are treated as ties (dealer wins ties).
  if (
    playerEval.category === "flush" &&
    dealerEval.category === "flush" &&
    playerEval.kickerRanks?.[0] === dealerEval.kickerRanks?.[0]
  ) {
    rawCompare = 0;
  }

  const compare = Math.abs(rawCompare) <= SHOWDOWN_TIE_EPSILON ? 0 : rawCompare;

  return {
    playerEval,
    dealerEval,
    compare,
    winner: compare > 0 ? "player" : "dealer",
    dealerWonTie: compare === 0,
  };
}

export function resolveDealResult(game, result) {
  const turnEntry = {
    turnIndex: game.turnLog.length + 1,
    selectionIds: [...game.selection],
    result: {
      type: result.type,
      playerCardId: result.playerCard ? cardId(result.playerCard) : null,
      dealerCardIds: result.dealerCards.map(cardId),
      topUpCardIds: result.topUpCards.map(cardId),
      isGameOver: Boolean(result.isGameOver),
    },
  };

  if (result.type === RESULT_TYPE_NO_MATCH) {
    return {
      status: TURN_STATUS_NO_MATCH,
      nextGame: {
        ...game,
        turnLog: [...game.turnLog, turnEntry],
        dealer: [...game.dealer, ...result.dealerCards],
        remaining: result.remaining,
      },
    };
  }

  const nextPlayer = [...game.player, result.playerCard];
  const nextDealer = [...game.dealer, ...result.dealerCards, ...result.topUpCards];

  if (result.isGameOver) {
    const showdown = evaluateShowdown(nextPlayer, nextDealer);

    return {
      status: TURN_STATUS_FINISHED,
      showdown,
      nextGame: {
        ...game,
        turnLog: [...game.turnLog, turnEntry],
        player: nextPlayer,
        dealer: nextDealer,
        remaining: result.remaining,
        selection: new Set(),
        gameOver: true,
        winner: showdown.winner,
        showdown,
      },
    };
  }

  return {
    status: TURN_STATUS_DEALT,
    nextGame: {
      ...game,
      turnLog: [...game.turnLog, turnEntry],
      player: nextPlayer,
      dealer: nextDealer,
      remaining: result.remaining,
      selection: new Set(),
    },
  };
}

export function buildCompletedGameSummary(game) {
  if (!game.gameOver || !game.showdown) {
    return null;
  }

  const { showdown } = game;

  return {
    localGameId: game.localGameId,
    startedAt: game.startedAt,
    deckOrderIds: game.deckOrder.map(cardId),
    turnLog: game.turnLog,
    outcome: showdown.winner === "player" ? "win" : "loss",
    dealerWonTie: showdown.dealerWonTie,
    playerHandCategory: showdown.playerEval.category,
    playerHandName: showdown.playerEval.name,
    dealerHandCategory: showdown.dealerEval.category,
    dealerHandName: showdown.dealerEval.name,
    playerCardIds: game.player.map(cardId),
    dealerCardIds: game.dealer.map(cardId),
    remainingCardIds: game.remaining.map(cardId),
  };
}
