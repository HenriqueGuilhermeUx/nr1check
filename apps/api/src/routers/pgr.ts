import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import OpenAI from "openai";
import { db } from "@nr1check/db";
import {
  assessmentCycles,
  companies,
  pgrReports,
} from "@nr1check/db/schema";
import { protectedProcedure, router } from "../trpc";
import { uploadToR2 } from "../integrations/r2";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "OPENAI_API_KEY não configurada" });
  return new OpenAI({ apiKey: key });
}

export const pgrRouter = router({
  // Lista relatórios PGR da empresa
  list: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return db.select().from(pgrReports).where(eq(pgrReports.companyId, input.companyId));
    }),

  // Gera PGR com IA a partir do último ciclo COPSOQ
  generate: protectedProcedure
    .input(z.object({ companyId: z.number(), cycleId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Pega o último ciclo (ou o especificado)
      const cycles = await db.select().from(assessmentCycles).where(eq(assessmentCycles.companyId, input.companyId));
      const cycle = input.cycleId
        ? cycles.find((c) => c.id === input.cycleId)
        : cycles.sort((a, b) => b.id - a.id)[0];

      if (!cycle) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhum ciclo de avaliação encontrado. Aplique o COPSOQ antes." });
      }

      // Gera conteúdo via OpenAI
      const openai = getOpenAI();
      const prompt = `Gere um Programa de Gerenciamento de Riscos (PGR) psicossocial para a empresa "${company.name}" (CNPJ ${company.cnpj}, setor: ${company.sector ?? "serviços"}, porte: ${company.size}).

Use LINGUAGEM 100% DEFENSIVA para o empregador. Use verbos como "gerenciar", "mitigar", "orientar", "adotar medidas razoáveis e proporcionais". NUNCA use "garantir", "eliminar totalmente" ou "ambiente livre de risco".

O PGR deve conter:
1. Identificação da empresa
2. Responsável legal
3. Inventário de Riscos Psicossociais (baseado em COPSOQ II-Br)
4. Plano de Ação com responsáveis e prazos
5. Medidas de prevenção e mitigação
6. Cronograma de revisão (12 meses)

A frase-base obrigatória é: "A empresa adotou medidas razoáveis e proporcionais, compatíveis com sua realidade operacional, visando à prevenção e controle dos riscos identificados."`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em Segurança e Saúde do Trabalho (SST) brasileiro, focado em NR-1. Use linguagem defensiva e técnica. Responda em markdown estruturado.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 3000,
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content ?? "";

      // Salva o conteúdo
      const [report] = await db.insert(pgrReports).values({
        companyId: input.companyId,
        cycleId: cycle.id,
        title: `PGR Psicossocial — ${company.name} — ${new Date().toLocaleDateString("pt-BR")}`,
        status: "generated",
        metadata: { cycleId: cycle.id, generatedBy: ctx.user.id },
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      }).returning();

      // Upload do PDF/markdown para R2 (aqui salvamos como .md; produção converte para PDF)
      let pdfUrl: string | null = null;
      try {
        const filename = `pgr-${report.id}-${Date.now()}.md`;
        pdfUrl = await uploadToR2(`pgr/${company.id}/${filename}`, content, "text/markdown");
      } catch (err) {
        console.warn("R2 upload falhou (PDF ficará indisponível):", err);
      }

      if (pdfUrl) {
        await db.update(pgrReports).set({ pdfUrl }).where(eq(pgrReports.id, report.id));
      }

      return { report, content, pdfUrl };
    }),
});
