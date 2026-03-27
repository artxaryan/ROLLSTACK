import { user } from "@sams-t-app/db/schema/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../index";
import { classRouter } from "./class";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  checkUserExists: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ ctx, input }) => {
      const existingUser = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, input.email.toLowerCase()))
        .limit(1);
      return {
        exists: !!existingUser[0],
      };
    }),
  updateUserRole: protectedProcedure
    .input(
      z.object({
        role: z.enum(["student", "professor"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      await ctx.db
        .update(user)
        .set({ role: input.role })
        .where(eq(user.id, ctx.session.user.id));

      return { success: true };
    }),
  class: classRouter,
});
export type AppRouter = typeof appRouter;
