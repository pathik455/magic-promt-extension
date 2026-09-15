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
            showError(error.message || "Invalid API Key. Please check and try again.");
            console.error(error);
        } finally {
            setAuthLoading(false);
        }
    }

    function handleLogout() {
        // Clear key and cached model
        chrome.storage.local.remove(['geminiApiKey', 'activeGeminiModel'], () => {
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

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function fetchAvailableModels(key) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
            if (!response.ok) return [];
            const data = await response.json();
            if (!Array.isArray(data.models)) return [];

            return data.models
                .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
                .map(m => (m.name || '').replace(/^models\//, ''))
                .filter(Boolean);
        } catch {
            return [];
        }
    }

    function selectBestModel(models) {
        if (!Array.isArray(models) || models.length === 0) return 'gemini-1.5-flash';

        const modelNames = models.map(m => (typeof m === 'string' ? m : m.name || '').replace(/^models\//, ''));
        const preferenceList = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-2.5-flash',
            'gemini-1.5-pro',
            'gemini-2.0-flash',
            'gemini-3.8-flash'
        ];

        for (const pref of preferenceList) {
            if (modelNames.includes(pref)) {
                return pref;
            }
        }

        return modelNames[0] || 'gemini-1.5-flash';
    }

    async function validateApiKey(key) {
        // Official Google recommended method: query models endpoint to verify key validity
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || "Invalid API Key. Please verify your key in Google AI Studio.");
        }

        const data = await response.json();
        const models = data.models || [];
        const bestModel = selectBestModel(models);
        if (bestModel) {
            await chrome.storage.local.set({ activeGeminiModel: bestModel });
        }
    }

    function getActiveModel() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['activeGeminiModel'], (result) => {
                resolve(result.activeGeminiModel || 'gemini-1.5-flash');
            });
        });
    }

    function buildModelCandidates(availableModels, activeModel) {
        const priority = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-2.5-flash',
            'gemini-1.5-pro',
            'gemini-2.0-flash',
            'gemini-3.8-flash'
        ];

        const list = [];
        if (activeModel) list.push(activeModel);

        if (availableModels && availableModels.length > 0) {
            for (const p of priority) {
                if (availableModels.includes(p) && !list.includes(p)) list.push(p);
            }
            for (const m of availableModels) {
                if (!list.includes(m)) list.push(m);
            }
        } else {
            for (const p of priority) {
                if (!list.includes(p)) list.push(p);
            }
        }

        return list;
    }

    async function callGeminiAPI(rawPrompt, key) {
        const metaPrompt = `You are a prompt engineering expert. Your goal is to rewrite the following raw prompt into a structured "Magic Prompt" format.
The Magic Prompt format is: "Act as [ROLE]. I want you to [ACTION] about [TOPIC] for [AUDIENCE]. Use a [TONE/STYLE] tone. Include [KEY DETAILS]. Format the answer as [FORMAT]."

Instructions:
1. Analyze the raw prompt to extract or infer these elements.
2. If any element is missing, infer a reasonable default based on the context.
3. Output ONLY the enhanced prompt. Do not include any explanations.

Raw Prompt: "${rawPrompt}"`;

        const availableModels = await fetchAvailableModels(key);
        const activeModel = await getActiveModel();
        const modelsToTry = buildModelCandidates(availableModels, activeModel);

        let lastError = null;

        for (const model of modelsToTry) {
            // Up to 2 attempts per model (with backoff on high demand)
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: metaPrompt }] }]
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            // Persist working model
                            chrome.storage.local.set({ activeGeminiModel: model });
                            return text.trim();
                        }
                    }

                    const errData = await response.json().catch(() => ({}));
                    const errMsg = errData.error?.message || `HTTP ${response.status}`;
                    const status = response.status;

                    // Stop immediately if it's an authentic authorization rejection
                    if ((status === 400 && errMsg.toLowerCase().includes('api key')) || status === 401 || status === 403) {
                        throw new Error(errMsg);
                    }

                    const isHighDemand = status === 503 || status === 429 || errMsg.toLowerCase().includes('demand') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource');

                    lastError = new Error(errMsg);

                    if (isHighDemand && attempt === 1) {
                        // Quick 1-second pause to let the micro-burst pass before retrying
                        await sleep(1000);
                        continue;
                    }

                    // Move to the next alternative model
                    break;
                } catch (err) {
                    if (err.message && (err.message.toLowerCase().includes('api key') || err.message.includes('401') || err.message.includes('403'))) {
                        throw err;
                    }
                    lastError = err;
                    break;
                }
            }
        }

        throw lastError || new Error("Gemini models are experiencing high demand right now. Please wait a moment and try again.");
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
