import { Notice } from "obsidian";
import { APIService } from "../utils/api-service";
import { generatePrompts } from "../utils/prompts";
import { ProgressModal } from "../ui/progress-modal";
import { OrganizerSettings } from "../types";

export async function organizeCurrentFile(app: any, settings: OrganizerSettings): Promise<void> {
	const activeFile = app.workspace.getActiveFile();
	if (!activeFile) {
		new Notice("No hay archivo activo.");
		return;
	}

	const modal = new ProgressModal(app);
	modal.open();

	try {
		const content = await app.vault.read(activeFile);
		const messages = generatePrompts(content, settings.targetLanguage);
		
		const apiService = new APIService(settings);
		const organizedContent = await apiService.makeRequest(messages);

		await app.vault.modify(activeFile, organizedContent);
		new Notice("Note organized successfully 🚀");
	} catch (error) {
		console.error(error);
		new Notice("Error: " + error);
	} finally {
		modal.close();
	}
}
