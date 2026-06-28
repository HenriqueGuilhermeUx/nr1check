import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import {
  assessmentCycles,
  assessmentResponses,
  companies,
  psychosocialDistributionLogs,
  psychosocialDocuments,
  psychosocialFindings,
  psychosocialRiskInventory,
} from "@nr1check/db/schema";
import { protectedProcedure, router } from "../trpc";

const riskLevelSchema = z.enum(["baixo", "medio", "alto", "critico"]);
const actionStatusSchema = z.enum(["pendente", "em_andamento", "concluido"]);

type RiskLevel = z.infer<typeof riskLevelSchema>;

const DIMENSION_RULES: Record<string, { factor: string; finding: string; action: string; consequences: string }> = {
  "Exigências Quantitativas": {
    factor: "Sobrecarga de trabalho",
    finding: "Indício agregado de sobrecarga, falta de tempo, acúmulo de demandas e pressão por entrega.",
    action: "Revisar distribuição de tarefas, metas, prioridades, prazos e dimensionamento da equipe.",
    consequences: "Aumento de estresse, fadiga, erros, conflitos e queda de desempenho.",
  },
  "Ritmo de Trabalho": {
    factor: "Ritmo de trabalho intenso",
    finding: "Indício agregado de ritmo acelerado, prazos apertados e exigência de atenção constante.",
    action: "Rever fluxo de trabalho, pausas, filas de demanda, metas operacionais e suporte da liderança.",
    consequences: "Cansaço, tensão, irritabilidade, sensação de pressão contínua e maior risco de falhas.",
  },
  "Autonomia e Influência": {
    factor: "Baixa autonomia",
    finding: "Indício agregado de baixa autonomia, pouca influência nas decisões e pouca participação na organização do trabalho.",
    action: "Criar rotinas de escuta, participação, alinhamento de prioridades e clareza de decisão.",
    consequences: "Baixo engajamento, frustração, conflitos e dificuldade de adaptação às demandas.",
  },
  "Apoio Social": {
    factor: "Apoio social insuficiente",
    finding: "Indício agregado de suporte insuficiente entre colegas, liderança ou canais internos de apoio.",
    action: "Treinar liderança, criar rituais de acompanhamento, melhorar feedback e estruturar canal de apoio.",
    consequences: "Isolamento, piora do clima, conflitos e dificuldade de resolução de problemas.",
  },
  "Qualidade de Liderança": {
    factor: "Falhas de liderança",
    finding: "Indício agregado de falhas de liderança, planejamento, desenvolvimento ou gestão de conflitos.",
    action: "Capacitar gestores, registrar acordos de liderança, melhorar planejamento e acompanhar reincidências.",
    consequences: "Conflitos, insegurança, queda de confiança e aumento de relatos ou insatisfação.",
  },
  "Insegurança no Trabalho": {
    factor: "Insegurança no trabalho",
    finding: "Indício agregado de insegurança, preocupação com mudanças e incerteza sobre estabilidade ou futuro do trabalho.",
    action: "Melhorar comunicação interna, transparência nas mudanças, previsibilidade e orientação aos trabalhadores.",
    consequences: "Ansiedade, queda de foco, resistência a mudanças e insegurança organizacional.",
  },
  "Satisfação no Trabalho": {
    factor: "Reconhecimento e satisfação",
    finding: "Indício agregado de baixa satisfação, baixo reconhecimento ou baixo aproveitamento de capacidades.",
    action: "Revisar reconhecimento, feedback, oportunidades, condições de trabalho e uso das capacidades da equipe.",
    consequences: "Desmotivação, queda de produtividade, rotatividade e enfraquecimento do clima organizacional.",
  },
  "Saúde e Bem-Estar": {
    factor: "Saúde e bem-estar",
    finding: "Indício agregado de desgaste, estresse, dificuldade de desligamento ou impacto negativo do trabalho no bem-estar.",
    action: "Priorizar análise de carga, pausas, jornada, suporte, encaminhamentos e monitoramento recorrente.",
    consequences: "Esgotamento, absenteísmo, presenteísmo, conflitos e maior risco de adoecimento relacionado ao trabalho.",
  },
};

async function assertCompanyOwner(userId: number, companyId: number) {
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company || company.ownerId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return company;
}

function classifyRisk(score: number): RiskLevel {
  if (score >= 75) return "critico";
  if (score >= 50) return "alto";
  if (score >= 25) return "medio";
  return "baixo";
}

function riskToMatrix(level: RiskLevel) {
  if (level === "critico") return { probability: 5, severity: 5 };
  if (level === "alto") return { probability: 4, severity: 4 };
  if (level === "medio") return { probability: 3, severity: 3 };
  return { probability: 2, severity: 2 };
}

function matrixToRiskLevel(probability: number, severity: number): RiskLevel {
  const score = probability * severity;
  if (score <= 4) return "baixo";
  if (score <= 9) return "medio";
  if (score <= 16) return "alto";
  return "critico";
}

export const psychosocialRouter = router({
  generateFindingsFromCycle: protectedProcedure
    .input(z.object({ companyId: z.number(), cycleId: z.number(), minResponses: z.number().min(1).default(3) }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);

      const [cycle] = await db
        .select()
        .from(assessmentCycles)
        .where(and(eq(assessmentCycles.id, input.cycleId), eq(assessmentCycles.companyId, input.companyId)))
        .limit(1);

      if (!cycle) throw new TRPCError({ code: "NOT_FOUND", message: "Ciclo não encontrado." });

      const responses = await db
        .select()
        .from(assessmentResponses)
        .where(eq(assessmentResponses.cycleId, input.cycleId));

      if (responses.length < input.minResponses) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `É necessário ter pelo menos ${input.minResponses} respostas para gerar achados agregados.`,
        });
      }

      const buckets: Record<string, number[]> = {};
      for (const response of responses) {
        const scores = response.scores ?? {};
        for (const [dimension, value] of Object.entries(scores)) {
          if (typeof value !== "number") continue;
          if (!buckets[dimension]) buckets[dimension] = [];
          buckets[dimension].push(value);
        }
      }

      const saved = [];
      for (const [dimension, values] of Object.entries(buckets)) {
        if (!values.length) continue;

        const averageScore = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
        const riskLevel = classifyRisk(averageScore);
        const rule = DIMENSION_RULES[dimension] ?? {
          factor: "Outros fatores psicossociais",
          finding: `Indício agregado de atenção na dimensão ${dimension}.`,
          action: "Analisar causas, consultar trabalhadores de forma agregada e definir medidas preventivas proporcionais.",
          consequences: "Possível impacto no clima, desempenho, bem-estar e organização do trabalho.",
        };

        const [row] = await db
          .insert(psychosocialFindings)
          .values({
            companyId: input.companyId,
            cycleId: input.cycleId,
            dimension,
            averageScore,
            riskLevel,
            respondentCount: values.length,
            findingText: rule.finding,
            recommendedAction: rule.action,
            evidence: `Achado calculado a partir do ciclo "${cycle.name}", com ${values.length} resposta(s) consideradas.`,
            createdById: ctx.user.id,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [psychosocialFindings.companyId, psychosocialFindings.cycleId, psychosocialFindings.dimension],
            set: {
              averageScore,
              riskLevel,
              respondentCount: values.length,
              findingText: rule.finding,
              recommendedAction: rule.action,
              evidence: `Achado calculado a partir do ciclo "${cycle.name}", com ${values.length} resposta(s) consideradas.`,
              updatedAt: new Date(),
            },
          })
          .returning();

        saved.push(row);
      }

      return saved;
    }),

  listFindings: protectedProcedure
    .input(z.object({ companyId: z.number(), cycleId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);

      if (input.cycleId) {
        return db
          .select()
          .from(psychosocialFindings)
          .where(and(eq(psychosocialFindings.companyId, input.companyId), eq(psychosocialFindings.cycleId, input.cycleId)));
      }

      return db
        .select()
        .from(psychosocialFindings)
        .where(eq(psychosocialFindings.companyId, input.companyId));
    }),

  sendFindingsToInventory: protectedProcedure
    .input(z.object({ companyId: z.number(), cycleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);

      const findings = await db
        .select()
        .from(psychosocialFindings)
        .where(and(eq(psychosocialFindings.companyId, input.companyId), eq(psychosocialFindings.cycleId, input.cycleId)));

      const existing = await db
        .select()
        .from(psychosocialRiskInventory)
        .where(eq(psychosocialRiskInventory.companyId, input.companyId));

      const existingFindingIds = new Set(existing.map((item) => item.findingId).filter(Boolean));
      const created = [];

      for (const finding of findings) {
        if (finding.riskLevel === "baixo") continue;
        if (existingFindingIds.has(finding.id)) continue;

        const rule = DIMENSION_RULES[finding.dimension] ?? {
          factor: "Outros fatores psicossociais",
          consequences: "Possível impacto no clima, desempenho, bem-estar e organização do trabalho.",
        };
        const matrix = riskToMatrix(finding.riskLevel);

        const [row] = await db
          .insert(psychosocialRiskInventory)
          .values({
            companyId: input.companyId,
            cycleId: input.cycleId,
            findingId: finding.id,
            department: "Empresa / análise agregada",
            role: "Trabalhadores avaliados no ciclo",
            factor: rule.factor,
            description: `${finding.findingText} Score médio: ${finding.averageScore}/100.`,
            evidence: finding.evidence,
            consequences: rule.consequences,
            exposedWorkers: `${finding.respondentCount} respondente(s) no ciclo`,
            probability: matrix.probability,
            severity: matrix.severity,
            riskLevel: finding.riskLevel,
            recommendedAction: finding.recommendedAction,
            responsible: "Gestor/RH/Responsável designado",
            monitoring: "Reavaliar após implantação das ações e registrar evidências.",
            createdById: ctx.user.id,
          })
          .returning();

        created.push(row);
      }

      return created;
    }),

  listInventory: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);
      return db
        .select()
        .from(psychosocialRiskInventory)
        .where(eq(psychosocialRiskInventory.companyId, input.companyId));
    }),

  createInventoryItem: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      cycleId: z.number().optional(),
      department: z.string().min(1),
      role: z.string().optional(),
      factor: z.string().min(1),
      description: z.string().min(1),
      evidence: z.string().optional(),
      consequences: z.string().optional(),
      exposedWorkers: z.string().optional(),
      probability: z.number().min(1).max(5),
      severity: z.number().min(1).max(5),
      existingMeasures: z.string().optional(),
      recommendedAction: z.string().min(1),
      responsible: z.string().optional(),
      deadline: z.string().optional(),
      monitoring: z.string().optional(),
      actionStatus: actionStatusSchema.default("pendente"),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);
      const riskLevel = matrixToRiskLevel(input.probability, input.severity);

      const [row] = await db
        .insert(psychosocialRiskInventory)
        .values({
          companyId: input.companyId,
          cycleId: input.cycleId,
          department: input.department,
          role: input.role,
          factor: input.factor,
          description: input.description,
          evidence: input.evidence,
          consequences: input.consequences,
          exposedWorkers: input.exposedWorkers,
          probability: input.probability,
          severity: input.severity,
          riskLevel,
          existingMeasures: input.existingMeasures,
          recommendedAction: input.recommendedAction,
          responsible: input.responsible,
          deadline: input.deadline ? new Date(`${input.deadline}T12:00:00`) : undefined,
          monitoring: input.monitoring,
          actionStatus: input.actionStatus,
          createdById: ctx.user.id,
        })
        .returning();

      return row;
    }),

  updateInventoryStatus: protectedProcedure
    .input(z.object({ companyId: z.number(), id: z.number(), actionStatus: actionStatusSchema }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);
      const [row] = await db
        .update(psychosocialRiskInventory)
        .set({ actionStatus: input.actionStatus, updatedAt: new Date() })
        .where(and(eq(psychosocialRiskInventory.id, input.id), eq(psychosocialRiskInventory.companyId, input.companyId)))
        .returning();
      return row;
    }),

  deleteInventoryItem: protectedProcedure
    .input(z.object({ companyId: z.number(), id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);
      await db
        .delete(psychosocialRiskInventory)
        .where(and(eq(psychosocialRiskInventory.id, input.id), eq(psychosocialRiskInventory.companyId, input.companyId)));
      return { success: true };
    }),

  listDocuments: protectedProcedure
    .input(z.object({ companyId: z.number(), cycleId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);

      if (input.cycleId) {
        return db
          .select()
          .from(psychosocialDocuments)
          .where(and(eq(psychosocialDocuments.companyId, input.companyId), eq(psychosocialDocuments.cycleId, input.cycleId)));
      }

      return db.select().from(psychosocialDocuments).where(eq(psychosocialDocuments.companyId, input.companyId));
    }),

  createDocument: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      cycleId: z.number().optional(),
      templateId: z.string().min(1),
      title: z.string().min(1),
      status: z.string().default("gerado"),
      notes: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);
      const [row] = await db
        .insert(psychosocialDocuments)
        .values({
          companyId: input.companyId,
          cycleId: input.cycleId,
          templateId: input.templateId,
          title: input.title,
          status: input.status,
          notes: input.notes,
          metadata: input.metadata ?? {},
          generatedById: ctx.user.id,
          generatedAt: new Date(),
        })
        .returning();
      return row;
    }),

  updateDocumentStatus: protectedProcedure
    .input(z.object({ companyId: z.number(), id: z.number(), status: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);
      const now = new Date();
      const [row] = await db
        .update(psychosocialDocuments)
        .set({
          status: input.status,
          signedAt: input.status === "assinado" ? now : undefined,
          archivedAt: input.status === "arquivado" ? now : undefined,
          updatedAt: now,
        })
        .where(and(eq(psychosocialDocuments.id, input.id), eq(psychosocialDocuments.companyId, input.companyId)))
        .returning();
      return row;
    }),

  listDistributionLogs: protectedProcedure
    .input(z.object({ companyId: z.number(), cycleId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);

      if (input.cycleId) {
        return db
          .select()
          .from(psychosocialDistributionLogs)
          .where(and(eq(psychosocialDistributionLogs.companyId, input.companyId), eq(psychosocialDistributionLogs.cycleId, input.cycleId)));
      }

      return db.select().from(psychosocialDistributionLogs).where(eq(psychosocialDistributionLogs.companyId, input.companyId));
    }),

  createDistributionLog: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      cycleId: z.number().optional(),
      channel: z.string().min(1),
      audience: z.string().optional(),
      message: z.string().min(1),
      evidence: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyOwner(ctx.user.id, input.companyId);
      const [row] = await db
        .insert(psychosocialDistributionLogs)
        .values({
          companyId: input.companyId,
          cycleId: input.cycleId,
          channel: input.channel,
          audience: input.audience,
          message: input.message,
          evidence: input.evidence,
          createdById: ctx.user.id,
        })
        .returning();
      return row;
    }),
});
