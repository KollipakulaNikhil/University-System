import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = '';
    let params: any[] = [];

    if (type === 'schedule') {
        // Complex JOIN for student schedule
        query = `
            SELECT 
                s.course_code, c.title, 
                sec.term, sec.room_id, r.name as room_name,
                t.day, t.start_time, t.end_time,
                u.name as instructor_name
            FROM enrollments e
            JOIN sections sec ON e.section_id = sec.id
            JOIN courses c ON sec.course_code = c.code
            JOIN rooms r ON sec.room_id = r.id
            JOIN timeslots t ON sec.timeslot_id = t.id
            JOIN users u ON sec.instructor_id = u.id
            WHERE e.student_id = ?
        `;
        params = [1]; // Dummy student ID
    } else if (type === 'usage') {
        // Aggregation for seat usage
        query = `
            SELECT 
                c.code, c.title, 
                COUNT(sec.id) as section_count,
                SUM(sec.enrolled) as total_enrolled,
                SUM(sec.capacity) as total_capacity,
                (SUM(sec.enrolled) / SUM(sec.capacity)) * 100 as occupancy_rate
            FROM courses c
            JOIN sections sec ON c.code = sec.course_code
            GROUP BY c.code, c.title
            HAVING occupancy_rate > 80
        `;
    } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    try {
        const [explainRows] = await pool.query<RowDataPacket[]>(`EXPLAIN ${query}`, params);
        const [resultRows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({
            query,
            explain: explainRows,
            results: resultRows
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
