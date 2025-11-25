# Publishing & Security Guide 🚀

This guide outlines the steps to publish the **Magic Prompt Enhancer** to the Chrome Web Store, along with notes on scalability and security.

## 📦 How to Publish

### 1. Prepare the Package
1.  **Test Thoroughly**: Ensure all features (Auth, Enhance, History, Logout) work as expected.
2.  **Clean Up**: Remove any unused files (e.g., `.DS_Store`, test files).
3.  **Zip the Folder**: Compress the entire `magic-promt-extension` directory into a `.zip` file.

### 2. Chrome Web Store Developer Dashboard
1.  Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  **Register**: You will need to pay a one-time $5 registration fee if you haven't already.
3.  **Create New Item**: Click the "New Item" button.
4.  **Upload**: Drag and drop your `.zip` file.

### 3. Store Listing
1.  **Description**: Write a compelling description. Mention that it uses Gemini AI to help write better prompts.
2.  **Screenshots**: Take screenshots of the extension in action (Login screen, Enhanced result, Dark mode UI).
3.  **Category**: Choose "Productivity" or "Search Tools".
4.  **Privacy Policy**: Since you are not collecting user data on a server (everything is local or sent directly to Google API), state that:
    *   "This extension does not collect or store user data on external servers."
    *   "API Keys are stored locally on the user's device."
    *   "Prompts are sent directly to the Google Gemini API for processing."

### 4. Submit for Review
1.  Click **"Submit for Review"**.
2.  Google's team will review the extension (usually takes 1-3 days).

---

## 📈 Scalability

### API Quotas
*   **Current Setup**: The extension uses the **User's API Key**. This is the most scalable approach for a free extension because **you (the developer) do not pay for the usage**. Each user brings their own quota.
*   **Gemini Free Tier**: The free tier of Gemini API is generous (currently 15 RPM - Requests Per Minute). This is sufficient for individual use.
*   **Rate Limiting**: The extension handles errors gracefully. If a user hits their limit, they will see an error message and can try again later.

### Client-Side Processing
*   The extension is "serverless". All logic runs in the user's browser.
*   There is **zero infrastructure cost** for you. It can scale to millions of users without you needing to upgrade any servers.

---

## 🔒 Security

### API Key Safety
*   **Local Storage**: API Keys are stored in `chrome.storage.local`. This is sandboxed to the extension and cannot be accessed by other websites.
*   **Direct Communication**: The key is sent directly from the browser to `generativelanguage.googleapis.com`. It never passes through a middleman server.
*   **No Hardcoded Secrets**: The source code contains **no secrets**. The `manifest.json` and `popup.js` are safe to be public.

### Content Security Policy (CSP)
*   Manifest V3 enforces a strict CSP by default.
*   We have configured `host_permissions` to only allow `https://generativelanguage.googleapis.com/*`. This prevents the extension from sending data to unauthorized servers.

### Data Privacy
*   **History**: The "History" feature stores data locally on the device. It is not synced to the cloud unless the user enables Chrome Sync (which is encrypted by Google).
*   **User Trust**: By asking users for their own key, you establish trust that you are not mining their data.
