import pool from '../src/lib/db';

async function checkDb() {
    try {
        console.log("Checking database tables...");
        const [rows] = await pool.query("SHOW TABLES");
        console.log("Tables:", rows);
        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

checkDb();
