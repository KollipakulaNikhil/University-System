import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'student') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionId, simulateDeadlock } = await request.json();
    const studentId = session.user.id;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check seat availability
        // FOR UPDATE locks the row, preventing other transactions from reading it until this one commits
        const [sections] = await connection.query<RowDataPacket[]>(
            'SELECT * FROM sections WHERE id = ? FOR UPDATE',
            [sectionId]
        );

        if (sections.length === 0) {
            throw new Error('Section not found');
        }

        const section = sections[0];

        if (section.enrolled >= section.capacity) {
            throw new Error('Section is full');
        }

        // SIMULATE DEADLOCK
        if (simulateDeadlock) {
            // Wait to allow another transaction to acquire a lock
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Try to lock another resource (e.g., student record) in a different order
            // This is a common cause of deadlocks: Tx1 locks A then B, Tx2 locks B then A
            await connection.query('SELECT * FROM users WHERE id = ? FOR UPDATE', [studentId]);
        }

        // 2. Insert enrollment
        await connection.query(
            'INSERT INTO enrollments (student_id, section_id, status) VALUES (?, ?, ?)',
            [studentId, sectionId, 'enrolled']
        );

        // 3. Update seat count
        await connection.query(
            'UPDATE sections SET enrolled = enrolled + 1 WHERE id = ?',
            [sectionId]
        );

        await connection.commit();
        return NextResponse.json({ message: 'Enrolled successfully' });

    } catch (error: any) {
        await connection.rollback();

        if (error.code === 'ER_LOCK_DEADLOCK') {
            return NextResponse.json({ error: 'Deadlock detected, please retry' }, { status: 409 });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}
