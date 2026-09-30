import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GitPullRequest, History, ShieldCheck, Sparkles } from "lucide-react";
import { BugMark, BuggersWordmark } from "@/components/brand/BugMark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buggers — Catch risky code before it catches you" },
      {
        name: "description",
        content:
          "AI-assisted code review and bug triage powered by real GitHub repository data: risk scoring, historical signals, and validated findings.",
      },
      { property: "og:title", content: "Buggers — Catch risky code before it catches you" },
      {
        property: "og:description",
        content:
          "Connect GitHub and analyze real pull requests: risk scoring from engineering signals plus AI review findings validated against the diff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const pipeline = [
  { label: "GitHub PR", icon: GitPullRequest },
  { label: "Buggers analysis", icon: BugMark },
  { label: "Historical signals", icon: History },
  { label: "AI review", icon: Sparkles },
  { label: "Risk analysis", icon: ShieldCheck },
  { label: "Actionable findings", icon: ArrowRight },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <BuggersWordmark />
        <nav className="flex items-center gap-2">
          <a
            href="#how-it-works"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            How it works
          </a>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </nav>
      </header>

      <main>
        <section className="dotted-grid border-y border-border">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <BugMark className="h-4 w-4 text-primary" />
                AI-assisted code review & bug triage
              </span>
              <h1 className="text-display mt-6 text-5xl font-extrabold leading-[1.05] sm:text-7xl">
                BUGGERS
              </h1>
              <p className="text-display mt-3 text-2xl font-bold text-foreground sm:text-3xl">
                Catch risky code before it catches you.
              </p>
              <p className="mt-4 max-w-xl text-base text-muted-foreground">
                AI-assisted code review and bug triage powered by real GitHub repository data. No
                sample projects, no invented findings — Buggers reads your actual pull requests.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-display text-2xl font-bold">How an analysis runs</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every step reads real data. When a signal has no supporting evidence, Buggers says so
            instead of filling the gap.
          </p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pipeline.map((step, i) => (
              <li key={step.label} className="surface-card flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-soft text-primary">
                  <step.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">Step {i + 1}</div>
                  <div className="text-sm font-semibold">{step.label}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <FeatureCard
              title="Risk from real signals"
              body="Change size, churn, defect-associated history, test movement, dependency edits. Every score shows its evidence and confidence."
            />
            <FeatureCard
              title="AI review, validated"
              body="Findings that reference files or lines outside the actual diff are rejected before you ever see them."
            />
            <FeatureCard
              title="Triage that sticks"
              body="Mark findings reviewed, fixed, or false positive, and turn the ones that matter into tickets."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <BuggersWordmark className="text-foreground" />
          <span>Built for developers who read diffs.</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface-card p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
