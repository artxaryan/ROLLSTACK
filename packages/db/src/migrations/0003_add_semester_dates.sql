-- Add semester start and end dates to class table
ALTER TABLE "class" ADD COLUMN "semester_start_date" timestamp;
ALTER TABLE "class" ADD COLUMN "semester_end_date" timestamp;
