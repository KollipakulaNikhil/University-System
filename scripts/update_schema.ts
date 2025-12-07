import pool from '../src/lib/db';

async function updateSchema() {
    try {
        console.log("Updating schema...");

        // Add suspended_until column to users table
        try {
            await pool.query("ALTER TABLE users ADD COLUMN suspended_until TIMESTAMP NULL");
            console.log("Added suspended_until column to users table.");
        } catch (error: any) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("suspended_until column already exists.");
            } else {
                console.error("Error adding column:", error);
            }
        }

        // Create disciplinary_reports table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS disciplinary_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                instructor_id INT NOT NULL,
                reason TEXT NOT NULL,
                status ENUM('pending', 'resolved') DEFAULT 'pending',
                suspension_days INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id),
                FOREIGN KEY (instructor_id) REFERENCES users(id)
            )
        `);
        console.log("Created disciplinary_reports table.");

        console.log("Schema update complete.");
        process.exit(0);
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
}

updateSchema();
