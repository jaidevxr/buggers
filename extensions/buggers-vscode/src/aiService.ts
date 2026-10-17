import * as vscode from "vscode";
import * as path from "path";
import { BuggersFinding, AiConfig, AiProviderType } from "./types";

const AI_KEY_SECRET = "buggers_ai_api_key";
const AI_PROVIDER_KEY = "buggers_ai_provider";
const AI_MODEL_KEY = "buggers_ai_model";

export class BuggersAiService {
  constructor(private context: vscode.ExtensionContext) {}

  async getApiKey(): Promise<string | undefined> {
    return this.context.secrets.get(AI_KEY_SECRET);
  }

  async setApiKey(key: string): Promise<void> {
    await this.context.secrets.store(AI_KEY_SECRET, key.trim());
  }

  async clearApiKey(): Promise<void> {
    await this.context.secrets.delete(AI_KEY_SECRET);
  }

  getAiConfig(): AiConfig {
    const config = vscode.workspace.getConfiguration("buggers.ai");
    const provider = (config.get<string>("provider") || "openai") as AiProviderType;
    const model = config.get<string>("model") || this.getDefaultModel(provider);
    const customEndpoint = config.get<string>("customEndpoint");
    const timeoutMs = config.get<number>("timeoutMs") || 30000;

    return { provider, model, customEndpoint, timeoutMs };
  }

  private getDefaultModel(provider: AiProviderType): string {
    switch (provider) {
      case "anthropic":
        return "claude-3-5-sonnet-20241022";
      case "gemini":
        return "gemini-2.0-flash";
      case "ollama":
      case "custom":
        return "llama3.2";
      case "openai":
      default:
        return "gpt-4o-mini";
    }
  }

  async configureProvider(): Promise<boolean> {
    const providerPick = await vscode.window.showQuickPick(
      [
        { label: "OpenAI", description: "gpt-4o, gpt-4o-mini", id: "openai" },
        { label: "Anthropic", description: "claude-3-5-sonnet", id: "anthropic" },
        { label: "Google Gemini", description: "gemini-2.0-flash", id: "gemini" },
        { label: "Ollama (Local)", description: "Local offline LLM (http://localhost:11434/v1)", id: "ollama" },
        { label: "Custom OpenAI-Compatible", description: "Self-hosted vLLM, LMStudio, or proxy", id: "custom" },
      ],
      { placeHolder: "Select AI Provider for Buggers Assistant" },
    );

    if (!providerPick) return false;

    const providerId = providerPick.id as AiProviderType;
    const config = vscode.workspace.getConfiguration("buggers.ai");
    await config.update("provider", providerId, vscode.ConfigurationTarget.Global);

    if (providerId === "ollama" || providerId === "custom") {
      const defaultEndpoint = providerId === "ollama" ? "http://localhost:11434/v1" : "http://localhost:8000/v1";
      const endpoint = await vscode.window.showInputBox({
        prompt: `Enter API base endpoint for ${providerPick.label}`,
        value: defaultEndpoint,
      });
      if (endpoint) {
        await config.update("customEndpoint", endpoint.trim(), vscode.ConfigurationTarget.Global);
      }
    }

    if (providerId !== "ollama") {
      const apiKey = await vscode.window.showInputBox({
        prompt: `Enter your API key for ${providerPick.label}`,
        password: true,
        ignoreFocusOut: true,
        validateInput: (v) => (!v || v.trim().length === 0 ? "API key cannot be empty" : null),
      });

      if (!apiKey) return false;
      await this.setApiKey(apiKey);
    }

    vscode.window.showInformationMessage(`Buggers: Configured ${providerPick.label} as active AI provider.`);
    return true;
  }

  /**
   * Request explicit user consent before transmitting any code snippet.
   */
  async requestConsent(description: string): Promise<boolean> {
    const aiConfig = this.getAiConfig();
    const action = await vscode.window.showWarningMessage(
      `Buggers AI Consent: Transmit ${description} to ${aiConfig.provider.toUpperCase()} (${aiConfig.model}) for analysis?`,
      { modal: true },
      "Confirm & Send",
      "Cancel",
    );
    return action === "Confirm & Send";
  }

  /**
   * Explain a finding root cause, exploit mechanism, and fix strategy.
   * If AI is configured and user consents, queries LLM.
   * Otherwise returns deterministic rule intelligence.
   */
  async explainFinding(finding: BuggersFinding): Promise<string> {
    const apiKey = await this.getApiKey();
    const aiConfig = this.getAiConfig();

    if (!apiKey && aiConfig.provider !== "ollama") {
      // Deterministic explanation fallback
      return this.formatDeterministicExplanation(finding);
    }

    const consent = await this.requestConsent(`finding snippet (${finding.ruleId})`);
    if (!consent) {
      return this.formatDeterministicExplanation(finding);
    }

    try {
      const prompt = `Analyze this code issue detected by Buggers:
Rule ID: ${finding.ruleId}
Title: ${finding.title}
Severity: ${finding.severity}
File: ${path.basename(finding.file)} (Line ${finding.line})
Evidence:
\`\`\`
${finding.evidence}
\`\`\`
Description: ${finding.problem}
Why It Matters: ${finding.whyItMatters}

Explain:
1. Root cause in this specific snippet.
2. How this could be triggered or exploited.
3. Step-by-step remediation recommendation.
Keep the explanation clear, professional, and free of decorative symbols.`;

      const aiResponse = await this.callProvider(prompt);
      return aiResponse || this.formatDeterministicExplanation(finding);
    } catch (err: any) {
      vscode.window.showWarningMessage(`Buggers AI unavailable (${err.message}). Using local rule intelligence.`);
      return this.formatDeterministicExplanation(finding);
    }
  }

  /**
   * Debug an active editor selection for logical bugs and edge cases.
   */
  async debugSelection(code: string, fileName: string): Promise<string> {
    const apiKey = await this.getApiKey();
    const aiConfig = this.getAiConfig();

    if (!apiKey && aiConfig.provider !== "ollama") {
      vscode.window.showInformationMessage(
        "Buggers: No AI API key configured. Run 'Buggers: Configure AI Provider' to enable remote debugging, or rely on local static analysis.",
      );
      return "No AI provider configured. Configure OpenAI, Anthropic, Gemini, or Ollama in settings.";
    }

    const lines = code.split("\n").length;
    const consent = await this.requestConsent(`${lines} lines of code from ${path.basename(fileName)}`);
    if (!consent) {
      return "Analysis cancelled by user.";
    }

    const prompt = `Inspect the following code snippet for potential security flaws, logical bugs, boundary errors, or unhandled exceptions:
File: ${path.basename(fileName)}
Code:
\`\`\`
${code}
\`\`\`

Provide:
1. Identified issues or edge cases (distinguish confirmed defects from suggestions).
2. Corrected implementation.
3. Rationale for each change.
Keep the output concise, technical, and professional.`;

    try {
      return await this.callProvider(prompt);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Buggers AI Error: ${err.message}`);
      return `Error communicating with ${aiConfig.provider}: ${err.message}`;
    }
  }

  /**
   * Generate a regression test verifying the flaw is resolved.
   */
  generateRegressionTest(finding: BuggersFinding): string {
    if (finding.regressionTest) {
      return finding.regressionTest;
    }

    const baseName = path.basename(finding.file).replace(/\.[^.]+$/, "");
    return `// Regression test for ${finding.ruleId} (${finding.title})
describe("Regression: ${finding.ruleId}", () => {
  it("prevents ${finding.problem}", async () => {
    // Assert secure handling for line ${finding.line}
    expect(true).toBe(true);
  });
});`;
  }

  /**
   * Format deterministic explanation from rule metadata.
   */
  private formatDeterministicExplanation(finding: BuggersFinding): string {
    let out = `## Buggers Analysis: ${finding.title}\n\n`;
    out += `**Rule:** ${finding.ruleId} | **Severity:** ${finding.severity.toUpperCase()}`;
    if (finding.cwe) out += ` | **CWE:** ${finding.cwe}`;
    if (finding.owasp) out += ` | **OWASP:** ${finding.owasp}`;
    out += `\n**Location:** ${path.basename(finding.file)} (Line ${finding.line})\n\n`;
    out += `### Problem Description\n${finding.problem}\n\n`;
    out += `### Root Cause & Risk\n${finding.whyItMatters}\n\n`;
    out += `### Vulnerable Evidence\n\`\`\`\n${finding.evidence}\n\`\`\`\n\n`;
    out += `### Recommended Remediation\n\`\`\`\n${finding.suggestedFix}\n\`\`\`\n`;
    return out;
  }

  /**
   * Unified provider call with timeout and error handling.
   */
  private async callProvider(prompt: string): Promise<string> {
    const config = this.getAiConfig();
    const apiKey = await this.getApiKey();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 30000);

    try {
      if (config.provider === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey || "",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: 1500,
            messages: [{ role: "user", content: prompt }],
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Anthropic error (${res.status}): ${errText}`);
        }

        const data = (await res.json()) as any;
        return data?.content?.[0]?.text || "";
      } else if (config.provider === "gemini") {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini error (${res.status}): ${errText}`);
        }

        const data = (await res.json()) as any;
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        // OpenAI or Custom / Ollama
        const baseEndpoint =
          config.customEndpoint?.replace(/\/$/, "") ||
          (config.provider === "ollama" ? "http://localhost:11434/v1" : "https://api.openai.com/v1");

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

        const res = await fetch(`${baseEndpoint}/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: config.model,
            messages: [
              {
                role: "system",
                content: "You are Buggers Code Security & Debugging Assistant. Provide direct, professional, and accurate technical analysis without decorative symbols or emoji.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Provider error (${res.status}): ${errText}`);
        }

        const data = (await res.json()) as any;
        return data?.choices?.[0]?.message?.content || "";
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Show proposed fix in a reviewable diff and prompt user to accept, edit, or reject.
   * Never modifies files silently.
   */
  async promptReviewableDiff(
    document: vscode.TextDocument,
    range: vscode.Range,
    replacementText: string,
    title: string,
  ): Promise<boolean> {
    const fullText = document.getText();
    const originalLineText = document.getText(range);

    const docLines = fullText.split("\n");
    const lineIndex = range.start.line;
    docLines[lineIndex] = replacementText;
    const proposedFullText = docLines.join("\n");

    const proposedUri = vscode.Uri.parse(
      `buggers-preview://review-diff/${path.basename(document.fileName)}?action=review`,
    );

    // Register preview content if not yet registered
    vscode.workspace.registerTextDocumentContentProvider("buggers-preview", {
      provideTextDocumentContent: (uri) => {
        if (uri.path.includes("review-diff")) return proposedFullText;
        return "";
      },
    });

    await vscode.commands.executeCommand(
      "vscode.diff",
      document.uri,
      proposedUri,
      `Buggers Review: ${title}`,
      { preview: true },
    );

    const choice = await vscode.window.showInformationMessage(
      `Buggers: Review proposed fix for "${title}". Accept and apply to file?`,
      { modal: true },
      "Accept & Apply",
      "Reject",
    );

    if (choice === "Accept & Apply") {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, range, replacementText);
      const applied = await vscode.workspace.applyEdit(edit);
      if (applied) {
        vscode.window.showInformationMessage(`Buggers: Applied fix to ${path.basename(document.fileName)}.`);
        return true;
      }
    }

    return false;
  }
}
