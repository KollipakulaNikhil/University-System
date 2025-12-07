const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'university_user',
        password: process.env.DB_PASSWORD || 'university_password',
        database: process.env.DB_NAME || 'university_db',
        port: Number(process.env.DB_PORT) || 3307,
    });

    try {
        console.log('Connected to database.');
        console.log('Adding section_number column to sections table...');

        await connection.query(`
            ALTER TABLE sections
            ADD COLUMN section_number INT NOT NULL AFTER term;
        `);

        console.log('Migration successful: section_number column added.');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column section_number already exists.');
        } else {
            console.error('Migration failed:', error);
        }
    } finally {
        await connection.end();
    }
}

migrate();
