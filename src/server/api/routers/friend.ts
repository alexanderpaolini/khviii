import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const friendRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const friends = await ctx.db.friend.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    const ids = friends.flatMap((x) => [x.userAId, x.userBId]);

    const contactIds = Array.from(
      new Set(ids.filter((id) => id != null && id !== userId))
    );

    if (contactIds.length === 0) {
      return [];
    }

    const d = await ctx.db.contact.findMany({
      where: { userId: { in: contactIds } },
    });

    return d;
  }),
});
