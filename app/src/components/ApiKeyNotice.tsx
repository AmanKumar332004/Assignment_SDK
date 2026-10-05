import React, { useState } from "react";

export interface ApiKeyNoticeProps {
  apiKey: string;
  onSetTempKey: (key: string) => void;
}

export function ApiKeyNotice({ apiKey, onSetTempKey }: ApiKeyNoticeProps): React.JSX.Element | null {
  const [inputKey, setInputKey] = useState("");
  const [dismissed, setDismissed] = useState(false);

  if (apiKey && apiKey.trim().length > 0 && apiKey !== "your_pexels_api_key_here") {
    return null;
  }

  if (dismissed) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      onSetTempKey(inputKey.trim());
    }
  };

  return (
    <aside className="setup-banner" role="region" aria-label="API key configuration needed">
      <div className="setup-banner-title">
        <span>🔑</span>
        <span>Pexels API Key Needed</span>
      </div>
      <div className="setup-banner-body">
        <p>
          No valid Pexels API key was detected in your local environment. To view live photos and
          videos from Pexels:
        </p>
        <ol style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>
          <li>
            Get a free key from{" "}
            <a
              href="https://www.pexels.com/api/"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#93c5fd", textDecoration: "underline" }}
            >
              pexels.com/api
            </a>
          </li>
          <li>
            Create a local file <code>.env.local</code> in the project root with{" "}
            <code>VITE_PEXELS_API_KEY=your_key</code>
          </li>
          <li>Or enter your key below for immediate temporary testing in this browser session:</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="setup-input-group">
        <input
          type="password"
          placeholder="Paste Pexels API Key for temporary session..."
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          className="search-input"
          style={{ maxWidth: "380px" }}
          aria-label="Temporary Pexels API Key"
        />
        <button type="submit" className="btn btn-primary" disabled={!inputKey.trim()}>
          Apply Key
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="btn btn-ghost"
          style={{ fontSize: "0.8rem" }}
        >
          Dismiss
        </button>
      </form>
    </aside>
  );
}

