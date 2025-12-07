import pool from '../src/lib/db';

async function updateSchema() {
    try {
        console.log("Updating schema for Attendance System...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                section_id INT NOT NULL,
                date DATE NOT NULL,
                status ENUM('present', 'absent', 'excused') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id),
                FOREIGN KEY (section_id) REFERENCES sections(id),
                UNIQUE(student_id, section_id, date)
            );
        `);

        console.log("Schema updated successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Schema update failed:", error);
        process.exit(1);
    }
}

updateSchema();
