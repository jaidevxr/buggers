import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  FileWarning,
  Github,
  GitPullRequest,
  ShieldAlert,
} from "lucide-react";

import { BugMark } from "@/components/brand/BugMark";
import { SeverityBadge } from "@/components/status/StatusBadges";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buggers — Catch risky code before it catches you" },
      {
        name: "description",
        content:
          "Buggers reviews your pull requests with AI and your repository history, so risky changes get caught before they ship.",
      },
      { property: "og:title", content: "Buggers — Catch risky code before it catches you" },
      {
        property: "og:description",
        content:
          "AI-assisted code review and bug triage powered by your GitHub repository history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const flow = [
  { icon: GitPullRequest, title: "GitHub PR", text: "A pull request opens on your repository." },
  { icon: BrainCircuit, title: "Buggers analysis", text: "Diff, history and churn are read together." },
  { icon: ShieldAlert, title: "Risk detection", text: "Each change gets a risk score with reasons." },
  { icon: FileWarning, title: "AI findings", text: "Concrete issues, evidence and suggested fixes." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <BugMark className="h-7 w-7 text-primary" />
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              Buggers
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden rounded-full sm:inline-flex" asChild>
              <a href="#how-it-works">See how it works</a>
            </Button>
            <Button className="rounded-full shadow-xs" asChild>
              <Link to="/auth">
                <Github className="h-4 w-4" /> Continue with GitHub
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="dotted-surface border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Code review for teams that ship fast
              </span>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Catch risky code
                <br />
                before it catches you.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                AI-assisted code review and bug triage powered by your GitHub repository history.
                Buggers reads the diff and everything that happened to those files before it.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button size="lg" className="rounded-full shadow-xs" asChild>
                  <Link to="/auth">
                    <Github className="h-4 w-4" /> Continue with GitHub
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full" asChild>
                  <a href="#how-it-works">
                    See how it works <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <ProductPreview />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">How Buggers works</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Four steps, no configuration. Connect a repository and the next pull request is analyzed.
        </p>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {flow.map((step, i) => (
            <li
              key={step.title}
              className="card-hover rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <step.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-xs font-medium text-muted-foreground">Step {i + 1}</p>
              <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-3">
          {[
            {
              title: "Risk with reasons",
              text: "Every score comes with the signals behind it — churn, defect history, missing tests, dependency moves.",
            },
            {
              title: "Findings you can act on",
              text: "Problem, why it matters, evidence and a suggested fix. Mark reviewed, fixed, or create a ticket.",
            },
            {
              title: "History as evidence",
              text: "Buggers learns which files broke before, so review attention lands where it pays off.",
            },
          ].map((c) => (
            <div key={c.title}>
              <h3 className="text-base font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:px-6">
        <div className="flex items-center gap-2">
          <BugMark className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            Buggers
          </span>
        </div>
        <span>Demo data shown throughout. Connect GitHub to analyze real repositories.</span>
      </footer>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-lift sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            <span className="text-muted-foreground">payment-service #184</span> Fix payment validation
          </p>
          <p className="mt-1 text-xs text-muted-foreground">mira-k · 3 files · +204 −74</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-risk-high/25 bg-risk-high-soft px-2.5 py-0.5 text-xs font-medium text-risk-high whitespace-nowrap">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          High risk
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-surface p-4">
        <p className="text-xs font-medium text-muted-foreground">Overall risk</p>
        <p className="mt-1 font-display text-3xl font-semibold text-risk-high">HIGH · 82</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-strong">
          <div className="h-full w-[82%] rounded-full bg-risk-high" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {[
          { s: "critical", t: "Partial capture amount silently overwritten" },
          { s: "high", t: "Refund no longer wrapped in a transaction" },
          { s: "medium", t: "Empty card number treated as valid" },
        ].map((f) => (
          <div
            key={f.t}
            className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
          >
            <SeverityBadge severity={f.s} />
            <span className="truncate text-sm">{f.t}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border font-mono text-[12px]">
        <div className="bg-diff-del-soft px-3 py-1 text-diff-del">− if amount &lt;= order.total:</div>
        <div className="bg-diff-add-soft px-3 py-1 text-diff-add">+ if amount != order.total:</div>
        <div className="bg-diff-add-soft px-3 py-1 text-diff-add">+ amount = order.total</div>
      </div>
    </div>
  );
}
