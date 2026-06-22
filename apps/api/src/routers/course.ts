import { TRPCError } from "@trpc/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import {
  companies,
  courseModules,
  courseProgress,
  courses,
  employees,
} from "@nr1check/db/schema";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const courseRouter = router({
  // Lista cursos (globais + da empresa)
  list: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(courses)
        .where(
          and(
            eq(courses.isActive, true),
            or(isNull(courses.companyId), eq(courses.companyId, input.companyId)),
          ),
        );
    }),

  // Detalhes de um curso com módulos
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [course] = await db.select().from(courses).where(eq(courses.id, input.id)).limit(1);
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      const modules = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.courseId, input.id));
      return { ...course, modules: modules.sort((a, b) => a.order - b.order) };
    }),

  // Progresso do funcionário num curso
  myProgress: publicProcedure
    .input(z.object({ employeeId: z.number(), courseId: z.number() }))
    .query(async ({ input }) => {
      const [progress] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.employeeId, input.employeeId),
            eq(courseProgress.courseId, input.courseId),
          ),
        )
        .limit(1);
      return progress ?? null;
    }),

  // Atualizar progresso (marca módulo como completo)
  updateProgress: publicProcedure
    .input(z.object({
      employeeId: z.number(),
      courseId: z.number(),
      companyId: z.number(),
      moduleId: z.number(),
      quizScore: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [existing] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.employeeId, input.employeeId),
            eq(courseProgress.courseId, input.courseId),
          ),
        )
        .limit(1);

      const allModules = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.courseId, input.courseId));
      const totalModules = allModules.length;

      if (!existing) {
        const [inserted] = await db.insert(courseProgress).values({
          employeeId: input.employeeId,
          courseId: input.courseId,
          companyId: input.companyId,
          currentModuleId: input.moduleId,
          completedModules: [input.moduleId],
          quizScores: input.quizScore !== undefined ? { [input.moduleId]: input.quizScore } : {},
          status: "em_andamento",
        }).returning();
        return inserted;
      }

      const completed = Array.from(new Set([...(existing.completedModules ?? []), input.moduleId]));
      const quizScores = input.quizScore !== undefined
        ? { ...existing.quizScores, [input.moduleId]: input.quizScore }
        : existing.quizScores;
      const status = completed.length >= totalModules ? "concluido" : "em_andamento";
      const completedAt = status === "concluido" ? new Date() : null;

      const [updated] = await db
        .update(courseProgress)
        .set({
          currentModuleId: input.moduleId,
          completedModules: completed,
          quizScores,
          status,
          completedAt,
          updatedAt: new Date(),
        })
        .where(eq(courseProgress.id, existing.id))
        .returning();
      return updated;
    }),

  // Resumo de cursos da empresa (para o gestor)
  summary: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const allCourses = await db
        .select()
        .from(courses)
        .where(and(eq(courses.isActive, true), isNull(courses.companyId)));

      const emps = await db.select().from(employees).where(eq(employees.companyId, input.companyId));
      const progress = await db.select().from(courseProgress).where(eq(courseProgress.companyId, input.companyId));

      return {
        totalCourses: allCourses.length,
        totalEmployees: emps.length,
        totalEnrollments: progress.length,
        completedCount: progress.filter((p) => p.status === "concluido").length,
        completionRate: progress.length > 0
          ? progress.filter((p) => p.status === "concluido").length / progress.length
          : 0,
        courses: allCourses,
      };
    }),
});
