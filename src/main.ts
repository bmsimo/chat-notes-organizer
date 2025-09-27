import { Plugin } from "obsidian";
import { OrganizerSettings } from "./types";
import { DEFAULT_SETTINGS } from "./settings";
import { registerCommands } from "./commands";
import { OrganizerSettingTab } from "./ui/settings-tab";

export default class OrganizerPlugin extends Plugin {
	settings: OrganizerSettings;

	async onload() {
		await this.loadSettings();
		registerCommands(this);
		this.addSettingTab(new OrganizerSettingTab(this.app, this));
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
