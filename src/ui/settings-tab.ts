import { App, PluginSettingTab, Setting } from "obsidian";
import ISO6391 from "iso-639-1";
import { OrganizerSettings } from "../types";

export class OrganizerSettingTab extends PluginSettingTab {
	plugin: any; // Plugin reference

	constructor(app: App, plugin: any) {
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
			customUrlSetting.settingEl.classList.toggle(
				"d-none",
				this.plugin.settings.provider !== "custom"
			);
		};

		const updateApiKeyVisibility = () => {
			if (!apiKeySetting) {
				return;
			}
			const show =
				this.plugin.settings.provider === "openai" ||
				this.plugin.settings.provider === "openrouter";
			apiKeySetting.settingEl.classList.toggle("d-none", !show);
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
