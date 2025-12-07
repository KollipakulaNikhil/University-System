import pool from '../src/lib/db';

async function checkUsers() {
    try {
        const [instructor] = await pool.query("SELECT * FROM users WHERE role = 'instructor' LIMIT 1");
        const [student] = await pool.query("SELECT * FROM users WHERE role = 'student' LIMIT 1");

        console.log("Instructor:", instructor);
        console.log("Student:", student);
    } catch (error) {
        console.error("Error checking users:", error);
    } finally {
        await pool.end(); // Assuming pool.end() is the correct method to close the pool
    }
}

checkUsers();
