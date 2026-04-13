import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { hashSync } from "bcryptjs";
import { users } from "./schema";

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded, skipping.");
    await pool.end();
    return;
  }

  await db.insert(users).values({
    email: "admin@fraggell.com",
    passwordHash: hashSync("admin123", 10),
    name: "Admin",
    role: "admin",
  });

  console.log("Seeded admin user: admin@fraggell.com / admin123");
  await pool.end();
}

seed().catch(console.error);
