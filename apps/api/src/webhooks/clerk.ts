import type { Express } from "express";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { db } from "@nr1check/db";
import { users } from "@nr1check/db/schema";

/**
 * Webhook do Clerk — sincroniza criação/atualização/exclusão de usuários
 * com a nossa tabela `users`.
 *
 * Configure no painel do Clerk → Webhooks → Endpoint: https://api.nr1check.com.br/webhooks/clerk
 * Eventos: user.created, user.updated, user.deleted
 */
export function registerClerkWebhook(app: Express) {
  app.post("/webhooks/clerk", async (req, res) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) return res.status(400).send("CLERK_WEBHOOK_SECRET não configurado");

    const svix_id = req.headers["svix-id"] as string;
    const svix_timestamp = req.headers["svix-timestamp"] as string;
    const svix_signature = req.headers["svix-signature"] as string;
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).send("Headers svix ausentes");
    }

    const wh = new Webhook(secret);
    let evt: any;
    try {
      evt = wh.verify((req as any).rawBody, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error("Webhook Clerk assinatura inválida:", err);
      return res.status(400).send("Assinatura inválida");
    }

    const { type, data } = evt;
    try {
      if (type === "user.created" || type === "user.updated") {
        const email = data.email_addresses?.[0]?.email_address ?? "";
        const name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || null;
        const imageUrl = data.image_url ?? null;

        const [existing] = await db.select().from(users).where(eq(users.clerkUserId, data.id)).limit(1);
        if (existing) {
          await db.update(users).set({ email, name, imageUrl, updatedAt: new Date() }).where(eq(users.id, existing.id));
        } else {
          await db.insert(users).values({
            clerkUserId: data.id,
            email,
            name,
            imageUrl,
            lastSignedIn: new Date(),
          });
        }
      } else if (type === "user.deleted") {
        await db.delete(users).where(eq(users.clerkUserId, data.id));
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Erro ao processar webhook Clerk:", err);
      res.status(500).send("Internal error");
    }
  });
}
