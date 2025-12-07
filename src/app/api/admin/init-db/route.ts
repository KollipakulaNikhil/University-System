import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== 'setup123') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const connection = await pool.getConnection();
        try {
            // 1. Base Schema
            const schemaSql = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role ENUM('student', 'instructor', 'admin') NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS programs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    code VARCHAR(50) UNIQUE NOT NULL
                );

                CREATE TABLE IF NOT EXISTS courses (
                    code VARCHAR(20) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    credits INT NOT NULL,
                    program_id INT,
                    FOREIGN KEY (program_id) REFERENCES programs(id)
                );

                CREATE TABLE IF NOT EXISTS rooms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    capacity INT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS timeslots (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    day ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL,
                    start_time TIME NOT NULL,
                    end_time TIME NOT NULL,
                    UNIQUE(day, start_time, end_time)
                );

                CREATE TABLE IF NOT EXISTS sections (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    course_code VARCHAR(20) NOT NULL,
                    term VARCHAR(20) NOT NULL,
                    section_number INT NOT NULL,
                    instructor_id INT,
                    room_id INT,
                    timeslot_id INT,
                    capacity INT NOT NULL,
                    enrolled INT DEFAULT 0,
                    FOREIGN KEY (course_code) REFERENCES courses(code),
                    FOREIGN KEY (instructor_id) REFERENCES users(id),
                    FOREIGN KEY (room_id) REFERENCES rooms(id),
                    FOREIGN KEY (timeslot_id) REFERENCES timeslots(id),
                    UNIQUE(room_id, timeslot_id),
                    UNIQUE(instructor_id, timeslot_id)
                );

                CREATE TABLE IF NOT EXISTS enrollments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    section_id INT NOT NULL,
                    status ENUM('enrolled', 'dropped', 'waitlisted') DEFAULT 'enrolled',
                    grade VARCHAR(5),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES users(id),
                    FOREIGN KEY (section_id) REFERENCES sections(id),
                    UNIQUE(student_id, section_id)
                );

                CREATE TABLE IF NOT EXISTS waitlists (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    section_id INT NOT NULL,
                    student_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (section_id) REFERENCES sections(id),
                    FOREIGN KEY (student_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS payments (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    amount DECIMAL(10, 2) NOT NULL,
                    status ENUM('pending', 'completed') DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES users(id)
                );

                CREATE TABLE IF NOT EXISTS prerequisites (
                    course_code VARCHAR(20) NOT NULL,
                    prerequisite_code VARCHAR(20) NOT NULL,
                    PRIMARY KEY (course_code, prerequisite_code),
                    FOREIGN KEY (course_code) REFERENCES courses(code),
                    FOREIGN KEY (prerequisite_code) REFERENCES courses(code)
                );
            `;

            // Execute base schema (split by semicolon roughly, but mysql2 might handle multiple statements if configured)
            // Since we enabled multipleStatements: true in db.ts (wait, did we? No, db.ts usually doesn't have it by default unless added)
            // Let's check db.ts again. It doesn't have multipleStatements: true.
            // So we must execute one by one.

            // Actually, let's just use the logic from seed.js but adapted.
            // Splitting by ';' is fragile.
            // Instead, I'll just run the CREATE TABLEs individually.

            const tables = [
                `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role ENUM('student', 'instructor', 'admin') NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
                `CREATE TABLE IF NOT EXISTS programs (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, code VARCHAR(50) UNIQUE NOT NULL)`,
                `CREATE TABLE IF NOT EXISTS courses (code VARCHAR(20) PRIMARY KEY, title VARCHAR(255) NOT NULL, credits INT NOT NULL, program_id INT, FOREIGN KEY (program_id) REFERENCES programs(id))`,
                `CREATE TABLE IF NOT EXISTS rooms (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, capacity INT NOT NULL)`,
                `CREATE TABLE IF NOT EXISTS timeslots (id INT AUTO_INCREMENT PRIMARY KEY, day ENUM('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun') NOT NULL, start_time TIME NOT NULL, end_time TIME NOT NULL, UNIQUE(day, start_time, end_time))`,
                `CREATE TABLE IF NOT EXISTS sections (id INT AUTO_INCREMENT PRIMARY KEY, course_code VARCHAR(20) NOT NULL, term VARCHAR(20) NOT NULL, section_number INT NOT NULL, instructor_id INT, room_id INT, timeslot_id INT, capacity INT NOT NULL, enrolled INT DEFAULT 0, FOREIGN KEY (course_code) REFERENCES courses(code), FOREIGN KEY (instructor_id) REFERENCES users(id), FOREIGN KEY (room_id) REFERENCES rooms(id), FOREIGN KEY (timeslot_id) REFERENCES timeslots(id), UNIQUE(room_id, timeslot_id), UNIQUE(instructor_id, timeslot_id))`,
                `CREATE TABLE IF NOT EXISTS enrollments (id INT AUTO_INCREMENT PRIMARY KEY, student_id INT NOT NULL, section_id INT NOT NULL, status ENUM('enrolled', 'dropped', 'waitlisted') DEFAULT 'enrolled', grade VARCHAR(5), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (student_id) REFERENCES users(id), FOREIGN KEY (section_id) REFERENCES sections(id), UNIQUE(student_id, section_id))`,
                `CREATE TABLE IF NOT EXISTS waitlists (id INT AUTO_INCREMENT PRIMARY KEY, section_id INT NOT NULL, student_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (section_id) REFERENCES sections(id), FOREIGN KEY (student_id) REFERENCES users(id))`,
                `CREATE TABLE IF NOT EXISTS payments (id INT AUTO_INCREMENT PRIMARY KEY, student_id INT NOT NULL, amount DECIMAL(10, 2) NOT NULL, status ENUM('pending', 'completed') DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (student_id) REFERENCES users(id))`,
                `CREATE TABLE IF NOT EXISTS prerequisites (course_code VARCHAR(20) NOT NULL, prerequisite_code VARCHAR(20) NOT NULL, PRIMARY KEY (course_code, prerequisite_code), FOREIGN KEY (course_code) REFERENCES courses(code), FOREIGN KEY (prerequisite_code) REFERENCES courses(code))`
            ];

            for (const sql of tables) {
                await connection.query(sql);
            }

            // 2. Updates
            try {
                await connection.query("ALTER TABLE users ADD COLUMN suspended_until TIMESTAMP NULL");
            } catch (e: any) {
                if (e.code !== 'ER_DUP_FIELDNAME') console.error(e);
            }

            await connection.query(`
                CREATE TABLE IF NOT EXISTS disciplinary_reports (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    student_id INT NOT NULL,
                    instructor_id INT NOT NULL,
                    reason TEXT NOT NULL,
                    status ENUM('pending', 'resolved', 'revoked') DEFAULT 'pending',
                    suspension_days INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (student_id) REFERENCES users(id),
                    FOREIGN KEY (instructor_id) REFERENCES users(id)
                )
            `);

            await connection.query(`
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
                )
            `);

            // 3. Seed Data
            const passwordHash = await bcrypt.hash('password123', 10);

            // Seed Admin
            const [adminRows]: any = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@university.com']);
            if (adminRows.length === 0) {
                await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Admin User', 'admin@university.com', passwordHash, 'admin']);
            }

            // Seed Instructors
            for (let i = 1; i <= 5; i++) {
                const email = `instructor${i}@university.com`;
                const [rows]: any = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
                if (rows.length === 0) {
                    await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [`Instructor ${i}`, email, passwordHash, 'instructor']);
                }
            }

            // Seed Students
            for (let i = 1; i <= 10; i++) {
                const email = `student${i}@university.com`;
                const [rows]: any = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
                if (rows.length === 0) {
                    await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [`Student ${i}`, email, passwordHash, 'student']);
                }
            }

            // Seed Rooms
            const rooms = [['Lecture Hall A', 100], ['Lab 101', 30]];
            for (const room of rooms) {
                const [rows]: any = await connection.query('SELECT id FROM rooms WHERE name = ?', [room[0]]);
                if (rows.length === 0) {
                    await connection.query('INSERT INTO rooms (name, capacity) VALUES (?, ?)', room);
                }
            }

            // Seed Timeslots
            const timeslots = [['Mon', '09:00:00', '10:00:00'], ['Mon', '10:00:00', '11:00:00']];
            for (const slot of timeslots) {
                const [rows]: any = await connection.query('SELECT id FROM timeslots WHERE day = ? AND start_time = ?', [slot[0], slot[1]]);
                if (rows.length === 0) {
                    await connection.query('INSERT INTO timeslots (day, start_time, end_time) VALUES (?, ?, ?)', slot);
                }
            }

            return NextResponse.json({ message: 'Database initialized successfully' });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
