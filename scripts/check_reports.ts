import pool from '../src/lib/db';

async function checkReports() {
    try {
        console.log("Checking disciplinary_reports table...");
        const [rows] = await pool.query("SELECT * FROM disciplinary_reports");
        console.log("Reports:", rows);
        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

checkReports();
