import { Pool } from "pg";

async function main() {
  const envUrl = "postgres://f04b8507ba52e2a3ec528b65bc6531586d8dee489777238147c61a5ca49a3e54:sk_a9fHBJDMyp2PxI8Phv2mb@pooled.db.prisma.io:5432/postgres?sslmode=require";
  
  const pool = new Pool({ connectionString: envUrl });
  
  try {
    console.log("Connecting to old database directly...");
    const employeeCount = await pool.query('SELECT COUNT(*) FROM "Employee"');
    console.log("Successfully connected! Employee count:", employeeCount.rows[0].count);
    
    const applicantCount = await pool.query('SELECT COUNT(*) FROM "Applicant"');
    console.log("Applicant count:", applicantCount.rows[0].count);
    
    const taskCount = await pool.query('SELECT COUNT(*) FROM "Task"');
    console.log("Task count:", taskCount.rows[0].count);
    
    const jobCount = await pool.query('SELECT COUNT(*) FROM "JobPosting"');
    console.log("Job Posting count:", jobCount.rows[0].count);
    
  } catch (error) {
    console.error("Failed to connect or query old database:", error);
  } finally {
    await pool.end();
  }
}

main();
