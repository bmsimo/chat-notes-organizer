import { ChatMessage } from "../types";

export function generatePrompts(content: string, targetLanguage: string): ChatMessage[] {
	const systemPrompt = `
You are an expert assistant in personal knowledge organization.
You receive text fragments in conversation format (copied from a chat),
which may be jumbled, repetitive, or incomplete.

Your task is to:
1. Analyze the text as if they were unstructured personal notes.
2. Detect if the chat contains several different topics.
  - If there are multiple topics, divide the content into INDEPENDENT SECTIONS.
  - Give each section a clear title that represents the context.
3. Within each section:
  - Identify main ideas and sub-ideas.
  - Eliminate redundancies and noise.
  - Organize with hierarchies (headings, subheadings, bullets).
4. Generate the result in **clean Markdown** for Obsidian.
5. The final result must be written in the target language: ${targetLanguage}.
6. Never make up information, just reorganize and summarize.

IMPORTANT: Do not include reasoning traces, chain-of-thought, or <think> blocks in your output.
Only return the cleaned, final organized note in Markdown.
`;

	const userPrompt = `
I have the following notes copied from a chat.
The content may mix several different topics in a single stream.
Please:
  - Divide the content into separate thematic sections if you detect multiple contexts.
  - Organize each section clearly and hierarchically.
  - Use Markdown.
<<<NOTAS>>>
${content}
<<<FIN_NOTAS>>>
`;

	return [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: userPrompt },
	];
}
