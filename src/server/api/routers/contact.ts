import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const contactRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.contact.findFirst({ where: { userId: ctx.session.user.id } });
  }),

  update: protectedProcedure
    .input(
      z.object({
        nickname: z.string().max(255).optional(),
        firstName: z.string().max(255).optional(),
        lastName: z.string().max(255).optional(),
        phoneNumber: z.string().max(20).optional(),
        email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
          message: "Invalid email format"
        }),
        instagram: z.string().max(255).optional(),
        discord: z.string().max(255).optional(),
        linkedin: z.string().max(255).optional(),
        pronouns: z.string().max(50).optional(),
        company: z.string().max(255).optional(),
        address: z.string().max(500).optional(),
        birthday: z.date().optional(),
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
