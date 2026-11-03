import express, { type Express } from "express";
import { sql } from "drizzle-orm";
import { db } from "@nr1check/db";
import { extendBillingPeriod, recordPartnerCommission } from "../commercial/partners";

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
    identifier?: string;
  };
  transaction?: {
    correlationID?: string;
    identifier?: string;
    charge?: {
      correlationID?: string;
      identifier?: string;
    };
  };
  data?: any;
};

function readEvent(payload: WooviWebhookPayload) {
  return payload.event ?? payload.eventType ?? payload.type ?? payload.data?.event ?? "";
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

function readIdentifierCandidates(payload: WooviWebhookPayload) {
  return unique([
    payload.charge?.correlationID,
    payload.charge?.identifier,

    payload.pixQrCode?.correlationID,
    payload.pixQrCode?.identifier,

    payload.transaction?.correlationID,
    payload.transaction?.identifier,
    payload.transaction?.charge?.correlationID,
    payload.transaction?.charge?.identifier,

    payload.data?.charge?.correlationID,
    payload.data?.charge?.identifier,

    payload.data?.pixQrCode?.correlationID,
    payload.data?.pixQrCode?.identifier,

    payload.data?.transaction?.correlationID,
    payload.data?.transaction?.identifier,
    payload.data?.transaction?.charge?.correlationID,
    payload.data?.transaction?.charge?.identifier,
  ]);
}

function isPaidEvent(event: string) {
  return [
    "OPENPIX:CHARGE_COMPLETED",
    "OPENPIX:TRANSACTION_RECEIVED",
    "PIX_AUTOMATIC_APPROVED",
    "PIX_AUTOMATIC_COBR_COMPLETED",
    "PIX_AUTOMATIC_COBR_APPROVED",
  ].includes(event);
}

function readPaidValue(payload: WooviWebhookPayload) {
  const values = [
    payload.charge?.value,
    payload.data?.charge?.value,
    payload.data?.transaction?.value,
    payload.data?.transaction?.charge?.value,
    (payload.transaction as any)?.value,
    (payload.transaction?.charge as any)?.value,
  ].filter((value) => typeof value === "number") as number[];
  return values[0] ?? null;
}

function isExpiredOrRejectedEvent(event: string) {
  return [
    "OPENPIX:CHARGE_EXPIRED",
    "PIX_AUTOMATIC_REJECTED",
    "PIX_AUTOMATIC_COBR_REJECTED",
    "PIX_AUTOMATIC_COBR_TRY_REJECTED",
  ].includes(event);
}

async function insertWebhookEvent({
  event,
  candidates,
  payload,
}: {
  event: string;
  candidates: string[];
  payload: WooviWebhookPayload;
}) {
  const result = await db.execute(sql`
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
      ${candidates[0] ?? null},
      ${JSON.stringify(payload)}::jsonb,
      false
    )
    returning id
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows;
  return Number(rows?.[0]?.id);
}

async function markWebhookProcessed(eventId: number) {
  await db.execute(sql`
    update billing_webhook_events
    set processed = true
    where id = ${eventId}
  `);
}

async function markWebhookIgnored(eventId: number, reason: string) {
  await db.execute(sql`
    update billing_webhook_events
    set
      processed = true,
      payload = jsonb_set(payload, '{nr1checkIgnoredReason}', ${JSON.stringify(reason)}::jsonb, true)
    where id = ${eventId}
  `);
}

async function getPaymentByCandidates(candidates: string[]) {
  if (!candidates.length) return null;

  const result = await db.execute(sql`
    select
      id,
      scope,
      user_id,
      company_id,
      plan_id,
      amount_cents,
      status,
      woovi_correlation_id,
      woovi_charge_id
    from billing_payments
    where woovi_correlation_id = any(${candidates}::text[])
       or woovi_charge_id = any(${candidates}::text[])
    order by id desc
    limit 1
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows;
  return rows?.[0] ?? null;
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
    const candidates = readIdentifierCandidates(payload);

    let webhookEventId: number | null = null;

    try {
      webhookEventId = await insertWebhookEvent({ event, candidates, payload });

      if (!candidates.length) {
        await markWebhookIgnored(webhookEventId, "missing_identifier_candidates");
        return res.json({
          ok: true,
          ignored: true,
          reason: "missing_identifier_candidates",
          event,
        });
      }

      const payment = await getPaymentByCandidates(candidates);

      if (!payment) {
        await markWebhookIgnored(webhookEventId, "payment_not_found");
        return res.json({
          ok: true,
          ignored: true,
          reason: "payment_not_found",
          event,
          candidates,
        });
      }

      if (isPaidEvent(event)) {
        const paidValue = readPaidValue(payload);
        if (paidValue != null && paidValue !== Number(payment.amount_cents)) {
          await markWebhookIgnored(webhookEventId, `payment_value_mismatch:${paidValue}!=${payment.amount_cents}`);
          return res.json({
            ok: true,
            ignored: true,
            reason: "payment_value_mismatch",
            expected: Number(payment.amount_cents),
            received: paidValue,
          });
        }

        const alreadyPaid = payment.status === "paid" || payment.status === "completed" || payment.status === "active";

        await db.execute(sql`
          update billing_payments
          set
            status = 'paid',
            paid_at = coalesce(paid_at, now()),
            raw_webhook = ${JSON.stringify(payload)}::jsonb,
            updated_at = now()
          where id = ${Number(payment.id)}
        `);

        if (!alreadyPaid) {
          await extendBillingPeriod({
            scope: payment.scope as "company" | "accountant",
            userId: Number(payment.user_id),
            companyId: payment.company_id ? Number(payment.company_id) : null,
            paymentId: Number(payment.id),
            planId: payment.plan_id as string,
          });
          await recordPartnerCommission(Number(payment.id));
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

      await markWebhookProcessed(webhookEventId);

      res.json({
        ok: true,
        event,
        candidates,
        paymentId: Number(payment.id),
        scope: payment.scope,
      });
    } catch (error) {
      console.error("Erro ao processar webhook Woovi:", error);

      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
