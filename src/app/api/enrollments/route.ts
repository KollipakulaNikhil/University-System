import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'student') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                s.id as section_id,
                c.code, c.title, c.credits,
                s.term, s.section_number,
                t.day, t.start_time, t.end_time,
                r.name as room_name,
                u.name as instructor_name
            FROM enrollments e
            JOIN sections s ON e.section_id = s.id
            JOIN courses c ON s.course_code = c.code
            JOIN timeslots t ON s.timeslot_id = t.id
            JOIN rooms r ON s.room_id = r.id
            JOIN users u ON s.instructor_id = u.id
            WHERE e.student_id = ? AND e.status = 'enrolled'
            ORDER BY t.day, t.start_time
        `, [session.user.id]);

        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
