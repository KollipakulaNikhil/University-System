import pool from '../src/lib/db';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function createUser() {
    const args = process.argv.slice(2);

    if (args.length < 4) {
        console.error("Usage: npx tsx scripts/create_user.ts <name> <email> <password> <role>");
        console.error("Example: npx tsx scripts/create_user.ts \"John Doe\" john@example.com password123 student");
        process.exit(1);
    }

    const [name, email, password, role] = args;

    if (!['student', 'instructor', 'admin'].includes(role)) {
        console.error("Invalid role. Must be 'student', 'instructor', or 'admin'.");
        process.exit(1);
    }

    try {
        console.log(`Creating user: ${name} (${email}) as ${role}...`);

        // Check if user exists
        const [existing] = await pool.query<any[]>("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            console.error("Error: User with this email already exists.");
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role]
        );

        console.log("User created successfully!");
        process.exit(0);
    } catch (error: any) {
        console.error("Error creating user:", error.message);
        process.exit(1);
    }
}

createUser();
