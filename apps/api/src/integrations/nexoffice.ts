import type { Express, Request } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";

const handoffPayloadSchema = z.object({
  v: z.literal(1),
  workspaceRef: z.string().uuid(),
  businessName: z.string().trim().min(1).max(180),
  sector: z.string().trim().max(120).default(""),
  exp: z.number().int().positive(),
  nonce: z.string().min(8).max(120),
});

export type NexOfficeHandoffPayload = z.infer<typeof handoffPayloadSchema>;

function bridgeSecret() {
  const secret = String(process.env.NEXOFFICE_COMPLIANCE_BRIDGE_SECRET || "").trim();
  if (!secret) throw new Error("NEXOFFICE_COMPLIANCE_BRIDGE_SECRET não configurada");
  return secret;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function signatureFor(encodedPayload: string) {
  return createHmac("sha256", bridgeSecret()).update(encodedPayload).digest("base64url");
}

export function verifyNexOfficeHandoffToken(token: string): NexOfficeHandoffPayload {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) throw new Error("handoff inválido");
  const expected = signatureFor(encodedPayload);
  if (!safeEqual(signature, expected)) throw new Error("handoff inválido");
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    throw new Error("handoff inválido");
  }
  const payload = handoffPayloadSchema.parse(parsed);
  if (payload.exp * 1000 < Date.now()) throw new Error("handoff expirado");
  return payload;
}

function bridgeAuthorized(req: Request) {
  const received = String(req.headers["x-nexoffice-compliance-key"] || "");
  let expected = "";
  try {
    expected = bridgeSecret();
  } catch {
    return false;
  }
  return safeEqual(received, expected);
}

function firstRow<T = Record<string, unknown>>(result: unknown): T | undefined {
  if (Array.isArray(result)) return result[0] as T | undefined;
  const rows = (result as { rows?: T[] } | null)?.rows;
  return rows?.[0];
}

function rowsOf<T = Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return (result as { rows?: T[] } | null)?.rows || [];
}

export async function linkCompanyToNexOffice(companyId: number, userId: number, token: string) {
  const payload = verifyNexOfficeHandoffToken(token);
  const conflicting = firstRow<{ company_id: number }>(await db.execute(sql`
    select company_id from nexoffice_links
    where workspace_ref = ${payload.workspaceRef}::uuid
      and company_id <> ${companyId}
    limit 1
  `));
  if (conflicting) throw new Error("Este workspace NexOffice já está vinculado a outra empresa.");

  await db.execute(sql`
    insert into nexoffice_links(company_id, workspace_ref, linked_by_user_id, linked_at, updated_at)
    values(${companyId}, ${payload.workspaceRef}::uuid, ${userId}, now(), now())
    on conflict(company_id) do update set
      workspace_ref = excluded.workspace_ref,
      linked_by_user_id = excluded.linked_by_user_id,
      updated_at = now()
  `);
  return { workspaceRef: payload.workspaceRef, businessName: payload.businessName, sector: payload.sector };
}

function appBaseUrl() {
  const raw = String(process.env.APP_BASE_URL || "").split(",").map((item) => item.trim()).find(Boolean);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function getNexOfficeComplianceSummary(workspaceRef: string) {
  const workspaceId = z.string().uuid().parse(workspaceRef);
  const company = firstRow<any>(await db.execute(sql`
    select c.id, c.name, c.onboarding_completed, c.pgr_due_date
    from nexoffice_links l
    join companies c on c.id = l.company_id
    where l.workspace_ref = ${workspaceId}::uuid
    limit 1
  `));
  if (!company) return null;

  const actions = firstRow<any>(await db.execute(sql`
    select
      count(*)::int as total,
      count(*) filter (
        where lower(coalesce(action_status, 'pendente')) not in ('concluido','concluida','done','closed','resolvido','resolvida')
      )::int as open_actions,
      count(*) filter (
        where lower(coalesce(action_status, 'pendente')) not in ('concluido','concluida','done','closed','resolvido','resolvida')
          and deadline is not null and deadline < now()
      )::int as overdue_actions,
      min(deadline) filter (
        where lower(coalesce(action_status, 'pendente')) not in ('concluido','concluida','done','closed','resolvido','resolvida')
          and deadline is not null
      ) as next_action_due_at
    from psychosocial_risk_inventory
    where company_id = ${company.id}
  `)) || { total: 0, open_actions: 0, overdue_actions: 0, next_action_due_at: null };

  const cycles = firstRow<any>(await db.execute(sql`
    select
      count(*)::int as total,
      count(*) filter(where status = 'active')::int as active,
      count(*) filter(where status in ('closed','archived'))::int as completed
    from assessment_cycles
    where company_id = ${company.id}
  `)) || { total: 0, active: 0, completed: 0 };

  const review = firstRow<any>(await db.execute(sql`
    select min(next_review_date) as next_review_date
    from pgr_reviews
    where company_id = ${company.id} and next_review_date >= now()
  `));

  const total = Number(actions.total || 0);
  const openActions = Number(actions.open_actions || 0);
  const overdueActions = Number(actions.overdue_actions || 0);
  const completionPct = total > 0 ? Math.round(((total - openActions) / total) * 100) : null;
  const dateCandidates = [actions.next_action_due_at, company.pgr_due_date, review?.next_review_date]
    .filter(Boolean)
    .map((value) => new Date(value));
  const nextDueAt = dateCandidates.length
    ? new Date(Math.min(...dateCandidates.map((value) => value.getTime()))).toISOString()
    : null;

  let diagnosticStatus: "not_started" | "in_progress" | "completed" = "not_started";
  if (Number(cycles.active || 0) > 0) diagnosticStatus = "in_progress";
  else if (Number(cycles.completed || 0) > 0) diagnosticStatus = "completed";

  let programStatus: "not_started" | "active" | "attention" = company.onboarding_completed ? "active" : "not_started";
  if (overdueActions > 0) programStatus = "attention";

  const categories = ["nr1"];
  if (total > 0) categories.push("plano_de_acao");
  if (company.pgr_due_date || review?.next_review_date) categories.push("pgr");

  const base = appBaseUrl();
  return {
    workspaceRef: workspaceId,
    sourceProduct: "nr1check" as const,
    diagnosticStatus,
    programStatus,
    openActions,
    overdueActions,
    nextDueAt,
    completionPct,
    categories,
    deepLink: base ? `${base}/dashboard` : null,
    observedAt: new Date().toISOString(),
    privacy: {
      mode: "aggregate_only",
      includesEmployeeData: false,
      includesPsychosocialAnswers: false,
      includesComplaintContent: false,
      includesRawDocuments: false,
    },
  };
}

export function registerNexOfficeBridge(app: Express) {
  app.post("/api/nexoffice/handoff/verify", (req, res) => {
    try {
      const token = z.object({ token: z.string().min(20).max(5000) }).parse(req.body).token;
      const payload = verifyNexOfficeHandoffToken(token);
      res.json({
        source: "nexoffice",
        workspaceRef: payload.workspaceRef,
        businessName: payload.businessName,
        sector: payload.sector,
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        privacy: "business_context_only",
      });
    } catch (error) {
      res.status(401).json({ error: "invalid_handoff", message: error instanceof Error ? error.message : "handoff inválido" });
    }
  });

  app.get("/api/internal/nexoffice/compliance-summary", async (req, res) => {
    if (!bridgeAuthorized(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      const workspaceRef = z.string().uuid().parse(req.query.workspaceRef);
      const summary = await getNexOfficeComplianceSummary(workspaceRef);
      if (!summary) {
        res.status(404).json({ error: "not_linked" });
        return;
      }
      res.json(summary);
    } catch (error) {
      res.status(400).json({ error: "invalid_request", message: error instanceof Error ? error.message : "requisição inválida" });
    }
  });

  app.get("/api/internal/nexoffice/health", (req, res) => {
    if (!bridgeAuthorized(req)) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    res.json({
      status: "ok",
      service: "nr1check-nexoffice-bridge",
      handoff: "signed",
      summary: "aggregate_only",
      rawEmployeeData: false,
      rawPsychosocialAnswers: false,
      complaintContent: false,
      rawDocuments: false,
    });
  });
}
