import OpenAI from "openai";
import { State } from "./game";
import { printtt } from "./utils";

const client = new OpenAI();

export async function buy(game: State) {
    printtt(`OpenAI buy request`);

    const response = await client.responses.create({
        model: "gpt-5",
        reasoning: { effort: "high" },
        instructions: `
            You're playing Machi Koro, a city-building card game.
            Given the player's current city and budget, suggest the best card to buy next.
            Reply with a json. "result" contains the name of the card to buy, or "skip" if no purchase should be made.
            "reasoning" contains your reasoning for the decision. "Steps" contains the steps you took to reach your conclusion.

            You should consider the following when making your decision:
            - The player's current budget.
            - The cards already owned by the player.
            - The cards owned by opponents.
            - The potential benefits of each card available for purchase.
            - The overall strategy of building a balanced city.

            Go over top 10 best strategies for Machi Koro players and base your decision on them.
            Invalidate strategies that don't fit the current game state.
        `,
        input: JSON.stringify(game),
    });

    printtt(`OpenAI response: ${JSON.stringify(response.output_text, null, 2)}`);

    const { result } = JSON.parse(response.output_text!);

    if (result === "skip") {
        return null;
    }

    return result;
}