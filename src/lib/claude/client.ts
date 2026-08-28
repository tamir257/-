import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment — set it in .env.local
// (see .env.example / README). Never hardcode a key here.
export const anthropic = new Anthropic();
