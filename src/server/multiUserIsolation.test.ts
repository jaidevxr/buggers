import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

describe("Multi-User Tenant Isolation & Security Policy Verification", () => {
  const schemaSql = fs.readFileSync(
    path.resolve(process.cwd(), "supabase-setup.sql"),
    "utf-8",
  );

  it("enforces RLS and auth.uid() checks on analyses table", () => {
    expect(schemaSql).toContain("ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;");
    expect(schemaSql).toMatch(/CREATE POLICY "own analyses select" ON public\.analyses FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\);/);
    // Authenticated users must NOT have raw INSERT or UPDATE on analyses (must be server/service_role only)
    expect(schemaSql).toContain("GRANT SELECT ON public.analyses TO authenticated;");
    expect(schemaSql).not.toContain("GRANT INSERT ON public.analyses TO authenticated;");
    expect(schemaSql).not.toContain("GRANT UPDATE ON public.analyses TO authenticated;");
  });

  it("enforces RLS and tenant write isolation on findings table", () => {
    expect(schemaSql).toContain("ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;");
    expect(schemaSql).toMatch(/CREATE POLICY "own findings select" ON public\.findings FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\);/);
    expect(schemaSql).toMatch(/CREATE POLICY "own findings update" ON public\.findings FOR UPDATE TO authenticated USING \(auth\.uid\(\) = user_id\);/);
    // Findings inserts must be managed by backend pipeline, not client direct insert
    expect(schemaSql).not.toContain("GRANT INSERT ON public.findings TO authenticated;");
    expect(schemaSql).not.toContain("GRANT DELETE ON public.findings TO authenticated;");
  });

  it("enforces RLS write and delete isolation on tickets table", () => {
    expect(schemaSql).toContain("ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;");
    expect(schemaSql).toMatch(/CREATE POLICY "own tickets select" ON public\.tickets FOR SELECT TO authenticated USING \(auth\.uid\(\) = user_id\);/);
    expect(schemaSql).toMatch(/CREATE POLICY "own tickets insert" ON public\.tickets FOR INSERT TO authenticated WITH CHECK \(auth\.uid\(\) = user_id\);/);
    expect(schemaSql).toMatch(/CREATE POLICY "own tickets update" ON public\.tickets FOR UPDATE TO authenticated USING \(auth\.uid\(\) = user_id\);/);
    expect(schemaSql).toMatch(/CREATE POLICY "own tickets delete" ON public\.tickets FOR DELETE TO authenticated USING \(auth\.uid\(\) = user_id\);/);
  });

  it("shields sensitive connector credentials completely from authenticated role", () => {
    expect(schemaSql).toContain("ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;");
    // app_user_connections must only be granted to service_role, never authenticated
    expect(schemaSql).toContain("GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_user_connections TO service_role;");
    expect(schemaSql).not.toMatch(/ON public\.app_user_connections\s+TO authenticated/);
    expect(schemaSql).not.toMatch(/CREATE POLICY .* ON public\.app_user_connections .* TO authenticated/);
  });

  it("guarantees unique per-commit analysis rows to prevent cross-run race conditions", () => {
    expect(schemaSql).toContain("UNIQUE (user_id, repo_full_name, pr_number, head_sha)");
  });
});
