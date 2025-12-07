import pool from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function resetPassword() {
    try {
        console.log("Resetting admin password...");
        const passwordHash = await bcrypt.hash('admin123', 10);
        await pool.query("UPDATE users SET password_hash = ? WHERE id = 1", [passwordHash]);
        console.log("Password reset successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Reset failed:", error);
        process.exit(1);
    }
}

resetPassword();
