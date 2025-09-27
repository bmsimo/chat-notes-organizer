import { organizeCurrentFile } from "./organize-command";

export function registerCommands(plugin: any) {
	// Add ribbon icon
	plugin.addRibbonIcon("wand", "Organize current note", async () => {
		await organizeCurrentFile(plugin.app, plugin.settings);
	});

	// Add command
	plugin.addCommand({
		id: "organize-current-note",
		name: "Organize current note",
		callback: async () => {
			await organizeCurrentFile(plugin.app, plugin.settings);
		},
	});
}
