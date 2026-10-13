import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  dispatchSecurityAlert,
  type SecurityAlertPayload,
} from "./notificationWebhook.server";

describe("Security Alerts Webhook (Slack & Discord)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const sampleAlert: SecurityAlertPayload = {
    repoFullName: "acme/payment-api",
    prNumber: 42,
    prTitle: "feat: Add billing processor",
    prAuthor: "developer1",
    riskScore: 85,
    riskLevel: "critical",
    qualityGatePassed: false,
    qualityGateReason: "Quality Gate Failed: 2 Critical severity findings detected",
    criticalCount: 2,
    highCount: 1,
    totalFindings: 3,
    analysisUrl: "http://localhost:8080/analysis/test-id-123",
  };

  it("returns false gracefully when no ALERT_WEBHOOK_URL is set", async () => {
    delete process.env["ALERT_WEBHOOK_URL"];
    const sent = await dispatchSecurityAlert(sampleAlert);
    expect(sent).toBe(false);
  });

  it("dispatches formatted Slack payload when configured with Slack webhook URL", async () => {
    process.env["ALERT_WEBHOOK_URL"] = "https://hooks.slack.com/services/T00/B00/X00";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const sent = await dispatchSecurityAlert(sampleAlert);
    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const callArgs = fetchMock.mock.calls[0]!;
    expect(callArgs[0]).toBe("https://hooks.slack.com/services/T00/B00/X00");

    const sentBody = JSON.parse(callArgs[1].body);
    expect(sentBody.text).toContain("acme/payment-api #42");
    expect(sentBody.blocks).toBeDefined();
    expect(sentBody.blocks[1].fields[0].text).toContain("85/100");
  });

  it("dispatches formatted Discord embed when configured with Discord webhook URL", async () => {
    process.env["ALERT_WEBHOOK_URL"] = "https://discord.com/api/webhooks/12345/abcdef";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const sent = await dispatchSecurityAlert(sampleAlert);
    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const callArgs = fetchMock.mock.calls[0]!;
    const sentBody = JSON.parse(callArgs[1].body);
    expect(sentBody.embeds).toBeDefined();
    expect(sentBody.embeds[0].title).toContain("Security Review: acme/payment-api #42");
    expect(sentBody.embeds[0].color).toBe(0xef4444); // Red for failed gate
  });

  it("handles remote HTTP errors without throwing an exception", async () => {
    process.env["ALERT_WEBHOOK_URL"] = "https://hooks.slack.com/services/fail";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });
    vi.stubGlobal("fetch", fetchMock);

    const sent = await dispatchSecurityAlert(sampleAlert);
    expect(sent).toBe(false);
  });
});
