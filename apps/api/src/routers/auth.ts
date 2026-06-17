import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  logout: protectedProcedure.mutation(() => {
    // Clerk gerencia sessão via cookie/token no cliente
    return { success: true };
  }),

  checkCompanyAccess: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { db } = await import("@nr1check/db");
      const { companies, managers } = await import("@nr1check/db/schema");
      const { eq, and } = await import("drizzle-orm");

      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);

      if (!company) return { hasAccess: false, role: null };

      if (company.ownerId === ctx.user.id) {
        return { hasAccess: true, role: "owner" as const };
      }

      const [mgr] = await db
        .select()
        .from(managers)
        .where(
          and(eq(managers.userId, ctx.user.id), eq(managers.companyId, input.companyId)),
        )
        .limit(1);

      return {
        hasAccess: !!mgr,
        role: mgr?.managerRole ?? null,
      };
    }),
});
