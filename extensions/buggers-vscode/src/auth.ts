import * as vscode from "vscode";

const SECRET_KEY = "buggers_api_token";
const GITHUB_TOKEN_KEY = "buggers_github_pat";

export class BuggersAuth {
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Securely retrieve stored Buggers API token
   */
  async getToken(): Promise<string | undefined> {
    return this.context.secrets.get(SECRET_KEY);
  }

  /**
   * Securely store Buggers API token in OS keychain via ExtensionContext.secrets
   */
  async setToken(token: string): Promise<void> {
    await this.context.secrets.store(SECRET_KEY, token.trim());
  }

  /**
   * Clear stored Buggers API token
   */
  async clearToken(): Promise<void> {
    await this.context.secrets.delete(SECRET_KEY);
  }

  /**
   * Securely retrieve stored GitHub PAT
   */
  async getGitHubToken(): Promise<string | undefined> {
    return this.context.secrets.get(GITHUB_TOKEN_KEY);
  }

  /**
   * Securely store GitHub PAT
   */
  async setGitHubToken(token: string): Promise<void> {
    await this.context.secrets.store(GITHUB_TOKEN_KEY, token.trim());
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return Boolean(token && token.length > 0);
  }

  /**
   * Prompt user to enter credentials and store in keychain
   */
  async promptSignIn(): Promise<boolean> {
    const token = await vscode.window.showInputBox({
      prompt: "Enter your Buggers API Key or GitHub Personal Access Token",
      placeHolder: "buggers_live_... or ghp_...",
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return "Token cannot be empty";
        }
        if (value.trim().length < 8) {
          return "Token is too short to be a valid API key";
        }
        return null;
      },
    });

    if (!token) {
      return false;
    }

    if (token.startsWith("ghp_") || token.startsWith("github_pat_")) {
      await this.setGitHubToken(token);
    }
    await this.setToken(token);
    vscode.window.showInformationMessage("Buggers: Successfully authenticated and securely saved in keychain.");
    return true;
  }

  /**
   * Sign out and clear stored tokens
   */
  async signOut(): Promise<void> {
    await this.clearToken();
    await this.context.secrets.delete(GITHUB_TOKEN_KEY);
    vscode.window.showInformationMessage("Buggers: Signed out. Credentials removed from secure storage.");
  }
}
