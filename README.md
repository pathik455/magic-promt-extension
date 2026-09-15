# Magic Prompt Enhancer ✨

A Chrome Extension that transforms simple prompts into structured, high-quality "Magic Prompts" using the Google Gemini API.

## 🤖 Built with AI

This project was developed using **Google's Agentic Coding Assistant**. The entire process, from planning to implementation and debugging, was driven by AI collaboration.

**Key AI Contributions:**
*   **Architecture**: Designed the extension structure (Manifest V3, Popup UI, Background scripts).
*   **Authentication**: Refactored from complex OAuth 2.0 to a streamlined API Key system for better user experience.
*   **Prompt Engineering**: Crafted the "Meta-Prompt" that instructs Gemini how to enhance user inputs.
*   **UI/UX Design**: Created a production-ready, dark-mode interface with animations and responsive feedback.
*   **Debugging**: Solved complex OAuth scope issues by pivoting to a simpler architectural choice.

## 📂 File Structure

```text
magic-promt-extension/
├── manifest.json       # Extension configuration (permissions, icons, version)
├── popup.html          # Main user interface structure
├── popup.css           # Styling (Dark mode, animations, responsive design)
├── popup.js            # Core logic (API calls, storage, UI interactions)
├── images/             # Icon assets
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md           # Project documentation
└── PUBLISHING.md       # Deployment and security guide
```

## 📚 Method Documentation

The core logic resides in `popup.js`. Here is an overview of the key functions:

### Authentication & Storage
*   `checkApiKey()`: Checks `chrome.storage.local` for a saved API key on startup. Toggles between Auth and App views.
*   `handleSaveKey()`: Validates the user-inputted API key by making a test request. If successful, saves it to local storage.
*   `validateApiKey(key)`: Sends a minimal request to the Gemini API to ensure the key is active and valid before saving.
*   `handleLogout()`: Removes the API key from storage and resets the UI to the authentication state.

### Core Functionality
*   `handleEnhance()`: Orchestrates the prompt enhancement process. Shows loading states, calls the API, and handles errors.
*   `callGeminiAPI(rawPrompt, key)`: Constructs the payload with the system instructions and sends a request using the latest Gemini API.
    *   **Model**: Uses Google's latest `gemini-3.8-flash` model via the **Interactions API** (`v1beta/interactions`) with automatic fallback to `generateContent` (`gemini-3.8-flash` and `gemini-2.5-flash`).
*   `saveToHistory(prompt, result)`: Manages a FIFO queue of the last 3 prompts in local storage.

### UI Helpers
*   `showAuth()` / `showApp()`: Toggles visibility of the login vs. main application sections.
*   `showResult(text)`: Displays the enhanced prompt and the "Copy" button.
*   `renderHistory(history)`: Dynamically generates the history list UI from stored data.
*   `showError(msg)`: Displays a temporary toast notification for errors.
