import { cardId } from "./deck";
import { compareHands, evaluateBestHand } from "./poker-eval";

export const RESULT_TYPE_NO_MATCH = "no-match";
export const RESULT_TYPE_MATCH = "match";

export const TURN_STATUS_NO_MATCH = "no-match";
export const TURN_STATUS_DEALT = "dealt";
export const TURN_STATUS_FINISHED = "finished";

function createLocalGameId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

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

export function topUpDealerPure(dealerArr, remainingArr) {
  const dealer = [...dealerArr];
  const remaining = [...remainingArr];

  while (dealer.length < 8 && remaining.length) {
    dealer.push(remaining.shift());
  }

  return { dealer, remaining };
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
  const compare = compareHands(playerEval, dealerEval);

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
  if (!game.gameOver) {
    return null;
  }

  const showdown = evaluateShowdown(game.player, game.dealer);

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

export function replaySelections(deck, selectionHistory) {
  let game = createGameState(deck);
  const turns = [];

  for (const selectionIds of selectionHistory) {
    if (game.gameOver || game.player.length >= 5) {
      break;
    }

    const nextSelection = selectionIds instanceof Set
      ? new Set(selectionIds)
      : new Set(selectionIds ?? []);
    const turnGame = { ...game, selection: nextSelection };
    const result = computeDealResult(turnGame);

    if (!result) {
      break;
    }

    const resolution = resolveDealResult(turnGame, result);

    turns.push({
      turnIndex: turns.length + 1,
      selectionIds: [...nextSelection],
      result: {
        type: result.type,
        playerCardId: result.playerCard ? cardId(result.playerCard) : null,
        dealerCardIds: result.dealerCards.map(cardId),
        topUpCardIds: result.topUpCards.map(cardId),
        isGameOver: Boolean(result.isGameOver),
      },
      status: resolution.status,
    });

    game = resolution.nextGame;
  }

  return {
    game,
    turns,
    summary: buildCompletedGameSummary(game),
  };
}
