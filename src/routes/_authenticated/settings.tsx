import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { disconnectGitHub, getGitHubConnection } from "@/lib/github.functions";
import { deleteMyAnalysisData, getSettings, saveSettings, type UserSettings } from "@/lib/settings.functions";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, errMsg } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/status/EmptyState";
import { ConnectGitHubButton } from "@/components/github/ConnectGitHubCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Buggers" }] }),
  component: Settings,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="surface-card space-y-4 p-5"><h2 className="font-semibold">{title}</h2>{children}</section>;
}

function Settings() {
  const qc = useQueryClient();
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

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" />
      <div className="space-y-4">
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
