# What is Chat Notes Organizer?

Chat Notes Organizer is an Obsidian plugin that transforms messy chat transcripts or unstructured text into clean, organized Markdown notes. It’s designed for people who paste content from messaging apps, support chats, or brainstorming sessions into Obsidian and want a fast, reliable way to turn that into structured, readable notes.

The plugin uses an LLM (configurable provider and model) to:
- Detect multiple topics in a single chat or note.
- Split content into clearly titled sections.
- Extract the main ideas and sub-ideas.
- Remove noise and redundancies.
- Output clean, hierarchical Markdown ready for Obsidian.

# Key Features

- Organize the currently active note with one click.
- Automatically split content into thematic sections with meaningful titles.
- Hierarchical formatting with headings and bullet points.
- Works with multiple providers: OpenAI, OpenRouter, Ollama (local), and Custom endpoints.
- Output language is configurable via a convenient dropdown of ISO 639-1 language codes.
- Lightweight progress modal with a spinner while the note is being processed.
- Safe output policy: removes chain-of-thought or special <think> blocks if present.

# How It Works

1. Retrieve the active file
   - `this.app.workspace.getActiveFile()` is used to get the current note. If there is no active note, a Notice is shown and the operation stops.

2. Show a progress modal
   - A small progress modal opens showing a spinner and the text “Organizing note...”.

3. Read note contents
   - The plugin reads the file contents via `this.app.vault.read(activeFile)`.

4. Build the prompts
   - A carefully crafted `systemPrompt` sets expectations for the LLM:
     - Detect multiple topics and split into independent sections.
     - Give each section a clear title.
     - Organize content hierarchically with headings and bullet points.
     - Remove noise and redundancies.
     - Output clean Markdown.
     - Write the final result in the configured target language.
     - Do not include chain-of-thought or reasoning traces.
   - A `userPrompt` wraps your note content and asks the LLM to perform the organization.

5. Select the provider and construct the request
   - The provider is selected from settings: `openai`, `openrouter`, `ollama`, or `custom`.
   - Each provider has its own request shape:
     - OpenAI: POST to `https://api.openai.com/v1/chat/completions` with Bearer API Key and model from settings.
     - OpenRouter: POST to `https://openrouter.ai/api/v1/chat/completions` with Bearer API Key and model.
     - Ollama: POST to `{ollamaUrl}/api/chat` with `{ model, messages, stream: false }`. No API Key required.
     - Custom: POST to `{customUrl}/v1/chat/completions` with `messages` (provide your own server and auth if needed).

6. Send the request
   - The plugin performs a `fetch` with the correct headers and body for the chosen provider.

7. Parse the response
   - For OpenAI/OpenRouter/Custom: reads `data.choices?.[0]?.message?.content`.
   - For Ollama: reads `data.message?.content`.
   - If the API returns an error or the content is empty, a Notice explains the problem.

8. Sanitize and write the result
   - Any `<think>...</think>` blocks are removed to avoid chain-of-thought content.
   - The organized Markdown fully replaces the content of the currently active note via `this.app.vault.modify(activeFile, organizedContent)`.
   - A success Notice appears: “Note organized successfully 🚀”.

9. Close the modal
   - The progress modal always closes in a `finally` block to ensure a clean user experience.

# UI and Interaction

- Ribbon Button
  - The plugin adds a ribbon icon labeled “Organize current note”.
  - Click it to organize the note currently open in your active editor pane.

- Progress Modal
  - A minimal modal with a CSS-based spinner and a status line appears while the plugin calls the model and waits for a response.
  - Closes automatically when the process finishes or if an error happens.

# Settings

Open Obsidian Settings → Community Plugins → Chat Notes Organizer Plugin to configure:

- Provider
  - Choose between:
    - OpenAI
    - OpenRouter
    - Ollama (local models)
    - Custom (your own server endpoint)

- OpenAI API Key
  - Only shown when Provider is OpenAI or OpenRouter.
  - Set your API key here.

- Model
  - The model identifier to use (e.g., `gpt-4o-mini`, `gpt-3.5-turbo`, or an Ollama model name like `llama3`).
  - For OpenRouter, use a supported model string listed by OpenRouter.
  - For Custom endpoints, this is not passed.

- Custom URL
  - Only shown when Provider is set to Custom.
  - Base URL for your server. The plugin will call `{customUrl}/v1/chat/completions`.

- Output Language
  - Select the target language for the final organized note.
  - Uses ISO 639-1 language codes and names (e.g., `en`, `es`, `fr`, `de`, etc.).

# Providers and Authentication

- OpenAI
  - Requires an API key. The request is sent to `https://api.openai.com/v1/chat/completions`.
  - Headers: `Authorization: Bearer <API_KEY>`.

- OpenRouter
  - Requires an API key. The request is sent to `https://openrouter.ai/api/v1/chat/completions`.
  - Headers: `Authorization: Bearer <API_KEY>`.

- Ollama (Local)
  - No API key required.
  - Default URL: `http://localhost:11434/api/chat` (configurable base in settings).
  - Make sure Ollama is running locally and the model is available.

- Custom
  - If we're using something like LM Studio
  - Endpoint format: `{customUrl}/v1/chat/completions`.

# Privacy and Data Handling

- Your note’s content is sent to the configured provider to generate the organized version.
- If you use local models via Ollama, the data does not leave your machine.
- If you use OpenAI, OpenRouter, or a Custom remote provider, content is transmitted over the network to that service.
- The plugin does not store your content externally; it only replaces the content of the current note with the returned Markdown.

# Error Handling

- No active note: shows a Notice and exits safely.
- Provider not supported: shows a Notice if settings are misconfigured.
- API error response: shows a descriptive Notice with the API error message where available.
- Empty response: shows a Notice if the LLM did not produce content.
- All errors close the progress modal cleanly.

# Requirements

- Obsidian with Community Plugins enabled.
- For OpenAI/OpenRouter: a valid API key and network connectivity.
- For Ollama: Ollama installed and running locally; model pulled.
- For Custom: a compatible server exposing a `chat/completions`-style endpoint.

# Usage

1. Open a note that contains raw chat logs or unstructured text.
2. Click the ribbon icon “Organize current note”.
3. Wait for the spinner modal to complete.
4. Your note content will be replaced with clean, structured Markdown.

# Tips

- Keep the note content reasonably sized for your model or provider limits.
- Choose a target language that matches how you prefer to read your notes.
- Experiment with different models for speed vs. quality.
- For local-first workflows, try Ollama with a capable local model.

# Troubleshooting

- If nothing happens:
  - Ensure there’s an active note.
  - Check the provider settings and API key if using OpenAI/OpenRouter.
  - Verify your Custom URL or Ollama URL is correct and reachable.

- If the result is empty or low-quality:
  - Try a different model (e.g., a higher-capability model).
  - Ensure the source content is present and not empty.
  - Try again; sometimes non-deterministic models produce variable quality.

- If you see chain-of-thought artifacts:
  - The plugin already removes `<think> ... </think>` blocks. If your provider uses other tags, consider adjusting your server or model configuration to avoid returning hidden reasoning.
