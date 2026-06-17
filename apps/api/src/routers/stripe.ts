import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import { companies, stripeEvents } from "@nr1check/db/schema";
import { PLAN_LIMITS, type PlanId } from "@nr1check/shared";
import { protectedProcedure, publicProcedure, router } from "../trpc";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "STRIPE_SECRET_KEY não configurada" });
  return new Stripe(key);
}

const priceIdCache: Partial<Record<PlanId, string>> = {};

async function ensureStripePriceId(planId: PlanId): Promise<string> {
  if (priceIdCache[planId]) return priceIdCache[planId]!;
  const stripe = getStripe();
  const plan = PLAN_LIMITS[planId];
  if (plan.priceMonthly === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Plano corporativo: contate vendas" });

  const products = await stripe.products.search({
    query: `metadata['nr1check_plan_id']:'${planId}'`,
  });
  let productId: string;
  if (products.data.length > 0) productId = products.data[0].id;
  else {
    const product = await stripe.products.create({
      name: plan.name,
      metadata: { nr1check_plan_id: planId },
    });
    productId = product.id;
  }

  const prices = await stripe.prices.list({ product: productId, active: true, currency: "brl" });
  const existing = prices.data.find((p) => p.recurring?.interval === "month" && p.unit_amount === plan.priceMonthly);
  let priceId: string;
  if (existing) priceId = existing.id;
  else {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: plan.priceMonthly,
      currency: "brl",
      recurring: { interval: "month" },
      metadata: { nr1check_plan_id: planId },
    });
    priceId = price.id;
  }
  priceIdCache[planId] = priceId;
  return priceId;
}

export const stripeRouter = router({
  // Lista planos disponíveis
  plans: publicProcedure.query(() => {
    return Object.entries(PLAN_LIMITS).map(([id, p]) => ({
      id: id as PlanId,
      name: p.name,
      priceMonthly: p.priceMonthly / 100,
      maxEmployees: p.maxEmployees,
    }));
  }),

  // Cria sessão de checkout
  createCheckout: protectedProcedure
    .input(z.object({ companyId: z.number(), planId: z.enum(["nr1_solo", "nr1_pro"]), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const planId = input.planId as PlanId;
      const plan = PLAN_LIMITS[planId];
      const priceId = await ensureStripePriceId(planId);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: ctx.user.email,
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          company_id: input.companyId.toString(),
          plan_id: planId,
        },
        subscription_data: {
          metadata: { company_id: input.companyId.toString(), plan_id: planId },
        },
        success_url: `${input.origin}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&company=${input.companyId}`,
        cancel_url: `${input.origin}/precos`,
      });

      return {
        checkoutUrl: session.url!,
        sessionId: session.id,
        planName: plan.name,
        priceMonthly: plan.priceMonthly / 100,
      };
    }),

  // Status da assinatura
  subscriptionStatus: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company) return null;
      return {
        plan: company.stripePlan,
        status: company.stripeStatus,
        subscriptionId: company.stripeSubscriptionId,
        isActive: company.stripeStatus === "active",
      };
    }),

  // Portal do cliente (gerenciar/cancelar)
  createPortalSession: protectedProcedure
    .input(z.object({ companyId: z.number(), origin: z.string() }))
    .mutation(async ({ input }) => {
      const stripe = getStripe();
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company?.stripeCustomerId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empresa sem assinatura ativa" });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: `${input.origin}/dashboard`,
      });
      return { portalUrl: session.url };
    }),
});
