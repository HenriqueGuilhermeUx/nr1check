import { createHash, randomInt } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import { companies, employees } from "@nr1check/db/schema";
import { createEmployeeSchema, cpfSchema } from "@nr1check/shared";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { sendEmployeeLoginToken } from "../integrations/whatsapp";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export const employeeRouter = router({
  // Lista funcionários de uma empresa
  list: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);
      if (!company || company.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.select().from(employees).where(eq(employees.companyId, input.companyId));
    }),

  // Cadastrar funcionário
  create: protectedProcedure
    .input(createEmployeeSchema)
    .mutation(async ({ ctx, input }) => {
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, input.companyId))
        .limit(1);
      if (!company || company.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const cpf = normalizeCpf(input.cpf);
      const [existing] = await db
        .select()
        .from(employees)
        .where(and(eq(employees.companyId, input.companyId), eq(employees.cpf, cpf)))
        .limit(1);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Funcionário já cadastrado com este CPF" });
      }

      const [inserted] = await db
        .insert(employees)
        .values({ ...input, cpf })
        .returning();
      return inserted;
    }),

  // Importar vários via planilha
  bulkCreate: protectedProcedure
    .input(z.array(createEmployeeSchema))
    .mutation(async ({ ctx, input }) => {
      const results = { created: 0, errors: [] as string[] };
      for (const emp of input) {
        try {
          const cpf = normalizeCpf(emp.cpf);
          const [existing] = await db
            .select()
            .from(employees)
            .where(and(eq(employees.companyId, emp.companyId), eq(employees.cpf, cpf)))
            .limit(1);
          if (existing) {
            results.errors.push(`CPF ${cpf} já cadastrado`);
            continue;
          }
          await db.insert(employees).values({ ...emp, cpf });
          results.created++;
        } catch (err) {
          results.errors.push(`${emp.name}: ${(err as Error).message}`);
        }
      }
      return results;
    }),

  // Solicitar token de acesso via CPF (envia por WhatsApp)
  requestToken: publicProcedure
    .input(z.object({ cpf: cpfSchema, companyId: z.number() }))
    .mutation(async ({ input }) => {
      const cpf = normalizeCpf(input.cpf);
      const [employee] = await db
        .select()
        .from(employees)
        .where(and(eq(employees.companyId, input.companyId), eq(employees.cpf, cpf)))
        .limit(1);

      // Resposta ambígua por segurança (evita enumeração)
      if (!employee) {
        return { success: true, message: "Se o CPF estiver cadastrado, você receberá o código." };
      }

      const token = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db
        .update(employees)
        .set({ accessToken: token, tokenExpiresAt: expiresAt })
        .where(eq(employees.id, employee.id));

      if (employee.phone) {
        const [company] = await db
          .select()
          .from(companies)
          .where(eq(companies.id, input.companyId))
          .limit(1);
        await sendEmployeeLoginToken(
          employee.phone,
          employee.name,
          token,
          company?.name ?? "NR1Check",
        );
      }

      return {
        success: true,
        message: "Código enviado para o seu WhatsApp cadastrado.",
        devToken: process.env.NODE_ENV === "development" ? token : undefined,
      };
    }),

  // Verificar token e autenticar funcionário
  verifyToken: publicProcedure
    .input(z.object({ cpf: cpfSchema, token: z.string().length(6), companyId: z.number() }))
    .mutation(async ({ input }) => {
      const cpf = normalizeCpf(input.cpf);
      const [employee] = await db
        .select()
        .from(employees)
        .where(and(eq(employees.companyId, input.companyId), eq(employees.cpf, cpf)))
        .limit(1);

      if (!employee || employee.accessToken !== input.token) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "CPF ou código inválido." });
      }
      if (!employee.tokenExpiresAt || new Date() > employee.tokenExpiresAt) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Código expirado. Solicite um novo." });
      }

      // Token one-time: invalida após uso
      await db
        .update(employees)
        .set({ accessToken: null, tokenExpiresAt: null })
        .where(eq(employees.id, employee.id));

      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, employee.companyId))
        .limit(1);

      return {
        success: true,
        employee: {
          id: employee.id,
          name: employee.name,
          role: employee.role,
          departmentId: employee.departmentId,
          companyId: employee.companyId,
          companyName: company?.name,
        },
        // Token de sessão simples para o portal do funcionário (cookie httpOnly)
        sessionToken: createHash("sha256")
          .update(`${employee.id}-${Date.now()}`)
          .digest("hex"),
      };
    }),
});
