/**
 * Webhook notification dispatcher for Slack and Discord alerts.
 * Sends immediate security notifications when Critical findings or Quality Gate blocks occur.
 */

import { logStructured } from "@/server/logger.server";

export interface SecurityAlertPayload {
  repoFullName: string;
  prNumber: number;
  prTitle?: string | undefined;
  prAuthor?: string | undefined;
  riskScore: number;
  riskLevel: string;
  qualityGatePassed: boolean;
  qualityGateReason?: string | undefined;
  criticalCount: number;
  highCount: number;
  totalFindings: number;
  analysisUrl: string;
}

/**
 * Format a rich Slack webhook message block.
 */
function buildSlackPayload(alert: SecurityAlertPayload) {
  const icon = alert.qualityGatePassed ? "✅" : "🚨";
  const title = alert.qualityGatePassed
    ? `*Buggers Security Pass:* <${alert.analysisUrl}|${alert.repoFullName} #${alert.prNumber}>`
    : `*Buggers Security Alert — Quality Gate Failed:* <${alert.analysisUrl}|${alert.repoFullName} #${alert.prNumber}>`;

  return {
    text: `${icon} ${alert.repoFullName} #${alert.prNumber}: ${alert.qualityGatePassed ? "Passed" : "Action Required"}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${title}\n>${alert.prTitle ?? "Pull Request Review"}\n_Author: ${alert.prAuthor ?? "unknown"}_`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Risk Score:*\n\`${alert.riskScore}/100\` (${alert.riskLevel.toUpperCase()})`,
          },
          {
            type: "mrkdwn",
            text: `*Quality Gate:*\n${alert.qualityGatePassed ? "Passed" : "⛔ BLOCKED"}`,
          },
          {
            type: "mrkdwn",
            text: `*Critical Findings:*\n\`${alert.criticalCount}\``,
          },
          {
            type: "mrkdwn",
            text: `*High Findings:*\n\`${alert.highCount}\``,
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: alert.qualityGateReason
              ? `Reason: _${alert.qualityGateReason}_`
              : "Review findings and fixes directly on GitHub or the Buggers dashboard.",
          },
        ],
      },
    ],
  };
}

/**
 * Format a rich Discord embed message.
 */
function buildDiscordPayload(alert: SecurityAlertPayload) {
  const color = alert.qualityGatePassed ? 0x10b981 : 0xef4444; // Green or Red
  return {
    embeds: [
      {
        title: `${alert.qualityGatePassed ? "✅" : "🚨"} Security Review: ${alert.repoFullName} #${alert.prNumber}`,
        url: alert.analysisUrl,
        description: alert.prTitle ?? "Security review completed",
        color,
        fields: [
          {
            name: "Risk Score",
            value: `${alert.riskScore}/100 (${alert.riskLevel.toUpperCase()})`,
            inline: true,
          },
          {
            name: "Quality Gate",
            value: alert.qualityGatePassed ? "Passed" : "BLOCKED",
            inline: true,
          },
          {
            name: "Critical / High",
            value: `${alert.criticalCount} Critical, ${alert.highCount} High`,
            inline: true,
          },
          {
            name: "Status Reason",
            value: alert.qualityGateReason ?? "All security policies satisfied.",
          },
        ],
        footer: {
          text: "Buggers Continuous Security Engine",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Dispatch security alert to configured webhook URL (Slack / Discord).
 */
export async function dispatchSecurityAlert(alert: SecurityAlertPayload): Promise<boolean> {
  const webhookUrl = process.env["ALERT_WEBHOOK_URL"]?.trim();
  if (!webhookUrl) {
    // No alert webhook configured — skip silently
    return false;
  }

  try {
    const isDiscord = webhookUrl.includes("discord.com/api/webhooks");
    const payload = isDiscord ? buildDiscordPayload(alert) : buildSlackPayload(alert);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      logStructured("warn", "security_alert_webhook_failed", {
        status: res.status,
        statusText: res.statusText,
        repo: alert.repoFullName,
        pr: alert.prNumber,
      });
      return false;
    }

    logStructured("info", "security_alert_webhook_dispatched", {
      repo: alert.repoFullName,
      pr: alert.prNumber,
      qualityGatePassed: alert.qualityGatePassed,
    });
    return true;
  } catch (error) {
    logStructured("error", "security_alert_webhook_error", {
      error: error instanceof Error ? error.message : String(error),
      repo: alert.repoFullName,
      pr: alert.prNumber,
    });
    return false;
  }
}
