import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import { companies, departments, employees } from "@nr1check/db/schema";
import { createCompanySchema } from "@nr1check/shared";
import { protectedProcedure, publicProcedure, router } from "../trpc";

const GOOGLE_REVIEW_EMAIL = "notarizex@gmail.com";

function isGoogleReviewUser(email?: string | null) {
  return email?.toLowerCase() === GOOGLE_REVIEW_EMAIL;
}

function reviewCnpjForUser(userId: number) {
  return `90${String(userId).padStart(12, "0")}`.slice(0, 14);
}

async function ensureGoogleReviewCompany(userId: number) {
  const existingCompanies = await db
    .select()
    .from(companies)
    .where(eq(companies.ownerId, userId));

  if (existingCompanies.length > 0) return existingCompanies;

  const demoCnpj = reviewCnpjForUser(userId);

  const [inserted] = await db
    .insert(companies)
    .values({
      ownerId: userId,
      name: "Empresa Demonstração Google Play",
      cnpj: demoCnpj,
      type: "empresa",
      size: "pequena",
      sector: "Serviços administrativos",
      city: "São Paulo",
      state: "SP",
      phone: "11999999999",
      stripeStatus: "active",
      stripePlan: "nr1_pro",
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .returning();

  await db.execute(sql`
    update companies
    set
      billing_provider = 'google_review',
      billing_plan = 'nr1_pro',
      billing_status = 'active',
      updated_at = now()
    where id = ${inserted.id}
  `);

  const [department] = await db
    .insert(departments)
    .values({
      companyId: inserted.id,
      name: "Administrativo",
      description: "Setor de demonstração para revisão Google Play",
    })
    .returning();

  await db.insert(employees).values([
    {
      companyId: inserted.id,
      departmentId: department.id,
      name: "Ana Souza",
      cpf: "11122233344",
      email: "ana.demo@nr1check.com.br",
      phone: "11999990001",
      role: "Analista Administrativo",
      status: "ativo",
    },
    {
      companyId: inserted.id,
      departmentId: department.id,
      name: "Carlos Lima",
      cpf: "22233344455",
      email: "carlos.demo@nr1check.com.br",
      phone: "11999990002",
      role: "Assistente Operacional",
      status: "ativo",
    },
  ]);

  return db.select().from(companies).where(eq(companies.ownerId, userId));
}

export const companyRouter = router({
  // Lista empresas do gestor logado
  my: protectedProcedure.query(async ({ ctx }) => {
    if (isGoogleReviewUser(ctx.user.email)) {
      return ensureGoogleReviewCompany(ctx.user.id);
    }

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
