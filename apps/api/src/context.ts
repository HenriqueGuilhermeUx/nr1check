import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { db } from "@nr1check/db";
import { users } from "@nr1check/db/schema";
import { eq } from "drizzle-orm";

export type Context = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: {
    id: number;
    clerkUserId: string;
    email: string;
    name: string | null;
    role: "user" | "admin";
  } | null;
  ip: string;
};

function getIp(req: CreateExpressContextOptions["req"]): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "0.0.0.0"
  );
}

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<Context> {
  const ip = getIp(opts.req);

  // Extrai o token de sessão do Clerk
  const authHeader = opts.req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return { req: opts.req, res: opts.res, user: null, ip };
  }

  const token = authHeader.slice(7);
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn("CLERK_SECRET_KEY não configurada");
    return { req: opts.req, res: opts.res, user: null, ip };
  }

  try {
    const payload = await verifyToken(token, { secretKey });
    const clerkUserId = payload.sub;

    // Busca/cria o usuário no nosso DB
    let userRow = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (userRow.length === 0) {
      // Cria o usuário (geralmente o webhook do Clerk faz isso, mas fallback)
      const clerk = createClerkClient({ secretKey });
      const clerkUser = await clerk.users.getUser(clerkUserId);
      const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
      const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;

      const [inserted] = await db
        .insert(users)
        .values({
          clerkUserId,
          email,
          name,
          imageUrl: clerkUser.imageUrl,
          lastSignedIn: new Date(),
        })
        .returning();
      userRow = [inserted];
    } else {
      // Atualiza lastSignedIn
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, userRow[0].id));
    }

    return {
      req: opts.req,
      res: opts.res,
      user: {
        id: userRow[0].id,
        clerkUserId,
        email: userRow[0].email,
        name: userRow[0].name,
        role: userRow[0].role,
      },
      ip,
    };
  } catch (err) {
    console.error("Erro ao verificar token Clerk:", err);
    return { req: opts.req, res: opts.res, user: null, ip };
  }
}
