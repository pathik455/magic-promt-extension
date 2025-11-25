document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const userProfile = document.getElementById('user-profile');
    const enhanceBtn = document.getElementById('enhance-btn');
    const copyBtn = document.getElementById('copy-btn');
    const promptInput = document.getElementById('prompt-input');
    const enhancedOutput = document.getElementById('enhanced-output');
    const authSection = document.getElementById('auth-section');
    const appSection = document.getElementById('app-section');
    const resultContainer = document.getElementById('result-container');
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    const errorToast = document.getElementById('error-toast');
    const errorText = document.getElementById('error-text');

    // State
    let currentApiKey = null;

    // Initialization
    init();

    function init() {
        checkApiKey();
        loadHistory();
    }

    // Event Listeners
    saveKeyBtn.addEventListener('click', handleSaveKey);
    userProfile.addEventListener('click', handleLogout);
    enhanceBtn.addEventListener('click', handleEnhance);
    copyBtn.addEventListener('click', handleCopy);

    // Allow Enter key to save API key
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSaveKey();
    });

    // --- Handlers ---

    async function handleSaveKey() {
        const key = apiKeyInput.value.trim();
        if (!key) {
            showError("Please enter a valid API Key.");
            return;
        }

        setAuthLoading(true);
        try {
            // Validate Key by making a dummy call
            await validateApiKey(key);

            // If valid, save and show app
            await chrome.storage.local.set({ geminiApiKey: key });
            currentApiKey = key;
            showApp();
            apiKeyInput.value = ''; // Clear input
        } catch (error) {
            showError("Invalid API Key. Please check and try again.");
            console.error(error);
        } finally {
            setAuthLoading(false);
        }
    }

    function handleLogout() {
        // Clear key
        chrome.storage.local.remove(['geminiApiKey'], () => {
            currentApiKey = null;
            showAuth();
        });
    }

    async function handleEnhance() {
        const rawPrompt = promptInput.value.trim();
        if (!rawPrompt) {
            showError("Please enter a prompt first.");
            return;
        }

        setEnhanceLoading(true);
        try {
            if (!currentApiKey) throw new Error("API Key missing.");

            const enhancedPrompt = await callGeminiAPI(rawPrompt, currentApiKey);

            // Show result
            showResult(enhancedPrompt);

            // Save to history
            saveToHistory(rawPrompt, enhancedPrompt);

        } catch (error) {
            showError(error.message);
            if (error.message.includes("API Key") || error.message.includes("403")) {
                handleLogout(); // Force re-auth if key is bad
            }
        } finally {
            setEnhanceLoading(false);
        }
    }

    function handleCopy() {
        const text = enhancedOutput.innerText;
        navigator.clipboard.writeText(text).then(() => {
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>`;
            copyBtn.style.color = '#10b981';
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
                copyBtn.style.color = '';
            }, 2000);
        });
    }

    // --- Core Logic ---

    function checkApiKey() {
        chrome.storage.local.get(['geminiApiKey'], (result) => {
            if (result.geminiApiKey) {
                currentApiKey = result.geminiApiKey;
                showApp();
            } else {
                showAuth();
            }
        });
    }

    async function validateApiKey(key) {
        // Simple call to list models or generate content to verify key
        // We'll use generateContent with a tiny prompt to be sure it works for generation
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hi" }] }],
                generationConfig: { maxOutputTokens: 1 }
            })
        });

        if (!response.ok) {
            throw new Error("Validation failed");
        }
    }

    async function callGeminiAPI(rawPrompt, key) {
        const metaPrompt = `
You are a prompt engineering expert. Your goal is to rewrite the following raw prompt into a structured "Magic Prompt" format.
The Magic Prompt format is: "Act as [ROLE]. I want you to [ACTION] about [TOPIC] for [AUDIENCE]. Use a [TONE/STYLE] tone. Include [KEY DETAILS]. Format the answer as [FORMAT]."

Instructions:
1. Analyze the raw prompt to extract or infer these elements.
2. If any element is missing, infer a reasonable default based on the context.
3. Output ONLY the enhanced prompt. Do not include any explanations.

Raw Prompt: "${rawPrompt}"
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: metaPrompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to enhance prompt");
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    }

    // --- History Logic ---

    function loadHistory() {
        chrome.storage.local.get(['promptHistory'], (result) => {
            const history = result.promptHistory || [];
            renderHistory(history);
        });
    }

    function saveToHistory(prompt, result) {
        chrome.storage.local.get(['promptHistory'], (data) => {
            let history = data.promptHistory || [];

            // Add new item to top
            const newItem = {
                id: Date.now(),
                prompt: prompt,
                result: result,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            history.unshift(newItem);

            // Keep only last 3
            if (history.length > 3) {
                history = history.slice(0, 3);
            }

            chrome.storage.local.set({ promptHistory: history }, () => {
                renderHistory(history);
            });
        });
    }

    function renderHistory(history) {
        if (history.length === 0) {
            historySection.classList.add('hidden');
            return;
        }

        historySection.classList.remove('hidden');
        historyList.innerHTML = '';

        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-prompt">${escapeHtml(item.prompt)}</div>
                <div class="history-meta">
                    <span>${item.timestamp}</span>
                    <span>Tap to view</span>
                </div>
            `;
            el.addEventListener('click', () => {
                promptInput.value = item.prompt;
                showResult(item.result);
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            historyList.appendChild(el);
        });
    }

    // --- UI Helpers ---

    function showAuth() {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        userProfile.classList.add('hidden');
        hideError();
    }

    function showApp() {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        userProfile.classList.remove('hidden');
        hideError();
        loadHistory(); // Refresh history
    }

    function showResult(text) {
        enhancedOutput.innerText = text;
        resultContainer.classList.remove('hidden');
        hideError();
    }

    function showError(msg) {
        errorText.textContent = msg;
        errorToast.classList.remove('hidden');
        setTimeout(() => {
            errorToast.classList.add('hidden');
        }, 3000);
    }

    function hideError() {
        errorToast.classList.add('hidden');
    }

    function setAuthLoading(isLoading) {
        if (isLoading) {
            saveKeyBtn.disabled = true;
            saveKeyBtn.innerHTML = `<span>Verifying...</span>`;
        } else {
            saveKeyBtn.disabled = false;
            saveKeyBtn.innerHTML = `<span>Connect</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>`;
        }
    }

    function setEnhanceLoading(isLoading) {
        if (isLoading) {
            enhanceBtn.disabled = true;
            enhanceBtn.innerHTML = `<span class="btn-text">Enhancing...</span>`;
            resultContainer.classList.add('hidden');
        } else {
            enhanceBtn.disabled = false;
            enhanceBtn.innerHTML = `<span class="btn-text">Enhance Prompt</span><span class="sparkles">✨</span>`;
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
