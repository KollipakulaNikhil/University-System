import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    try {
        let query = '';
        let params: any[] = [];

        if (role === 'student') {
            query = `
        SELECT 
          c.code, c.title, 
          s.term, s.section_number,
          t.day, t.start_time, t.end_time,
          r.name as room_name
        FROM enrollments e
        JOIN sections s ON e.section_id = s.id
        JOIN courses c ON s.course_code = c.code
        JOIN timeslots t ON s.timeslot_id = t.id
        JOIN rooms r ON s.room_id = r.id
        WHERE e.student_id = ? AND e.status = 'enrolled'
        ORDER BY t.day, t.start_time
      `;
            params = [userId];
        } else if (role === 'instructor') {
            query = `
        SELECT 
          s.id,
          c.code, c.title, 
          s.term, s.section_number,
          t.day, t.start_time, t.end_time,
          r.name as room_name,
          s.enrolled, s.capacity
        FROM sections s
        JOIN courses c ON s.course_code = c.code
        JOIN timeslots t ON s.timeslot_id = t.id
        JOIN rooms r ON s.room_id = r.id
        WHERE s.instructor_id = ?
        ORDER BY t.day, t.start_time
      `;
            params = [userId];
        } else {
            return NextResponse.json({ error: 'Invalid role for timetable' }, { status: 400 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return NextResponse.json(rows);

    } catch (error: any) {
        console.error("Timetable API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
