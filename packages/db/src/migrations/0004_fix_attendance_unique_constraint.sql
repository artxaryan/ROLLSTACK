--> statement-breakpoint
-- Drop the old unique constraint on raw timestamp
ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_unique";

--> statement-breakpoint
-- Create a new unique index on date portion only (ignoring time)
CREATE UNIQUE INDEX "attendance_unique_date" ON "attendance" (
  "class_id", 
  "student_id", 
  (date_trunc('day', "date"))
);