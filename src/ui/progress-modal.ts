import { App, Modal } from "obsidian";

export class ProgressModal extends Modal {
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
