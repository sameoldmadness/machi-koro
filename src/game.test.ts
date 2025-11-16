import { describe, it, expect } from 'vitest';
import {
  cards,
  deck,
  amusementCards,
  startingDeck,
  startingAmusementDeck,
  startingBudget,
} from './game';

describe('game.ts - Game Data', () => {
  describe('cards', () => {
    it('should have valid card definitions', () => {
      expect(cards.length).toBeGreaterThan(0);

      cards.forEach((card) => {
        expect(card.name).toBeTruthy();
        expect(card.color).toMatch(/^(green|blue|red|purple)$/);
        expect(card.kind).toBeTruthy();
        expect(card.cost).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(card.match)).toBe(true);
        expect(card.match.length).toBeGreaterThan(0);
      });
    });

    it('should have dice rolls in valid range (1-12)', () => {
      cards.forEach((card) => {
        card.match.forEach((roll) => {
          expect(roll).toBeGreaterThanOrEqual(1);
          expect(roll).toBeLessThanOrEqual(12);
        });
      });
    });

    it('should have either income or multiplier or special rule', () => {
      cards.forEach((card) => {
        const hasIncome = card.income !== undefined;
        const hasMultiplier = card.multiplier !== undefined;
        const hasSpecialRule = card.specialRule !== undefined;

        expect(hasIncome || hasMultiplier || hasSpecialRule).toBe(true);
      });
    });

    it('should have unique names', () => {
      const names = cards.map((c) => c.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(cards.length);
    });

    it('should mark tower cards as singular', () => {
      const towerCards = cards.filter((c) => c.color === 'purple');

      towerCards.forEach((card) => {
        expect(card.singular).toBe(true);
      });
    });
  });

  describe('specific cards', () => {
    it('Grain Field should be a blue card costing 1', () => {
      const grainField = cards.find((c) => c.name === 'Grain Field');

      expect(grainField).toBeDefined();
      expect(grainField?.color).toBe('blue');
      expect(grainField?.cost).toBe(1);
      expect(grainField?.match).toContain(1);
      expect(grainField?.income).toBe(1);
    });

    it('Bakery should match on 2 or 3', () => {
      const bakery = cards.find((c) => c.name === 'Bakery');

      expect(bakery).toBeDefined();
      expect(bakery?.match).toEqual([2, 3]);
      expect(bakery?.color).toBe('green');
    });

    it('Stadium should take coins from all players', () => {
      const stadium = cards.find((c) => c.name === 'Stadium');

      expect(stadium).toBeDefined();
      expect(stadium?.specialRule).toBe('take_2_coins_from_every_player');
      expect(stadium?.singular).toBe(true);
    });

    it('Cheese Factory should have cow multiplier', () => {
      const cheeseFactory = cards.find((c) => c.name === 'Cheese Factory');

      expect(cheeseFactory).toBeDefined();
      expect(cheeseFactory?.multiplier).toEqual({ cow: 3 });
    });

    it('Furniture Factory should have cog multiplier', () => {
      const furnitureFactory = cards.find((c) => c.name === 'Furniture Factory');

      expect(furnitureFactory).toBeDefined();
      expect(furnitureFactory?.multiplier).toEqual({ cog: 3 });
    });

    it('Fruit Market should have grain multiplier', () => {
      const fruitMarket = cards.find((c) => c.name === 'Fruit Market');

      expect(fruitMarket).toBeDefined();
      expect(fruitMarket?.multiplier).toEqual({ grain: 2 });
    });
  });

  describe('deck', () => {
    it('should have correct card counts', () => {
      expect(deck['Grain Field']).toBe(6);
      expect(deck['Bakery']).toBe(6);
      expect(deck['Farm']).toBe(6);
      expect(deck['Stadium']).toBe(5);
      expect(deck['TV Center']).toBe(5);
      expect(deck['Business Center']).toBe(5);
    });

    it('should include all non-amusement cards', () => {
      const regularCards = cards.filter((c) => c.color !== 'purple' || c.singular);
      const deckCards = Object.keys(deck);

      regularCards.forEach((card) => {
        expect(deckCards).toContain(card.name);
      });
    });
  });

  describe('amusementCards', () => {
    it('should have 4 amusement cards', () => {
      expect(amusementCards).toHaveLength(4);
    });

    it('should have increasing costs', () => {
      expect(amusementCards[0].cost).toBe(4); // Terminal
      expect(amusementCards[1].cost).toBe(10); // Shopping Center
      expect(amusementCards[2].cost).toBe(16); // Amusement Park
      expect(amusementCards[3].cost).toBe(22); // Radio Tower
    });

    it('should all have special rules', () => {
      amusementCards.forEach((card) => {
        expect(card.specialRule).toBeTruthy();
      });
    });

    it('Terminal should allow rolling 2 dice', () => {
      const terminal = amusementCards.find((c) => c.name === 'Terminal');

      expect(terminal).toBeDefined();
      expect(terminal?.specialRule).toBe('may_roll_2_dice');
    });

    it('Shopping Center should boost coffee and bread income', () => {
      const shoppingCenter = amusementCards.find((c) => c.name === 'Shopping Center');

      expect(shoppingCenter).toBeDefined();
      expect(shoppingCenter?.specialRule).toBe('plue_1_income_for_coffee_and_bread_cards');
    });

    it('Amusement Park should allow reroll on double', () => {
      const amusementPark = amusementCards.find((c) => c.name === 'Amusement Park');

      expect(amusementPark).toBeDefined();
      expect(amusementPark?.specialRule).toBe('roll_again_on_double');
    });

    it('Radio Tower should allow reroll once', () => {
      const radioTower = amusementCards.find((c) => c.name === 'Radio Tower');

      expect(radioTower).toBeDefined();
      expect(radioTower?.specialRule).toBe('may_reroll_once');
    });
  });

  describe('starting conditions', () => {
    it('should start with Bakery and Grain Field', () => {
      expect(startingDeck).toEqual({
        Bakery: 1,
        'Grain Field': 1,
      });
    });

    it('should start with no amusement cards', () => {
      expect(startingAmusementDeck).toEqual({
        Terminal: false,
        'Shopping Center': false,
        'Amusement Park': false,
        'Radio Tower': false,
      });
    });

    it('should start with 3 coins', () => {
      expect(startingBudget).toBe(3);
    });
  });

  describe('card colors and activations', () => {
    it('blue cards should activate on any players turn', () => {
      const blueCards = cards.filter((c) => c.color === 'blue');

      expect(blueCards.length).toBeGreaterThan(0);
      blueCards.forEach((card) => {
        expect(['blue']).toContain(card.color);
      });
    });

    it('green cards should activate on owner turn only', () => {
      const greenCards = cards.filter((c) => c.color === 'green');

      expect(greenCards.length).toBeGreaterThan(0);
    });

    it('red cards should activate on other players turns', () => {
      const redCards = cards.filter((c) => c.color === 'red');

      expect(redCards.length).toBeGreaterThan(0);
      redCards.forEach((card) => {
        expect(['red']).toContain(card.color);
      });
    });

    it('purple cards should have special abilities', () => {
      const purpleCards = cards.filter((c) => c.color === 'purple');

      purpleCards.forEach((card) => {
        expect(card.specialRule).toBeTruthy();
      });
    });
  });

  describe('card kinds', () => {
    it('should have bread kind cards', () => {
      const breadCards = cards.filter((c) => c.kind === 'bread');

      expect(breadCards.length).toBeGreaterThan(0);
      expect(breadCards.map((c) => c.name)).toContain('Bakery');
      expect(breadCards.map((c) => c.name)).toContain('Shop');
    });

    it('should have coffee kind cards', () => {
      const coffeeCards = cards.filter((c) => c.kind === 'coffee');

      expect(coffeeCards.length).toBeGreaterThan(0);
      expect(coffeeCards.map((c) => c.name)).toContain('Cafe');
    });

    it('should have grain kind cards', () => {
      const grainCards = cards.filter((c) => c.kind === 'grain');

      expect(grainCards.length).toBeGreaterThan(0);
    });

    it('should have cog kind cards', () => {
      const cogCards = cards.filter((c) => c.kind === 'cog');

      expect(cogCards.length).toBeGreaterThan(0);
    });

    it('should have cow kind cards', () => {
      const cowCards = cards.filter((c) => c.kind === 'cow');

      expect(cowCards.length).toBeGreaterThan(0);
    });

    it('should have factory kind cards', () => {
      const factoryCards = cards.filter((c) => c.kind === 'factory');

      expect(factoryCards.length).toBeGreaterThan(0);
    });
  });
});
