import { mutation } from "./_generated/server";

export const migrateBoardFolders = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all boards that have a folderId
    const boards = await ctx.db.query("boards").collect();

    let migratedCount = 0;

    for (const board of boards) {
      if (board.folderId) {
        // Find the creator's participant record
        const participant = await ctx.db
          .query("participants")
          .withIndex("by_user_and_board", (q) =>
            q.eq("userId", board.createdBy).eq("boardId", board._id)
          )
          .first();

        // If participant exists and doesn't have a folderId yet, update it
        if (participant && !participant.folderId) {
          await ctx.db.patch(participant._id, {
            folderId: board.folderId,
          });
          migratedCount++;
        }

        // Unset folderId on the board
        await ctx.db.patch(board._id, {
          folderId: undefined,
        });
      }
    }

    return `Migrated ${migratedCount} boards`;
  },
});
