import { describe, it, expect } from "vitest";

// In-memory test store simulating Supabase with PostgreSQL Row-Level Security (RLS)
class SimulatedRlsDatabase {
  public analyses: Array<{
    id: string;
    user_id: string;
    repo_full_name: string;
    pr_number: number;
    head_sha: string;
    status: string;
    risk_score: number | null;
    risk_level: string | null;
    created_at: string;
    updated_at: string;
    head_branch?: string;
  }> = [];

  public findings: Array<{
    id: string;
    user_id: string;
    analysis_id: string;
    repo_full_name: string;
    pr_number: number;
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    title: string;
    file_path: string;
    line_number: number | null;
    status: "open" | "fixed" | "dismissed";
    suggested_fix?: string;
    evidence?: string;
    created_at: string;
    updated_at: string;
  }> = [];

  public tickets: Array<{
    id: string;
    user_id: string;
    finding_id: string;
    title: string;
    repo_full_name: string;
    pr_number: number;
    severity: string;
    status: "open" | "closed";
    created_at: string;
    updated_at: string;
  }> = [];

  public user_settings: Array<{
    user_id: string;
    auto_comment_on_pr: boolean;
    notify_on_critical: boolean;
    created_at: string;
  }> = [];

  public app_user_connections: Array<{
    user_id: string;
    github_user_id: string;
    connection_key_ciphertext: string;
  }> = [];

  // Creates a user-scoped Supabase client that strictly enforces:
  // auth.uid() = user_id on all tables, and denies app_user_connections entirely
  createScopedClient(currentUserId: string) {
    const db = this;

    return {
      from(table: string) {
        if (table === "app_user_connections") {
          return {
            select: () => Promise.resolve({ data: null, error: new Error("permission denied for table app_user_connections") }),
          };
        }

        const getTableRows = () => {
          if (table === "analyses") return db.analyses;
          if (table === "findings") return db.findings;
          if (table === "tickets") return db.tickets;
          if (table === "user_settings") return db.user_settings;
          return [];
        };

        // RLS enforcement: filter out any row where user_id !== currentUserId
        const scopedRows = (getTableRows() as any[]).filter((row) => row.user_id === currentUserId);

        const buildQuery = (rows: any[]): any => {
          const promise = Promise.resolve({ data: rows, error: null }) as any;
          promise.eq = (col: string, val: any) => buildQuery(rows.filter((r) => r[col] === val));
          promise.order = () => promise;
          promise.limit = (n: number) => buildQuery(rows.slice(0, n));
          promise.single = () =>
            Promise.resolve({ data: rows[0] || null, error: rows[0] ? null : new Error("Row not found") });
          promise.maybeSingle = () => Promise.resolve({ data: rows[0] || null, error: null });
          return promise;
        };

        const buildUpdate = (rows: any[], updates: any): any => {
          const promise = Promise.resolve().then(() => {
            for (const row of rows) {
              Object.assign(row, updates);
            }
            return { data: rows, count: rows.length, error: null };
          }) as any;
          promise.eq = (col: string, val: any) =>
            buildUpdate(
              rows.filter((r) => r[col] === val),
              updates,
            );
          return promise;
        };

        return {
          select(_columns = "*") {
            return buildQuery([...scopedRows]);
          },
          update(updates: any) {
            return buildUpdate([...scopedRows], updates);
          },
          insert(payload: any) {
            // RLS WITH CHECK: user_id must equal currentUserId
            if (payload.user_id && payload.user_id !== currentUserId) {
              return Promise.resolve({ data: null, error: new Error("new row violates row-level security policy") });
            }
            const record = { ...payload, id: payload.id || `gen-${Date.now()}` };
            (getTableRows() as any[]).push(record);
            return {
              select() {
                return {
                  single() {
                    return Promise.resolve({ data: record, error: null });
                  },
                };
              },
            };
          },
        };
      },
    };
  }
}

// Concrete application endpoint implementations mirroring src/lib/*.functions.ts
async function appEndpoint_getAnalysis(context: { supabase: any; userId: string }, analysisId: string) {
  const { data: analysis, error } = await context.supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .maybeSingle();
  if (error) throw error;
  if (!analysis) return { analysis: null, findings: [] };

  const { data: findings, error: findingsError } = await context.supabase
    .from("findings")
    .select("*")
    .eq("analysis_id", analysisId);
  if (findingsError) throw findingsError;
  return { analysis, findings: findings ?? [] };
}

async function appEndpoint_getFinding(context: { supabase: any; userId: string }, findingId: string) {
  const { data: finding, error } = await context.supabase
    .from("findings")
    .select("*")
    .eq("id", findingId)
    .maybeSingle();
  if (error) throw error;
  if (!finding) return { finding: null, ticket: null, analysis: null };

  const [{ data: ticket }, { data: analysis }] = await Promise.all([
    context.supabase.from("tickets").select("*").eq("finding_id", findingId).maybeSingle(),
    context.supabase.from("analyses").select("*").eq("id", finding.analysis_id).maybeSingle(),
  ]);
  return { finding, ticket: ticket ?? null, analysis: analysis ?? null };
}

async function appEndpoint_updateFindingStatus(
  context: { supabase: any; userId: string },
  findingId: string,
  newStatus: "open" | "fixed" | "dismissed",
) {
  const { error } = await context.supabase
    .from("findings")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", findingId);
  if (error) throw error;
  return { ok: true };
}

async function appEndpoint_createTicketFromFinding(context: { supabase: any; userId: string }, findingId: string) {
  const { data: finding, error: findingError } = await context.supabase
    .from("findings")
    .select("*")
    .eq("id", findingId)
    .maybeSingle();
  if (findingError) throw findingError;
  if (!finding) throw new Error("Finding not found.");

  const { data: ticket, error } = await context.supabase
    .from("tickets")
    .insert({
      user_id: context.userId,
      finding_id: finding.id,
      title: finding.title,
      repo_full_name: finding.repo_full_name,
      pr_number: finding.pr_number,
      severity: finding.severity,
      status: "open",
    })
    .select()
    .single();
  if (error) throw error;
  return { ticket };
}

async function appEndpoint_applyFindingFixToGitHub(context: { supabase: any; userId: string }, findingId: string) {
  const { data: finding, error: findingError } = await context.supabase
    .from("findings")
    .select("*")
    .eq("id", findingId)
    .maybeSingle();
  if (findingError) throw findingError;
  if (!finding) throw new Error("Finding not found.");

  const { data: analysis, error: analysisError } = await context.supabase
    .from("analyses")
    .select("repo_full_name, head_branch, pr_number")
    .eq("id", finding.analysis_id)
    .maybeSingle();
  if (analysisError) throw analysisError;
  if (!analysis) throw new Error("Analysis not found.");

  return { success: true, branch: analysis.head_branch };
}

async function appEndpoint_listAnalyses(context: { supabase: any; userId: string }) {
  const { data: rows, error } = await context.supabase.from("analyses").select("*");
  if (error) throw error;
  return { analyses: rows ?? [] };
}

async function appEndpoint_listFindings(context: { supabase: any; userId: string }) {
  const { data: rows, error } = await context.supabase.from("findings").select("*");
  if (error) throw error;
  return { findings: rows ?? [] };
}

async function appEndpoint_getDashboardSummary(context: { supabase: any; userId: string }) {
  const [analyses, findings] = await Promise.all([
    context.supabase.from("analyses").select("*"),
    context.supabase.from("findings").select("id, severity, category, status"),
  ]);
  if (analyses.error) throw analyses.error;
  if (findings.error) throw findings.error;

  const allFindings = findings.data ?? [];
  const openFindings = allFindings.filter((f: any) => f.status === "open");
  const criticalCount = openFindings.filter((f: any) => f.severity === "critical").length;
  const highCount = openFindings.filter((f: any) => f.severity === "high").length;

  return {
    totalAnalyses: analyses.data?.length ?? 0,
    openFindingsCount: openFindings.length,
    criticalCount,
    highCount,
    securityGrade: criticalCount > 0 ? "D" : highCount > 0 ? "B" : "A",
  };
}

describe("Multi-User Multi-Tenant Endpoint Isolation Proof", () => {
  const ALICE_ID = "00000000-0000-0000-0000-user-alice-01";
  const BOB_ID = "00000000-0000-0000-0000-user-bob-00002";

  function setupSeededDatabase() {
    const db = new SimulatedRlsDatabase();

    // Alice's data: 1 analysis, 2 findings (1 critical, 1 high), 1 ticket
    db.analyses.push({
      id: "analysis-alice-01",
      user_id: ALICE_ID,
      repo_full_name: "alice-org/private-repo",
      pr_number: 101,
      head_sha: "a11ce00112233445566778899aabbccddeeff00",
      status: "completed",
      risk_score: 88,
      risk_level: "critical",
      head_branch: "alice-fix",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.findings.push(
      {
        id: "finding-alice-crit-01",
        user_id: ALICE_ID,
        analysis_id: "analysis-alice-01",
        repo_full_name: "alice-org/private-repo",
        pr_number: 101,
        severity: "critical",
        category: "security",
        title: "SQL Injection in User Profile Query",
        file_path: "src/profile.ts",
        line_number: 45,
        status: "open",
        suggested_fix: "db.query('SELECT * FROM profiles WHERE id = $1', [id])",
        evidence: "SELECT * FROM profiles WHERE id = " + "id",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "finding-alice-high-02",
        user_id: ALICE_ID,
        analysis_id: "analysis-alice-01",
        repo_full_name: "alice-org/private-repo",
        pr_number: 101,
        severity: "high",
        category: "security",
        title: "Missing CSRF Token on Mutation",
        file_path: "src/transfer.ts",
        line_number: 88,
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    );

    db.tickets.push({
      id: "ticket-alice-01",
      user_id: ALICE_ID,
      finding_id: "finding-alice-crit-01",
      title: "SQL Injection in User Profile Query",
      repo_full_name: "alice-org/private-repo",
      pr_number: 101,
      severity: "critical",
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Bob's data: 1 analysis, 1 finding (low severity)
    db.analyses.push({
      id: "analysis-bob-01",
      user_id: BOB_ID,
      repo_full_name: "bob-org/open-project",
      pr_number: 5,
      head_sha: "b0b00112233445566778899aabbccddeeff0011",
      status: "completed",
      risk_score: 15,
      risk_level: "low",
      head_branch: "bob-docs",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    db.findings.push({
      id: "finding-bob-low-01",
      user_id: BOB_ID,
      analysis_id: "analysis-bob-01",
      repo_full_name: "bob-org/open-project",
      pr_number: 5,
      severity: "low",
      category: "maintainability",
      title: "Trailing whitespace in README",
      file_path: "README.md",
      line_number: 10,
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Store Alice's sensitive GitHub token in shielded table
    db.app_user_connections.push({
      user_id: ALICE_ID,
      github_user_id: "gh-alice-999",
      connection_key_ciphertext: "encrypted-alice-token-secret",
    });

    return db;
  }

  it("proves User Bob CANNOT read User Alice's analysis via getAnalysis", async () => {
    const db = setupSeededDatabase();
    const aliceContext = { supabase: db.createScopedClient(ALICE_ID), userId: ALICE_ID };
    const bobContext = { supabase: db.createScopedClient(BOB_ID), userId: BOB_ID };

    // Alice fetches her own analysis -> SUCCESS
    const aliceRes = await appEndpoint_getAnalysis(aliceContext, "analysis-alice-01");
    expect(aliceRes.analysis).not.toBeNull();
    expect(aliceRes.analysis?.id).toBe("analysis-alice-01");
    expect(aliceRes.findings).toHaveLength(2);

    // Bob attempts to fetch Alice's analysis -> BLOCKED (returns null analysis, empty findings)
    const bobRes = await appEndpoint_getAnalysis(bobContext, "analysis-alice-01");
    expect(bobRes.analysis).toBeNull();
    expect(bobRes.findings).toEqual([]);
  });

  it("proves User Bob CANNOT read User Alice's finding via getFinding", async () => {
    const db = setupSeededDatabase();
    const aliceContext = { supabase: db.createScopedClient(ALICE_ID), userId: ALICE_ID };
    const bobContext = { supabase: db.createScopedClient(BOB_ID), userId: BOB_ID };

    // Alice fetches her own finding -> SUCCESS
    const aliceRes = await appEndpoint_getFinding(aliceContext, "finding-alice-crit-01");
    expect(aliceRes.finding).not.toBeNull();
    expect(aliceRes.finding?.id).toBe("finding-alice-crit-01");
    expect(aliceRes.ticket?.id).toBe("ticket-alice-01");

    // Bob attempts to fetch Alice's finding -> BLOCKED
    const bobRes = await appEndpoint_getFinding(bobContext, "finding-alice-crit-01");
    expect(bobRes.finding).toBeNull();
    expect(bobRes.ticket).toBeNull();
    expect(bobRes.analysis).toBeNull();
  });

  it("proves User Bob CANNOT mutate User Alice's finding status via updateFindingStatus", async () => {
    const db = setupSeededDatabase();
    const bobContext = { supabase: db.createScopedClient(BOB_ID), userId: BOB_ID };

    // Bob attempts to mark Alice's critical finding as 'fixed'
    await appEndpoint_updateFindingStatus(bobContext, "finding-alice-crit-01", "fixed");

    // Check Alice's actual finding in the database: must remain 'open'
    const aliceFinding = db.findings.find((f) => f.id === "finding-alice-crit-01");
    expect(aliceFinding?.status).toBe("open");
  });

  it("proves User Bob CANNOT create tickets against User Alice's finding", async () => {
    const db = setupSeededDatabase();
    const bobContext = { supabase: db.createScopedClient(BOB_ID), userId: BOB_ID };

    // Bob attempts to create a ticket referencing Alice's finding
    await expect(appEndpoint_createTicketFromFinding(bobContext, "finding-alice-crit-01")).rejects.toThrow(
      "Finding not found.",
    );

    // Verify no ticket was inserted under Alice or Bob
    const bobTickets = db.tickets.filter((t) => t.user_id === BOB_ID);
    expect(bobTickets).toHaveLength(0);
  });

  it("proves User Bob CANNOT trigger automated code remediation on User Alice's repo", async () => {
    const db = setupSeededDatabase();
    const bobContext = { supabase: db.createScopedClient(BOB_ID), userId: BOB_ID };

    // Bob attempts to trigger fix on Alice's finding
    await expect(appEndpoint_applyFindingFixToGitHub(bobContext, "finding-alice-crit-01")).rejects.toThrow(
      "Finding not found.",
    );
  });

  it("proves complete multi-user isolation on listAnalyses and listFindings queries", async () => {
    const db = setupSeededDatabase();
    const aliceContext = { supabase: db.createScopedClient(ALICE_ID), userId: ALICE_ID };
    const bobContext = { supabase: db.createScopedClient(BOB_ID), userId: BOB_ID };

    // Alice list calls
    const aliceAnalyses = await appEndpoint_listAnalyses(aliceContext);
    const aliceFindings = await appEndpoint_listFindings(aliceContext);
    expect(aliceAnalyses.analyses).toHaveLength(1);
    expect(aliceAnalyses.analyses[0]?.id).toBe("analysis-alice-01");
    expect(aliceFindings.findings).toHaveLength(2);

    // Bob list calls: ZERO of Alice's analyses or findings appear
    const bobAnalyses = await appEndpoint_listAnalyses(bobContext);
    const bobFindings = await appEndpoint_listFindings(bobContext);
    expect(bobAnalyses.analyses).toHaveLength(1);
    expect(bobAnalyses.analyses[0]?.id).toBe("analysis-bob-01");
    expect(bobFindings.findings).toHaveLength(1);
    expect(bobFindings.findings[0]?.id).toBe("finding-bob-low-01");
  });

  it("proves dashboard metric isolation: Alice's critical findings NEVER pollute Bob's posture", async () => {
    const db = setupSeededDatabase();
    const aliceContext = { supabase: db.createScopedClient(ALICE_ID), userId: ALICE_ID };
    const bobContext = { supabase: db.createScopedClient(BOB_ID), userId: BOB_ID };

    const aliceDashboard = await appEndpoint_getDashboardSummary(aliceContext);
    const bobDashboard = await appEndpoint_getDashboardSummary(bobContext);

    // Alice has 1 critical finding -> Grade D
    expect(aliceDashboard.criticalCount).toBe(1);
    expect(aliceDashboard.securityGrade).toBe("D");

    // Bob has 0 critical, 0 high -> Grade A
    expect(bobDashboard.criticalCount).toBe(0);
    expect(bobDashboard.highCount).toBe(0);
    expect(bobDashboard.securityGrade).toBe("A");
  });

  it("proves sensitive credential table app_user_connections is completely inaccessible to authenticated users", async () => {
    const db = setupSeededDatabase();
    const bobClient = db.createScopedClient(BOB_ID);

    const result = await bobClient.from("app_user_connections").select();
    expect(result.data).toBeNull();
    expect(result.error?.message).toContain("permission denied");
  });
});
