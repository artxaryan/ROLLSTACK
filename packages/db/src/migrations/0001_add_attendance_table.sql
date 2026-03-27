CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"marked_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_unique" UNIQUE("class_id","student_id","date")
);
--> statement-breakpoint
CREATE TABLE "class" (
	"id" text PRIMARY KEY NOT NULL,
	"class_name" text NOT NULL,
	"subject" text NOT NULL,
	"class_code" text NOT NULL,
	"professor_id" text NOT NULL,
	"student_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "class_class_code_unique" UNIQUE("class_code")
);
--> statement-breakpoint
CREATE TABLE "student_enrollment" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"roll_number" text NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_class_roll" UNIQUE("class_id","roll_number"),
	CONSTRAINT "enrollment_class_student" UNIQUE("class_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'student' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_user_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class" ADD CONSTRAINT "class_professor_id_user_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD CONSTRAINT "student_enrollment_class_id_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD CONSTRAINT "student_enrollment_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_classId_idx" ON "attendance" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "attendance_studentId_idx" ON "attendance" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "class_professorId_idx" ON "class" USING btree ("professor_id");--> statement-breakpoint
CREATE INDEX "class_classCode_idx" ON "class" USING btree ("class_code");--> statement-breakpoint
CREATE INDEX "enrollment_classId_idx" ON "student_enrollment" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "enrollment_studentId_idx" ON "student_enrollment" USING btree ("student_id");