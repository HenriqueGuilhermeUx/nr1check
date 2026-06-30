import express, { type Express } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "@nr1check/db";
import { companies } from "@nr1check/db/schema";

type WooviWebhookPayload = {
  event?: string;
  eventType?: string;
  type?: string;
  charge?: {
    correlationID?: string;
    identifier?: string;
    status?: string;
    value?: number;
  };
  pixQrCode?: {
    correlationID?: string;
  };
  transaction?: {
    correlationID?: string;
    charge?: {
      correlationID?: string;
    };
  };
  data?: any;
};

function readEvent(payload: WooviWebhookPayload) {
  return payload.event ?? payload.eventType ?? payload.type ?? payload.data?.event ?? "";
}

function readCorrelationID(payload: WooviWebhookPayload) {
  return (
    payload.charge?.correlationID ??
    payload.pixQrCode?.correlationID ??
    payload.transaction?.correlationID ??
    payload.transaction?.charge?.correlationID ??
    payload.data?.charge?.correlationID ??
    payload.data?.pixQrCode?.correlationID ??
    payload.data?.transaction?.correlationID ??
    payload.data?.transaction?.charge?.correlationID ??
    null
  );
}

function isPaidEvent(event: string) {
  return [
    "OPENPIX:CHARGE_COMPLETED",
    "OPENPIX:TRANSACTION_RECEIVED",
    "PIX_AUTOMATIC_COBR_COMPLETED",
    "PIX_AUTOMATIC_COBR_APPROVED",
  ].includes(event);
}

function isExpiredOrRejectedEvent(event: string) {
  return [
    "OPENPIX:CHARGE_EXPIRED",
    "PIX_AUTOMATIC_REJECTED",
    "PIX_AUTOMATIC_COBR_REJECTED",
    "PIX_AUTOMATIC_COBR_TRY_REJECTED",
  ].includes(event);
}

async function getPaymentByCorrelationID(correlationID: string) {
  const result = await db.execute(sql`
    select
      id,
      scope,
      user_id,
      company_id,
      plan_id,
      amount_cents,
      status
    from billing_payments
    where woovi_correlation_id = ${correlationID}
    limit 1
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows;
  return rows?.[0] ?? null;
}

async function activateCompany(companyId: number, planId: string) {
  await db
    .update(companies)
    .set({
      stripeStatus: "active",
      stripePlan: (planId as any) === "contador" ? "corporate" : (planId as any),
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  await db.execute(sql`
    update companies
    set
      billing_provider = 'woovi',
      billing_plan = ${planId},
      billing_status = 'active',
      updated_at = now()
    where id = ${companyId}
  `);
}

async function activateAccountant(userId: number, planId: string) {
  await db.execute(sql`
    update users
    set
      billing_provider = 'woovi',
      billing_plan = ${planId},
      billing_status = 'active',
      updated_at = now()
    where id = ${userId}
  `);
}

export function registerWooviWebhook(app: Express) {
  app.post("/webhooks/woovi", express.json({ limit: "5mb" }), async (req, res) => {
    const webhookToken = process.env.WOOVI_WEBHOOK_TOKEN;
    const authorization = req.headers.authorization;

    if (webhookToken && authorization !== webhookToken) {
      return res.status(401).json({ ok: false, error: "Unauthorized webhook" });
    }

    const payload = req.body as WooviWebhookPayload;
    const event = readEvent(payload);
    const correlationID = readCorrelationID(payload);

    try {
      await db.execute(sql`
        insert into billing_webhook_events (
          provider,
          event_type,
          correlation_id,
          payload,
          processed
        )
        values (
          'woovi',
          ${event || "unknown"},
          ${correlationID},
          ${JSON.stringify(payload)}::jsonb,
          false
        )
      `);

      if (!correlationID) {
        return res.json({ ok: true, ignored: true, reason: "missing_correlation_id" });
      }

      const payment = await getPaymentByCorrelationID(correlationID);

      if (!payment) {
        return res.json({ ok: true, ignored: true, reason: "payment_not_found", correlationID });
      }

      if (isPaidEvent(event)) {
        await db.execute(sql`
          update billing_payments
          set
            status = 'paid',
            paid_at = now(),
            raw_webhook = ${JSON.stringify(payload)}::jsonb,
            updated_at = now()
          where id = ${Number(payment.id)}
        `);

        if (payment.scope === "company" && payment.company_id) {
          await activateCompany(Number(payment.company_id), payment.plan_id as string);
        }

        if (payment.scope === "accountant") {
          await activateAccountant(Number(payment.user_id), payment.plan_id as string);
        }
      }

      if (isExpiredOrRejectedEvent(event)) {
        await db.execute(sql`
          update billing_payments
          set
            status = 'expired',
            raw_webhook = ${JSON.stringify(payload)}::jsonb,
            updated_at = now()
          where id = ${Number(payment.id)}
        `);
      }

      await db.execute(sql`
        update billing_webhook_events
        set processed = true
        where provider = 'woovi'
          and correlation_id = ${correlationID}
          and processed = false
      `);

      res.json({ ok: true, event, correlationID });
    } catch (error) {
      console.error("Erro ao processar webhook Woovi:", error);
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
