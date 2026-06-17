import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import { companies, departments } from "@nr1check/db/schema";
import { createCompanySchema } from "@nr1check/shared";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const companyRouter = router({
  // Lista empresas do gestor logado
  my: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(companies).where(eq(companies.ownerId, ctx.user.id));
  }),

  // Detalhes de uma empresa
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.id))
        .limit(1);

      if (!company) throw new TRPCError({ code: "NOT_FOUND" });
      if (company.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return company;
    }),

  // Busca pública por CNPJ (pré-onboarding)
  lookupByCnpj: publicProcedure
    .input(z.object({ cnpj: z.string() }))
    .query(async ({ input }) => {
      const cnpj = input.cnpj.replace(/\D/g, "");
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.cnpj, cnpj))
        .limit(1);
      return company ?? null;
    }),

  // Criar empresa (onboarding)
  create: protectedProcedure
    .input(createCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select()
        .from(companies)
        .where(eq(companies.cnpj, input.cnpj))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe uma empresa cadastrada com este CNPJ",
        });
      }

      const [inserted] = await db
        .insert(companies)
        .values({
          ...input,
          ownerId: ctx.user.id,
        })
        .returning();

      return inserted;
    }),

  // Atualizar dados
  update: protectedProcedure
    .input(createCompanySchema.partial().extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, id))
        .limit(1);

      if (!company) throw new TRPCError({ code: "NOT_FOUND" });
      if (company.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await db
        .update(companies)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(companies.id, id))
        .returning();
      return updated;
    }),

  // Marcar onboarding como completo
  completeOnboarding: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.id))
        .limit(1);

      if (!company || company.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .update(companies)
        .set({ onboardingCompleted: true, updatedAt: new Date() })
        .where(eq(companies.id, input.id));

      return { success: true };
    }),

  // Departamentos
  departments: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(departments)
        .where(eq(departments.companyId, input.companyId));
    }),

  createDepartment: protectedProcedure
    .input(z.object({ companyId: z.number(), name: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      const [inserted] = await db
        .insert(departments)
        .values(input)
        .returning();
      return inserted;
    }),
});
