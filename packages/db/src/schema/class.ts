import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const classTable = pgTable(
  "class",
  {
    id: text("id").primaryKey(),
    className: text("class_name").notNull(),
    subject: text("subject").notNull(),
    classCode: text("class_code").notNull().unique(),
    professorId: text("professor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    studentCount: integer("student_count").default(0).notNull(),
    semesterStartDate: timestamp("semester_start_date"),
    semesterEndDate: timestamp("semester_end_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("class_professorId_idx").on(table.professorId),
    index("class_classCode_idx").on(table.classCode),
  ]
);

export const studentEnrollment = pgTable(
  "student_enrollment",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classTable.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rollNumber: text("roll_number").notNull(),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  },
  (table) => [
    index("enrollment_classId_idx").on(table.classId),
    index("enrollment_studentId_idx").on(table.studentId),
    unique("enrollment_class_roll").on(table.classId, table.rollNumber),
    unique("enrollment_class_student").on(table.classId, table.studentId),
  ]
);

export const classSchedule = pgTable(
  "class_schedule",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classTable.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0=Monday, 6=Sunday
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    lectureHall: text("lecture_hall").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("schedule_classId_idx").on(table.classId),
    index("schedule_dayOfWeek_idx").on(table.dayOfWeek),
  ]
);

export const classRelations = relations(classTable, ({ one, many }) => ({
  professor: one(user, {
    fields: [classTable.professorId],
    references: [user.id],
  }),
  enrollments: many(studentEnrollment),
  schedules: many(classSchedule),
}));

export const studentEnrollmentRelations = relations(
  studentEnrollment,
  ({ one }) => ({
    class: one(classTable, {
      fields: [studentEnrollment.classId],
      references: [classTable.id],
    }),
    student: one(user, {
      fields: [studentEnrollment.studentId],
      references: [user.id],
    }),
  })
);

export const classScheduleRelations = relations(classSchedule, ({ one }) => ({
  class: one(classTable, {
    fields: [classSchedule.classId],
    references: [classTable.id],
  }),
}));

export const attendance = pgTable(
  "attendance",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classTable.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: timestamp("date").defaultNow().notNull(),
    status: text("status").notNull(), // "present" or "absent"
    markedBy: text("marked_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("attendance_classId_idx").on(table.classId),
    index("attendance_studentId_idx").on(table.studentId),
    index("attendance_date_idx").on(table.date),
    unique("attendance_unique").on(table.classId, table.studentId, table.date),
  ]
);

export const attendanceRelations = relations(attendance, ({ one }) => ({
  class: one(classTable, {
    fields: [attendance.classId],
    references: [classTable.id],
  }),
  student: one(user, {
    fields: [attendance.studentId],
    references: [user.id],
  }),
  marker: one(user, {
    fields: [attendance.markedBy],
    references: [user.id],
  }),
}));

export const cancelledClass = pgTable(
  "cancelled_class",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .notNull()
      .references(() => classTable.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    cancelledBy: text("cancelled_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("cancelled_class_classId_idx").on(table.classId),
    index("cancelled_class_date_idx").on(table.date),
    unique("cancelled_class_unique").on(table.classId, table.date),
  ]
);

export const cancelledClassRelations = relations(cancelledClass, ({ one }) => ({
  class: one(classTable, {
    fields: [cancelledClass.classId],
    references: [classTable.id],
  }),
  cancelledByUser: one(user, {
    fields: [cancelledClass.cancelledBy],
    references: [user.id],
  }),
}));

export const userClassRelations = relations(user, ({ many }) => ({
  classes: many(classTable),
  enrollments: many(studentEnrollment),
  attendanceRecords: many(attendance),
  cancelledClasses: many(cancelledClass),
}));
