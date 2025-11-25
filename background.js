// Background script
// Currently not heavily used, but good to have for future expansion or keeping the service worker active if needed.

chrome.runtime.onInstalled.addListener(() => {
    console.log("Magic Prompt Enhancer installed.");
});
