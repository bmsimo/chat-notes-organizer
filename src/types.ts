export interface OrganizerSettings {
	apiKey: string;
	model: string;
	provider: "openai" | "openrouter" | "ollama" | "custom";
	customUrl: string;
	ollamaUrl: string;
	targetLanguage: string;
}

export interface ProviderConfig {
	apiUrl: string;
	headers: Record<string, string>;
	body: any;
}

export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface APIResponse {
	error?: {
		message: string;
	};
	choices?: Array<{
		message: {
			content: string;
		};
	}>;
	message?: {
		content: string;
	};
}
