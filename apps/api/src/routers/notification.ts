import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@nr1check/db";
import { notifications } from "@nr1check/db/schema";
import { protectedProcedure, router } from "../trpc";

export const notificationRouter = router({
  // Lista notificações da empresa
  list: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(notifications)
        .where(eq(notifications.companyId, input.companyId))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }),

  // Marca como lida
  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(notifications).set({ read: true }).where(eq(notifications.id, input.id));
      return { success: true };
    }),

  // Marca todas como lidas
  markAllRead: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .mutation(async ({ input }) => {
      await db.update(notifications).set({ read: true }).where(eq(notifications.companyId, input.companyId));
      return { success: true };
    }),
});
