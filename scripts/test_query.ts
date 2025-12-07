import pool from '../src/lib/db';

async function testQuery() {
    try {
        console.log("Testing API query...");
        const [rows] = await pool.query(`
            SELECT 
                dr.id, dr.reason, dr.status, dr.created_at,
                s.name as student_name, s.email as student_email,
                i.name as instructor_name
            FROM disciplinary_reports dr
            JOIN users s ON dr.student_id = s.id
            JOIN users i ON dr.instructor_id = i.id
            WHERE dr.status = 'pending'
            ORDER BY dr.created_at DESC
        `);
        console.log("Query Result:", rows);
        process.exit(0);
    } catch (error) {
        console.error("Query failed:", error);
        process.exit(1);
    }
}

testQuery();
