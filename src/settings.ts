import { OrganizerSettings } from "./types";

export const DEFAULT_SETTINGS: OrganizerSettings = {
	apiKey: "",
	model: "gpt-4o-mini",
	provider: "openai",
	customUrl: "",
	ollamaUrl: "http://localhost:11434",
	targetLanguage: "es",
};
