import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const contactRouter = createTRPCRouter({
  friendCode: protectedProcedure.query(async ({ ctx }) => {
    return {
      friendCode: (
        await ctx.db.user.findFirst({ where: { id: ctx.session.user.id } })
      )?.friendCode,
    };
  }),

  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.contact.findFirst({ where: { userId: ctx.session.user.id } });
  }),

  update: protectedProcedure
    .input(
      z.object({
        nickname: z.string().max(255).optional(),
        firstName: z.string().max(255).optional(),
        lastName: z.string().max(255).optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.contact.update({
        where: { userId: ctx.session.user.id },
        data: input,
      });
      return { success: true };
    }),
});
