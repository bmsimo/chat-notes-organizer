import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
	Modal,
} from "obsidian";

import ISO6391 from "iso-639-1";

interface OrganizerSettings {
	apiKey: string;
	model: string;
	provider: "openai" | "openrouter" | "ollama" | "custom";
	customUrl: string;
	ollamaUrl: string;
	targetLanguage: string;
}

const DEFAULT_SETTINGS: OrganizerSettings = {
	apiKey: "",
	model: "gpt-5-nano",
	provider: "openai",
	customUrl: "",
	ollamaUrl: "http://localhost:11434",
	targetLanguage: "es",
};

export default class OrganizerPlugin extends Plugin {
	settings: OrganizerSettings;

	async onload() {
		await this.loadSettings();

		// Añadir botón en la sidebar
		this.addRibbonIcon("wand", "Organize current note", async () => {
			await this.organizeCurrentFile();
		});

		// Ajustes del plugin
		this.addSettingTab(new OrganizerSettingTab(this.app, this));
	}

	async organizeCurrentFile() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No hay archivo activo.");
			return;
		}

		const modal = new ProgressModal(this.app);
		modal.open();

		try {
			const content = await this.app.vault.read(activeFile);

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
5. The final result must be written in the target language: ${this.settings.targetLanguage}.
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

			const messages = [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			];

			const baseBody = {
				messages,
			};

			const providerConfigs: Record<
				string,
				{ apiUrl: string; headers: Record<string, string>; body: any }
			> = {
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

			const providerConfig = providerConfigs[this.settings.provider];

			if (!providerConfig) {
				new Notice("Error: unsupported provider.");
				return;
			}

			const { apiUrl, headers, body } = providerConfig;

			const response = await fetch(apiUrl, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (data.error) {
				new Notice("Error de la API: " + data.error.message);
				return;
			}

			let organizedContent = "";

			if (this.settings.provider === "ollama") {
				organizedContent = data.message?.content || "";
			} else {
				organizedContent = data.choices?.[0]?.message?.content || "";
			}

			if (!organizedContent) {
				new Notice("Error: no response from LLM was received.");
				return;
			}

			organizedContent = organizedContent
				.replace(/<think>[\s\S]*?<\/think>/gi, "")
				.trim();

			await this.app.vault.modify(activeFile, organizedContent);
			new Notice("Note organized successfully 🚀");
		} catch (error) {
			console.error(error);
			new Notice("Error: " + error);
		} finally {
			modal.close();
		}
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class OrganizerSettingTab extends PluginSettingTab {
	plugin: OrganizerPlugin;

	constructor(app: App, plugin: OrganizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Chat Notes Organizer Plugin",
		});

		let customUrlSetting: Setting;
		let apiKeySetting: Setting;

		const updateCustomVisibility = () => {
			if (!customUrlSetting) {
				return;
			}
			customUrlSetting.settingEl.style.display =
				this.plugin.settings.provider === "custom" ? "" : "none";
		};

		const updateApiKeyVisibility = () => {
			if (!apiKeySetting) {
				return;
			}
			const show =
				this.plugin.settings.provider === "openai" ||
				this.plugin.settings.provider === "openrouter";
			apiKeySetting.settingEl.style.display = show ? "" : "none";
		};

		new Setting(containerEl)
			.setName("Provider")
			.setDesc("Select the model provider to use")
			.addDropdown((drop) =>
				drop
					.addOption("openai", "OpenAI")
					.addOption("openrouter", "OpenRouter")
					.addOption("ollama", "Ollama")
					.addOption("custom", "Custom")
					.setValue(this.plugin.settings.provider)
					.onChange(async (value) => {
						this.plugin.settings.provider =
							value as OrganizerSettings["provider"];
						updateCustomVisibility();
						updateApiKeyVisibility();
						await this.plugin.saveSettings();
					})
			);

		apiKeySetting = new Setting(containerEl)
			.setName("OpenAI API Key")
			.setDesc("Enter your OpenAI or OpenRouter API Key")
			.addText((text) =>
				text
					.setPlaceholder("sk-...")
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					})
			);

		updateApiKeyVisibility();

		new Setting(containerEl)
			.setName("Model")
			.setDesc("Model to use (e.g. gpt-4o-mini, gpt-3.5-turbo, etc.)")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.plugin.saveSettings();
					})
			);

		customUrlSetting = new Setting(containerEl)
			.setName("Custom URL")
			.setDesc(
				"Endpoint for making requests when using a custom provider"
			)
			.addText((text) =>
				text
					.setPlaceholder("https://mi-servidor.com/api/chat")
					.setValue(this.plugin.settings.customUrl)
					.onChange(async (value) => {
						this.plugin.settings.customUrl = value;
						await this.plugin.saveSettings();
					})
			);

		updateCustomVisibility();

		new Setting(containerEl)
			.setName("Output Language")
			.setDesc("Select the language for organized notes")
			.addDropdown((drop) => {
				ISO6391.getAllCodes().forEach((code) => {
					drop.addOption(code, ISO6391.getName(code));
				});
				drop.setValue(this.plugin.settings.targetLanguage);
				drop.onChange(async (value) => {
					this.plugin.settings.targetLanguage = value;
					await this.plugin.saveSettings();
				});
			});
	}
}

class ProgressModal extends Modal {
	progressEl: HTMLProgressElement;
	interval: number;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass("progress-modal");

		// Add spinner container
		const spinnerContainer = contentEl.createDiv({
			cls: "spinner-container",
		});
		const spinner = spinnerContainer.createDiv({ cls: "spinner" });

		// Add status text
		contentEl.createEl("h3", {
			text: "Organizing note...",
			cls: "status-text",
		});

		// Add some basic styles
		const style = document.createElement("style");
		style.textContent = `
			.progress-modal {
				text-align: center;
				padding: 20px;
			}
			.spinner-container {
				display: flex;
				justify-content: center;
				margin: 20px 0;
			}
			.spinner {
				width: 40px;
				height: 40px;
				border: 4px solid #f3f3f3;
				border-top: 4px solid #3498db;
				border-radius: 50%;
				animation: spin 1s linear infinite;
			}
			.status-text {
				margin-top: 15px;
				color: var(--text-normal);
			}
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
		`;
		contentEl.appendChild(style);
	}

	onClose() {
		clearInterval(this.interval);
	}
}
