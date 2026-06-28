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

type UserContextRow = {
  id: number;
  clerkUserId: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
};

function getIp(req: CreateExpressContextOptions["req"]): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "0.0.0.0"
  );
}

function toContextUser(row: UserContextRow): Context["user"] {
  return {
    id: row.id,
    clerkUserId: row.clerkUserId,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

async function findUserByClerkId(clerkUserId: string): Promise<UserContextRow | null> {
  const [row] = await db
    .select({
      id: users.id,
      clerkUserId: users.clerkUserId,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  return row ?? null;
}

async function findUserByEmail(email: string): Promise<UserContextRow | null> {
  const [row] = await db
    .select({
      id: users.id,
      clerkUserId: users.clerkUserId,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return row ?? null;
}

async function getClerkProfile(secretKey: string, clerkUserId: string) {
  const clerk = createClerkClient({ secretKey });
  const clerkUser = await clerk.users.getUser(clerkUserId);

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    "";

  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
    clerkUser.username ||
    null;

  return { email, name };
}

async function syncUserFromClerk(secretKey: string, clerkUserId: string): Promise<UserContextRow> {
  const existingByClerk = await findUserByClerkId(clerkUserId);

  if (existingByClerk) {
    return existingByClerk;
  }

  const profile = await getClerkProfile(secretKey, clerkUserId);

  if (!profile.email) {
    throw new Error(`Clerk user ${clerkUserId} sem e-mail primário`);
  }

  const existingByEmail = await findUserByEmail(profile.email);

  if (existingByEmail) {
    const [updated] = await db
      .update(users)
      .set({
        clerkUserId,
        name: profile.name ?? existingByEmail.name,
      })
      .where(eq(users.id, existingByEmail.id))
      .returning({
        id: users.id,
        clerkUserId: users.clerkUserId,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    return updated ?? existingByEmail;
  }

  try {
    const [inserted] = await db
      .insert(users)
      .values({
        clerkUserId,
        email: profile.email,
        name: profile.name,
      })
      .returning({
        id: users.id,
        clerkUserId: users.clerkUserId,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    if (!inserted) {
      throw new Error("Usuário não retornou após insert");
    }

    return inserted;
  } catch (error) {
    const fallbackByEmail = await findUserByEmail(profile.email);

    if (fallbackByEmail) {
      const [updated] = await db
        .update(users)
        .set({
          clerkUserId,
          name: profile.name ?? fallbackByEmail.name,
        })
        .where(eq(users.id, fallbackByEmail.id))
        .returning({
          id: users.id,
          clerkUserId: users.clerkUserId,
          email: users.email,
          name: users.name,
          role: users.role,
        });

      return updated ?? fallbackByEmail;
    }

    throw error;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions,
): Promise<Context> {
  const ip = getIp(opts.req);

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

    const userRow = await syncUserFromClerk(secretKey, clerkUserId);

    return {
      req: opts.req,
      res: opts.res,
      user: toContextUser(userRow),
      ip,
    };
  } catch (error) {
    console.error("Erro ao criar contexto autenticado:", error);

    return {
      req: opts.req,
      res: opts.res,
      user: null,
      ip,
    };
  }
}
