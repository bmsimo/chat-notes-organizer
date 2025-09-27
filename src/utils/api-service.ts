import { OrganizerSettings, ProviderConfig, ChatMessage, APIResponse } from "../types";

export class APIService {
	private settings: OrganizerSettings;

	constructor(settings: OrganizerSettings) {
		this.settings = settings;
	}

	private getProviderConfig(messages: ChatMessage[]): ProviderConfig {
		const baseBody = { messages };

		const providerConfigs: Record<string, ProviderConfig> = {
			openai: {
				apiUrl: "https://api.openai.com/v1/chat/completions",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.settings.apiKey}`,
				},
				body: {
					model: this.settings.model,
					...baseBody,
					temperature: 1,
				},
			},
			openrouter: {
				apiUrl: "https://openrouter.ai/api/v1/chat/completions",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.settings.apiKey}`,
				},
				body: {
					model: this.settings.model,
					...baseBody,
				},
			},
			ollama: {
				apiUrl: `${this.settings.ollamaUrl}/api/chat`,
				headers: { "Content-Type": "application/json" },
				body: {
					model: this.settings.model,
					...baseBody,
					stream: false,
				},
			},
			custom: {
				apiUrl: `${this.settings.customUrl}/v1/chat/completions`,
				headers: {
					"Content-Type": "application/json",
				},
				body: {
					...baseBody,
				},
			},
		};

		return providerConfigs[this.settings.provider];
	}

	async makeRequest(messages: ChatMessage[]): Promise<string> {
		const providerConfig = this.getProviderConfig(messages);

		if (!providerConfig) {
			throw new Error("Unsupported provider");
		}

		const { apiUrl, headers, body } = providerConfig;

		const response = await fetch(apiUrl, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		const data: APIResponse = await response.json();

		if (data.error) {
			throw new Error(`API Error: ${data.error.message}`);
		}

		let content = "";

		if (this.settings.provider === "ollama") {
			content = data.message?.content || "";
		} else {
			content = data.choices?.[0]?.message?.content || "";
		}

		if (!content) {
			throw new Error("No response from LLM was received");
		}

		// Clean up any thinking blocks
		return content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
	}
}
