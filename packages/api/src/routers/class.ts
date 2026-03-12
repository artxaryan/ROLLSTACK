import {
  classTable,
  studentEnrollment,
  user,
} from "@sams-t-app/db/schema/index";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

function generateClassCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export const classRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const classes = await ctx.db
      .select()
      .from(classTable)
      .where(eq(classTable.professorId, ctx.session.user.id))
      .orderBy(classTable.createdAt);
    return classes;
  }),

  getEnrolledClasses: protectedProcedure.query(async ({ ctx }) => {
    const enrolledClasses = await ctx.db
      .select({
        enrollmentId: studentEnrollment.id,
        rollNumber: studentEnrollment.rollNumber,
        enrolledAt: studentEnrollment.enrolledAt,
        classId: classTable.id,
        className: classTable.className,
        subject: classTable.subject,
        classCode: classTable.classCode,
        professorId: classTable.professorId,
        professorName: user.name,
        studentCount: classTable.studentCount,
      })
      .from(studentEnrollment)
      .innerJoin(classTable, eq(studentEnrollment.classId, classTable.id))
      .innerJoin(user, eq(classTable.professorId, user.id))
      .where(eq(studentEnrollment.studentId, ctx.session.user.id))
      .orderBy(studentEnrollment.enrolledAt);
    return enrolledClasses;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const classData = await ctx.db
        .select()
        .from(classTable)
        .where(
          and(
            eq(classTable.id, input.id),
            eq(classTable.professorId, ctx.session.user.id)
          )
        )
        .limit(1);
      return classData[0] ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        className: z.string().min(1).max(100),
        subject: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const classCode = generateClassCode();

      await ctx.db.insert(classTable).values({
        id,
        className: input.className,
        subject: input.subject,
        classCode,
        professorId: ctx.session.user.id,
        studentCount: 0,
      });

      const newClass = await ctx.db
        .select()
        .from(classTable)
        .where(eq(classTable.id, id))
        .limit(1);

      return newClass[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(classTable)
        .where(
          and(
            eq(classTable.id, input.id),
            eq(classTable.professorId, ctx.session.user.id)
          )
        );
      return { success: true };
    }),

  getStudents: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const students = await ctx.db
        .select({
          id: studentEnrollment.id,
          rollNumber: studentEnrollment.rollNumber,
          name: user.name,
          email: user.email,
          enrolledAt: studentEnrollment.enrolledAt,
        })
        .from(studentEnrollment)
        .innerJoin(user, eq(studentEnrollment.studentId, user.id))
        .where(eq(studentEnrollment.classId, input.classId))
        .orderBy(studentEnrollment.rollNumber);
      return students;
    }),

  joinClass: protectedProcedure
    .input(
      z.object({
        classCode: z.string(),
        rollNumber: z.string().min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const classData = await ctx.db
        .select()
        .from(classTable)
        .where(eq(classTable.classCode, input.classCode))
        .limit(1);

      if (classData.length === 0) {
        throw new Error("Invalid class code");
      }

      const classInfo = classData[0];

      if (!classInfo) {
        throw new Error("Class not found");
      }

      if (classInfo.professorId === ctx.session.user.id) {
        throw new Error("You cannot join your own class");
      }

      const existingEnrollment = await ctx.db
        .select()
        .from(studentEnrollment)
        .where(
          and(
            eq(studentEnrollment.classId, classInfo.id),
            eq(studentEnrollment.studentId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (existingEnrollment.length > 0) {
        throw new Error("You are already enrolled in this class");
      }

      const rollExists = await ctx.db
        .select()
        .from(studentEnrollment)
        .where(
          and(
            eq(studentEnrollment.classId, classInfo.id),
            eq(studentEnrollment.rollNumber, input.rollNumber)
          )
        )
        .limit(1);

      if (rollExists.length > 0) {
        throw new Error("This roll number is already taken");
      }

      const enrollmentId = crypto.randomUUID();
      await ctx.db.insert(studentEnrollment).values({
        id: enrollmentId,
        classId: classInfo.id,
        studentId: ctx.session.user.id,
        rollNumber: input.rollNumber,
      });

      await ctx.db
        .update(classTable)
        .set({
          studentCount: sql`${classTable.studentCount} + 1`,
        })
        .where(eq(classTable.id, classInfo.id));

      return {
        success: true,
        className: classInfo.className,
        subject: classInfo.subject,
      };
    }),

  leaveClass: protectedProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.db
        .select()
        .from(studentEnrollment)
        .where(
          and(
            eq(studentEnrollment.id, input.enrollmentId),
            eq(studentEnrollment.studentId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (enrollment.length === 0) {
        throw new Error("Enrollment not found");
      }

      const enrollmentData = enrollment[0];

      if (!enrollmentData) {
        throw new Error("Enrollment not found");
      }

      await ctx.db
        .delete(studentEnrollment)
        .where(eq(studentEnrollment.id, input.enrollmentId));

      await ctx.db
        .update(classTable)
        .set({
          studentCount: sql`${classTable.studentCount} - 1`,
        })
        .where(eq(classTable.id, enrollmentData.classId));

      return { success: true };
    }),
});

export type ClassRouter = typeof classRouter;
