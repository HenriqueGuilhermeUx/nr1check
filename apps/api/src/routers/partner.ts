import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc";
import {
  applyForPartner,
  approvePartner,
  claimPartnerReferral,
  listAdminCommissions,
  listPartnerApplications,
  markCommissionPaid,
  partnerDashboard,
  partnerMe,
  pausePartner,
  publicPartnerOffer,
  trackPartnerClick,
  updatePartnerPayout,
} from "../commercial/partners";

export const partnerRouter = router({
  offer: publicProcedure
    .input(z.object({ code: z.string().min(1).max(80) }))
    .query(({ input }) => publicPartnerOffer(input.code)),

  track: publicProcedure
    .input(z.object({
      code: z.string().min(1).max(80),
      visitorId: z.string().min(8).max(120),
      referrer: z.string().max(1000).optional().nullable(),
    }))
    .mutation(({ input }) => trackPartnerClick(input.code, input.visitorId, input.referrer)),

  claim: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(80) }))
    .mutation(({ ctx, input }) => claimPartnerReferral(ctx.user.id, input.code)),

  apply: protectedProcedure
    .input(z.object({
      partnerType: z.enum(["contador", "influencer", "consultor"]),
      displayName: z.string().trim().min(2).max(160),
      socialHandle: z.string().trim().max(160).optional().nullable(),
      socialUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
      audienceSize: z.number().int().min(0).max(100_000_000).optional().nullable(),
      acceptedTerms: z.literal(true),
    }))
    .mutation(({ ctx, input }) => applyForPartner(ctx.user.id, {
      ...input,
      socialUrl: input.socialUrl || null,
      acceptedTerms: true,
    })),

  me: protectedProcedure.query(({ ctx }) => partnerMe(ctx.user.id)),
  dashboard: protectedProcedure.query(({ ctx }) => partnerDashboard(ctx.user.id)),

  updatePayout: protectedProcedure
    .input(z.object({ payoutPixKey: z.string().trim().min(3).max(255) }))
    .mutation(({ ctx, input }) => updatePartnerPayout(ctx.user.id, input.payoutPixKey)),

  admin: router({
    list: adminProcedure.query(() => listPartnerApplications()),
    commissions: adminProcedure.query(() => listAdminCommissions()),
    approve: adminProcedure
      .input(z.object({ partnerId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => approvePartner(input.partnerId, ctx.user.id)),
    pause: adminProcedure
      .input(z.object({ partnerId: z.number().int().positive() }))
      .mutation(({ input }) => pausePartner(input.partnerId)),
    markPaid: adminProcedure
      .input(z.object({ commissionId: z.number().int().positive() }))
      .mutation(({ input }) => markCommissionPaid(input.commissionId)),
  }),
});
