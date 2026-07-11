import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import { companies } from "@nr1check/db/schema";
import { protectedProcedure, router } from "../trpc";

type PixPlanId = "nr1_solo" | "nr1_pro" | "contador";

const PIX_PLANS: Record<PixPlanId, { name: string; amountCents: number; scope: "company" | "accountant" }> = {
  nr1_solo: { name: "NR1Check Empresa Solo", amountCents: 7900, scope: "company" },
  nr1_pro: { name: "NR1Check PME Pro", amountCents: 13900, scope: "company" },
  contador: { name: "NR1Check Contador", amountCents: 19900, scope: "accountant" },
};

type WooviChargeResponse = {
  charge?: {
    identifier?: string;
    correlationID?: string;
    status?: string;
    value?: number;
    comment?: string;
    brCode?: string;
    qrCodeImage?: string;
    paymentLinkID?: string;
    paymentLinkUrl?: string;
    paymentLink?: string;
  };
  data?: { charge?: WooviChargeResponse["charge"] };
  errors?: Array<{ message?: string }>;
};

function getWooviConfig() {
  const appId = process.env.WOOVI_APP_ID || process.env.OPENPIX_APP_ID;
  const baseUrl = process.env.WOOVI_API_URL || "https://api.woovi.com/api/v1";

  if (!appId) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "WOOVI_APP_ID não configurado no Render" });
  }

  return { appId, baseUrl };
}

function getCharge(response: WooviChargeResponse) {
  return response.charge ?? response.data?.charge ?? null;
}

function buildPaymentLink(charge: NonNullable<ReturnType<typeof getCharge>>) {
  if (charge.paymentLinkUrl) return charge.paymentLinkUrl;
  if (charge.paymentLink) return charge.paymentLink;
  if (charge.paymentLinkID) return `https://openpix.com.br/pay/${charge.paymentLinkID}`;
  return null;
}

function makeCorrelationID({ scope, userId, companyId, planId }: { scope: "company" | "accountant"; userId: number; companyId?: number | null; planId: PixPlanId }) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  if (scope === "company") return `nr1_company_${companyId}_${planId}_${timestamp}_${random}`;
  return `nr1_accountant_${userId}_${planId}_${timestamp}_${random}`;
}

async function insertPayment(input: {
  userId: number;
  companyId?: number | null;
  scope: "company" | "accountant";
  planId: PixPlanId;
  amountCents: number;
  correlationID: string;
  wooviChargeId?: string | null;
  brCode?: string | null;
  qrCodeImage?: string | null;
  paymentLinkUrl?: string | null;
  rawResponse?: unknown;
}) {
  const result = await db.execute(sql`
    insert into billing_payments (
      provider,
      scope,
      user_id,
      company_id,
      plan_id,
      amount_cents,
      status,
      woovi_correlation_id,
      woovi_charge_id,
      br_code,
      qr_code_image,
      payment_link_url,
      raw_response
    )
    values (
      'woovi',
      ${input.scope},
      ${input.userId},
      ${input.companyId ?? null},
      ${input.planId},
      ${input.amountCents},
      'pending',
      ${input.correlationID},
      ${input.wooviChargeId ?? null},
      ${input.brCode ?? null},
      ${input.qrCodeImage ?? null},
      ${input.paymentLinkUrl ?? null},
      ${JSON.stringify(input.rawResponse ?? {})}::jsonb
    )
    returning id
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows;
  return Number(rows?.[0]?.id);
}

async function findPayment(paymentId: number, userId: number) {
  const result = await db.execute(sql`
    select
      id,
      provider,
      scope,
      user_id,
      company_id,
      plan_id,
      amount_cents,
      status,
      woovi_correlation_id,
      woovi_charge_id,
      br_code,
      qr_code_image,
      payment_link_url,
      paid_at,
      created_at
    from billing_payments
    where id = ${paymentId}
      and user_id = ${userId}
    limit 1
  `);

  const rows = Array.isArray(result) ? result : (result as any).rows;
  return rows?.[0] ?? null;
}

function isActiveStatus(status?: string | null) {
  return status === "active" || status === "trialing" || status === "paid";
}

export const wooviRouter = router({
  createPixCharge: protectedProcedure
    .input(z.object({ planId: z.enum(["nr1_solo", "nr1_pro", "contador"]), companyId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const plan = PIX_PLANS[input.planId];
      if (!plan) throw new TRPCError({ code: "BAD_REQUEST", message: "Plano inválido" });

      let companyName: string | null = null;

      if (plan.scope === "company") {
        if (!input.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "Informe a empresa para assinar este plano" });

        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Empresa não pertence a este usuário" });
        }
        companyName = company.name;
      }

      const { appId, baseUrl } = getWooviConfig();
      const correlationID = makeCorrelationID({ scope: plan.scope, userId: ctx.user.id, companyId: input.companyId ?? null, planId: input.planId });
      const comment = plan.scope === "company" ? `${plan.name} - ${companyName ?? "Empresa"}` : `${plan.name} - ${ctx.user.email}`;

      const payload = {
        correlationID,
        value: plan.amountCents,
        comment,
        customer: {
          name: ctx.user.name ?? ctx.user.email,
          email: ctx.user.email,
        },
      };

      const response = await fetch(`${baseUrl}/charge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: appId },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as WooviChargeResponse;

      if (!response.ok) {
        const message = json.errors?.map((error) => error.message).filter(Boolean).join(", ") || `Erro Woovi HTTP ${response.status}`;
        throw new TRPCError({ code: "BAD_GATEWAY", message });
      }

      const charge = getCharge(json);
      if (!charge) throw new TRPCError({ code: "BAD_GATEWAY", message: "Woovi não retornou cobrança" });

      const paymentLinkUrl = buildPaymentLink(charge);
      const paymentId = await insertPayment({
        userId: ctx.user.id,
        companyId: input.companyId ?? null,
        scope: plan.scope,
        planId: input.planId,
        amountCents: plan.amountCents,
        correlationID,
        wooviChargeId: charge.identifier ?? null,
        brCode: charge.brCode ?? null,
        qrCodeImage: charge.qrCodeImage ?? null,
        paymentLinkUrl,
        rawResponse: json,
      });

      return {
        paymentId,
        provider: "woovi",
        scope: plan.scope,
        planId: input.planId,
        planName: plan.name,
        amountCents: plan.amountCents,
        amountFormatted: `R$ ${(plan.amountCents / 100).toFixed(2).replace(".", ",")}`,
        correlationID,
        status: charge.status ?? "pending",
        brCode: charge.brCode ?? null,
        qrCodeImage: charge.qrCodeImage ?? null,
        paymentLinkUrl,
      };
    }),

  paymentStatus: protectedProcedure
    .input(z.object({ paymentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const payment = await findPayment(input.paymentId, ctx.user.id);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Pagamento não encontrado" });

      return {
        id: Number(payment.id),
        provider: payment.provider as string,
        scope: payment.scope as string,
        companyId: payment.company_id ? Number(payment.company_id) : null,
        planId: payment.plan_id as string,
        amountCents: Number(payment.amount_cents),
        amountFormatted: `R$ ${(Number(payment.amount_cents) / 100).toFixed(2).replace(".", ",")}`,
        status: payment.status as string,
        correlationID: payment.woovi_correlation_id as string,
        brCode: payment.br_code as string | null,
        qrCodeImage: payment.qr_code_image as string | null,
        paymentLinkUrl: payment.payment_link_url as string | null,
        paidAt: payment.paid_at as string | null,
        createdAt: payment.created_at as string,
        isPaid: payment.status === "paid" || payment.status === "completed" || payment.status === "active",
      };
    }),

  billingStatus: protectedProcedure.query(async ({ ctx }) => {
    const userResult = await db.execute(sql`
      select id, email, billing_provider, billing_plan, billing_status
      from users
      where id = ${ctx.user.id}
      limit 1
    `);

    const userRows = Array.isArray(userResult) ? userResult : (userResult as any).rows;
    const user = userRows?.[0];

    const companiesResult = await db.execute(sql`
      select
        id,
        name,
        billing_provider,
        billing_plan,
        billing_status,
        stripe_status,
        stripe_plan
      from companies
      where owner_id = ${ctx.user.id}
      order by id asc
    `);

    const companyRows = Array.isArray(companiesResult) ? companiesResult : (companiesResult as any).rows;
    const accountStatus = user?.billing_status as string | null;
    const accountPlan = user?.billing_plan as string | null;

    const mappedCompanies = (companyRows ?? []).map((company: any) => {
      const billingStatus = company.billing_status as string | null;
      const stripeStatus = company.stripe_status as string | null;

      return {
        id: Number(company.id),
        name: company.name as string,
        billingProvider: company.billing_provider as string | null,
        billingPlan: company.billing_plan as string | null,
        billingStatus,
        stripeStatus,
        stripePlan: company.stripe_plan as string | null,
        isActive: isActiveStatus(billingStatus) || isActiveStatus(stripeStatus),
      };
    });

    return {
      accountant: {
        billingProvider: user?.billing_provider as string | null,
        billingPlan: accountPlan,
        billingStatus: accountStatus,
        isActive: accountPlan === "contador" && isActiveStatus(accountStatus),
      },
      companies: mappedCompanies,
      hasActiveCompany: mappedCompanies.some((company: any) => company.isActive),
      hasAnyActiveBilling: (accountPlan === "contador" && isActiveStatus(accountStatus)) || mappedCompanies.some((company: any) => company.isActive),
    };
  }),
});
