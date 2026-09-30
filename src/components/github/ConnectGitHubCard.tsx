import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Github, KeyRound, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { connectGitHub } from "@/lib/github-connect-client";
import { saveGitHubToken } from "@/lib/github.functions";
import { supabase } from "@/integrations/supabase/client";

export function ConnectGitHubButton({ label = "Connect GitHub" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasProviderToken, setHasProviderToken] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.provider_token) {
        setHasProviderToken(true);
      }
    });
  }, []);

  async function handleOAuthConnect() {
    setBusy(true);
    try {
      await connectGitHub();
      toast.success("GitHub connected successfully!");
      setOpen(false);
      await qc.invalidateQueries();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "GitHub OAuth failed";
      if (msg.includes("missing GITHUB_CLIENT_ID")) {
        toast.info("GitHub OAuth App is not configured in .env. Please use the Personal Access Token tab or your session token above.");
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleTokenSave(tokenToSave: string) {
    if (!tokenToSave.trim()) {
      toast.error("Please enter a valid GitHub token");
      return;
    }
    setBusy(true);
    try {
      await saveGitHubToken({ data: { token: tokenToSave.trim() } });
      toast.success("GitHub connected successfully!");
      setOpen(false);
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to connect with GitHub token");
    } finally {
      setBusy(false);
    }
  }

  async function handleUseProviderToken() {
    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.provider_token) {
        toast.error("No GitHub session token found. Please use a Personal Access Token below.");
        return;
      }
      await saveGitHubToken({ data: { token: data.session.provider_token } });
      toast.success("GitHub connected from your sign-in session!");
      setOpen(false);
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to connect via session token");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Github className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Connect GitHub
          </DialogTitle>
          <DialogDescription>
            Connect your GitHub account to inspect repositories, view pull requests, and run AI code reviews.
          </DialogDescription>
        </DialogHeader>

        {hasProviderToken ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
            <div className="flex flex-col gap-3">
              <div>
                <span className="flex items-center gap-1.5 font-semibold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  GitHub Sign-In Detected
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  You signed in with GitHub! Click below to connect your repositories using your active session.
                </p>
              </div>
              <Button onClick={handleUseProviderToken} disabled={busy} className="w-full">
                <Github className="mr-2 h-4 w-4" />
                {busy ? "Connecting…" : "Connect Using My GitHub Session"}
              </Button>
            </div>
          </div>
        ) : null}

        <Tabs defaultValue="pat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pat">Personal Access Token</TabsTrigger>
            <TabsTrigger value="oauth">OAuth App</TabsTrigger>
          </TabsList>

          <TabsContent value="pat" className="space-y-4 pt-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="github-token" className="text-xs font-semibold">
                  Personal Access Token (Classic or Fine-Grained)
                </Label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=Buggers%20Code%20Review"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Generate token <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Required scopes: <code className="text-foreground">repo</code> and{" "}
                <code className="text-foreground">read:user</code>. The token is encrypted using AES-256-GCM.
              </p>
            </div>
            <Button
              className="w-full"
              disabled={busy || !token.trim()}
              onClick={() => handleTokenSave(token)}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              {busy ? "Verifying & Saving…" : "Connect with Token"}
            </Button>
          </TabsContent>

          <TabsContent value="oauth" className="space-y-4 pt-3">
            <p className="text-xs text-muted-foreground">
              Authorize Buggers using a GitHub OAuth Application configured in your <code className="text-foreground">.env</code>.
            </p>
            <Button className="w-full" variant="outline" disabled={busy} onClick={handleOAuthConnect}>
              <Github className="mr-2 h-4 w-4" />
              {busy ? "Connecting…" : "Authorize with OAuth"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function ConnectGitHubCard({ reconnect }: { reconnect?: boolean | undefined }) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Github className="h-8 w-8 text-muted-foreground" />
      <h3 className="text-base font-semibold">
        {reconnect ? "GitHub authorization expired" : "GitHub authorization required"}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        {reconnect
          ? "Reconnect your account to keep reading repositories and pull requests."
          : "Connect your GitHub account so Buggers can read your real repositories and pull requests."}
      </p>
      <ConnectGitHubButton label={reconnect ? "Reconnect GitHub" : "Connect GitHub"} />
    </div>
  );
}
