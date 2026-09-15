# Privacy Policy for Magic Prompt Enhancer

**Last updated:** September 15, 2026

This Privacy Policy explains how **Magic Prompt Enhancer** ("the Extension", "we", "us", or "our") handles user data. We are committed to protecting your privacy and ensuring transparency regarding any information processed while using the Extension.

---

## 1. Overview and Core Philosophy

Magic Prompt Enhancer is a client-side productivity tool designed to rewrite and optimize user prompts using the Google Gemini API. 

**We do not collect, sell, or monetize user data.** The Extension operates without any custom backend servers, tracking scripts, or telemetry services.

---

## 2. Information We Process and Store

### A. Google Gemini API Key
* **Purpose:** Required to authenticate your requests directly with Google's Generative Language API.
* **Storage:** Stored locally on your device using Chrome's sandboxed `chrome.storage.local` API.
* **Transmission:** Sent directly and securely (via HTTPS/TLS) to `generativelanguage.googleapis.com`. It is **never** transmitted to the developer or any third-party intermediary.

### B. User Prompts
* **Purpose:** The text you enter is sent to the Google Gemini API solely to generate an enhanced prompt.
* **Transmission:** Prompts are transmitted directly from your browser to Google's API servers.
* **Storage:** Prompts are not stored on any developer-owned servers.

### C. Recent Prompt History
* **Purpose:** To allow you to review and copy your recent prompt enhancements.
* **Storage:** The last 3 prompts and results are saved strictly locally in your browser's `chrome.storage.local`.
* **Retention:** You can clear this data at any time by logging out or uninstalling the extension.

---

## 3. Information We Do NOT Collect

* We do **NOT** collect your name, email address, IP address, browsing history, or device identifiers.
* We do **NOT** use tracking cookies, analytics SDKs, advertising networks, or user fingerprinting.
* We do **NOT** send any data to external servers other than the official Google API endpoints specified in the extension permissions.

---

## 4. Third-Party Services

The Extension communicates directly with:
* **Google Gemini API (Google LLC)**: Used for prompt processing. Your interactions with the Google Gemini API are governed by [Google's Privacy Policy](https://policies.google.com/privacy) and [Google AI Studio Terms of Service](https://ai.google.dev/terms).

---

## 5. Data Control and Deletion

You retain full control over your data:
* **Log Out**: Clicking the avatar / logout button in the extension immediately clears your saved API key and cached model data from local storage.
* **Uninstall**: Removing the extension from Chrome deletes all locally stored data, including prompt history and configuration.

---

## 6. Permissions Justification

* `storage`: Used solely to save your API key and recent prompt history locally on your device.
* `host_permissions` (`https://generativelanguage.googleapis.com/*`): Used exclusively to communicate directly with Google's official Gemini API servers.

---

## 7. Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted in this repository with an updated revision date.

---

## 8. Contact

If you have questions or concerns regarding this Privacy Policy, please open an issue on the [GitHub Repository](https://github.com/pathik455/magic-promt-extension).
