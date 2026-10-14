import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sun, Moon, Laptop, Copy, Check, Webhook, Activity, Send, Shield, ShieldAlert, Sliders } from "lucide-react";
import { disconnectGitHub, getGitHubConnection } from "@/lib/github.functions";
import { deleteMyAnalysisData, getSettings, saveSettings, testWebhookPing, type UserSettings } from "@/lib/settings.functions";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, errMsg } from "@/components/layout/PageHeader";
import { SettingsSkeleton } from "@/components/LoadingSkeletons";
import { LoadingState } from "@/components/status/EmptyState";
import { ConnectGitHubButton } from "@/components/github/ConnectGitHubCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme/ThemeProvider";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings – Buggers" }] }),
  component: Settings,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="surface-card space-y-4 p-5"><h2 className="font-semibold">{title}</h2>{children}</section>;
}

function WebhookCard() {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/github`
      : "/api/webhooks/github";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestPing = async () => {
    setTesting(true);
    try {
      const res = await testWebhookPing();
      if (res.ok) {
        setPingResult("Connected & Verified (HMAC Validated)");
        toast.success(`Webhook ping verified! Zen: "${res.zen}"`);
      } else {
        throw new Error("Failed to verify webhook");
      }
    } catch (e) {
      setPingResult("Verification Failed");
      toast.error(errMsg(e));
    } finally {
      setTesting(false);
    }
  };

  return (
    <Section title="Real-time GitHub Webhook & CI/CD">
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Trigger automated AI security reviews and commit risk checks the instant developers open a pull request or push code to your GitHub repositories.
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Payload URL</label>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 rounded-md border border-border bg-muted/50 px-3 py-1.5 font-mono text-xs text-foreground select-all">
              {webhookUrl}
            </code>
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 h-8">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy URL"}
            </Button>
            <Button size="sm" onClick={handleTestPing} disabled={testing} className="gap-1.5 h-8 bg-primary">
              <Send className="h-3.5 w-3.5" />
              {testing ? "Testing..." : "Test Ping"}
            </Button>
          </div>
          {pingResult && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Webhook Endpoint: {pingResult}</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs space-y-2">
          <p className="font-semibold text-foreground">Quick Setup in GitHub Repository:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
            <li>Go to your repository on GitHub &rarr; <strong>Settings</strong> &rarr; <strong>Webhooks</strong> &rarr; <strong>Add webhook</strong>.</li>
            <li>Paste the <strong>Payload URL</strong> above.</li>
            <li>Set <strong>Content type</strong> to <code className="bg-muted px-1 py-0.5 rounded">application/json</code>.</li>
            <li>Under <em>"Which events would you like to trigger this webhook?"</em>, choose <strong>Let me select individual events</strong> and check <strong>Pull requests</strong> &amp; <strong>Pushes</strong>.</li>
            <li>Click <strong>Add webhook</strong>. Buggers will now analyze every PR automatically!</li>
          </ol>
        </div>
      </div>
    </Section>
  );
}

function SecurityPoliciesCard() {
  const [maxRisk, setMaxRisk] = useState(75);
  const [blockCritical, setBlockCritical] = useState(true);
  const [blockHigh, setBlockHigh] = useState(true);
  const [blockSecrets, setBlockSecrets] = useState(true);
  const [blockDependencies, setBlockDependencies] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("buggers_security_policy");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.maxRisk != null) setMaxRisk(parsed.maxRisk);
        if (parsed.blockCritical != null) setBlockCritical(parsed.blockCritical);
        if (parsed.blockHigh != null) setBlockHigh(parsed.blockHigh);
        if (parsed.blockSecrets != null) setBlockSecrets(parsed.blockSecrets);
        if (parsed.blockDependencies != null) setBlockDependencies(parsed.blockDependencies);
      }
    } catch {}
  }, []);

  const savePolicy = () => {
    try {
      localStorage.setItem(
        "buggers_security_policy",
        JSON.stringify({
          maxRisk,
          blockCritical,
          blockHigh,
          blockSecrets,
          blockDependencies,
        }),
      );
      toast.success("Security quality gate policy updated successfully!");
    } catch {
      toast.error("Failed to save policy to storage");
    }
  };

  return (
    <Section title="CI Quality Gates & Security Policies">
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Configure automated gate checks that set GitHub commit status checks to <code>failure</code> (blocking merge) when security violations or high risk are detected.
        </p>

        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="maxRisk" className="font-medium text-sm">
                Maximum Allowed Risk Score ({maxRisk}/100)
              </Label>
              <p className="text-xs text-muted-foreground">
                Block PR merge if defect/vulnerability risk score exceeds this threshold.
              </p>
            </div>
            <input
              id="maxRisk"
              type="range"
              min={20}
              max={100}
              step={5}
              value={maxRisk}
              onChange={(e) => setMaxRisk(Number(e.target.value))}
              className="w-32 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3">
            <div>
              <Label htmlFor="blockCritical" className="font-medium text-sm">
                Block PR on Critical Severity Findings
              </Label>
              <p className="text-xs text-muted-foreground">
                Fail quality gate if SQL injection, RCE, or severe vulnerabilities are detected.
              </p>
            </div>
            <Switch
              id="blockCritical"
              checked={blockCritical}
              onCheckedChange={setBlockCritical}
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3">
            <div>
              <Label htmlFor="blockHigh" className="font-medium text-sm">
                Block PR on High Severity Findings
              </Label>
              <p className="text-xs text-muted-foreground">
                Fail quality gate if CSRF, IDOR, or severe logic bugs are identified.
              </p>
            </div>
            <Switch
              id="blockHigh"
              checked={blockHigh}
              onCheckedChange={setBlockHigh}
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3">
            <div>
              <Label htmlFor="blockSecrets" className="font-medium text-sm">
                Block PR on Hardcoded Secrets &amp; Keys
              </Label>
              <p className="text-xs text-muted-foreground">
                Fail quality gate if AWS keys, Stripe secrets, or private keys are exposed in diffs.
              </p>
            </div>
            <Switch
              id="blockSecrets"
              checked={blockSecrets}
              onCheckedChange={setBlockSecrets}
            />
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-3">
            <div>
              <Label htmlFor="blockDependencies" className="font-medium text-sm">
                Block PR on Known CVE Dependencies (SCA)
              </Label>
              <p className="text-xs text-muted-foreground">
                Fail quality gate if vulnerable packages with known CVEs are introduced.
              </p>
            </div>
            <Switch
              id="blockDependencies"
              checked={blockDependencies}
              onCheckedChange={setBlockDependencies}
            />
          </div>

          <div className="pt-2">
            <Button size="sm" onClick={savePolicy} className="gap-1.5 bg-primary">
              <Shield className="h-3.5 w-3.5" />
              Save Quality Gate Policy
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Settings() {
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const conn = useQuery({ queryKey: ["github-connection"], queryFn: () => getGitHubConnection() });
  const s = useQuery({ queryKey: ["settings"], queryFn: () => getSettings() });
  const [email, setEmail] = useState<string | null>(null);
  const [form, setForm] = useState<UserSettings | null>(null);
  useEffect(() => { if (s.data) setForm({ ...s.data.settings, min_confidence: Number(s.data.settings.min_confidence) }); }, [s.data]);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)); }, []);

  async function save() {
    if (!form) return;
    try { await saveSettings({ data: form }); toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); }
    catch (e) { toast.error(errMsg(e)); }
  }
  const toggle = (k: keyof UserSettings, label: string) => (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={k}>{label}</Label>
      <Switch id={k} checked={Boolean(form?.[k])} onCheckedChange={(v) => setForm((f) => (f ? { ...f, [k]: v } : f))} />
    </div>
  );

  if (s.isLoading && !form) return <SettingsSkeleton />;

  return (
    <div className="max-w-3xl page-view content-fade-in">
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <Section title="Appearance">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Theme mode</p>
              <p className="text-xs text-muted-foreground">
                Choose between dark mode, light mode, or match your system preferences.
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border p-1 bg-muted/40">
              <Button
                type="button"
                variant={theme === "light" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-3.5 w-3.5" /> Light
              </Button>
              <Button
                type="button"
                variant={theme === "dark" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-3.5 w-3.5" /> Dark
              </Button>
              <Button
                type="button"
                variant={theme === "system" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={() => setTheme("system")}
              >
                <Laptop className="h-3.5 w-3.5" /> System
              </Button>
            </div>
          </div>
        </Section>
        <Section title="GitHub connection">
          {conn.isLoading ? <LoadingState /> : conn.data?.connected ? (
            <div className="flex flex-wrap items-center gap-3">
              {conn.data.avatarUrl && <img src={conn.data.avatarUrl} alt="" className="h-10 w-10 rounded-full" />}
              <div className="flex-1"><div className="font-medium">{conn.data.login}</div><div className="text-xs text-muted-foreground">Authorized</div></div>
              <Button variant="outline" onClick={async () => {
                try { await disconnectGitHub(); toast.success("GitHub disconnected"); await qc.invalidateQueries(); } catch (e) { toast.error(errMsg(e)); }
              }}>Disconnect</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">{conn.data?.reconnectRequired ? "Authorization expired." : "Not connected."}</span>
              <ConnectGitHubButton label={conn.data?.reconnectRequired ? "Reconnect GitHub" : "Connect GitHub"} />
            </div>
          )}
        </Section>
        <WebhookCard />
        <SecurityPoliciesCard />
        <Section title="Profile">
          <p className="text-sm"><span className="text-muted-foreground">Email:</span> {email ?? "—"}</p>
        </Section>
        {!form ? <LoadingState /> : (
          <>
            <Section title="Notifications">
              {toggle("notify_high_risk", "Notify me about high-risk pull requests")}
              {toggle("notify_analysis_complete", "Notify me when an analysis completes")}
            </Section>
            <Section title="Analysis preferences">
              {toggle("include_low_severity", "Include low severity findings")}
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="minc">Minimum finding confidence ({Math.round(form.min_confidence * 100)}%)</Label>
                <input id="minc" type="range" min={0} max={1} step={0.05} value={form.min_confidence} onChange={(e) => setForm({ ...form, min_confidence: Number(e.target.value) })} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="maxf">Max files reviewed per PR</Label>
                <input id="maxf" type="number" min={1} max={200} value={form.max_diff_files} onChange={(e) => setForm({ ...form, max_diff_files: Number(e.target.value) })} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm" />
              </div>
            </Section>
            <Section title="Privacy">
              {toggle("store_code_snippets", "Store code snippets with findings")}
              <Button variant="destructive" size="sm" onClick={async () => {
                if (!confirm("Delete all analyses, findings, tickets and notifications? This cannot be undone.")) return;
                try { await deleteMyAnalysisData(); toast.success("Your analysis data was deleted"); await qc.invalidateQueries(); } catch (e) { toast.error(errMsg(e)); }
              }}>Delete all my analysis data</Button>
            </Section>
            <Button onClick={save}>Save settings</Button>
          </>
        )}
      </div>
    </div>
  );
}
