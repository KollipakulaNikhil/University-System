const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'university_user',
        password: process.env.DB_PASSWORD || 'university_password',
        database: process.env.DB_NAME || 'university_db',
        port: Number(process.env.DB_PORT) || 3307,
        multipleStatements: true,
    });

    try {
        console.log('Connected to database.');

        // Read and execute schema
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Applying schema...');
        try {
            await connection.query(schemaSql);
            console.log('Schema applied successfully.');
        } catch (err) {
            console.warn('Schema application failed (might already exist):', err.message);
        }

        // Seed Users
        const passwordHash = await bcrypt.hash('password123', 10);

        const users = [
            ['Admin User', 'admin@university.com', passwordHash, 'admin']
        ];

        // Generate 10 Instructors
        for (let i = 1; i <= 10; i++) {
            users.push([`Instructor ${i}`, `instructor${i}@university.com`, passwordHash, 'instructor']);
        }

        // Generate 50 Students
        for (let i = 1; i <= 50; i++) {
            users.push([`Student ${i}`, `student${i}@university.com`, passwordHash, 'student']);
        }

        console.log('Seeding users...');
        for (const user of users) {
            // Check if user exists
            const [rows] = await connection.query('SELECT id FROM users WHERE email = ?', [user[1]]);
            if (rows.length === 0) {
                await connection.query(
                    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                    user
                );
                console.log(`Created user: ${user[1]}`);
            } else {
                console.log(`User already exists: ${user[1]}`);
            }
        }

        // Seed Rooms
        const rooms = [
            ['Lecture Hall A', 100],
            ['Lecture Hall B', 80],
            ['Lab 101', 30],
            ['Seminar Room 1', 20]
        ];

        console.log('Seeding rooms...');
        for (const room of rooms) {
            const [rows] = await connection.query('SELECT id FROM rooms WHERE name = ?', [room[0]]);
            if (rows.length === 0) {
                await connection.query('INSERT INTO rooms (name, capacity) VALUES (?, ?)', room);
                console.log(`Created room: ${room[0]}`);
            }
        }

        // Seed Timeslots
        const timeslots = [
            ['Mon', '09:00:00', '10:00:00'],
            ['Mon', '10:00:00', '11:00:00'],
            ['Tue', '09:00:00', '10:00:00'],
            ['Tue', '10:00:00', '11:00:00'],
            ['Wed', '09:00:00', '10:00:00'],
            ['Wed', '10:00:00', '11:00:00'],
            ['Thu', '09:00:00', '10:00:00'],
            ['Thu', '10:00:00', '11:00:00'],
            ['Fri', '09:00:00', '10:00:00'],
            ['Fri', '10:00:00', '11:00:00']
        ];

        console.log('Seeding timeslots...');
        for (const slot of timeslots) {
            const [rows] = await connection.query(
                'SELECT id FROM timeslots WHERE day = ? AND start_time = ? AND end_time = ?',
                slot
            );
            if (rows.length === 0) {
                await connection.query(
                    'INSERT INTO timeslots (day, start_time, end_time) VALUES (?, ?, ?)',
                    slot
                );
                console.log(`Created timeslot: ${slot[0]} ${slot[1]}-${slot[2]}`);
            }
        }

        console.log('Seeding completed successfully.');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await connection.end();
    }
}

seed();
