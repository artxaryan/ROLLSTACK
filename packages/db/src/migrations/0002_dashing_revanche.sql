CREATE TABLE "class_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"lecture_hall" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_schedule" ADD CONSTRAINT "class_schedule_class_id_class_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."class"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "schedule_classId_idx" ON "class_schedule" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "schedule_dayOfWeek_idx" ON "class_schedule" USING btree ("day_of_week");