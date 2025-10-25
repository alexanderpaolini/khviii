import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const friendRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const friends = await ctx.db.friend.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });
    if (friends.length === 0) return [];

    const contactIds = Array.from(
      new Set(
        friends
          .map((f) => (f.userAId === userId ? f.userBId : f.userAId))
          .filter((id): id is string => Boolean(id) && id !== userId),
      ),
    );

    if (contactIds.length === 0) return [];

    return await ctx.db.contact.findMany({
      where: { userId: { in: contactIds } },
    });
  }),

  add: protectedProcedure
    .input(z.object({ friendCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const friendCode = input.friendCode.trim();

      const otherUser = await ctx.db.user.findFirst({
        where: { friendCode },
      });

      if (!otherUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User with that friend code not found",
        });
      }

      if (otherUser.id === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot add yourself as a friend",
        });
      }

      const existing = await ctx.db.friend.findFirst({
        where: {
          OR: [
            { userAId: userId, userBId: otherUser.id },
            { userAId: otherUser.id, userBId: userId },
          ],
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already friends with this user",
        });
      }

      const created = await ctx.db.friend.create({
        data: {
          userAId: userId,
          userBId: otherUser.id,
        },
        include: {
          userB: { include: { contact: true } },
        },
      });

      return created;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const otherId = input.id;

      const result = await ctx.db.friend.deleteMany({
        where: {
          OR: [
            { userAId: userId, userBId: otherId },
            { userAId: otherId, userBId: userId },
          ],
        },
      });

      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friend record not found",
        });
      }

      return { success: true };
    }),
});
