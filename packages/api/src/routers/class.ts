import {
  attendance,
  cancelledClass,
  classSchedule,
  classTable,
  studentEnrollment,
  user,
} from "@sams-t-app/db/schema/index";
import { and, count, eq, gte, inArray, lte, sql } from "drizzle-orm";
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

  getTodayEnrolledClasses: protectedProcedure.query(async ({ ctx }) => {
    // Get current day of week (0=Sunday, 1=Monday, ... 6=Saturday)
    // Convert to our format: 0=Monday, 6=Sunday
    const jsDay = new Date().getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    // Get all enrolled class IDs for the student
    const enrollments = await ctx.db
      .select({ classId: studentEnrollment.classId })
      .from(studentEnrollment)
      .where(eq(studentEnrollment.studentId, ctx.session.user.id));

    if (enrollments.length === 0) {
      return [];
    }

    const classIds = enrollments.map((e) => e.classId);

    // Get schedules for today that match enrolled classes
    const schedules = await ctx.db
      .select()
      .from(classSchedule)
      .where(
        and(
          inArray(classSchedule.classId, classIds),
          eq(classSchedule.dayOfWeek, dayOfWeek)
        )
      )
      .orderBy(classSchedule.startTime);

    if (schedules.length === 0) {
      return [];
    }

    // Get class info for these schedules
    const scheduleClassIds = schedules.map((s) => s.classId);
    const classes = await ctx.db
      .select({
        id: classTable.id,
        className: classTable.className,
        subject: classTable.subject,
        classCode: classTable.classCode,
        studentCount: classTable.studentCount,
        professorId: classTable.professorId,
      })
      .from(classTable)
      .where(inArray(classTable.id, scheduleClassIds));

    const classMap = new Map(classes.map((c) => [c.id, c]));

    // Get professor names
    const professorIds = [...new Set(classes.map((c) => c.professorId))];
    const professors = await ctx.db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(inArray(user.id, professorIds));
    const professorMap = new Map(professors.map((p) => [p.id, p.name]));

    // Get enrollment details for each schedule
    const scheduleClassIdsArr = schedules.map((s) => s.classId);
    const enrollmentsData = await ctx.db
      .select({
        classId: studentEnrollment.classId,
        rollNumber: studentEnrollment.rollNumber,
        enrolledAt: studentEnrollment.enrolledAt,
      })
      .from(studentEnrollment)
      .where(
        and(
          inArray(studentEnrollment.classId, scheduleClassIdsArr),
          eq(studentEnrollment.studentId, ctx.session.user.id)
        )
      );

    const enrollmentMap = new Map(enrollmentsData.map((e) => [e.classId, e]));

    return schedules.map((schedule) => {
      const classInfo = classMap.get(schedule.classId);
      const enrollment = enrollmentMap.get(schedule.classId);
      return {
        ...schedule,
        class: classInfo
          ? {
              ...classInfo,
              professorName:
                professorMap.get(classInfo.professorId) ?? "Unknown",
              rollNumber: enrollment?.rollNumber,
              enrolledAt: enrollment?.enrolledAt,
            }
          : null,
      };
    });
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
        semesterStartDate: z.string().datetime().optional(),
        semesterEndDate: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate semester dates if provided
      if (input.semesterStartDate && input.semesterEndDate) {
        const startDate = new Date(input.semesterStartDate);
        const endDate = new Date(input.semesterEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate > today) {
          throw new Error("Semester start date must be today or in the past");
        }

        if (endDate <= today) {
          throw new Error("Semester end date must be in the future");
        }

        if (endDate <= startDate) {
          throw new Error("Semester end date must be after start date");
        }
      }

      const id = crypto.randomUUID();
      const classCode = generateClassCode();

      await ctx.db.insert(classTable).values({
        id,
        className: input.className,
        subject: input.subject,
        classCode,
        professorId: ctx.session.user.id,
        studentCount: 0,
        semesterStartDate: input.semesterStartDate
          ? new Date(input.semesterStartDate)
          : undefined,
        semesterEndDate: input.semesterEndDate
          ? new Date(input.semesterEndDate)
          : undefined,
      });

      const newClass = await ctx.db
        .select()
        .from(classTable)
        .where(eq(classTable.id, id))
        .limit(1);

      return newClass[0];
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        className: z.string().min(1).max(100).optional(),
        subject: z.string().min(1).max(100).optional(),
        semesterStartDate: z.string().datetime().optional(),
        semesterEndDate: z.string().datetime().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify professor owns this class
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

      if (classData.length === 0) {
        throw new Error("Class not found");
      }

      const existingClass = classData[0];
      if (!existingClass) {
        throw new Error("Class not found");
      }

      // Validate semester dates if provided
      const startDate = input.semesterStartDate
        ? new Date(input.semesterStartDate)
        : existingClass.semesterStartDate;
      const endDate = input.semesterEndDate
        ? new Date(input.semesterEndDate)
        : existingClass.semesterEndDate;

      if (startDate && endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate > today) {
          throw new Error("Semester start date must be today or in the past");
        }

        if (endDate <= today) {
          throw new Error("Semester end date must be in the future");
        }

        if (endDate <= startDate) {
          throw new Error("Semester end date must be after start date");
        }
      }

      const updateData: {
        className?: string;
        subject?: string;
        semesterStartDate?: Date;
        semesterEndDate?: Date;
        updatedAt?: Date;
      } = {
        updatedAt: new Date(),
      };

      if (input.className) {
        updateData.className = input.className;
      }
      if (input.subject) {
        updateData.subject = input.subject;
      }
      if (input.semesterStartDate) {
        updateData.semesterStartDate = new Date(input.semesterStartDate);
      }
      if (input.semesterEndDate) {
        updateData.semesterEndDate = new Date(input.semesterEndDate);
      }

      await ctx.db
        .update(classTable)
        .set(updateData)
        .where(eq(classTable.id, input.id));

      const updatedClass = await ctx.db
        .select()
        .from(classTable)
        .where(eq(classTable.id, input.id))
        .limit(1);

      return updatedClass[0];
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

  removeStudent: protectedProcedure
    .input(z.object({ enrollmentId: z.string(), classId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify professor owns this class
      const classData = await ctx.db
        .select()
        .from(classTable)
        .where(
          and(
            eq(classTable.id, input.classId),
            eq(classTable.professorId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (classData.length === 0) {
        throw new Error("Class not found");
      }

      // Delete the enrollment
      await ctx.db
        .delete(studentEnrollment)
        .where(
          and(
            eq(studentEnrollment.id, input.enrollmentId),
            eq(studentEnrollment.classId, input.classId)
          )
        );

      // Decrement student count
      await ctx.db
        .update(classTable)
        .set({
          studentCount: sql`${classTable.studentCount} - 1`,
        })
        .where(eq(classTable.id, input.classId));

      return { success: true };
    }),

  getStudents: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const students = await ctx.db
        .select({
          id: user.id,
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

  markAttendance: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        studentId: z.string(),
        status: z.enum(["present", "absent"]),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if semester dates are configured
      const classData = await ctx.db
        .select({
          semesterStartDate: classTable.semesterStartDate,
          semesterEndDate: classTable.semesterEndDate,
        })
        .from(classTable)
        .where(eq(classTable.id, input.classId))
        .limit(1);

      if (classData.length === 0) {
        throw new Error("Class not found");
      }

      const classInfo = classData[0];
      if (!classInfo) {
        throw new Error("Class not found");
      }

      if (!(classInfo.semesterStartDate && classInfo.semesterEndDate)) {
        throw new Error(
          "Please configure semester dates before taking attendance"
        );
      }

      // Use provided date or default to today
      const attendanceDate = input.date ? new Date(input.date) : new Date();
      attendanceDate.setHours(0, 0, 0, 0);

      // Check if date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (attendanceDate > today) {
        throw new Error("Cannot mark attendance for future dates");
      }

      // Check if class is cancelled for this date
      const cancelledClassData = await ctx.db
        .select()
        .from(cancelledClass)
        .where(
          and(
            eq(cancelledClass.classId, input.classId),
            sql`date_trunc('day', ${cancelledClass.date}) = date_trunc('day', ${sql.raw(`'${attendanceDate.toISOString().split("T")[0]}'::date`)})`
          )
        )
        .limit(1);

      if (cancelledClassData.length > 0) {
        throw new Error("Cannot mark attendance for a cancelled class");
      }

      // Check if attendance already exists for this date
      // Use date_trunc to compare dates only, ignoring time component
      const existingAttendance = await ctx.db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.classId, input.classId),
            eq(attendance.studentId, input.studentId),
            sql`date_trunc('day', ${attendance.date}) = date_trunc('day', ${sql.raw(`'${attendanceDate.toISOString().split("T")[0]}'::date`)})`
          )
        )
        .limit(1);

      if (existingAttendance.length > 0 && existingAttendance[0]) {
        // Update existing attendance
        await ctx.db
          .update(attendance)
          .set({ status: input.status })
          .where(eq(attendance.id, existingAttendance[0].id));
      } else {
        // Create new attendance record
        await ctx.db.insert(attendance).values({
          id: crypto.randomUUID(),
          classId: input.classId,
          studentId: input.studentId,
          status: input.status,
          markedBy: ctx.session.user.id,
          date: attendanceDate,
        });
      }

      return { success: true };
    }),

  saveBatchAttendance: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        attendanceRecords: z.array(
          z.object({
            studentId: z.string(),
            status: z.enum(["present", "absent"]),
          })
        ),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log(
        "[saveBatchAttendance] Input received:",
        JSON.stringify(input, null, 2)
      );

      // Check if semester dates are configured
      const classData = await ctx.db
        .select({
          semesterStartDate: classTable.semesterStartDate,
          semesterEndDate: classTable.semesterEndDate,
        })
        .from(classTable)
        .where(eq(classTable.id, input.classId))
        .limit(1);

      if (classData.length === 0) {
        console.log("[saveBatchAttendance] Class not found:", input.classId);
        throw new Error("Class not found");
      }

      const classInfo = classData[0];
      if (!classInfo) {
        console.log(
          "[saveBatchAttendance] Class info null for:",
          input.classId
        );
        throw new Error("Class not found");
      }

      if (!(classInfo.semesterStartDate && classInfo.semesterEndDate)) {
        console.log(
          "[saveBatchAttendance] Semester dates not configured. Start:",
          classInfo.semesterStartDate,
          "End:",
          classInfo.semesterEndDate
        );
        throw new Error(
          "Please configure semester dates before taking attendance"
        );
      }

      // Use provided date or default to today
      const dateStr = input.date ?? new Date().toISOString().split("T")[0];
      console.log("[saveBatchAttendance] Date string:", dateStr);

      // Check if date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const attendanceDate = new Date(`${dateStr}T00:00:00`);
      console.log(
        "[saveBatchAttendance] Parsed attendance date:",
        attendanceDate.toISOString()
      );

      if (attendanceDate > today) {
        console.log("[saveBatchAttendance] Date is in future:", attendanceDate);
        throw new Error("Cannot mark attendance for future dates");
      }

      // Check if class is cancelled for this date
      const cancelledClassData = await ctx.db
        .select()
        .from(cancelledClass)
        .where(
          and(
            eq(cancelledClass.classId, input.classId),
            sql`date_trunc('day', ${cancelledClass.date}) = date_trunc('day', ${sql.raw(`'${dateStr}'::date`)})`
          )
        )
        .limit(1);

      if (cancelledClassData.length > 0) {
        console.log(
          "[saveBatchAttendance] Class is cancelled for date:",
          dateStr
        );
        throw new Error("Cannot mark attendance for a cancelled class");
      }

      // Check if attendance was already marked for this date
      const existingAttendance = await ctx.db
        .select({ studentId: attendance.studentId })
        .from(attendance)
        .where(
          and(
            eq(attendance.classId, input.classId),
            sql`date_trunc('day', ${attendance.date}) = date_trunc('day', ${sql.raw(`'${dateStr}'::date`)})`
          )
        );

      const alreadyMarked = existingAttendance.length > 0;
      let alreadyMarkedMessage = "";

      if (alreadyMarked) {
        const previouslyPresent = existingAttendance.filter(
          (r) => r.studentId !== null
        ).length;
        alreadyMarkedMessage = `Attendance already marked for ${dateStr} (${previouslyPresent} students)`;
      }

      // Delete any existing records for this class on this day,
      // then insert fresh ones. Separate queries work with neon-http driver.
      await ctx.db
        .delete(attendance)
        .where(
          and(
            eq(attendance.classId, input.classId),
            sql`date_trunc('day', ${attendance.date}) = date_trunc('day', ${sql.raw(`'${dateStr}'::date`)})`
          )
        );

      const values = input.attendanceRecords.map((record) => ({
        id: crypto.randomUUID(),
        classId: input.classId,
        studentId: record.studentId,
        status: record.status,
        markedBy: ctx.session.user.id,
        date: attendanceDate,
      }));

      console.log(
        "[saveBatchAttendance] About to insert:",
        values.length,
        "records"
      );

      await ctx.db.insert(attendance).values(values);

      console.log("[saveBatchAttendance] Successfully inserted records");

      return {
        success: true,
        count: input.attendanceRecords.length,
        alreadyMarked,
        message: alreadyMarkedMessage,
      };
    }),

  getTodayAttendance: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAttendance = await ctx.db
        .select({
          studentId: attendance.studentId,
          status: attendance.status,
        })
        .from(attendance)
        .where(
          and(
            eq(attendance.classId, input.classId),
            sql`date_trunc('day', ${attendance.date}) = date_trunc('day', ${sql.raw(`'${today.toISOString().split("T")[0]}'::date`)})`
          )
        );

      const present = todayAttendance.filter(
        (record) => record.status === "present"
      ).length;

      return {
        present,
        records: todayAttendance,
      };
    }),

  getAverageAttendance: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get class info including semester dates
      const classInfo = await ctx.db
        .select({
          semesterStartDate: classTable.semesterStartDate,
          semesterEndDate: classTable.semesterEndDate,
        })
        .from(classTable)
        .where(eq(classTable.id, input.classId))
        .limit(1);

      // Get total number of students in the class
      const totalStudentsResult = await ctx.db
        .select({ count: count() })
        .from(studentEnrollment)
        .where(eq(studentEnrollment.classId, input.classId));

      const totalStudents = totalStudentsResult[0]?.count ?? 0;

      if (totalStudents === 0) {
        return {
          average: 0,
          totalSessions: 0,
          semesterStartDate: classInfo[0]?.semesterStartDate,
          semesterEndDate: classInfo[0]?.semesterEndDate,
          classesLeftUntilEnd: null,
        };
      }

      // Get all attendance records grouped by date
      const attendanceRecords = await ctx.db
        .select({
          date: attendance.date,
          status: attendance.status,
        })
        .from(attendance)
        .where(eq(attendance.classId, input.classId));

      // Group by date and calculate daily attendance rates
      const sessionsByDate = new Map<
        string,
        { present: number; total: number }
      >();

      for (const record of attendanceRecords) {
        const dateKey = record.date.toISOString().split("T")[0] ?? "";
        if (!dateKey) {
          continue;
        }

        const session = sessionsByDate.get(dateKey) ?? {
          present: 0,
          total: 0,
        };
        session.total++;
        if (record.status === "present") {
          session.present++;
        }
        sessionsByDate.set(dateKey, session);
      }

      // Calculate average attendance percentage
      let totalPercentage = 0;
      for (const session of sessionsByDate.values()) {
        totalPercentage += (session.present / totalStudents) * 100;
      }

      const totalSessions = sessionsByDate.size;
      const average =
        totalSessions > 0 ? Math.round(totalPercentage / totalSessions) : 0;

      // Calculate classes left until semester end
      let classesLeftUntilEnd: number | null = null;
      const semesterEnd = classInfo[0]?.semesterEndDate;
      const semesterStart = classInfo[0]?.semesterStartDate;

      if (semesterEnd && semesterStart) {
        const schedules = await ctx.db
          .select()
          .from(classSchedule)
          .where(eq(classSchedule.classId, input.classId));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(semesterEnd);
        endDate.setHours(0, 0, 0, 0);

        if (today <= endDate) {
          const currentDay = new Date(today);
          classesLeftUntilEnd = 0;

          while (currentDay <= endDate) {
            const jsDay = currentDay.getDay();
            const ourDay = jsDay === 0 ? 6 : jsDay - 1;

            const daySchedules = schedules.filter(
              (s) => s.dayOfWeek === ourDay
            );
            classesLeftUntilEnd += daySchedules.length;

            currentDay.setDate(currentDay.getDate() + 1);
          }

          // Subtract sessions already marked (each session is one day with attendance)
          classesLeftUntilEnd -= totalSessions;
          if (classesLeftUntilEnd < 0) {
            classesLeftUntilEnd = 0;
          }
        }
      }

      return {
        average,
        totalSessions,
        semesterStartDate: classInfo[0]?.semesterStartDate,
        semesterEndDate: classInfo[0]?.semesterEndDate,
        classesLeftUntilEnd,
      };
    }),

  getStudentAttendance: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        studentId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const records = await ctx.db
        .select({
          date: attendance.date,
          status: attendance.status,
        })
        .from(attendance)
        .where(
          and(
            eq(attendance.classId, input.classId),
            eq(attendance.studentId, input.studentId)
          )
        )
        .orderBy(attendance.date);

      const total = records.length;
      const present = records.filter((r) => r.status === "present").length;

      return {
        records,
        total,
        present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    }),

  getStudentClassStats: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const studentId = ctx.session.user.id;

      // Verify student is enrolled in this class
      const enrollment = await ctx.db
        .select()
        .from(studentEnrollment)
        .where(
          and(
            eq(studentEnrollment.classId, input.classId),
            eq(studentEnrollment.studentId, studentId)
          )
        )
        .limit(1);

      if (enrollment.length === 0) {
        throw new Error("You are not enrolled in this class");
      }

      // Get class info with semester dates
      const classInfo = await ctx.db
        .select({
          id: classTable.id,
          className: classTable.className,
          subject: classTable.subject,
          classCode: classTable.classCode,
          professorId: classTable.professorId,
          semesterStartDate: classTable.semesterStartDate,
          semesterEndDate: classTable.semesterEndDate,
        })
        .from(classTable)
        .where(eq(classTable.id, input.classId))
        .limit(1);

      if (classInfo.length === 0) {
        throw new Error("Class not found");
      }

      // Get professor name
      const professor = await ctx.db
        .select({ name: user.name })
        .from(user)
        .where(eq(user.id, classInfo[0]?.professorId ?? ""))
        .limit(1);

      // Get all attendance records for this student
      const attendanceRecords = await ctx.db
        .select({
          date: attendance.date,
          status: attendance.status,
        })
        .from(attendance)
        .where(
          and(
            eq(attendance.classId, input.classId),
            eq(attendance.studentId, studentId)
          )
        )
        .orderBy(attendance.date);

      const totalClasses = attendanceRecords.length;
      const classesAttended = attendanceRecords.filter(
        (r) => r.status === "present"
      ).length;
      const classesAbsent = totalClasses - classesAttended;
      const attendancePercentage =
        totalClasses > 0
          ? Math.round((classesAttended / totalClasses) * 100)
          : 0;

      // Get class schedule
      const schedules = await ctx.db
        .select()
        .from(classSchedule)
        .where(eq(classSchedule.classId, input.classId));

      // Check if semester dates are configured
      const semesterConfigured =
        classInfo[0]?.semesterStartDate !== null &&
        classInfo[0]?.semesterStartDate !== undefined &&
        classInfo[0]?.semesterEndDate !== null &&
        classInfo[0]?.semesterEndDate !== undefined;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let classesLeft: number | null = null;
      let safeBunkCount: number | null = null;

      if (semesterConfigured) {
        const classData = classInfo[0];
        if (classData?.semesterEndDate) {
          const semesterEndDate = new Date(classData.semesterEndDate);

          // Count future scheduled classes
          classesLeft = 0;
          const currentDay = new Date(today);

          while (currentDay <= semesterEndDate) {
            const jsDay = currentDay.getDay();
            const ourDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Monday format

            const daySchedules = schedules.filter(
              (s) => s.dayOfWeek === ourDay
            );
            classesLeft += daySchedules.length;

            currentDay.setDate(currentDay.getDate() + 1);
          }

          // Calculate safe bunk count
          // To maintain slightly above 75%, we calculate how many more absences are allowed
          // Formula: (present + x) / (total + x) >= 0.75
          // Solving: x <= (present - 0.75 * total) / 0.25
          // We want slightly above 75%, so we use 76%
          const targetPercentage = 76;

          if (totalClasses > 0) {
            // Current absent count
            const maxAllowedAbsences = Math.floor(
              (classesAttended * 100 - targetPercentage * totalClasses) /
                targetPercentage
            );
            safeBunkCount = Math.max(0, maxAllowedAbsences - classesAbsent);
          } else {
            // If no classes yet, assume they can miss 25% of upcoming classes
            safeBunkCount = Math.floor(classesLeft * 0.24); // Slightly conservative
          }
        }
      }

      return {
        classInfo: {
          ...classInfo[0],
          professorName: professor[0]?.name ?? "Unknown",
          rollNumber: enrollment[0]?.rollNumber ?? "",
        },
        stats: {
          classesAttended,
          classesAbsent,
          totalClasses,
          classesLeft,
          attendancePercentage,
          safeBunkCount,
        },
        semesterConfigured,
        attendanceRecords,
        schedules,
      };
    }),

  getSchedule: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify professor owns this class
      const classData = await ctx.db
        .select()
        .from(classTable)
        .where(
          and(
            eq(classTable.id, input.classId),
            eq(classTable.professorId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (classData.length === 0) {
        throw new Error("Class not found");
      }

      const schedules = await ctx.db
        .select()
        .from(classSchedule)
        .where(eq(classSchedule.classId, input.classId))
        .orderBy(classSchedule.dayOfWeek, classSchedule.startTime);

      return schedules;
    }),

  addSchedule: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        lectureHall: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify professor owns this class
      const classData = await ctx.db
        .select()
        .from(classTable)
        .where(
          and(
            eq(classTable.id, input.classId),
            eq(classTable.professorId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (classData.length === 0) {
        throw new Error("Class not found");
      }

      // Validate end time is after start time
      const startParts = input.startTime.split(":").map(Number);
      const endParts = input.endTime.split(":").map(Number);
      const startHour = startParts[0];
      const startMin = startParts[1];
      const endHour = endParts[0];
      const endMin = endParts[1];
      const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
      const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);

      if (endMinutes <= startMinutes) {
        throw new Error("End time must be after start time");
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(classSchedule).values({
        id,
        classId: input.classId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        lectureHall: input.lectureHall,
      });

      const newSchedule = await ctx.db
        .select()
        .from(classSchedule)
        .where(eq(classSchedule.id, id))
        .limit(1);

      return newSchedule[0];
    }),

  updateSchedule: protectedProcedure
    .input(
      z.object({
        scheduleId: z.string(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        startTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
        endTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
        lectureHall: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get schedule and verify professor owns the class
      const existingSchedule = await ctx.db
        .select({
          schedule: classSchedule,
          class: classTable,
        })
        .from(classSchedule)
        .innerJoin(classTable, eq(classSchedule.classId, classTable.id))
        .where(eq(classSchedule.id, input.scheduleId))
        .limit(1);

      if (existingSchedule.length === 0) {
        throw new Error("Schedule not found");
      }

      const scheduleData = existingSchedule[0];
      if (!scheduleData) {
        throw new Error("Schedule not found");
      }

      if (scheduleData.class.professorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      const startTime = input.startTime ?? scheduleData.schedule.startTime;
      const endTime = input.endTime ?? scheduleData.schedule.endTime;

      // Validate end time is after start time
      const startParts = startTime.split(":").map(Number);
      const endParts = endTime.split(":").map(Number);
      const startHour = startParts[0];
      const startMin = startParts[1];
      const endHour = endParts[0];
      const endMin = endParts[1];
      const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
      const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);

      if (endMinutes <= startMinutes) {
        throw new Error("End time must be after start time");
      }

      await ctx.db
        .update(classSchedule)
        .set({
          dayOfWeek: input.dayOfWeek ?? scheduleData.schedule.dayOfWeek,
          startTime,
          endTime,
          lectureHall: input.lectureHall ?? scheduleData.schedule.lectureHall,
        })
        .where(eq(classSchedule.id, input.scheduleId));

      const updatedSchedule = await ctx.db
        .select()
        .from(classSchedule)
        .where(eq(classSchedule.id, input.scheduleId))
        .limit(1);

      return updatedSchedule[0];
    }),

  deleteSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get schedule and verify professor owns the class
      const existingSchedule = await ctx.db
        .select({
          schedule: classSchedule,
          class: classTable,
        })
        .from(classSchedule)
        .innerJoin(classTable, eq(classSchedule.classId, classTable.id))
        .where(eq(classSchedule.id, input.scheduleId))
        .limit(1);

      if (existingSchedule.length === 0) {
        throw new Error("Schedule not found");
      }

      const scheduleData = existingSchedule[0];
      if (!scheduleData) {
        throw new Error("Schedule not found");
      }

      if (scheduleData.class.professorId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      await ctx.db
        .delete(classSchedule)
        .where(eq(classSchedule.id, input.scheduleId));

      return { success: true };
    }),

  getTodayClasses: protectedProcedure.query(async ({ ctx }) => {
    // Get current day of week (0=Sunday, 1=Monday, ... 6=Saturday)
    // Convert to our format: 0=Monday, 6=Sunday
    const jsDay = new Date().getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

    // Get all professor's classes
    const classes = await ctx.db
      .select()
      .from(classTable)
      .where(eq(classTable.professorId, ctx.session.user.id));

    if (classes.length === 0) {
      return [];
    }

    const classIds = classes.map((c) => c.id);

    // Get schedules for today
    const schedules = await ctx.db
      .select()
      .from(classSchedule)
      .where(
        and(
          inArray(classSchedule.classId, classIds),
          eq(classSchedule.dayOfWeek, dayOfWeek)
        )
      )
      .orderBy(classSchedule.startTime);

    // Map schedules to class info
    const classMap = new Map(classes.map((c) => [c.id, c]));

    return schedules.map((schedule) => ({
      ...schedule,
      class: classMap.get(schedule.classId),
    }));
  }),

  getAllSchedules: protectedProcedure.query(async ({ ctx }) => {
    // Get all professor's classes
    const classes = await ctx.db
      .select()
      .from(classTable)
      .where(eq(classTable.professorId, ctx.session.user.id));

    if (classes.length === 0) {
      return [];
    }

    const classIds = classes.map((c) => c.id);

    // Get all schedules for professor's classes
    const schedules = await ctx.db
      .select()
      .from(classSchedule)
      .where(inArray(classSchedule.classId, classIds))
      .orderBy(classSchedule.dayOfWeek, classSchedule.startTime);

    // Map schedules to class info
    const classMap = new Map(classes.map((c) => [c.id, c]));

    return schedules.map((schedule) => ({
      ...schedule,
      class: classMap.get(schedule.classId),
    }));
  }),

  cancelClass: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify professor owns this class
      const classData = await ctx.db
        .select()
        .from(classTable)
        .where(
          and(
            eq(classTable.id, input.classId),
            eq(classTable.professorId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (classData.length === 0) {
        throw new Error("Class not found");
      }

      const cancelDate = new Date(input.date);
      cancelDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if date is in the past (cannot cancel past classes)
      if (cancelDate < today) {
        throw new Error("Cannot cancel past classes");
      }

      // Check if already cancelled
      const existingCancellation = await ctx.db
        .select()
        .from(cancelledClass)
        .where(
          and(
            eq(cancelledClass.classId, input.classId),
            gte(cancelledClass.date, cancelDate),
            lte(
              cancelledClass.date,
              new Date(cancelDate.getTime() + 24 * 60 * 60 * 1000)
            )
          )
        )
        .limit(1);

      if (existingCancellation.length > 0) {
        throw new Error("Class is already cancelled for this date");
      }

      // Check if attendance has been taken for this date
      const existingAttendance = await ctx.db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.classId, input.classId),
            sql`date_trunc('day', ${attendance.date}) = date_trunc('day', ${sql.raw(`'${cancelDate.toISOString().split("T")[0]}'::date`)})`
          )
        )
        .limit(1);

      if (existingAttendance.length > 0) {
        throw new Error("Cannot cancel class after attendance has been taken");
      }

      // Create cancellation record
      await ctx.db.insert(cancelledClass).values({
        id: crypto.randomUUID(),
        classId: input.classId,
        date: cancelDate,
        cancelledBy: ctx.session.user.id,
      });

      return { success: true };
    }),

  getCancelledClassesByDate: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const queryDate = new Date(input.date);
      queryDate.setHours(0, 0, 0, 0);

      const cancelledClasses = await ctx.db
        .select({
          classId: cancelledClass.classId,
          date: cancelledClass.date,
          className: classTable.className,
          subject: classTable.subject,
        })
        .from(cancelledClass)
        .innerJoin(classTable, eq(cancelledClass.classId, classTable.id))
        .where(
          and(
            eq(classTable.professorId, ctx.session.user.id),
            gte(cancelledClass.date, queryDate),
            lte(
              cancelledClass.date,
              new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
            )
          )
        );

      return cancelledClasses;
    }),

  getClassCancellationStatus: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ ctx, input }) => {
      const queryDate = new Date(input.date);
      queryDate.setHours(0, 0, 0, 0);

      const cancellation = await ctx.db
        .select()
        .from(cancelledClass)
        .where(
          and(
            eq(cancelledClass.classId, input.classId),
            gte(cancelledClass.date, queryDate),
            lte(
              cancelledClass.date,
              new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
            )
          )
        )
        .limit(1);

      return { isCancelled: cancellation.length > 0 };
    }),

  getAttendanceByDate: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
    )
    .query(async ({ ctx, input }) => {
      const queryDate = new Date(input.date);
      queryDate.setHours(0, 0, 0, 0);

      const attendanceRecords = await ctx.db
        .select({
          studentId: attendance.studentId,
          status: attendance.status,
        })
        .from(attendance)
        .where(
          and(
            eq(attendance.classId, input.classId),
            sql`date_trunc('day', ${attendance.date}) = date_trunc('day', ${sql.raw(`'${queryDate.toISOString().split("T")[0]}'::date`)})`
          )
        );

      return attendanceRecords;
    }),

  getAttendanceDates: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const records = await ctx.db
        .select({
          date: attendance.date,
        })
        .from(attendance)
        .where(eq(attendance.classId, input.classId))
        .groupBy(attendance.date);

      return records.map((r) => r.date);
    }),

  getCancelledDates: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const records = await ctx.db
        .select({
          date: cancelledClass.date,
        })
        .from(cancelledClass)
        .where(eq(cancelledClass.classId, input.classId));

      return records.map((r) => r.date);
    }),
});

export type ClassRouter = typeof classRouter;
