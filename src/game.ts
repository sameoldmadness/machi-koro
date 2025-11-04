export type Name = 
    'Apple Garden' | 
    'Bakery' |
    'Business Center' |
    'Cafe' |
    'Cheese Factory' |
    'Farm' |
    'Forest' |
    'Fruit Market' | 
    'Furniture Factory' |
    'Grain Field' |
    'Mine' |
    'Restraunt' |
    'Shop' | 
    'Stadium' |
    'TV Center';

export type Color = 'green' | 'blue' | 'red' | 'purple';
export type Kind = 'fruit' | 'cog' | 'grain' | 'tower' | 'cow' | 'bread' | 'factory' | 'coffee';

export type SpecialRule = 
    'take_2_coins_from_every_player' |
    'take_5_coins_from_one_player' |
    'switch_1_non_tower_card_with_one_player';

export type Card = {
    name: Name;
    color: Color;
    kind: Kind;
    cost: number;
    match: number[];
    income?: number;
    multiplier?: Partial<Record<Kind, number>>; 
    specialRule?: SpecialRule;
    singular?: true;
}

export const cards: Card[] = [
    {
        name: 'Grain Field',
        color: 'blue',
        kind: 'grain',
        cost: 1,
        match: [1],
        income: 1,
    },
    {
        name: 'Farm',
        color: 'blue',
        kind: 'cow',
        cost: 1,
        match: [2],
        income: 1,
    },
    {
        name: "Bakery",
        color: "green",
        kind: "bread",
        cost: 1,
        match: [2, 3],
        income: 1,
    },
    
    {
        name: 'Cafe',
        color: 'red',
        kind: 'coffee', 
        cost: 2,
        match: [3],
        income: 1,
    },
    {
        name: 'Shop',
        color: 'green',
        kind: 'bread',
        cost: 2,
        match: [4],
        income: 3,
    },
    {
        name: 'Forest',
        color: "blue",
        kind: "cog",
        cost: 3,
        match: [5],
        income: 1,
    },
    {
        name: 'Business Center',
        color: 'purple',
        kind: 'tower',
        cost: 8,
        match: [6],
        specialRule: 'switch_1_non_tower_card_with_one_player',
        singular: true,
    },
    {
        name: 'TV Center',
        color: 'purple',
        kind: 'tower',
        cost: 7,
        match: [6],
        specialRule: 'take_5_coins_from_one_player',
        singular: true,
    },
    {
        name: 'Stadium',
        color: 'purple',
        kind: 'tower',
        cost: 6,
        match: [6],
        specialRule: 'take_2_coins_from_every_player',
        singular: true,
    },
    {
        name: 'Cheese Factory',
        color: 'green',
        kind: 'factory',
        cost: 5,
        match: [7],
        multiplier: {
            "cow": 3,
        },
    },
    {
        name: "Furniture Factory",
        color: 'green',
        kind: 'factory',
        cost: 3,
        match: [8],
        multiplier: {
            "cog": 3,
        }
    },
    {
        name: "Mine",
        color: "blue",
        kind: "cog",
        cost: 6,
        match: [9],
        income: 5,
    },
    {
        name: "Restraunt",
        color: "red",
        kind: "coffee",
        cost: 3,
        match: [9, 10],
        income: 2,
    },
    {
        name: "Apple Garden",
        color: "blue",
        kind: "grain",
        cost: 3,
        match: [10],
        income: 3,
    },
    {   
        name: "Fruit Market",
        color: "green",
        kind: 'fruit',
        cost: 2,
        match: [11, 12],
        multiplier: {
            "grain": 2
        }
    }
];

export type Deck = Record<Name, number>;

export const deck: Deck = {
    'Apple Garden': 6, 
    'Bakery': 6,
    'Business Center': 5,
    'Cafe': 6,
    'Cheese Factory': 6,
    'Farm': 6,
    'Forest': 6,
    'Fruit Market': 6, 
    'Furniture Factory': 6,
    'Grain Field': 6,
    'Mine': 6,
    'Restraunt': 6,
    'Shop': 6, 
    'Stadium': 5,
    'TV Center': 5,
}

export type AmusementName = 
    'Terminal' |
    'Shopping Center' |
    'Amusement Park' |
    'Radio Tower';

export type AmusementSpecialRule = 
    'may_roll_2_dice' |
    'plue_1_income_for_coffee_and_bread_cards' |
    'roll_again_on_double' |
    'may_reroll_once';

export type AmusementCard = {
    name: AmusementName;
    cost: number;
    specialRule: AmusementSpecialRule;
}

export const amusementCards: AmusementCard[] = [
    {
        name: 'Terminal',
        cost: 4,
        specialRule: 'may_roll_2_dice',
    },
    {
        name: 'Shopping Center',
        cost: 10,
        specialRule: 'plue_1_income_for_coffee_and_bread_cards',
    },
    {
        name: 'Amusement Park',
        cost: 16,
        specialRule: 'roll_again_on_double',
    },
    {
        name: 'Radio Tower',
        cost: 22,
        specialRule: 'may_reroll_once',
    },
];

export const startingDeck: Partial<Record<Name, number>> = {
    'Bakery': 1,
    'Grain Field': 1,
};

export type AmusementDeck = Record<AmusementName, boolean>;

export const startingAmusementDeck: AmusementDeck = {
    "Terminal": false,
    "Shopping Center": false,
    "Amusement Park": false,
    "Radio Tower": false,
}

export const startingBudget = 3;

export type Player = {
    name: string;
    deck: Partial<Deck>;
    amusementDeck: AmusementDeck;
    budget: number;
    strategy: Strategy;
}

export type State = {
    deck: Deck;
    players: Player[];
    activePlayerIndex: number;
}

export type RollType = 1 | 2;

export type Purchase = Name | AmusementName;

export type Strategy = {
    roll: (game: State) => Promise<RollType>;
    reroll: (prev: number, game: State) => Promise<RollType | null>;
    buy: (game: State) => Promise<Name | AmusementName | null>;
    swap: (game: State) => Promise<{give: Name, take: Name, otherPlayerIndex: null} | null>;
}
