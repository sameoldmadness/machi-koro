import { describe, it, expect } from 'vitest';
import { Player } from './Player';
import { Money } from '../value-objects/Money';

describe('Player Entity', () => {
  describe('creation', () => {
    it('should create player with default starting state', () => {
      const player = Player.create('player-1', 'Alice');

      expect(player.id).toBe('player-1');
      expect(player.name).toBe('Alice');
      expect(player.getMoney().getValue()).toBe(3);
      expect(player.getEstablishmentCount('Grain Field')).toBe(1);
      expect(player.getEstablishmentCount('Bakery')).toBe(1);
      expect(player.getLandmarks().size).toBe(0);
    });

    it('should create player with custom state', () => {
      const money = Money.of(10);
      const establishments = new Map([
        ['Grain Field' as const, 2],
        ['Shop' as const, 1],
      ]);
      const landmarks = new Set(['Terminal' as const]);

      const player = Player.createWithState(
        'player-1',
        'Bob',
        money,
        establishments,
        landmarks
      );

      expect(player.getMoney().getValue()).toBe(10);
      expect(player.getEstablishmentCount('Grain Field')).toBe(2);
      expect(player.getEstablishmentCount('Shop')).toBe(1);
      expect(player.hasLandmark('Terminal')).toBe(true);
    });

    it('should create independent instances', () => {
      const player1 = Player.create('player-1', 'Alice');
      const player2 = Player.create('player-2', 'Bob');

      player1.addMoney(Money.of(5));

      expect(player1.getMoney().getValue()).toBe(8);
      expect(player2.getMoney().getValue()).toBe(3);
    });
  });

  describe('money operations', () => {
    it('should add money', () => {
      const player = Player.create('player-1', 'Alice');

      player.addMoney(Money.of(5));

      expect(player.getMoney().getValue()).toBe(8);
    });

    it('should remove money', () => {
      const player = Player.create('player-1', 'Alice');

      player.removeMoney(Money.of(2));

      expect(player.getMoney().getValue()).toBe(1);
    });

    it('should not go below zero when removing money', () => {
      const player = Player.create('player-1', 'Alice');

      player.removeMoney(Money.of(10));

      expect(player.getMoney().getValue()).toBe(0);
    });

    it('should check if can afford cost', () => {
      const player = Player.create('player-1', 'Alice');

      expect(player.canAfford(Money.of(2))).toBe(true);
      expect(player.canAfford(Money.of(5))).toBe(false);
    });

    it('should handle multiple money operations', () => {
      const player = Player.create('player-1', 'Alice');

      player.addMoney(Money.of(7)); // 3 + 7 = 10
      player.removeMoney(Money.of(4)); // 10 - 4 = 6
      player.addMoney(Money.of(2)); // 6 + 2 = 8

      expect(player.getMoney().getValue()).toBe(8);
    });
  });

  describe('establishment operations', () => {
    it('should add establishment', () => {
      const player = Player.create('player-1', 'Alice');

      player.addEstablishment('Shop');

      expect(player.hasEstablishment('Shop')).toBe(true);
      expect(player.getEstablishmentCount('Shop')).toBe(1);
    });

    it('should add multiple of same establishment', () => {
      const player = Player.create('player-1', 'Alice');

      player.addEstablishment('Farm');
      player.addEstablishment('Farm');
      player.addEstablishment('Farm');

      expect(player.getEstablishmentCount('Farm')).toBe(3);
    });

    it('should remove establishment', () => {
      const player = Player.create('player-1', 'Alice');
      player.addEstablishment('Cafe');

      const removed = player.removeEstablishment('Cafe');

      expect(removed).toBe(true);
      expect(player.hasEstablishment('Cafe')).toBe(false);
      expect(player.getEstablishmentCount('Cafe')).toBe(0);
    });

    it('should remove one instance when multiple exist', () => {
      const player = Player.create('player-1', 'Alice');
      player.addEstablishment('Forest');
      player.addEstablishment('Forest');

      player.removeEstablishment('Forest');

      expect(player.getEstablishmentCount('Forest')).toBe(1);
      expect(player.hasEstablishment('Forest')).toBe(true);
    });

    it('should fail to remove non-owned establishment', () => {
      const player = Player.create('player-1', 'Alice');

      const removed = player.removeEstablishment('Stadium');

      expect(removed).toBe(false);
    });

    it('should get all establishments', () => {
      const player = Player.create('player-1', 'Alice');

      const establishments = player.getEstablishments();

      expect(establishments.get('Grain Field')).toBe(1);
      expect(establishments.get('Bakery')).toBe(1);
    });

    it('should return defensive copy of establishments', () => {
      const player = Player.create('player-1', 'Alice');

      const establishments = player.getEstablishments();
      establishments.set('Shop', 100); // Modify copy

      // Original should be unchanged
      expect(player.getEstablishmentCount('Shop')).toBe(0);
    });

    it('should get establishment cards', () => {
      const player = Player.create('player-1', 'Alice');
      player.addEstablishment('Farm');

      const cards = player.getEstablishmentCards();

      expect(cards.length).toBe(3); // Grain Field, Bakery, Farm
      expect(cards.some((c) => c.name === 'Grain Field')).toBe(true);
      expect(cards.some((c) => c.name === 'Bakery')).toBe(true);
      expect(cards.some((c) => c.name === 'Farm')).toBe(true);
    });
  });

  describe('landmark operations', () => {
    it('should build landmark', () => {
      const player = Player.create('player-1', 'Alice');

      player.buildLandmark('Terminal');

      expect(player.hasLandmark('Terminal')).toBe(true);
    });

    it('should build multiple landmarks', () => {
      const player = Player.create('player-1', 'Alice');

      player.buildLandmark('Terminal');
      player.buildLandmark('Shopping Center');

      expect(player.hasLandmark('Terminal')).toBe(true);
      expect(player.hasLandmark('Shopping Center')).toBe(true);
      expect(player.getLandmarks().size).toBe(2);
    });

    it('should not duplicate landmarks', () => {
      const player = Player.create('player-1', 'Alice');

      player.buildLandmark('Terminal');
      player.buildLandmark('Terminal');

      expect(player.getLandmarks().size).toBe(1);
    });

    it('should return defensive copy of landmarks', () => {
      const player = Player.create('player-1', 'Alice');
      player.buildLandmark('Terminal');

      const landmarks = player.getLandmarks();
      landmarks.add('Radio Tower');

      // Original should be unchanged
      expect(player.hasLandmark('Radio Tower')).toBe(false);
    });

    it('should get landmark cards', () => {
      const player = Player.create('player-1', 'Alice');
      player.buildLandmark('Terminal');
      player.buildLandmark('Shopping Center');

      const cards = player.getLandmarkCards();

      expect(cards.length).toBe(2);
      expect(cards.some((c) => c.name === 'Terminal')).toBe(true);
      expect(cards.some((c) => c.name === 'Shopping Center')).toBe(true);
    });
  });

  describe('winning condition', () => {
    it('should not have won at start', () => {
      const player = Player.create('player-1', 'Alice');

      expect(player.hasWon()).toBe(false);
    });

    it('should not have won with some landmarks', () => {
      const player = Player.create('player-1', 'Alice');
      player.buildLandmark('Terminal');
      player.buildLandmark('Shopping Center');

      expect(player.hasWon()).toBe(false);
    });

    it('should have won with all 4 landmarks', () => {
      const player = Player.create('player-1', 'Alice');
      player.buildLandmark('Terminal');
      player.buildLandmark('Shopping Center');
      player.buildLandmark('Amusement Park');
      player.buildLandmark('Radio Tower');

      expect(player.hasWon()).toBe(true);
    });
  });

  describe('query operations', () => {
    it('should get total establishment count', () => {
      const player = Player.create('player-1', 'Alice');
      player.addEstablishment('Farm');
      player.addEstablishment('Forest');
      player.addEstablishment('Farm');

      const total = player.getTotalEstablishmentCount();

      expect(total).toBe(5); // 1 Grain Field + 1 Bakery + 2 Farm + 1 Forest
    });

    it('should get establishment count by kind', () => {
      const player = Player.create('player-1', 'Alice');
      player.addEstablishment('Farm'); // cow
      player.addEstablishment('Farm'); // cow

      const cowCount = player.getEstablishmentCountByKind('cow');
      const grainCount = player.getEstablishmentCountByKind('grain');

      expect(cowCount).toBe(2);
      expect(grainCount).toBe(1); // Starting Grain Field
    });

    it('should return 0 for kinds not owned', () => {
      const player = Player.create('player-1', 'Alice');

      const cogCount = player.getEstablishmentCountByKind('cog');

      expect(cogCount).toBe(0);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON', () => {
      const player = Player.create('player-1', 'Alice');
      player.addMoney(Money.of(2));
      player.addEstablishment('Shop');
      player.buildLandmark('Terminal');

      const json = player.toJSON();

      expect(json.id).toBe('player-1');
      expect(json.name).toBe('Alice');
      expect(json.money).toBe(5);
      expect(json.establishments['Grain Field']).toBe(1);
      expect(json.establishments['Shop']).toBe(1);
      expect(json.landmarks).toContain('Terminal');
    });

    it('should deserialize from JSON', () => {
      const json = {
        id: 'player-1',
        name: 'Bob',
        money: 10,
        establishments: {
          'Grain Field': 2,
          'Bakery': 1,
        },
        landmarks: ['Terminal', 'Shopping Center'],
      };

      const player = Player.fromJSON(json);

      expect(player.id).toBe('player-1');
      expect(player.name).toBe('Bob');
      expect(player.getMoney().getValue()).toBe(10);
      expect(player.getEstablishmentCount('Grain Field')).toBe(2);
      expect(player.hasLandmark('Terminal')).toBe(true);
      expect(player.hasLandmark('Shopping Center')).toBe(true);
    });

    it('should round-trip serialize/deserialize', () => {
      const original = Player.create('player-1', 'Charlie');
      original.addMoney(Money.of(7));
      original.addEstablishment('Farm');
      original.buildLandmark('Terminal');

      const json = original.toJSON();
      const restored = Player.fromJSON(json);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.getMoney().getValue()).toBe(original.getMoney().getValue());
      expect(restored.getEstablishments()).toEqual(original.getEstablishments());
      expect(restored.getLandmarks()).toEqual(original.getLandmarks());
    });
  });

  describe('entity identity', () => {
    it('should have unique identity', () => {
      const player1 = Player.create('player-1', 'Alice');
      const player2 = Player.create('player-2', 'Bob');

      expect(player1.id).not.toBe(player2.id);
      expect(player1.name).not.toBe(player2.name);
    });

    it('should maintain identity after modifications', () => {
      const player = Player.create('player-1', 'Alice');
      const originalId = player.id;
      const originalName = player.name;

      player.addMoney(Money.of(10));
      player.addEstablishment('Shop');
      player.buildLandmark('Terminal');

      expect(player.id).toBe(originalId);
      expect(player.name).toBe(originalName);
    });
  });

  describe('edge cases', () => {
    it('should handle empty establishments', () => {
      const player = Player.createWithState(
        'player-1',
        'Alice',
        Money.of(5),
        new Map(),
        new Set()
      );

      expect(player.getTotalEstablishmentCount()).toBe(0);
      expect(player.getEstablishmentCards()).toEqual([]);
    });

    it('should handle zero money', () => {
      const player = Player.createWithState(
        'player-1',
        'Alice',
        Money.of(0),
        new Map(),
        new Set()
      );

      expect(player.getMoney().getValue()).toBe(0);
      expect(player.canAfford(Money.of(1))).toBe(false);
    });

    it('should handle large quantities', () => {
      const player = Player.create('player-1', 'Alice');

      for (let i = 0; i < 100; i++) {
        player.addEstablishment('Farm');
      }

      expect(player.getEstablishmentCount('Farm')).toBe(100);
      expect(player.getTotalEstablishmentCount()).toBe(102); // 100 + Grain Field + Bakery
    });
  });
});
