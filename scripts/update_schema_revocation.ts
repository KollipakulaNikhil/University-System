import pool from '../src/lib/db';

async function updateSchema() {
    try {
        console.log("Updating disciplinary_reports table schema...");
        await pool.query(`
            ALTER TABLE disciplinary_reports 
            MODIFY COLUMN status ENUM('pending', 'resolved', 'revoked') DEFAULT 'pending'
        `);
        console.log("Schema updated successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
}

updateSchema();
