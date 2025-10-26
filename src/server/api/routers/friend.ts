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

  sendFriendRequest: protectedProcedure
    .input(z.object({ 
      friendCode: z.string(),
      message: z.string().optional()
    }))
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
          message: "Cannot send friend request to yourself",
        });
      }

      // Check if already friends
      const existingFriend = await ctx.db.friend.findFirst({
        where: {
          OR: [
            { userAId: userId, userBId: otherUser.id },
            { userAId: otherUser.id, userBId: userId },
          ],
        },
      });

      if (existingFriend) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already friends with this user",
        });
      }

      // Check if there's already a pending request
      const existingRequest = await ctx.db.friendRequest.findFirst({
        where: {
          OR: [
            { requesterId: userId, receiverId: otherUser.id, status: "PENDING" },
            { requesterId: otherUser.id, receiverId: userId, status: "PENDING" },
          ],
        },
      });

      if (existingRequest) {
        if (existingRequest.requesterId === userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You have already sent a friend request to this user",
          });
        } else {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This user has already sent you a friend request",
          });
        }
      }

      // Create the friend request
      const friendRequest = await ctx.db.friendRequest.create({
        data: {
          requesterId: userId,
          receiverId: otherUser.id,
          message: input.message,
          status: "PENDING",
        },
        include: {
          receiver: {
            include: {
              contact: true,
            },
          },
        },
      });

      return friendRequest;
    }),

  // Keep the old add method for backward compatibility (direct friend creation)
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

  // Friend request functionality
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const requests = await ctx.db.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      include: {
        requester: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return requests;
  }),

  getSentRequests: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const requests = await ctx.db.friendRequest.findMany({
      where: {
        requesterId: userId,
        status: "PENDING",
      },
      include: {
        receiver: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return requests;
  }),

  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const searchQuery = input.query.trim();

      // Search by email, name, phone number, or nickname
      const users = await ctx.db.user.findMany({
        where: {
          AND: [
            { id: { not: userId } }, // Exclude current user
            {
              OR: [
                { email: { contains: searchQuery, mode: "insensitive" } },
                { name: { contains: searchQuery, mode: "insensitive" } },
                {
                  contact: {
                    OR: [
                      { firstName: { contains: searchQuery, mode: "insensitive" } },
                      { lastName: { contains: searchQuery, mode: "insensitive" } },
                      { nickname: { contains: searchQuery, mode: "insensitive" } },
                      { phoneNumber: { contains: searchQuery, mode: "insensitive" } },
                      { email: { contains: searchQuery, mode: "insensitive" } },
                      { instagram: { contains: searchQuery, mode: "insensitive" } },
                      { discord: { contains: searchQuery, mode: "insensitive" } },
                      { linkedin: { contains: searchQuery, mode: "insensitive" } },
                      { company: { contains: searchQuery, mode: "insensitive" } },
                    ],
                  },
                },
              ],
            },
          ],
        },
        include: {
          contact: true,
        },
        take: 10, // Limit results for performance
        orderBy: {
          name: "asc",
        },
      });

      return users;
    }),

  respondToRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        status: z.enum(["ACCEPTED", "REJECTED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get the friend request
      const request = await ctx.db.friendRequest.findFirst({
        where: {
          id: input.requestId,
          receiverId: userId,
          status: "PENDING",
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friend request not found",
        });
      }

      // Update the request status
      const updatedRequest = await ctx.db.friendRequest.update({
        where: { id: input.requestId },
        data: {
          status: input.status,
          respondedAt: new Date(),
        },
      });

      // If accepted, create the friend relationship
      if (input.status === "ACCEPTED") {
        await ctx.db.friend.create({
          data: {
            userAId: request.requesterId,
            userBId: request.receiverId,
          },
        });
      }

      return updatedRequest;
  }),
});
