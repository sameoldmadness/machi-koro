import { describe, it, expect } from 'vitest';
import { convertToDomainPlayer, convertFromDomainPlayer, convertToDomainGame, syncToOldState } from './GameAdapter';
import { createPlayer, createGame } from '../utils';
import { defaultStrategy } from '../domain/strategies/Strategy';
import { Money } from '../domain/value-objects/Money';

describe('GameAdapter', () => {
  describe('convertToDomainPlayer', () => {
    it('should convert old player to domain player', () => {
      const oldPlayer = createPlayer('Alice', defaultStrategy);
      oldPlayer.budget = 10;
      oldPlayer.deck['Farm'] = 2;
      oldPlayer.amusementDeck['Terminal'] = true;

      const domainPlayer = convertToDomainPlayer(oldPlayer);

      expect(domainPlayer.name).toBe('Alice');
      expect(domainPlayer.getMoney().getValue()).toBe(10);
      expect(domainPlayer.getEstablishmentCount('Grain Field')).toBe(1);
      expect(domainPlayer.getEstablishmentCount('Bakery')).toBe(1);
      expect(domainPlayer.getEstablishmentCount('Farm')).toBe(2);
      expect(domainPlayer.hasLandmark('Terminal')).toBe(true);
      expect(domainPlayer.hasLandmark('Shopping Center')).toBe(false);
    });

    it('should handle player with no extra cards', () => {
      const oldPlayer = createPlayer('Bob', defaultStrategy);

      const domainPlayer = convertToDomainPlayer(oldPlayer);

      expect(domainPlayer.name).toBe('Bob');
      expect(domainPlayer.getMoney().getValue()).toBe(3); // Starting budget
      expect(domainPlayer.getEstablishmentCount('Grain Field')).toBe(1);
      expect(domainPlayer.getEstablishmentCount('Bakery')).toBe(1);
      expect(domainPlayer.getLandmarks().size).toBe(0);
    });
  });

  describe('convertFromDomainPlayer', () => {
    it('should sync domain player back to old player', () => {
      const oldPlayer = createPlayer('Alice', defaultStrategy);
      const domainPlayer = convertToDomainPlayer(oldPlayer);

      // Modify domain player (add 5 coins: 3 + 5 = 8)
      domainPlayer.addMoney(Money.of(5));
      domainPlayer.addEstablishment('Farm');
      domainPlayer.buildLandmark('Terminal');

      // Sync back
      convertFromDomainPlayer(domainPlayer, oldPlayer);

      expect(oldPlayer.budget).toBe(8); // 3 + 5
      expect(oldPlayer.deck['Farm']).toBe(1);
      expect(oldPlayer.amusementDeck['Terminal']).toBe(true);
    });

    it('should clear landmarks that are not built', () => {
      const oldPlayer = createPlayer('Bob', defaultStrategy);
      oldPlayer.amusementDeck['Terminal'] = true;
      oldPlayer.amusementDeck['Shopping Center'] = true;

      const domainPlayer = convertToDomainPlayer(oldPlayer);
      // Domain player now has both landmarks

      // Sync back (should maintain the landmarks)
      convertFromDomainPlayer(domainPlayer, oldPlayer);

      expect(oldPlayer.amusementDeck['Terminal']).toBe(true);
      expect(oldPlayer.amusementDeck['Shopping Center']).toBe(true);
      expect(oldPlayer.amusementDeck['Amusement Park']).toBe(false);
      expect(oldPlayer.amusementDeck['Radio Tower']).toBe(false);
    });
  });

  describe('convertToDomainGame', () => {
    it('should convert old game state to domain game', () => {
      const playerA = createPlayer('Alice', defaultStrategy);
      const playerB = createPlayer('Bob', defaultStrategy);
      const oldGame = createGame([playerA, playerB]);
      oldGame.activePlayerIndex = 1;

      const domainGame = convertToDomainGame(oldGame);

      expect(domainGame.getPlayerCount()).toBe(2);
      expect(domainGame.getCurrentPlayerIndex()).toBe(1);
      expect(domainGame.getStatus()).toBe('in_progress');
      expect(domainGame.getPlayers()[0].name).toBe('Alice');
      expect(domainGame.getPlayers()[1].name).toBe('Bob');
    });

    it('should create market deck', () => {
      const playerA = createPlayer('Alice', defaultStrategy);
      const playerB = createPlayer('Bob', defaultStrategy);
      const oldGame = createGame([playerA, playerB]);

      const domainGame = convertToDomainGame(oldGame);

      const market = domainGame.getMarketDeck();
      expect(market).toBeDefined();
      expect(market.isAvailable('Grain Field')).toBe(true);
      expect(market.getAvailableQuantity('Grain Field')).toBe(6);
    });
  });

  describe('syncToOldState', () => {
    it('should sync domain game state back to old state', () => {
      const playerA = createPlayer('Alice', defaultStrategy);
      const playerB = createPlayer('Bob', defaultStrategy);
      const oldGame = createGame([playerA, playerB]);
      oldGame.activePlayerIndex = 0;

      const domainGame = convertToDomainGame(oldGame);

      // Modify domain game - add 5 coins to first player
      domainGame.getPlayers()[0].addMoney(Money.of(5));

      // Sync back
      syncToOldState(domainGame, oldGame);

      expect(oldGame.activePlayerIndex).toBe(0);
      expect(oldGame.players[0].budget).toBe(8); // 3 + 5
    });

    it('should sync all players correctly', () => {
      const playerA = createPlayer('Alice', defaultStrategy);
      const playerB = createPlayer('Bob', defaultStrategy);
      const oldGame = createGame([playerA, playerB]);

      const domainGame = convertToDomainGame(oldGame);

      // Modify both players through domain
      domainGame.getPlayers()[0].addEstablishment('Farm');
      domainGame.getPlayers()[1].buildLandmark('Terminal');

      // Sync back
      syncToOldState(domainGame, oldGame);

      expect(oldGame.players[0].deck['Farm']).toBe(1);
      expect(oldGame.players[1].amusementDeck['Terminal']).toBe(true);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain state through round-trip conversion', () => {
      const playerA = createPlayer('Alice', defaultStrategy);
      playerA.budget = 15;
      playerA.deck['Farm'] = 3;
      playerA.amusementDeck['Terminal'] = true;

      const playerB = createPlayer('Bob', defaultStrategy);
      const oldGame = createGame([playerA, playerB]);
      oldGame.activePlayerIndex = 1;

      // Convert to domain
      const domainGame = convertToDomainGame(oldGame);

      // Convert back
      const oldGameCopy = createGame([createPlayer('Alice', defaultStrategy), createPlayer('Bob', defaultStrategy)]);
      syncToOldState(domainGame, oldGameCopy);

      // Verify state maintained
      expect(oldGameCopy.activePlayerIndex).toBe(1);
      expect(oldGameCopy.players[0].budget).toBe(15);
      expect(oldGameCopy.players[0].deck['Farm']).toBe(3);
      expect(oldGameCopy.players[0].amusementDeck['Terminal']).toBe(true);
    });
  });
});
