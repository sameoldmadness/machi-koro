import { describe, it, expect } from 'vitest';
import { CardRegistry, EstablishmentCard, LandmarkCard } from './Card';
import { Money } from './Money';

describe('Card Value Objects', () => {
  describe('CardRegistry', () => {
    it('should initialize all establishments', () => {
      const establishments = CardRegistry.getAllEstablishments();
      expect(establishments.length).toBe(15);
    });

    it('should initialize all landmarks', () => {
      const landmarks = CardRegistry.getAllLandmarks();
      expect(landmarks.length).toBe(4);
    });

    it('should get establishment by name', () => {
      const grainField = CardRegistry.getEstablishment('Grain Field');

      expect(grainField.name).toBe('Grain Field');
      expect(grainField.cost.getValue()).toBe(1);
      expect(grainField.color).toBe('blue');
      expect(grainField.kind).toBe('grain');
      expect(grainField.activationNumbers).toEqual([1]);
      expect(grainField.income).toBe(1);
    });

    it('should get landmark by name', () => {
      const terminal = CardRegistry.getLandmark('Terminal');

      expect(terminal.name).toBe('Terminal');
      expect(terminal.cost.getValue()).toBe(4);
      expect(terminal.ability).toBe('may_roll_2_dice');
    });

    it('should throw error for unknown establishment', () => {
      expect(() => CardRegistry.getEstablishment('Unknown' as any)).toThrow(
        'Unknown establishment'
      );
    });

    it('should throw error for unknown landmark', () => {
      expect(() => CardRegistry.getLandmark('Unknown' as any)).toThrow(
        'Unknown landmark'
      );
    });

    it('should filter establishments by color', () => {
      const blueCards = CardRegistry.getEstablishmentsByColor('blue');

      expect(blueCards.every(card => card.color === 'blue')).toBe(true);
      expect(blueCards.length).toBeGreaterThan(0);
      expect(blueCards.some(card => card.name === 'Grain Field')).toBe(true);
    });

    it('should filter establishments by kind', () => {
      const grainCards = CardRegistry.getEstablishmentsByKind('grain');

      expect(grainCards.every(card => card.kind === 'grain')).toBe(true);
      expect(grainCards.some(card => card.name === 'Grain Field')).toBe(true);
      expect(grainCards.some(card => card.name === 'Apple Garden')).toBe(true);
    });
  });

  describe('EstablishmentCard', () => {
    it('should check activation numbers', () => {
      const bakery = CardRegistry.getEstablishment('Bakery');

      expect(bakery.activatesOn(2)).toBe(true);
      expect(bakery.activatesOn(3)).toBe(true);
      expect(bakery.activatesOn(4)).toBe(false);
    });

    it('should identify active player cards (green)', () => {
      const shop = CardRegistry.getEstablishment('Shop');

      expect(shop.isActivePlayerCard()).toBe(true);
      expect(shop.isPassiveCard()).toBe(false);
      expect(shop.isHostileCard()).toBe(false);
    });

    it('should identify passive cards (blue)', () => {
      const grainField = CardRegistry.getEstablishment('Grain Field');

      expect(grainField.isPassiveCard()).toBe(true);
      expect(grainField.isActivePlayerCard()).toBe(false);
      expect(grainField.isHostileCard()).toBe(false);
    });

    it('should identify hostile cards (red)', () => {
      const cafe = CardRegistry.getEstablishment('Cafe');

      expect(cafe.isHostileCard()).toBe(true);
      expect(cafe.isActivePlayerCard()).toBe(false);
      expect(cafe.isPassiveCard()).toBe(false);
    });

    it('should identify special ability cards (purple)', () => {
      const stadium = CardRegistry.getEstablishment('Stadium');

      expect(stadium.isActivePlayerCard()).toBe(true);
      expect(stadium.specialRule).toBe('take_2_coins_from_every_player');
      expect(stadium.isSingular).toBe(true);
    });

    it('should have multiplier cards', () => {
      const cheeseFactory = CardRegistry.getEstablishment('Cheese Factory');

      expect(cheeseFactory.multiplier).toEqual({ cow: 3 });
      expect(cheeseFactory.income).toBe(0);
    });

    it('should serialize to JSON', () => {
      const grainField = CardRegistry.getEstablishment('Grain Field');
      const json = grainField.toJSON();

      expect(json.name).toBe('Grain Field');
      expect(json.cost).toBe(1);
      expect(json.color).toBe('blue');
      expect(json.kind).toBe('grain');
    });
  });

  describe('LandmarkCard', () => {
    it('should have correct abilities', () => {
      const terminal = CardRegistry.getLandmark('Terminal');
      const shoppingCenter = CardRegistry.getLandmark('Shopping Center');
      const amusementPark = CardRegistry.getLandmark('Amusement Park');
      const radioTower = CardRegistry.getLandmark('Radio Tower');

      expect(terminal.ability).toBe('may_roll_2_dice');
      expect(shoppingCenter.ability).toBe('plus_1_income_for_coffee_and_bread_cards');
      expect(amusementPark.ability).toBe('roll_again_on_double');
      expect(radioTower.ability).toBe('may_reroll_once');
    });

    it('should have correct costs', () => {
      const terminal = CardRegistry.getLandmark('Terminal');
      const radioTower = CardRegistry.getLandmark('Radio Tower');

      expect(terminal.cost.getValue()).toBe(4);
      expect(radioTower.cost.getValue()).toBe(22);
    });

    it('should serialize to JSON', () => {
      const terminal = CardRegistry.getLandmark('Terminal');
      const json = terminal.toJSON();

      expect(json.name).toBe('Terminal');
      expect(json.cost).toBe(4);
      expect(json.ability).toBe('may_roll_2_dice');
    });
  });

  describe('Card immutability', () => {
    it('should return the same instance from registry', () => {
      const grainField1 = CardRegistry.getEstablishment('Grain Field');
      const grainField2 = CardRegistry.getEstablishment('Grain Field');

      // Should be the same instance (registry pattern)
      expect(grainField1).toBe(grainField2);
    });

    it('should have readonly properties at compile time', () => {
      const bakery = CardRegistry.getEstablishment('Bakery');

      // Readonly properties are enforced by TypeScript
      // This test verifies the structure exists
      expect(bakery.name).toBe('Bakery');
      expect(bakery.cost).toBeDefined();
      expect(bakery.color).toBe('green');
    });
  });

  describe('Special card properties', () => {
    it('should identify singular cards correctly', () => {
      const stadium = CardRegistry.getEstablishment('Stadium');
      const tvCenter = CardRegistry.getEstablishment('TV Center');
      const businessCenter = CardRegistry.getEstablishment('Business Center');
      const grainField = CardRegistry.getEstablishment('Grain Field');

      expect(stadium.isSingular).toBe(true);
      expect(tvCenter.isSingular).toBe(true);
      expect(businessCenter.isSingular).toBe(true);
      expect(grainField.isSingular).toBe(false);
    });

    it('should have special rules on purple cards', () => {
      const stadium = CardRegistry.getEstablishment('Stadium');
      const tvCenter = CardRegistry.getEstablishment('TV Center');
      const businessCenter = CardRegistry.getEstablishment('Business Center');

      expect(stadium.specialRule).toBe('take_2_coins_from_every_player');
      expect(tvCenter.specialRule).toBe('take_5_coins_from_one_player');
      expect(businessCenter.specialRule).toBe('switch_1_non_tower_card_with_one_player');
    });

    it('should have correct multipliers', () => {
      const cheeseFactory = CardRegistry.getEstablishment('Cheese Factory');
      const furnitureFactory = CardRegistry.getEstablishment('Furniture Factory');
      const fruitMarket = CardRegistry.getEstablishment('Fruit Market');

      expect(cheeseFactory.multiplier.cow).toBe(3);
      expect(furnitureFactory.multiplier.cog).toBe(3);
      expect(fruitMarket.multiplier.grain).toBe(2);
    });
  });
});
