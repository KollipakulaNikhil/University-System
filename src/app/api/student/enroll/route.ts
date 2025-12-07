import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader, Connection } from 'mysql2/promise';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'student') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = session.user.id;
    const { sectionId } = await request.json();

    if (!sectionId) {
        return NextResponse.json({ error: 'Missing sectionId' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get Section Details & Course Code
        const [sections] = await connection.query<RowDataPacket[]>(
            'SELECT * FROM sections WHERE id = ? FOR UPDATE', // Lock the section row
            [sectionId]
        );

        if (sections.length === 0) {
            throw new Error('Section not found');
        }

        const section = sections[0];

        // 2. Check Prerequisites
        const [prereqs] = await connection.query<RowDataPacket[]>(
            `SELECT prerequisite_code FROM prerequisites WHERE course_code = ?`,
            [section.course_code]
        );

        if (prereqs.length > 0) {
            const prereqCodes = prereqs.map(p => p.prerequisite_code);

            // Check if student has passed these courses
            const [passedCourses] = await connection.query<RowDataPacket[]>(
                `SELECT s.course_code 
                 FROM enrollments e 
                 JOIN sections s ON e.section_id = s.id 
                 WHERE e.student_id = ? AND e.grade IS NOT NULL AND e.grade != 'F'
                 AND s.course_code IN (?)`,
                [studentId, prereqCodes]
            );

            const passedCodes = passedCourses.map((c: any) => c.course_code);
            const missingPrereqs = prereqCodes.filter(code => !passedCodes.includes(code));

            if (missingPrereqs.length > 0) {
                throw new Error(`Missing prerequisites: ${missingPrereqs.join(', ')}`);
            }
        }

        // 3. Check Seat Availability
        if (section.enrolled >= section.capacity) {
            throw new Error('Section is full');
        }

        // 4. Check for Time Conflicts
        const [conflicts] = await connection.query<RowDataPacket[]>(
            `SELECT s.id 
             FROM enrollments e 
             JOIN sections s ON e.section_id = s.id 
             WHERE e.student_id = ? 
             AND s.term = ? 
             AND s.timeslot_id = ?`,
            [studentId, section.term, section.timeslot_id]
        );

        if (conflicts.length > 0) {
            throw new Error('Time conflict with another enrolled course');
        }

        // 5. Enroll Student
        await connection.query(
            'INSERT INTO enrollments (student_id, section_id, status) VALUES (?, ?, ?)',
            [studentId, sectionId, 'enrolled']
        );

        // 6. Update Section Enrollment Count
        await connection.query(
            'UPDATE sections SET enrolled = enrolled + 1 WHERE id = ?',
            [sectionId]
        );

        // 7. Create Pending Payment (Simulated)
        await connection.query(
            'INSERT INTO payments (student_id, amount, status) VALUES (?, ?, ?)',
            [studentId, 500.00, 'pending'] // Flat fee for simplicity
        );

        await connection.commit();

        return NextResponse.json({ message: 'Enrolled successfully' }, { status: 201 });

    } catch (error: any) {
        await connection.rollback();
        return NextResponse.json({ error: error.message }, { status: 400 });
    } finally {
        connection.release();
    }
}
