import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleCronWorkerRequest } from "./queueWorker.server";

describe("Queue Worker & Cron Auth", () => {
  const secret = "test-cron-secret-abcdef12345";

  beforeEach(() => {
    process.env["CRON_SECRET"] = secret;
  });

  it("rejects unauthorized cron requests with 401", async () => {
    const req = new Request("http://localhost:8080/api/cron/worker", {
      method: "POST",
      headers: { authorization: "Bearer invalid-secret" },
    });

    const res = await handleCronWorkerRequest(req);
    expect(res.status).toBe(401);
  });

  it("rejects requests missing the authorization header", async () => {
    const req = new Request("http://localhost:8080/api/cron/worker", {
      method: "POST",
    });

    const res = await handleCronWorkerRequest(req);
    expect(res.status).toBe(401);
  });
});
