import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Github } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { connectGitHub } from "@/lib/github-connect-client";

export function ConnectGitHubButton({ label = "Connect GitHub" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  return (
    <Button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await connectGitHub();
          toast.success("GitHub connected");
          await qc.invalidateQueries();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "GitHub connection failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Github className="mr-2 h-4 w-4" />
      {busy ? "Connecting…" : label}
    </Button>
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
