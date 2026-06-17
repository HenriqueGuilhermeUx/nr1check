import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import {
  assessmentCycles,
  assessmentResponses,
  copsoqQuestions,
  companies,
  departmentRiskScores,
  employees,
  notifications,
} from "@nr1check/db/schema";
import { calcRiskLevel } from "@nr1check/shared";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { sendAssessmentInvitation } from "../integrations/whatsapp";

const SCALE_MAX = 4; // 0-4

function calcScores(
  answers: Record<number, number>,
  questions: { id: number; dimension: string; reverseScore: boolean }[],
) {
  const dimensionScores: Record<string, number[]> = {};
  for (const q of questions) {
    const raw = answers[q.id];
    if (raw === undefined) continue;
    const score = q.reverseScore ? (SCALE_MAX - raw) * 25 : raw * 25;
    if (!dimensionScores[q.dimension]) dimensionScores[q.dimension] = [];
    dimensionScores[q.dimension].push(score);
  }
  const result: Record<string, number> = {};
  for (const [dim, scores] of Object.entries(dimensionScores)) {
    result[dim] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
  return result;
}

export const assessmentRouter = router({
  // Lista de perguntas COPSOQ
  questions: publicProcedure.query(async () => {
    return db.select().from(copsoqQuestions).where(eq(copsoqQuestions.active, true));
  }),

  // Pega o ciclo ativo de uma empresa (público, usado pelo portal do funcionário)
  activeCycle: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const [cycle] = await db
        .select()
        .from(assessmentCycles)
        .where(and(eq(assessmentCycles.companyId, input.companyId), eq(assessmentCycles.status, "active")))
        .orderBy(assessmentCycles.id)
        .limit(1);
      return cycle ?? null;
    }),

  // Ciclos de avaliação da empresa
  cycles: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return db.select().from(assessmentCycles).where(eq(assessmentCycles.companyId, input.companyId));
    }),

  // Criar ciclo + disparar pesquisa via WhatsApp
  createCycle: protectedProcedure
    .input(z.object({ companyId: z.number(), name: z.string().min(2), endDate: z.string().datetime().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const [cycle] = await db.insert(assessmentCycles).values({
        companyId: input.companyId,
        name: input.name,
        status: "active",
        startDate: new Date(),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      }).returning();

      const emps = await db.select().from(employees).where(eq(employees.companyId, input.companyId));
      const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:5173";
      let whatsappSent = 0;

      for (const emp of emps) {
        await db.insert(notifications).values({
          employeeId: emp.id,
          companyId: input.companyId,
          type: "questionario",
          title: "Novo questionário disponível",
          message: `Responda o questionário "${input.name}" para contribuir com a saúde no trabalho.`,
          sentVia: ["whatsapp"],
        });

        if (emp.phone) {
          const link = `${baseUrl}/portal/avaliacao?cycleId=${cycle.id}&employeeId=${emp.id}&companyId=${input.companyId}`;
          const result = await sendAssessmentInvitation(
            emp.phone,
            emp.name,
            link,
            company.name,
            input.endDate ? new Date(input.endDate).toLocaleDateString("pt-BR") : undefined,
          );
          if (result.success) whatsappSent++;
        }
      }

      await db.update(assessmentCycles).set({ totalInvited: emps.length }).where(eq(assessmentCycles.id, cycle.id));

      return { success: true, cycle, employeesNotified: emps.length, whatsappSent };
    }),

  // Encerrar ciclo
  closeCycle: protectedProcedure
    .input(z.object({ cycleId: z.number(), companyId: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(assessmentCycles).set({ status: "closed", updatedAt: new Date() }).where(eq(assessmentCycles.id, input.cycleId));
      return { success: true };
    }),

  // Funcionário responde (público, identificado por employeeId)
  submitResponse: publicProcedure
    .input(z.object({
      cycleId: z.number(),
      employeeId: z.number(),
      departmentId: z.number().optional(),
      answers: z.record(z.string(), z.number().min(0).max(4)),
    }))
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select()
        .from(assessmentResponses)
        .where(and(eq(assessmentResponses.cycleId, input.cycleId), eq(assessmentResponses.employeeId, input.employeeId)))
        .limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Você já respondeu este questionário." });

      const questions = await db.select().from(copsoqQuestions);
      const answersNum: Record<number, number> = {};
      for (const [k, v] of Object.entries(input.answers)) answersNum[Number(k)] = v;

      const scores = calcScores(answersNum, questions);
      const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
      const riskLevel = calcRiskLevel(avg);

      await db.insert(assessmentResponses).values({
        cycleId: input.cycleId,
        employeeId: input.employeeId,
        departmentId: input.departmentId,
        answers: answersNum,
        scores,
        riskLevel,
        completedAt: new Date(),
      });

      // Incrementa contador do ciclo
      const [cycle] = await db.select().from(assessmentCycles).where(eq(assessmentCycles.id, input.cycleId)).limit(1);
      if (cycle) {
        await db.update(assessmentCycles)
          .set({ totalResponded: (cycle.totalResponded ?? 0) + 1 })
          .where(eq(assessmentCycles.id, input.cycleId));
      }

      return { success: true, riskLevel, scores };
    }),

  // Resultados do ciclo (gestor)
  cycleResults: protectedProcedure
    .input(z.object({ cycleId: z.number(), companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const responses = await db.select().from(assessmentResponses).where(eq(assessmentResponses.cycleId, input.cycleId));
      const heatmap = await db.select().from(departmentRiskScores).where(eq(departmentRiskScores.cycleId, input.cycleId));
      const [cycle] = await db.select().from(assessmentCycles).where(eq(assessmentCycles.id, input.cycleId)).limit(1);
      return { responses, heatmap, cycle };
    }),

  // Heatmap por departamento
  heatmap: protectedProcedure
    .input(z.object({ companyId: z.number(), cycleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return db.select().from(departmentRiskScores).where(eq(departmentRiskScores.cycleId, input.cycleId));
    }),
});
