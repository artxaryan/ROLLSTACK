import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
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

export const classRelations = relations(classTable, ({ one, many }) => ({
  professor: one(user, {
    fields: [classTable.professorId],
    references: [user.id],
  }),
  enrollments: many(studentEnrollment),
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

export const userClassRelations = relations(user, ({ many }) => ({
  classes: many(classTable),
  enrollments: many(studentEnrollment),
}));
