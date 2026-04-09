import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: "./apps/server/.env" });

const sql = neon(process.env.DATABASE_URL ?? "");

async function main() {
  console.log("=== Checking student enrollment issues ===\n");

  // Check if the specific student exists
  console.log("1. Checking if student exists:");
  const studentCheck = await sql`
    SELECT id, name, email FROM "user" WHERE id = '1e12add2-a3c9-481d-97a6-ac439b7c6914'
  `;
  console.log(studentCheck);

  // Check all enrollments for the class
  console.log("\n2. All enrollments for class:");
  const enrollments = await sql`
    SELECT se.id, se.student_id, se.roll_number, u.id as user_exists, u.name, u.email
    FROM student_enrollment se
    LEFT JOIN "user" u ON se.student_id = u.id
    WHERE se.class_id = 'e0873e9b-9099-4019-a088-a72a70bac4e2'
  `;
  console.log(enrollments);

  // Check for orphaned enrollments
  console.log(
    "\n3. Orphaned enrollments (enrollment exists but user doesn't):"
  );
  const orphans = await sql`
    SELECT se.* FROM student_enrollment se
    LEFT JOIN "user" u ON se.student_id = u.id
    WHERE u.id IS NULL
  `;
  console.log(orphans);

  // Check all users
  console.log("\n4. All users in database:");
  const allUsers = await sql`SELECT id, name, email FROM "user"`;
  console.log(allUsers);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
