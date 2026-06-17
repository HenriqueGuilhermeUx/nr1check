import type { Express } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@nr1check/db";
import { companies, stripeEvents } from "@nr1check/db/schema";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada");
  return new Stripe(key);
}

export function registerStripeWebhook(app: Express) {
  // Endpoint raw (precisa vir antes do express.json())
  app.post("/webhooks/stripe", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !secret) return res.status(400).send("Webhook não configurado");

    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent((req as any).rawBody, sig as string, secret);
    } catch (err) {
      console.error("Webhook Stripe assinatura inválida:", err);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    try {
      // Idempotência
      const [exists] = await db.select().from(stripeEvents).where(eq(stripeEvents.stripeEventId, event.id)).limit(1);
      if (exists) return res.json({ received: true, duplicate: true });

      await db.insert(stripeEvents).values({
        stripeEventId: event.id,
        type: event.type,
        payload: event as any,
        processed: false,
      });

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const companyId = Number(session.metadata?.company_id);
          if (companyId && session.subscription) {
            await db.update(companies).set({
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              stripeStatus: "active",
              stripePlan: (session.metadata?.plan_id as any) ?? "nr1_solo",
              updatedAt: new Date(),
            }).where(eq(companies.id, companyId));
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const companyId = Number(sub.metadata?.company_id);
          if (companyId) {
            await db.update(companies).set({
              stripeStatus: sub.status,
              updatedAt: new Date(),
            }).where(eq(companies.id, companyId));
          }
          break;
        }
      }

      await db.update(stripeEvents).set({ processed: true }).where(eq(stripeEvents.stripeEventId, event.id));
      res.json({ received: true });
    } catch (err) {
      console.error("Erro ao processar webhook Stripe:", err);
      res.status(500).send("Internal error");
    }
  });
}
