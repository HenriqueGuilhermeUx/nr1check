import { createHash } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import { z } from "zod";
import { db } from "@nr1check/db";
import {
  cnaeRisks,
  companies,
  epiRecords,
  incidentRecords,
  pgrReviews,
  serviceOrders,
} from "@nr1check/db/schema";
import { protectedProcedure, router } from "../trpc";
import { uploadToR2 } from "../integrations/r2";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY não configurada");
  return new OpenAI({ apiKey: key });
}

function generateHash(data: string): string {
  return createHash("sha256").update(data + Date.now()).digest("hex");
}

const CNAE_SEED = [
  { code: "4711-3", description: "Comércio varejista (supermercados)", risks: ["ergonomico", "acidente"], epi: false },
  { code: "5611-2", description: "Restaurantes e similares", risks: ["fisico", "biologico", "acidente", "ergonomico"], epi: true },
  { code: "8610-1", description: "Atendimento hospitalar", risks: ["biologico", "ergonomico", "psicossocial"], epi: true },
  { code: "4120-4", description: "Construção de edifícios", risks: ["fisico", "quimico", "acidente", "ergonomico"], epi: true },
  { code: "8411-6", description: "Administração pública (prefeituras)", risks: ["ergonomico", "psicossocial"], epi: false },
  { code: "8513-9", description: "Ensino fundamental", risks: ["ergonomico", "psicossocial", "biologico"], epi: false },
  { code: "6201-5", description: "Desenvolvimento de software", risks: ["ergonomico", "psicossocial"], epi: false },
  { code: "4930-2", description: "Transporte rodoviário de carga", risks: ["fisico", "acidente", "ergonomico"], epi: true },
  { code: "8621-6", description: "Clínicas médicas", risks: ["biologico", "ergonomico", "psicossocial"], epi: true },
  { code: "7020-4", description: "Consultoria em gestão", risks: ["ergonomico", "psicossocial"], epi: false },
];

export const complianceRouter = router({
  // ─── CNAE ─────────────────────────────────────────────────────────────
  cnae: router({
    search: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        const dbResults = await db.select().from(cnaeRisks).limit(20);
        const seedResults = CNAE_SEED.filter(
          (c) =>
            c.code.includes(input.query) ||
            c.description.toLowerCase().includes(input.query.toLowerCase()),
        );
        return { dbResults, seedResults };
      }),

    getRisksByCnae: protectedProcedure
      .input(z.object({ cnaeCode: z.string(), companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const dbRisks = await db.select().from(cnaeRisks).where(eq(cnaeRisks.cnaeCode, input.cnaeCode));
        if (dbRisks.length > 0) return { risks: dbRisks, source: "db" as const };

        // Fallback IA
        const seedEntry = CNAE_SEED.find((c) => c.code === input.cnaeCode);
        if (!seedEntry && !input.cnaeCode.match(/^\d{4}-\d/)) {
          return { risks: [], source: "empty" as const };
        }

        try {
          const openai = getOpenAI();
          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Você é um especialista em SST brasileiro. Para o CNAE informado, liste os principais riscos ocupacionais conforme NR-1. Use linguagem defensiva: 'gerenciar', 'mitigar', 'orientar'. Responda em JSON.",
              },
              {
                role: "user",
                content: `CNAE ${input.cnaeCode}${seedEntry ? ` (${seedEntry.description})` : ""}. Liste 3-5 riscos principais com: riskType, riskDescription, severity, requiredDocuments (array), requiresEpi (bool), epiDescription, legalBasis.`,
              },
            ],
            response_format: { type: "json_object" },
          });
          const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
          return { risks: parsed.risks ?? [], source: "ai" as const };
        } catch {
          return { risks: [], source: "error" as const };
        }
      }),

    getChecklist: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const sector = company.sector ?? "servicos";
        return {
          checklist: {
            estruturais: [
              { id: "pgr", label: "PGR vigente e assinado", required: true, legalBasis: "NR-1 item 1.5" },
              { id: "inventario", label: "Inventário de Riscos por função", required: true, legalBasis: "NR-1 item 1.5.2" },
              { id: "plano_acao", label: "Plano de Ação com responsáveis e prazos", required: true, legalBasis: "NR-1 item 1.5.3" },
            ],
            operacionais: [
              { id: "ordem_servico", label: "Ordem de Serviço por função", required: true, legalBasis: "NR-1 item 1.7.1" },
              { id: "treinamento", label: "Registro de treinamentos", required: true, legalBasis: "NR-1 item 1.7" },
              { id: "epi", label: "Ficha de entrega de EPI (quando aplicável)", required: sector !== "servicos", legalBasis: "NR-6" },
            ],
            comportamentais: [
              { id: "codigo_conduta", label: "Código de Conduta SST assinado", required: true, legalBasis: "NR-1 item 1.4" },
              { id: "comunicados", label: "Comunicados internos de segurança", required: false, legalBasis: "NR-1 item 1.4.1" },
              { id: "advertencias", label: "Registros de orientação/advertência", required: false, legalBasis: "CLT art. 482" },
            ],
            monitoramento: [
              { id: "revisao_pgr", label: "Revisão periódica do PGR (máx. 12 meses)", required: true, legalBasis: "NR-1 item 1.5.5" },
              { id: "incidentes", label: "Registro de incidentes (mesmo sem afastamento)", required: true, legalBasis: "NR-1 item 1.5.6" },
            ],
            psicossocial: [
              { id: "copsoq", label: "Avaliação COPSOQ II-Br realizada", required: true, legalBasis: "NR-1 Portaria 1419/2024" },
              { id: "canal_denuncias", label: "Canal de Denúncias ativo e divulgado", required: true, legalBasis: "Lei 15.377/2026" },
              { id: "cursos", label: "Cursos obrigatórios concluídos", required: true, legalBasis: "NR-1 item 1.7" },
            ],
          },
          company: { name: company.name, sector: company.sector },
        };
      }),
  }),

  // ─── ORDENS DE SERVIÇO ────────────────────────────────────────────────
  serviceOrder: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return db.select().from(serviceOrders).where(eq(serviceOrders.companyId, input.companyId)).orderBy(desc(serviceOrders.createdAt));
      }),

    generate: protectedProcedure
      .input(z.object({ companyId: z.number(), departmentId: z.number().optional(), jobTitle: z.string().min(2), mainActivities: z.string().min(10) }))
      .mutation(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const openai = getOpenAI();
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Especialista em SST brasileiro. Use linguagem 100% DEFENSIVA para o empregador: 'gerenciar', 'mitigar', 'orientar', 'adotar medidas compatíveis'. NUNCA 'garantir', 'eliminar totalmente' ou 'ambiente livre de risco'. Responda em JSON com identifiedRisks e safetyInstructions (incluindo a frase-base: 'A empresa adotou medidas razoáveis e proporcionais, compatíveis com sua realidade operacional').",
            },
            {
              role: "user",
              content: `Gere Ordem de Serviço NR-1 para função "${input.jobTitle}" na empresa "${company.name}" (setor: ${company.sector ?? "serviços"}). Atividades: ${input.mainActivities}.`,
            },
          ],
          response_format: { type: "json_object" },
        });
        const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");

        const hash = generateHash(JSON.stringify({ ...input, ...parsed, userId: ctx.user.id }));
        const [result] = await db.insert(serviceOrders).values({
          companyId: input.companyId,
          departmentId: input.departmentId,
          jobTitle: input.jobTitle,
          mainActivities: input.mainActivities,
          identifiedRisks: parsed.identifiedRisks ?? "",
          safetyInstructions: parsed.safetyInstructions ?? "",
          documentHash: hash,
        }).returning();

        // Upload do PDF
        try {
          const pdfContent = formatServiceOrderPDF(company.name, result);
          const url = await uploadToR2(`service-orders/${company.id}/${result.id}.pdf`, pdfContent, "application/pdf");
          await db.update(serviceOrders).set({ pdfUrl: url }).where(eq(serviceOrders.id, result.id));
        } catch (err) {
          console.warn("Upload R2 falhou:", err);
        }

        return result;
      }),

    sign: protectedProcedure
      .input(z.object({ orderId: z.number(), employeeName: z.string().min(2), employeeId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        await db.update(serviceOrders).set({
          employeeName: input.employeeName,
          employeeId: input.employeeId,
          signedAt: new Date(),
          signatureIp: ctx.ip,
        }).where(eq(serviceOrders.id, input.orderId));
        return { success: true, signedAt: new Date(), ip: ctx.ip };
      }),
  }),

  // ─── EPI ──────────────────────────────────────────────────────────────
  epi: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return db.select().from(epiRecords).where(eq(epiRecords.companyId, input.companyId)).orderBy(desc(epiRecords.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        employeeId: z.number(),
        epiName: z.string().min(2),
        epiCa: z.string().optional(),
        purpose: z.string().min(5),
        quantity: z.number().min(1).default(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const hash = generateHash(JSON.stringify({ ...input, userId: ctx.user.id }));
        const [result] = await db.insert(epiRecords).values({ ...input, documentHash: hash }).returning();
        return result;
      }),

    sign: protectedProcedure
      .input(z.object({ epiId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.update(epiRecords).set({ signedAt: new Date(), signatureIp: ctx.ip }).where(eq(epiRecords.id, input.epiId));
        return { success: true };
      }),
  }),

  // ─── INCIDENTES ───────────────────────────────────────────────────────
  incident: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return db.select().from(incidentRecords).where(eq(incidentRecords.companyId, input.companyId)).orderBy(desc(incidentRecords.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        departmentId: z.number().optional(),
        occurredAt: z.string().datetime(),
        location: z.string().optional(),
        description: z.string().min(10),
        hasInjury: z.boolean().default(false),
        injuryDescription: z.string().optional(),
        immediateAction: z.string().min(5),
        preventiveMeasures: z.string().min(5),
      }))
      .mutation(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const hash = generateHash(JSON.stringify({ ...input, userId: ctx.user.id, ip: ctx.ip }));
        const [result] = await db.insert(incidentRecords).values({
          ...input,
          occurredAt: new Date(input.occurredAt),
          registeredById: ctx.user.id,
          registeredByName: ctx.user.name ?? ctx.user.email,
          registeredByIp: ctx.ip,
          documentHash: hash,
        }).returning();
        return { ...result, hash };
      }),

    updateStatus: protectedProcedure
      .input(z.object({ incidentId: z.number(), status: z.enum(["aberto", "em_analise", "encerrado"]) }))
      .mutation(async ({ input }) => {
        await db.update(incidentRecords).set({ status: input.status, updatedAt: new Date() }).where(eq(incidentRecords.id, input.incidentId));
        return { success: true };
      }),
  }),

  // ─── REVISÃO PGR ──────────────────────────────────────────────────────
  pgrReview: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return db.select().from(pgrReviews).where(eq(pgrReviews.companyId, input.companyId)).orderBy(desc(pgrReviews.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        reviewReason: z.enum(["periodica", "mudanca_processo", "incidente", "fiscalizacao", "outro"]).default("periodica"),
        conclusion: z.string().min(10),
        changesRequired: z.boolean().default(false),
        changesDescription: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const nextReview = new Date();
        nextReview.setFullYear(nextReview.getFullYear() + 1);
        const hash = generateHash(JSON.stringify({ ...input, userId: ctx.user.id, ip: ctx.ip }));
        const [result] = await db.insert(pgrReviews).values({
          ...input,
          nextReviewDate: nextReview,
          responsibleId: ctx.user.id,
          responsibleName: ctx.user.name ?? ctx.user.email,
          responsibleIp: ctx.ip,
          documentHash: hash,
        }).returning();
        return { ...result, nextReviewDate: nextReview };
      }),

    checkAlerts: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const reviews = await db.select().from(pgrReviews)
          .where(eq(pgrReviews.companyId, input.companyId))
          .orderBy(desc(pgrReviews.createdAt)).limit(1);
        const now = new Date();
        if (reviews.length === 0) {
          return { alert: "critical" as const, message: "Nenhuma revisão do PGR registrada. Crie a primeira revisão imediatamente.", daysOverdue: null };
        }
        const nextReview = new Date(reviews[0].nextReviewDate);
        const daysUntil = Math.floor((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) return { alert: "critical" as const, message: `Revisão do PGR atrasada há ${Math.abs(daysUntil)} dias!`, daysOverdue: Math.abs(daysUntil), nextReviewDate: nextReview };
        if (daysUntil <= 30) return { alert: "warning" as const, message: `Revisão do PGR vence em ${daysUntil} dias.`, daysOverdue: null, nextReviewDate: nextReview };
        return { alert: "ok" as const, message: `PGR revisado. Próxima revisão em ${daysUntil} dias.`, daysOverdue: null, nextReviewDate: nextReview };
      }),
  }),

  // ─── PAINEL DE DEFESA ─────────────────────────────────────────────────
  defensePanel: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const [orders, epis, incidents, reviews] = await Promise.all([
        db.select().from(serviceOrders).where(eq(serviceOrders.companyId, input.companyId)),
        db.select().from(epiRecords).where(eq(epiRecords.companyId, input.companyId)),
        db.select().from(incidentRecords).where(eq(incidentRecords.companyId, input.companyId)),
        db.select().from(pgrReviews).where(eq(pgrReviews.companyId, input.companyId)).orderBy(desc(pgrReviews.createdAt)).limit(1),
      ]);

      const now = new Date();
      const checks = [
        { id: "pgr", label: "PGR vigente", status: company.pgrDueDate && new Date(company.pgrDueDate) > now ? "green" : "red", detail: company.pgrDueDate ? `Válido até ${new Date(company.pgrDueDate).toLocaleDateString("pt-BR")}` : "PGR não gerado" },
        { id: "revisao_pgr", label: "Revisão periódica do PGR", status: reviews.length > 0 ? (new Date(reviews[0].nextReviewDate) > now ? "green" : "red") : "red", detail: reviews.length > 0 ? `Última revisão: ${new Date(reviews[0].createdAt).toLocaleDateString("pt-BR")}` : "Nenhuma revisão registrada" },
        { id: "ordens_servico", label: "Ordens de Serviço por função", status: orders.length > 0 ? "green" : "yellow", detail: `${orders.length} ordem(ns) gerada(s)` },
        { id: "ordens_assinadas", label: "Ordens de Serviço assinadas", status: orders.filter((o) => o.signedAt).length === orders.length && orders.length > 0 ? "green" : orders.some((o) => o.signedAt) ? "yellow" : "red", detail: `${orders.filter((o) => o.signedAt).length}/${orders.length} assinadas` },
        { id: "epi", label: "Fichas de EPI registradas", status: epis.length > 0 ? "green" : "yellow", detail: `${epis.length} ficha(s) de EPI` },
        { id: "incidentes", label: "Registro de incidentes", status: incidents.filter((i) => i.status === "aberto").length === 0 ? "green" : "yellow", detail: `${incidents.length} incidente(s) | ${incidents.filter((i) => i.status === "aberto").length} aberto(s)` },
      ];

      const greenCount = checks.filter((c) => c.status === "green").length;
      const redCount = checks.filter((c) => c.status === "red").length;
      const overallStatus = redCount > 0 ? "red" : greenCount === checks.length ? "green" : "yellow";
      const score = Math.round((greenCount / checks.length) * 100);

      return { checks, overallStatus, score, company: { name: company.name } };
    }),
});

// Helper simples para gerar o "PDF" (em produção use puppeteer ou react-pdf)
function formatServiceOrderPDF(companyName: string, order: any): Buffer {
  const content = `
ORDEM DE SERVIÇO — NR-1
Empresa: ${companyName}
Função: ${order.jobTitle}

Atividades principais:
${order.mainActivities}

Riscos identificados:
${order.identifiedRisks}

Instruções de segurança:
${order.safetyInstructions}

Frase-base: A empresa adotou medidas razoáveis e proporcionais, compatíveis com sua realidade operacional, visando à prevenção e controle dos riscos identificados.

Data: ${new Date().toLocaleDateString("pt-BR")}
Hash do documento: ${order.documentHash}
`;
  return Buffer.from(content, "utf-8");
}
