import { createHash, randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import {
  companies,
  complaintUpdates,
  complaints,
  users,
} from "@nr1check/db/schema";
import { createComplaintSchema } from "@nr1check/shared";
import { protectedProcedure, publicProcedure, router } from "../trpc";

function generateProtocolHash(content: string, timestamp: number): string {
  return createHash("sha256")
    .update(`${content}|${timestamp}|${randomBytes(16).toString("hex")}`)
    .digest("hex");
}

function generateProtocolNumber(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `NR1-${year}-${random}`;
}

export const complaintRouter = router({
  // Funcionário cria denúncia anônima
  create: publicProcedure
    .input(createComplaintSchema)
    .mutation(async ({ input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });

      const timestamp = Date.now();
      const protocolNumber = generateProtocolNumber();
      const contentHash = generateProtocolHash(
        `${input.category}|${input.description}|${timestamp}`,
        timestamp,
      );

      const [inserted] = await db
        .insert(complaints)
        .values({
          companyId: input.companyId,
          category: input.category,
          description: input.description,
          involvedDepartment: input.involvedDepartment,
          attachmentUrls: input.attachmentUrls,
          protocolNumber,
          protocolHash: contentHash,
          protocolTimestamp: timestamp,
          status: "recebida",
        })
        .returning();

      return {
        protocolNumber: inserted.protocolNumber,
        protocolHash: inserted.protocolHash,
        // Hash para acompanhar o status (código curto)
        trackingCode: inserted.protocolNumber.slice(-8),
      };
    }),

  // Acompanhar status pelo protocolo (público)
  status: publicProcedure
    .input(z.object({ protocolNumber: z.string() }))
    .query(async ({ input }) => {
      const [complaint] = await db
        .select()
        .from(complaints)
        .where(eq(complaints.protocolNumber, input.protocolNumber))
        .limit(1);
      if (!complaint) return null;
      return {
        protocolNumber: complaint.protocolNumber,
        status: complaint.status,
        createdAt: complaint.createdAt,
        resolvedAt: complaint.resolvedAt,
      };
    }),

  // Gestor lista todas as denúncias da empresa
  list: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return db
        .select()
        .from(complaints)
        .where(eq(complaints.companyId, input.companyId))
        .orderBy(desc(complaints.createdAt));
    }),

  // Gestor atualiza status
  updateStatus: protectedProcedure
    .input(z.object({
      complaintId: z.number(),
      status: z.enum(["recebida", "em_apuracao", "concluida", "arquivada"]),
      note: z.string().optional(),
      resolution: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [complaint] = await db.select().from(complaints).where(eq(complaints.id, input.complaintId)).limit(1);
      if (!complaint) throw new TRPCError({ code: "NOT_FOUND" });
      const [company] = await db.select().from(companies).where(eq(companies.id, complaint.companyId)).limit(1);
      if (!company || company.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const updateData: any = { status: input.status, updatedAt: new Date() };
      if (input.resolution) updateData.resolution = input.resolution;
      if (input.status === "concluida") updateData.resolvedAt = new Date();

      await db.update(complaints).set(updateData).where(eq(complaints.id, input.complaintId));

      await db.insert(complaintUpdates).values({
        complaintId: input.complaintId,
        userId: ctx.user.id,
        note: input.note ?? `Status alterado para ${input.status}`,
        statusChange: input.status,
      });

      return { success: true };
    }),
});
