import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const contactRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.contact.findFirst({ where: { userId: ctx.session.user.id } });
  }),
});
